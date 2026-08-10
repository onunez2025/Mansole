import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Boxes, AlertCircle, Plus, RefreshCw, CheckCircle2, Edit3, Trash2 } from 'lucide-react';

export default function Inventory({ currentUser }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    code: '', name: '', description: '', currentStock: 1, minStock: 1, location: 'Almacén Central', unitCost: 0, reason: 'Canibalización'
  });

  const loadInventory = () => {
    setLoading(true);
    api.getInventory().then(data => {
      if (Array.isArray(data)) {
        const cleanData = data.map((item, i) => {
          const cost = Number(item.unitCost !== undefined ? item.unitCost : (item.UnitCost !== undefined ? item.UnitCost : 0));
          return {
            id: item.id || item.Id || i + 1,
            code: item.code || item.Code || `REF-${i + 100}`,
            name: item.name || item.Name || 'Repuesto',
            description: item.description || item.Description || '',
            unitOfMeasure: item.unitOfMeasure || item.UnitOfMeasure || 'Pieza',
            currentStock: Number(item.currentStock !== undefined ? item.currentStock : (item.CurrentStock !== undefined ? item.CurrentStock : 0)),
            minStock: Number(item.minStock !== undefined ? item.minStock : (item.MinStock !== undefined ? item.MinStock : 0)),
            location: item.location || item.Location || 'Almacén Central',
            unitCost: isNaN(cost) ? 0 : cost,
            condition: item.condition || item.Condition || (cost === 0 ? 'Reusado' : 'Nuevo')
          };
        });
        setInventory(cleanData);
      } else {
        setInventory([]);
      }
      setLoading(false);
    }).catch(() => {
      setInventory([]);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const openCreate = () => {
    setEditingItem(null);
    setFormData({ code: '', name: '', description: '', currentStock: 1, minStock: 1, location: 'Almacén Central', unitCost: 0, reason: 'Canibalización' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      code: item.code, name: item.name, description: item.description || '',
      currentStock: item.currentStock, minStock: item.minStock,
      location: item.location, unitCost: item.unitCost,
      reason: item.condition === 'Reusado' ? 'Canibalización' : 'Compra SAP'
    });
    setShowModal(true);
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`¿Eliminar el repuesto [${item.code}] ${item.name}?`)) return;
    try {
      await api.deleteInventoryItem(item.id);
      alert(`✅ Repuesto eliminado de Azure SQL.`);
      loadInventory();
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const isCannib = formData.reason === 'Canibalización' || formData.reason === 'Hallazgo';
    const cost = isCannib ? 0.00 : (parseFloat(formData.unitCost) || 0);
    const payload = {
      code: formData.code || `CANIB-${Math.floor(Math.random() * 1000)}`,
      name: formData.name || 'Repuesto',
      description: formData.description,
      unitOfMeasure: 'Pieza',
      currentStock: parseFloat(formData.currentStock) || 0,
      minStock: parseFloat(formData.minStock) || 0,
      location: formData.location,
      unitCost: cost,
      condition: isCannib ? 'Reusado' : 'Nuevo'
    };
    try {
      if (editingItem) {
        await api.updateInventoryItem(editingItem.id, payload);
        alert(`✅ Repuesto actualizado en Azure SQL.`);
      } else {
        await api.createInventoryItem(payload);
        alert(`✅ Repuesto registrado en Azure SQL (Costo: $${Number(cost).toFixed(2)} USD)`);
      }
      setShowModal(false);
      loadInventory();
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: '#8A919E', fontWeight: '600' }}>⏳ Cargando almacén de repuestos desde Azure SQL...</div>;
  }

  const canRegister = currentUser?.role !== 'Operario de Máquina';
  const totalItems = Array.isArray(inventory) ? inventory.length : 0;
  const lowStockCount = Array.isArray(inventory) ? inventory.filter(i => (i.currentStock || 0) <= (i.minStock || 0)).length : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1C1E' }}>Almacén y Trazabilidad de Repuestos</h3>
          <p style={{ fontSize: '14px', color: '#515254' }}>Soporte nativo para componentes de <strong>Canibalización</strong> y hallazgos en planta (Fuera de SAP con costo $0)</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={loadInventory}>
            <RefreshCw size={16} /> Sincronizar
          </button>
          {canRegister ? (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={18} /> Ingresar Repuesto / Canibaliza
            </button>
          ) : (
            <button className="btn btn-secondary" disabled title="Bloqueado por RBAC para Operarios">
              🚫 Ingreso Bloqueado
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="siatc-card" style={{ padding: '18px 22px', borderLeft: '4px solid #05B169', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Boxes color="#05B169" size={28} />
          <div>
            <div style={{ fontSize: '12px', color: '#8A919E', fontWeight: '700' }}>TOTAL CATÁLOGO ALMACÉN</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#1A1C1E' }}>{totalItems} referencias</div>
          </div>
        </div>
        <div className="siatc-card" style={{ padding: '18px 22px', borderLeft: '4px solid #E58D14', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <AlertCircle color="#E58D14" size={28} />
          <div>
            <div style={{ fontSize: '12px', color: '#E58D14', fontWeight: '700' }}>ALERTA STOCK MÍNIMO</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#1A1C1E' }}>
              {lowStockCount} repuestos bajo mínimo
            </div>
          </div>
        </div>
      </div>

      <div className="siatc-card" style={{ padding: '24px' }}>
        <div className="table-container" style={{ marginTop: 0 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Código / Descripción</th>
                <th>Condición & Origen</th>
                <th>Stock Actual</th>
                <th>Mínimo</th>
                <th>Ubicación en Planta</th>
                <th>Costo Unit. USD</th>
                <th>Estado Stock</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, idx) => {
                const stock = Number(item.currentStock || 0);
                const min = Number(item.minStock || 0);
                const cost = Number(item.unitCost || 0);
                const isAlert = stock <= min;
                const isReused = item.condition === 'Reusado' || cost === 0;

                return (
                  <tr key={item.id || idx}>
                    <td>
                      <div style={{ fontWeight: '800', color: '#1A1C1E' }}>[{item.code}] {item.name}</div>
                      <div style={{ fontSize: '12px', color: '#515254' }}>{item.description || 'Sin descripción'}</div>
                    </td>
                    <td>
                      {isReused ? (
                        <span className="badge badge-success" title="No altera costos contables">♻️ Canibalizado / Reusado</span>
                      ) : (
                        <span className="badge badge-info">📦 Compra SAP (Nuevo)</span>
                      )}
                    </td>
                    <td style={{ fontWeight: '800', fontSize: '15px', color: '#1A1C1E' }}>{stock} {item.unitOfMeasure || 'Pieza'}s</td>
                    <td style={{ color: '#515254', fontWeight: '600' }}>{min}</td>
                    <td><span className="badge badge-mono">{item.location}</span></td>
                    <td style={{ fontWeight: '800', color: isReused ? '#05B169' : '#1A1C1E' }}>
                      ${Number(cost).toFixed(2)}
                      {isReused && <span style={{ display: 'block', fontSize: '11px', color: '#05B169', fontWeight: '700' }}>Imputar: $0 al CECO</span>}
                    </td>
                    <td>
                      {isAlert ? (
                        <span className="badge badge-warning">⚠️ Recomendar Compra</span>
                      ) : (
                        <span className="badge badge-success"><CheckCircle2 size={12} /> Stock OK</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button className="btn btn-secondary" style={{ padding: '5px 9px' }} onClick={() => openEdit(item)} title="Editar">
                          <Edit3 size={13} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '5px 9px', color: '#DF2935' }} onClick={() => handleDeleteItem(item)} title="Eliminar">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E4E9', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1C1E' }}>
                {editingItem ? `Editar Repuesto: ${editingItem.code}` : 'Ingreso de Repuesto / Canibalización'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ fontSize: '20px', color: '#8A919E', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: '#E7F9F0', border: '1px solid #B8EBD1', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', color: '#05B169', fontWeight: '600', lineHeight: '1.4' }}>
              ℹ️ Al seleccionar el motivo <strong>Canibalización</strong> o <strong>Hallazgo</strong>, el costo del repuesto se fijará automáticamente en <strong>$0.00 USD</strong> para preservar los balances contables en SAP.
            </div>

            <form onSubmit={handleRegister}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>Motivo de Ingreso</label>
                <select 
                  className="form-select" 
                  value={formData.reason} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, reason: val, unitCost: (val === 'Canibalización' || val === 'Hallazgo') ? 0 : formData.unitCost });
                  }}
                >
                  <option value="Canibalización">♻️ Canibalización (Retirado de máquina en desuso) - $0 USD</option>
                  <option value="Hallazgo">🔍 Hallazgo en Taller / Residual de producción - $0 USD</option>
                  <option value="Compra SAP">📦 Compra / Recepción Oficial SAP</option>
                  <option value="Ajuste">⚙️ Ajuste de Inventario positivo</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>Código</label>
                  <input className="form-input" placeholder="REP-CANIB-99" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>Nombre del Repuesto *</label>
                  <input className="form-input" required placeholder="Motor Neumático Recondicionado" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>Descripción / Origen</label>
                <input className="form-input" placeholder="Retirado de cinta Línea 1" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>Cantidad *</label>
                  <input type="number" min="1" className="form-input" required value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: e.target.value})} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>Stock Mínimo</label>
                  <input type="number" min="0" className="form-input" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>Costo Unit. USD</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    disabled={formData.reason === 'Canibalización' || formData.reason === 'Hallazgo'} 
                    value={formData.unitCost} 
                    onChange={e => setFormData({...formData, unitCost: e.target.value})} 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>Ubicación</label>
                <input className="form-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #E2E4E9' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Guardar Cambios' : 'Registrar en Almacén'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
