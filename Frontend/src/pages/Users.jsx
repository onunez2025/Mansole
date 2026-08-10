import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Lock, CheckCircle2, XCircle, Key, Users as UsersIcon, Edit3, Trash2, PlusCircle, ToggleLeft, ToggleRight, Check, AlertCircle, Layers, ChevronRight, UserCheck } from 'lucide-react';

export default function Users({ currentUser }) {
  const [activeTab, setActiveTab] = useState('users');

  const [usersList, setUsersList] = useState([
    { id: 1, name: 'Carlos Admin', email: 'admin@gruposole.com', role: 'Administrador', ceco: 'Todos los CECOs', isActive: true, status: 'Activo' },
    { id: 2, name: 'Roberto Gómez', email: 'supervisor@gruposole.com', role: 'Supervisor', ceco: 'CECO-SOL-101 (Ensamble)', isActive: true, status: 'Activo' },
    { id: 3, name: 'Juan Pérez', email: 'tecnico1@gruposole.com', role: 'Técnico', ceco: 'CECO-SOL-102 (Metalmecán)', isActive: true, status: 'Activo' },
    { id: 4, name: 'Miguel Torres', email: 'tecnico2@gruposole.com', role: 'Técnico', ceco: 'CECO-SOL-103 (Pintura)', isActive: false, status: 'Suspendido' },
    { id: 5, name: 'Ana Vásquez', email: 'operador@gruposole.com', role: 'Operativo', ceco: 'CECO-SOL-101 (Ensamble)', isActive: true, status: 'Activo' }
  ]);

  const [rolesList, setRolesList] = useState([
    { id: 1, name: 'Administrador', description: 'Control total del sistema, configuración y seguridad RBAC.', isSystem: true },
    { id: 2, name: 'Supervisor', description: 'Aprueba costos, supervisa cronogramas y gestiona técnicos.', isSystem: true },
    { id: 3, name: 'Técnico', description: 'Ejecuta mantenimientos, consulta IA de diagnóstico y repuestos.', isSystem: true },
    { id: 4, name: 'Operario', description: 'Reporta fallas iniciales y visualiza estado de equipos.', isSystem: true }
  ]);

  // Matriz RBAC con permisos vinculados directamente al NOMBRE DEL ROL para que sea 100% explícito
  const [modulesRBAC, setModulesRBAC] = useState([
    {
      moduleId: 'mod_dashboard',
      moduleName: '📊 Resumen Ejecutivo & Dashboard KPI',
      description: 'Indicadores directivos, telemetría operativa y costos acumulados por Centro de Costos',
      actions: [
        { id: 'dash_kpi', label: 'Ver telemetría operativa en vivo (Disponibilidad, MTTR, MTBF)', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: true, Operator: false, Operario: false, Operativo: false },
        { id: 'dash_costs', label: 'Consultar costos contables acumulados y gastos por CECO (RLS)', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: false, Operator: false, Operario: false, Operativo: false }
      ]
    },
    {
      moduleId: 'mod_assets',
      moduleName: '⚙️ Catálogo de Activos Fijos & CECOs',
      description: 'Gestión jerárquica de maquinaria (Empresa > CECO > Área > Máquina) y hojas de vida',
      actions: [
        { id: 'ast_view', label: 'Consultar catálogo de activos y ficha técnica de placa', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: true, Operatorio: true, Operator: true, Operario: true, Operativo: true },
        { id: 'ast_docs', label: 'Descargar manuales de operación y planos en Azure Blob Storage', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: true, Operatorio: true, Operator: true, Operario: true, Operativo: true },
        { id: 'ast_create', label: 'Registrar nueva maquinaria o editar jerarquía de Áreas / CECOs', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: false, Operario: false, Operator: false, Operativo: false }
      ]
    },
    {
      moduleId: 'mod_inventory',
      moduleName: '📦 Almacén de Repuestos & Trazabilidad',
      description: 'Control de stock, ingresos por compras SAP y gestión de repuestos reutilizados',
      actions: [
        { id: 'inv_view', label: 'Consultar existencias en vivo y alertas de stock mínimo', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: true, Operario: false, Operator: false, Operativo: false },
        { id: 'inv_canib', label: 'Ingresar repuestos por Canibalización o Hallazgo en planta ($0 USD)', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: true, Operario: false, Operator: false, Operativo: false },
        { id: 'inv_sap', label: 'Registrar recepciones oficiales de compra SAP con costo comercial', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: false, Operario: false, Operator: false, Operativo: false }
      ]
    },
    {
      moduleId: 'mod_workorders',
      moduleName: '🛠️ Órdenes de Trabajo (OT) & Asistente IA',
      description: 'Ejecución de incidencias, asignación de técnicos y diagnóstico inteligente',
      actions: [
        { id: 'ot_create', label: 'Emitir y solicitar nuevas incidencias / Órdenes de Trabajo Rápidas', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: true, Operario: true, Operator: true, Operativo: true },
        { id: 'ot_techs', label: 'Asignar múltiples técnicos (>1) a una OT y validar horas hombre', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: false, Operario: false, Operator: false, Operativo: false },
        { id: 'ot_ai', label: 'Consultar Inteligencia Artificial para Diagnóstico LOTO y soluciones', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: true, Operario: false, Operator: false, Operativo: false },
        { id: 'ot_pdf', label: 'Descargar Acta Formal de OT en formato PDF para firma digital', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: true, Operario: true, Operator: true, Operativo: true }
      ]
    },
    {
      moduleId: 'mod_schedule',
      moduleName: '📅 Cronograma & Mantenimientos Preventivos',
      description: 'Programación automática y frecuencias de inspección',
      actions: [
        { id: 'sch_view', label: 'Visualizar calendario de inspecciones y alertas de vencimiento', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: true, Operario: false, Operator: false, Operativo: false },
        { id: 'sch_reprog', label: 'Reprogramar fecha de preventivo con justificación de auditoría CECO', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: false, Operario: false, Operator: false, Operativo: false }
      ]
    },
    {
      moduleId: 'mod_activities',
      moduleName: '📋 Catálogo Maestro de Actividades',
      description: 'Estandarización de tareas por especialidad (Mecánica, Eléctrica, Instrumentación)',
      actions: [
        { id: 'act_view', label: 'Consultar tareas maestro y recursos/herramientas sugeridas', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: true, Operario: false, Operator: false, Operativo: false },
        { id: 'act_edit', label: 'Crear, editar o eliminar tareas estándar del catálogo maestro', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: false, Operario: false, Operator: false, Operativo: false }
      ]
    },
    {
      moduleId: 'mod_security',
      moduleName: '🔐 Seguridad EBM & Identidad (RBAC)',
      description: 'Administración corporativa de cuentas de acceso y privilegios granulares',
      actions: [
        { id: 'sec_view', label: 'Consultar directorio de colaboradores y roles corporativos', Administrador: true, Supervisor: true, 'Supervisor de Planta': true, Técnico: false, Operario: false, Operator: false, Operativo: false },
        { id: 'sec_users', label: 'Registrar nuevos colaboradores y editar su asignación de CECO (RLS)', Administrador: true, Supervisor: false, 'Supervisor de Planta': false, Técnico: false, Operario: false, Operator: false, Operativo: false },
        { id: 'sec_toggle', label: 'Suspender o rehabilitar el acceso al sistema (Toggle Activo/Suspendido)', Administrador: true, Supervisor: false, 'Supervisor de Planta': false, Técnico: false, Operario: false, Operator: false, Operativo: false },
        { id: 'sec_roles', label: 'Crear roles corporativos y alterar la Matriz RBAC en tiempo real', Administrador: true, Supervisor: false, 'Supervisor de Planta': false, Técnico: false, Operario: false, Operator: false, Operativo: false }
      ]
    }
  ]);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userDataForm, setUserDataForm] = useState({ name: '', email: '', role: 'Técnico', ceco: 'CECO-SOL-101 (Ensamble)', isActive: true });

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleDataForm, setRoleDataForm] = useState({ name: '', description: '' });

  useEffect(() => {
    fetch('http://localhost:5000/api/auth/users')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const safeData = data.map((u, index) => ({
            id: u.id || u.Id || index + 1,
            name: u.name || u.Name || u.FullName || `Colaborador #${index + 1}`,
            email: u.email || u.Email || 'sin-correo@gruposole.com',
            role: u.role || u.Role || u.RoleName || 'Técnico',
            ceco: u.ceco || u.Ceco || 'CECO-SOL-101 (Ensamble)',
            isActive: (u.isActive !== undefined ? u.isActive : u.IsActive) !== false && (u.isActive !== 0),
            status: ((u.isActive !== undefined ? u.isActive : u.IsActive) !== false && (u.isActive !== 0)) ? 'Activo' : 'Suspendido'
          }));
          setUsersList(safeData);
        }
      })
      .catch(() => console.log('Usando datos locales para Usuarios.'));

    fetch('http://localhost:5000/api/auth/roles')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const merged = data.map((d, i) => {
            const roleName = d.name || d.Name || `Rol #${i + 1}`;
            return {
              id: d.id || d.Id || i + 1,
              name: roleName,
              description: d.description || 'Rol corporativo administrado en Azure SQL',
              isSystem: i < 4 || (d.id || d.Id) <= 4
            };
          });
          setRolesList(merged);

          // Asegurar que si Azure SQL devuelve roles que no tienen key inicial, tengan valor por defecto
          setModulesRBAC(prev => prev.map(mod => ({
            ...mod,
            actions: mod.actions.map(act => {
              const newAct = { ...act };
              merged.forEach(role => {
                if (newAct[role.name] === undefined) {
                  const rLower = role.name.toLowerCase();
                  if (rLower.includes('admin') || rLower.includes('super')) newAct[role.name] = true;
                  else if (rLower.includes('técn') || rLower.includes('tecn')) newAct[role.name] = act.label.includes('Consultar') || act.label.includes('Emitir');
                  else newAct[role.name] = act.label.includes('Emitir') || act.label.includes('Descargar');
                }
              });
              return newAct;
            })
          })));
        }
      })
      .catch(() => console.log('Usando roles locales.'));
  }, []);

  const togglePermission = (modIdx, actionIdx, roleName) => {
    if ((currentUser?.role || '') !== 'Administrador') {
      alert('⚠️ Solo el Administrador general puede alterar la matriz de seguridad en vivo.');
      return;
    }
    if ((roleName || '').toLowerCase().includes('admin')) {
      alert('⚠️ No se puede restringir permisos al rol Administrador por seguridad del sistema.');
      return;
    }
    const copy = [...modulesRBAC];
    if (copy[modIdx] && copy[modIdx].actions[actionIdx]) {
      const currentVal = copy[modIdx].actions[actionIdx][roleName];
      copy[modIdx].actions[actionIdx][roleName] = !currentVal;
      setModulesRBAC(copy);
    }
  };

  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserDataForm({ name: '', email: '', role: rolesList[0]?.name || 'Técnico', ceco: 'CECO-SOL-101 (Ensamble)', isActive: true });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (user) => {
    if ((currentUser?.role || '') !== 'Administrador') {
      alert('⚠️ No tienes permisos suficientes para editar información de colaboradores.');
      return;
    }
    setEditingUser(user);
    setUserDataForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'Técnico',
      ceco: user.ceco || 'CECO-SOL-101 (Ensamble)',
      isActive: user.isActive !== false
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userDataForm.name || !userDataForm.email) return;

    if (editingUser) {
      const updated = usersList.map(u => u.id === editingUser.id ? { ...u, ...userDataForm, status: userDataForm.isActive ? 'Activo' : 'Suspendido' } : u);
      setUsersList(updated);
      try {
        await fetch(`http://localhost:5000/api/auth/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userDataForm)
        });
      } catch (e) {}
      alert(`✅ Información y rol del colaborador ${userDataForm.name} actualizados exitosamente.`);
    } else {
      const newObj = {
        id: Date.now(),
        ...userDataForm,
        status: userDataForm.isActive ? 'Activo' : 'Suspendido'
      };
      setUsersList([newObj, ...usersList]);
      try {
        await fetch('http://localhost:5000/api/auth/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newObj)
        });
      } catch (e) {}
      alert(`🎉 Nuevo colaborador ${newObj.name} registrado en la base de datos.`);
    }
    setShowUserModal(false);
  };

  const handleToggleActive = async (user) => {
    if ((currentUser?.role || '') !== 'Administrador') {
      alert('⚠️ Solo un Administrador puede suspender o rehabilitar el acceso al sistema.');
      return;
    }
    if (user.role === 'Administrador' && (user.email || '').includes('admin@gruposole.com')) {
      alert('⚠️ No es posible suspender a la cuenta de Administrador Principal de Grupo SOLE.');
      return;
    }
    const nextStatus = !user.isActive;
    const msg = nextStatus 
      ? `¿Estás seguro de ACTIVAR la cuenta de ${user.name}? Recuperará el acceso al sistema.`
      : `¿Estás seguro de DESACTIVAR/SUSPENDER a ${user.name}? No podrá iniciar sesión ni operar en planta.`;
    
    if (window.confirm(msg)) {
      const updated = usersList.map(u => u.id === user.id ? { ...u, isActive: nextStatus, status: nextStatus ? 'Activo' : 'Suspendido' } : u);
      setUsersList(updated);
      try {
        await fetch(`http://localhost:5000/api/auth/users/${user.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: nextStatus })
        });
      } catch (e) {}
    }
  };

  const handleDeleteUser = async (user) => {
    if ((currentUser?.role || '') !== 'Administrador') return alert('⚠️ Acción restringida a Administradores.');
    if ((user.email || '').includes('admin@gruposole.com')) return alert('⚠️ No se puede eliminar la cuenta maestra.');
    if (window.confirm(`⚠️ ¿Deseas eliminar definitivamente el registro de ${user.name || 'este usuario'}?`)) {
      setUsersList(usersList.filter(u => u.id !== user.id));
      try {
        await fetch(`http://localhost:5000/api/auth/users/${user.id}`, { method: 'DELETE' });
      } catch (e) {}
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!roleDataForm.name) return;
    if (rolesList.some(r => (r.name || '').toLowerCase() === (roleDataForm.name || '').toLowerCase())) {
      alert('⚠️ Este rol ya existe en el sistema.');
      return;
    }

    const newRoleName = roleDataForm.name.trim();
    const newRoleObj = {
      id: Date.now(),
      name: newRoleName,
      description: roleDataForm.description || 'Rol operativo personalizado para planta Grupo SOLE.',
      isSystem: false
    };

    setRolesList([...rolesList, newRoleObj]);
    
    // Al crear un rol, le asignamos permisos básicos en las acciones
    const updatedModules = modulesRBAC.map(mod => ({
      ...mod,
      actions: mod.actions.map(act => ({
        ...act,
        [newRoleName]: act.label.includes('Consultar') || act.label.includes('Visualizar') || act.label.includes('Descargar') || act.label.includes('Emitir')
      }))
    }));
    setModulesRBAC(updatedModules);

    setShowRoleModal(false);
    setRoleDataForm({ name: '', description: '' });

    try {
      await fetch('http://localhost:5000/api/auth/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleObj.name, description: newRoleObj.description })
      });
    } catch (e) {}
    alert(`✅ Rol "${newRoleObj.name}" creado con éxito y añadido a la Matriz RBAC con su propio indicador.`);
  };

  const handleDeleteRole = async (role) => {
    if (role.isSystem) {
      alert('⚠️ Los roles nativos del sistema están protegidos y no pueden eliminarse.');
      return;
    }
    if (usersList.some(u => u.role === role.name)) {
      alert(`⚠️ El rol "${role.name}" actualmente tiene colaboradores asignados. Cambia el rol de esos usuarios antes de eliminarlo.`);
      return;
    }
    if (window.confirm(`¿Seguro de eliminar el rol "${role.name}" del sistema y de la matriz RBAC?`)) {
      setRolesList(rolesList.filter(r => r.id !== role.id));
      try {
        await fetch(`http://localhost:5000/api/auth/roles/${role.id}`, { method: 'DELETE' });
      } catch (e) {}
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#1A1C1E', letterSpacing: '-0.3px' }}>
            Gestión Integral de Usuarios, Roles & Seguridad RBAC por Módulo
          </h3>
          <p style={{ fontSize: '14px', color: '#515254' }}>
            Configura de manera ultra-explícita qué nivel de acceso y privilegios tiene cada rol sobre los módulos de Grupo SOLE.
          </p>
        </div>
        {(currentUser?.role || '') === 'Administrador' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            {activeTab === 'users' ? (
              <button className="btn btn-primary" onClick={handleOpenCreateUser}>
                <UserPlus size={16} /> + Nuevo Colaborador
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowRoleModal(true)}>
                <PlusCircle size={16} /> + Crear Nuevo Rol
              </button>
            )}
          </div>
        )}
      </div>

      <div className="siatc-card" style={{ padding: '14px 20px', marginBottom: '24px', background: '#F4F7FC', borderLeft: '4px solid #3B72D4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Shield color="#3B72D4" size={26} />
          <div>
            <strong style={{ color: '#1A1C1E', fontSize: '14px' }}>
              Sesión Activa: {currentUser?.name || 'Invitado'} ({currentUser?.role || 'Consulta'})
            </strong>
            <p style={{ fontSize: '13px', color: '#515254', margin: 0, marginTop: '2px' }}>
              {(currentUser?.role || '') === 'Administrador' 
                ? '🟢 Permisos Globales: Haz clic en cualquier recuadro de la matriz para habilitar o restringir una acción a un rol específico en tiempo real.' 
                : '🟡 Modo Consulta: Si necesitas editar cuentas o modificar los recuadros de la matriz RBAC, ingresa con el perfil Administrador.'}
            </p>
          </div>
        </div>
        <span className="badge badge-info" style={{ fontSize: '12px', padding: '6px 12px' }}>Seguridad EBM Activa</span>
      </div>

      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #E4E7ED', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '700',
            color: activeTab === 'users' ? '#4C5F80' : '#8A919E',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'users' ? '3px solid #4C5F80' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <UsersIcon size={18} />
          Colaboradores & Estado ({usersList.length})
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          style={{
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '700',
            color: activeTab === 'roles' ? '#4C5F80' : '#8A919E',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'roles' ? '3px solid #4C5F80' : '3px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Layers size={18} />
          Matriz RBAC por Módulo & Acciones ({rolesList.length} Roles)
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="siatc-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#1A1C1E' }}>Directorio de Usuarios y Control de Acceso</h4>
            <span style={{ fontSize: '13px', color: '#515254' }}>Haz clic en "Editar" para cambiar roles o en el interruptor para suspender cuentas</span>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Correo Institucional</th>
                  <th>Rol Asignado</th>
                  <th>CECO Asociado (RLS)</th>
                  <th style={{ textAlign: 'center' }}>Estado (Toggle)</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => {
                  const displayName = u.name || 'Colaborador';
                  const initial = (displayName.charAt(0) || 'U').toUpperCase();
                  const isUserActive = u.isActive !== false && u.isActive !== 0;

                  return (
                    <tr key={u.id} style={{ opacity: !isUserActive ? '0.6' : '1', transition: 'opacity 0.2s' }}>
                      <td style={{ fontWeight: '700', color: '#1A1C1E' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '50%', background: isUserActive ? '#4C5F80' : '#A0AEC0',
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px'
                          }}>
                            {initial}
                          </div>
                          <div>
                            <span>{displayName}</span>
                            {!isUserActive && <span style={{ display: 'block', fontSize: '11px', color: '#D9534F', fontWeight: '600' }}>⚠️ Acceso Suspendido</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#515254' }}>{u.email || 'Sin correo'}</td>
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: '700', border: '1px solid #C5D6F5' }}>
                          {u.role || 'Técnico'}
                        </span>
                      </td>
                      <td><span className="badge badge-mono">{u.ceco || 'CECO-SOL-101'}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => handleToggleActive(u)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          title={isUserActive ? 'Cuenta Activa. Clic para suspender.' : 'Cuenta Suspendida. Clic para activar.'}
                        >
                          {isUserActive ? (
                            <>
                              <ToggleRight size={28} color="#2E7D32" />
                              <span className="badge badge-success">Activo</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={28} color="#C62828" />
                              <span className="badge badge-danger">Suspendido</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '13px' }} 
                            onClick={() => handleOpenEditUser(u)}
                            title="Editar usuario"
                          >
                            <Edit3 size={15} /> Editar
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', color: '#D9534F' }} 
                            onClick={() => handleDeleteUser(u)}
                            title="Eliminar usuario"
                          >
                            <Trash2 size={15} />
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
      )}

      {activeTab === 'roles' && (
        <>
          <div className="siatc-card" style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#1A1C1E' }}>Catálogo de Roles Corporativos</h4>
                <span style={{ fontSize: '13px', color: '#515254' }}>Crea roles personalizados y asígnalos a los colaboradores de Grupo SOLE</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {rolesList.map(r => {
                const count = usersList.filter(u => u.role === r.name).length;
                return (
                  <div key={r.id} style={{ border: '1px solid #D9E1F2', borderRadius: '12px', padding: '16px', background: '#FAFAFD', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontWeight: '800', fontSize: '16px', color: '#1B365D' }}>{r.name}</span>
                        {r.isSystem ? (
                          <span className="badge badge-mono" style={{ fontSize: '11px' }}>🔒 Sistema</span>
                        ) : (
                          <span className="badge badge-success" style={{ fontSize: '11px' }}>✨ Custom</span>
                        )}
                      </div>
                      <p style={{ fontSize: '13px', color: '#515254', marginBottom: '14px', lineHeight: '1.4' }}>
                        {r.description}
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #EEF2F8', paddingTop: '12px', marginTop: 'auto' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#4C5F80' }}>
                        👥 {count} {count === 1 ? 'colaborador' : 'colaboradores'}
                      </span>
                      {!r.isSystem && (currentUser?.role || '') === 'Administrador' && (
                        <button 
                          onClick={() => handleDeleteRole(r)} 
                          style={{ background: '#FFEBEB', color: '#C62828', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={13} /> Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="siatc-card" style={{ padding: '28px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ background: '#1E293B', padding: '10px', borderRadius: '10px', color: '#FFF' }}>
                <Layers size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '20px', fontWeight: '800', color: '#1E293B', margin: 0 }}>
                  Matriz Interactiva de Privilegios por Rol & Módulo
                </h4>
                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>
                  Cada recuadro muestra el <strong>Rol Exacto</strong> al que se otorga o deniega el permiso. Haz clic en el recuadro para alternar.
                </span>
              </div>
            </div>

            <div style={{ overflowX: 'auto', border: '2px solid #CBD5E1', borderRadius: '14px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                <thead>
                  <tr style={{ background: '#0F172A', color: '#FFFFFF' }}>
                    <th style={{ padding: '18px 22px', fontSize: '15px', fontWeight: '800', color: '#FFFFFF', width: '38%', borderBottom: '3px solid #334155' }}>
                      MÓDULO OPERATIVO / CAPACIDAD
                    </th>
                    {rolesList.map(r => (
                      <th key={r.id} style={{ textAlign: 'center', padding: '14px 10px', background: '#1E293B', borderLeft: '1px solid #334155', borderBottom: '3px solid #334155', minWidth: '150px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: '#F8FAFC', letterSpacing: '0.5px' }}>
                            👤 {r.name.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', background: '#0F172A', padding: '2px 10px', borderRadius: '20px', border: '1px solid #334155' }}>
                            {usersList.filter(u => (u.role || '').toLowerCase() === r.name.toLowerCase()).length} {usersList.filter(u => (u.role || '').toLowerCase() === r.name.toLowerCase()).length === 1 ? 'usuario' : 'usuarios'}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modulesRBAC.map((mod, modIdx) => (
                    <React.Fragment key={mod.moduleId}>
                      {/* Cabecera del Módulo */}
                      <tr style={{ background: '#E2E8F0', borderTop: '2px solid #94A3B8', borderBottom: '2px solid #94A3B8' }}>
                        <td colSpan={1 + rolesList.length} style={{ padding: '14px 22px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <strong style={{ fontSize: '16px', color: '#0F172A', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {mod.moduleName}
                              </strong>
                              <span style={{ fontSize: '12px', color: '#475569', display: 'block', marginTop: '2px', fontWeight: '600' }}>
                                ℹ️ {mod.description}
                              </span>
                            </div>
                            <span style={{ background: '#0F172A', color: '#FFFFFF', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' }}>
                              {mod.actions.length} CAPACIDADES
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Acciones del Módulo */}
                      {mod.actions.map((act, actIdx) => (
                        <tr key={act.id} style={{ borderBottom: '1px solid #E2E8F0', background: actIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', transition: 'all 0.1s' }}>
                          <td style={{ padding: '16px 22px', fontWeight: '700', color: '#1E293B', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <ChevronRight size={18} color="#3B82F6" strokeWidth={3} />
                            <span>{act.label}</span>
                          </td>
                          
                          {rolesList.map(r => {
                            // Evaluación ultra robusta que busca por nombre de rol exacto
                            const isAllowed = Boolean(act[r.name]);
                            const isAdmin = r.name.toLowerCase().includes('admin');

                            return (
                              <td key={r.id} style={{ padding: '12px', textAlign: 'center', borderLeft: '1px solid #E2E8F0' }}>
                                <div 
                                  onClick={() => togglePermission(modIdx, actIdx, r.name)}
                                  style={{
                                    padding: '10px 8px',
                                    borderRadius: '10px',
                                    border: `2px solid ${isAllowed ? '#10B981' : '#F43F5E'}`,
                                    background: isAllowed ? '#ECFDF5' : '#FFF1F2',
                                    cursor: (currentUser?.role === 'Administrador' && !isAdmin) ? 'pointer' : 'not-allowed',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'transform 0.1s'
                                  }}
                                  title={isAdmin ? 'El Administrador tiene permisos fijos totales por sistema.' : `Clic para alternar permiso en ${r.name}`}
                                >
                                  {/* Nombre del Rol dentro de la misma celda para CERO confusión */}
                                  <span style={{ fontSize: '11px', fontWeight: '800', color: isAllowed ? '#047857' : '#9F1239', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    👤 {r.name}
                                  </span>
                                  
                                  {/* Estado del permiso */}
                                  <span style={{ fontSize: '13px', fontWeight: '800', color: isAllowed ? '#059669' : '#E11D48', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    {isAllowed ? <><Check size={16} strokeWidth={3} /> PERMITIDO</> : <><XCircle size={15} /> RESTRINGIDO</>}
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E4E7ED', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1B365D' }}>
                {editingUser ? `Editar Colaborador: ${editingUser.name}` : 'Registrar Nuevo Colaborador'}
              </h3>
              <button onClick={() => setShowUserModal(false)} style={{ fontSize: '20px', color: '#8A919E', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#1A1C1E' }}>Nombre y Apellidos *</label>
                <input 
                  className="form-input" 
                  required 
                  placeholder="Ej. Fernando Silva" 
                  value={userDataForm.name} 
                  onChange={e => setUserDataForm({...userDataForm, name: e.target.value})} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#1A1C1E' }}>Correo Electrónico *</label>
                <input 
                  className="form-input" 
                  type="email" 
                  required 
                  placeholder="fsilva@gruposole.com" 
                  value={userDataForm.email} 
                  onChange={e => setUserDataForm({...userDataForm, email: e.target.value})} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#1A1C1E' }}>Rol de Acceso *</label>
                <select 
                  className="form-select" 
                  value={userDataForm.role} 
                  onChange={e => setUserDataForm({...userDataForm, role: e.target.value})}
                >
                  {rolesList.map(r => (
                    <option key={r.id} value={r.name}>{r.name} {r.isSystem ? '(Nativo)' : '(Personalizado)'}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#1A1C1E' }}>CECO / RLS</label>
                <select 
                  className="form-select" 
                  value={userDataForm.ceco} 
                  onChange={e => setUserDataForm({...userDataForm, ceco: e.target.value})}
                >
                  <option value="CECO-SOL-101 (Ensamble)">CECO-SOL-101 (Línea Ensamble Termos)</option>
                  <option value="CECO-SOL-102 (Metalmecánica)">CECO-SOL-102 (Prensas y Estampado)</option>
                  <option value="CECO-SOL-103 (Pintura)">CECO-SOL-103 (Tratamiento y Pintura)</option>
                  <option value="CECO-SOL-999 (Planta General)">CECO-SOL-999 (Infraestructural General)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px', background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E4E9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: '#1A1C1E', display: 'block' }}>Estado de Acceso al Sistema</strong>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    {userDataForm.isActive ? 'Cuenta habilitada para iniciar sesión' : 'Cuenta suspendida/bloqueada del sistema'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUserDataForm({ ...userDataForm, isActive: !userDataForm.isActive })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: userDataForm.isActive ? '#2E7D32' : '#C62828' }}
                >
                  {userDataForm.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  {userDataForm.isActive ? 'ACTIVA' : 'SUSPENDIDA'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #E4E7ED', paddingTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingUser ? 'Guardar Cambios' : 'Registrar Colaborador'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #E4E7ED', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1B365D' }}>Crear Nuevo Rol Corporativo</h3>
              <button onClick={() => setShowRoleModal(false)} style={{ fontSize: '20px', color: '#8A919E', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateRole}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#1A1C1E' }}>Nombre del Rol *</label>
                <input 
                  className="form-input" 
                  required 
                  placeholder="Ej. Inspector de Calidad, Jefe de Almacén..." 
                  value={roleDataForm.name} 
                  onChange={e => setRoleDataForm({...roleDataForm, name: e.target.value})} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#1A1C1E' }}>Descripción *</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  required 
                  placeholder="Explica las funciones o alcance de seguridad que tendrá este perfil..." 
                  value={roleDataForm.description} 
                  onChange={e => setRoleDataForm({...roleDataForm, description: e.target.value})} 
                />
              </div>

              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#1E40AF' }}>
                ℹ️ Al crear un rol, se añadirá instantáneamente como una nueva columna interactiva con el nombre del rol explícito en cada celda.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #E4E7ED', paddingTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Rol e Integrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
