import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Lock, CheckCircle2, XCircle, Key, Users as UsersIcon, Edit3, Trash2, PlusCircle, ToggleLeft, ToggleRight, Check, AlertCircle, Layers, ChevronRight, UserCheck } from 'lucide-react';
import { api } from '../services/api';

export default function Users({ currentUser }) {
  const [activeTab, setActiveTab] = useState('users');

  // Estado vacío: los datos SIEMPRE vienen de Azure SQL via /api/auth/users
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);

  // Roles reales desde MANSOLE.Roles: Administrador, Supervisor, Técnico, Operador
  const [rolesList, setRolesList] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

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
    // Carga usuarios reales desde Azure SQL (GET /api/auth/users)
    setUsersLoading(true);
    setUsersError(null);
    api.getUsers()
      .then(data => {
        if (Array.isArray(data)) {
          setUsersList(data.map((u, index) => ({
            id: u.id || u.Id || index + 1,
            name: u.name || u.Name || `Colaborador #${index + 1}`,
            email: u.email || u.Email || '',
            role: u.role || u.RoleName || 'Sin Rol',
            isActive: u.isActive !== false && u.isActive !== 0,
            status: (u.isActive !== false && u.isActive !== 0) ? 'Activo' : 'Suspendido'
          })));
        }
        setUsersLoading(false);
      })
      .catch(err => {
        setUsersError(`No se pudo conectar con Azure SQL: ${err.response?.data?.error || err.message}`);
        setUsersLoading(false);
      });

    // Carga roles reales desde MANSOLE.Roles
    setRolesLoading(true);
    api.getRoles()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const merged = data.map((d, i) => ({
            id: d.id || d.Id || i + 1,
            name: d.name || d.Name || `Rol #${i + 1}`,
            description: d.description || 'Rol corporativo en MANSOLE.Roles',
            permissionCount: d.permissionCount || 0,
            isSystem: true
          }));
          setRolesList(merged);

          // Expandir la matriz RBAC con cualquier rol nuevo que no tenga columna aún
          setModulesRBAC(prev => prev.map(mod => ({
            ...mod,
            actions: mod.actions.map(act => {
              const newAct = { ...act };
              merged.forEach(role => {
                if (newAct[role.name] === undefined) {
                  const rLower = (role.name || '').toLowerCase();
                  if (rLower.includes('admin')) newAct[role.name] = true;
                  else if (rLower.includes('super')) newAct[role.name] = true;
                  else if (rLower.includes('tecn')) newAct[role.name] = act.label.includes('Consultar') || act.label.includes('Emitir');
                  else newAct[role.name] = false;
                }
              });
              return newAct;
            })
          })));
        }
        setRolesLoading(false);
      })
      .catch(() => setRolesLoading(false));
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
        await api.updateUser(editingUser.id, userDataForm);
        alert(`✅ Información y rol del colaborador ${userDataForm.name} actualizados exitosamente.`);
      } catch (err) {
        alert(`❌ No se pudo actualizar: ${err.response?.data?.error || err.message}`);
      }
    } else {
      const newObj = {
        id: Date.now(),
        ...userDataForm,
        status: userDataForm.isActive ? 'Activo' : 'Suspendido'
      };
      setUsersList([newObj, ...usersList]);
      try {
        const res = await api.createUser(newObj);
        alert(
          `🎉 Nuevo colaborador ${newObj.name} registrado en la base de datos.\n\n` +
          `⚠️ Aún no puede iniciar sesión: asígnale una contraseña ejecutando en Backend/\n` +
          `node scripts/set-password.js ${newObj.email}` + (res?.note ? '' : '')
        );
      } catch (err) {
        alert(`❌ No se pudo crear: ${err.response?.data?.error || err.message}`);
      }
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
        await api.updateUserStatus(user.id, nextStatus);
      } catch (err) {
        alert(`❌ No se pudo cambiar el estado: ${err.response?.data?.error || err.message}`);
        setUsersList(usersList); // revertir el cambio optimista
      }
    }
  };

  const handleDeleteUser = async (user) => {
    if ((currentUser?.role || '') !== 'Administrador') return alert('⚠️ Acción restringida a Administradores.');
    if ((user.email || '').includes('admin@gruposole.com')) return alert('⚠️ No se puede eliminar la cuenta maestra.');
    if (window.confirm(`⚠️ ¿Deseas eliminar definitivamente el registro de ${user.name || 'este usuario'}?`)) {
      const previous = usersList;
      setUsersList(usersList.filter(u => u.id !== user.id));
      try {
        await api.deleteUser(user.id);
      } catch (err) {
        alert(`❌ No se pudo eliminar: ${err.response?.data?.error || err.message}`);
        setUsersList(previous);
      }
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
      await api.createRole({ name: newRoleObj.name, description: newRoleObj.description });
      alert(
        `✅ Rol "${newRoleObj.name}" creado en la base de datos.\n\n` +
        `⚠️ Nace sin permisos: hay que declararlos en Backend/src/config/permissions.js`
      );
    } catch (err) {
      alert(`❌ No se pudo crear el rol: ${err.response?.data?.error || err.message}`);
    }
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
      const previous = rolesList;
      setRolesList(rolesList.filter(r => r.id !== role.id));
      try {
        await api.deleteRole(role.id);
      } catch (err) {
        alert(`❌ No se pudo eliminar el rol: ${err.response?.data?.error || err.message}`);
        setRolesList(previous);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Usuarios, Roles & Matriz RBAC
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Gobernanza y control granular de accesos por rol en la organización
          </p>
        </div>
        {(currentUser?.role || '') === 'Administrador' && (
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {activeTab === 'users' ? (
              <button className="btn btn-primary text-xs flex-1 sm:flex-initial justify-center" onClick={handleOpenCreateUser}>
                <UserPlus size={15} /> Nuevo Colaborador
              </button>
            ) : (
              <button className="btn btn-primary text-xs flex-1 sm:flex-initial justify-center" onClick={() => setShowRoleModal(true)}>
                <PlusCircle size={15} /> Crear Rol
              </button>
            )}
          </div>
        )}
      </div>

      <div className="stat-card border-l-4 border-l-blue-600 flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 flex-shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              Sesión Activa: {currentUser?.name || 'Invitado'}{' '}
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 ml-1">
                {currentUser?.role || 'Consulta'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {(currentUser?.role || '') === 'Administrador' 
                ? 'Privilegios de Administrador: Haz clic en cualquier celda para conceder o revocar permisos en tiempo real.' 
                : 'Modo Consulta: Para modificar privilegios RBAC o dar de alta colaboradores, inicia sesión como Administrador.'}
            </p>
          </div>
        </div>
        <span className="badge badge-info text-[11px] flex-shrink-0">Encriptación Azure</span>
      </div>

      <div className="pipeline-container border-b border-slate-200 pb-2">
        <button 
          onClick={() => setActiveTab('users')}
          className={`pipeline-tab text-xs ${activeTab === 'users' ? 'active' : ''}`}
        >
          <UsersIcon size={14} />
          Colaboradores ({usersList.length})
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          className={`pipeline-tab text-xs ${activeTab === 'roles' ? 'active' : ''}`}
        >
          <Layers size={14} />
          Matriz RBAC ({rolesList.length} Roles)
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="stat-card p-3.5 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-4">
            <h4 className="text-sm sm:text-base font-bold text-slate-900">Directorio de Usuarios y Control de Acceso</h4>
            <span className="text-xs text-slate-500">Haz clic en "Editar" para cambiar roles o en el interruptor para suspender cuentas</span>
          </div>

          {usersError && (
            <div style={{ padding: '12px 16px', background: '#FDF1F2', color: '#DF2935', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: '600' }}>
              <AlertCircle size={16} /> {usersError}
            </div>
          )}

          {usersLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8A919E', fontWeight: '600' }}>
              ⏳ Cargando lista de colaboradores desde Azure SQL...
            </div>
          ) : usersList.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8A919E', fontWeight: '600' }}>
              📭 No hay usuarios registrados en la base de datos MANSOLE.Users.
            </div>
          ) : (
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
          )}
        </div>
      )}

      {activeTab === 'roles' && (
        <>
          <div className="stat-card p-3.5 sm:p-5 mb-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-4">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">Catálogo de Roles Corporativos</h4>
                <span className="text-xs text-slate-500">Crea roles personalizados y asígnalos a los colaboradores de Grupo SOLE</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {rolesList.map(r => {
                const count = usersList.filter(u => u.role === r.name).length;
                return (
                  <div key={r.id} className="border border-slate-200 rounded-xl p-3.5 sm:p-4 bg-slate-50/60 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm sm:text-base text-slate-900">{r.name}</span>
                        {r.isSystem ? (
                          <span className="badge badge-mono text-[11px]">🔒 Sistema</span>
                        ) : (
                          <span className="badge badge-success text-[11px]">✨ Custom</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {r.description}
                      </p>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200/80 pt-2.5 mt-auto">
                      <span className="text-xs font-bold text-slate-600">
                        👥 {count} {count === 1 ? 'colaborador' : 'colaboradores'}
                      </span>
                      {!r.isSystem && (currentUser?.role || '') === 'Administrador' && (
                        <button 
                          onClick={() => handleDeleteRole(r)} 
                          className="px-2 py-1 rounded bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 flex items-center gap-1 transition-colors"
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

          <div className="stat-card p-3.5 sm:p-6 bg-white shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                <Layers size={18} />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  Matriz Interactiva de Privilegios por Rol & Módulo
                </h4>
                <span className="text-xs text-slate-500">
                  Haz clic en el recuadro para alternar los permisos en tiempo real.
                </span>
              </div>
            </div>

            <div className="text-[11px] text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg mb-3 flex items-center gap-1.5 font-medium sm:hidden">
              <span>👉 Desliza horizontalmente la tabla para ver todos los roles y permisos</span>
            </div>

            <div className="table-container border border-slate-300 rounded-xl overflow-x-auto shadow-xs">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
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

              <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200 mb-4 flex items-center justify-between gap-2">
                <div>
                  <strong className="text-xs sm:text-sm font-bold text-slate-900 block">Estado de Acceso al Sistema</strong>
                  <span className="text-[11px] text-slate-500">
                    {userDataForm.isActive ? 'Cuenta habilitada para iniciar sesión' : 'Cuenta suspendida/bloqueada del sistema'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUserDataForm({ ...userDataForm, isActive: !userDataForm.isActive })}
                  className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border transition-colors ${
                    userDataForm.isActive ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'
                  }`}
                >
                  {userDataForm.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  <span>{userDataForm.isActive ? 'ACTIVA' : 'SUSPENDIDA'}</span>
                </button>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" className="btn btn-secondary text-xs justify-center" onClick={() => setShowUserModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary text-xs justify-center">{editingUser ? 'Guardar Cambios' : 'Registrar Colaborador'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Crear Nuevo Rol Corporativo</h3>
              <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1">✕</button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-3">
              <div className="form-group mb-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Rol *</label>
                <input 
                  className="form-input text-xs" 
                  required 
                  placeholder="Ej. Inspector de Calidad, Jefe de Almacén..." 
                  value={roleDataForm.name} 
                  onChange={e => setRoleDataForm({...roleDataForm, name: e.target.value})} 
                />
              </div>

              <div className="form-group mb-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción *</label>
                <textarea 
                  className="form-textarea text-xs" 
                  rows="2"
                  required 
                  placeholder="Explica las funciones o alcance de seguridad que tendrá este perfil..." 
                  value={roleDataForm.description} 
                  onChange={e => setRoleDataForm({...roleDataForm, description: e.target.value})} 
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-800 leading-relaxed">
                ℹ️ Al crear un rol, se añadirá instantáneamente como una nueva columna interactiva con el nombre del rol explícito en cada celda.
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" className="btn btn-secondary text-xs justify-center" onClick={() => setShowRoleModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary text-xs justify-center">Crear Rol e Integrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
