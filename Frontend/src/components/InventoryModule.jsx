import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, LoadingSpinner, EmptyState } from './UI';
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';

export default function InventoryModule() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/inventory');
        if (!response.ok) throw new Error('Error al cargar inventario');
        const data = await response.json();
        setInventory(data);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const getStockStatus = (stock, minStock) => {
    if (stock <= minStock) return 'Bajo Stock';
    if (stock <= minStock * 1.5) return 'Crítico';
    return 'Normal';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Bajo Stock': return 'error';
      case 'Crítico': return 'warning';
      default: return 'success';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-1 max-w-md">
          <Input placeholder="Buscar repuesto..." type="search" />
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus size={18} />
          Agregar Repuesto
        </Button>
      </div>

      {/* Tabla de Inventario */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Repuestos y Almacén</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Código</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Descripción</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Categoría</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Stock Actual</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Mín. Stock</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Ubicación</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const status = getStockStatus(item.stock, item.minStock);
                  return (
                    <tr key={item.id} className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">{item.id}</td>
                      <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{item.name}</td>
                      <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{item.category}</td>
                      <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">{item.stock} {item.unit}</td>
                      <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{item.minStock}</td>
                      <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{item.location}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {status !== 'Normal' && <AlertCircle size={14} className={`text-${getStatusColor(status)}-500`} />}
                          <Badge variant={getStatusColor(status)} size="sm">{status}</Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm"><Edit2 size={14} /></Button>
                          <Button variant="ghost" size="sm"><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
