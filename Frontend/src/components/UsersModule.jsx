import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, LoadingSpinner, EmptyState } from './UI';
import { Plus, Edit2, Trash2, Shield } from 'lucide-react';

export default function UsersModule() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/users');
        if (!response.ok) throw new Error('Error al cargar usuarios');
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getRoleColor = (role) => {
    switch (role) {
      case 'Administrador': return 'error';
      case 'Supervisor': return 'warning';
      case 'Técnico Mantenimiento': return 'info';
      default: return 'success';
    }
  };

  const getStatusColor = (status) => {
    return status === 'Activo' ? 'success' : 'warning';
  };

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-1 max-w-md">
          <Input placeholder="Buscar usuario..." type="search" />
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus size={18} />
          Nuevo Usuario
        </Button>
      </div>

      {/* Tabla de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios y Control RBAC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Nombre Completo</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Rol</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Departamento</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">{user.id}</td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{user.name}</td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{user.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="text-primary-500" />
                        <Badge variant={getRoleColor(user.role)} size="sm">{user.role}</Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{user.department}</td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusColor(user.status)} size="sm">{user.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm"><Edit2 size={14} /></Button>
                        <Button variant="ghost" size="sm"><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
