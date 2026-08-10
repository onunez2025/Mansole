import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, LoadingSpinner, EmptyState } from './UI';
import { Plus, Edit2, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function WorkOrdersModule() {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/workorders');
        if (!response.ok) throw new Error('Error al cargar OTs');
        const data = await response.json();
        setWorkOrders(data);
      } catch (err) {
        console.error('Error fetching work orders:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrders();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completado': return <CheckCircle className="text-success-500" size={16} />;
      case 'En Progreso': return <Clock className="text-info-500" size={16} />;
      default: return <AlertCircle className="text-warning-500" size={16} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Crítica': return 'error';
      case 'Alta': return 'warning';
      case 'Media': return 'info';
      default: return 'success';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <EmptyState
          type="error"
          title="Error al cargar Órdenes de Trabajo"
          description={error}
        />
      </div>
    );
  }

  if (!workOrders || workOrders.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          type="noresults"
          title="Sin Órdenes de Trabajo"
          description="No hay órdenes de trabajo registradas"
          action="Crear OT"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-1 max-w-md">
          <Input placeholder="Buscar OT..." type="search" />
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus size={18} />
          Nueva OT
        </Button>
      </div>

      {/* Tabla de Órdenes de Trabajo */}
      <Card>
        <CardHeader>
          <CardTitle>Órdenes de Trabajo Activas ({workOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Código</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Activo</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Prioridad</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Costo</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((wo) => (
                  <tr key={wo.Id || wo.id} className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">{wo.Code}</td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{wo.AssetCode || wo.AssetName}</td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{wo.Type}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(wo.Status)}
                        <span className="text-sm text-neutral-700 dark:text-neutral-400">{wo.Status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getPriorityColor(wo.Priority)} size="sm">{wo.Priority}</Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">${wo.TotalCost?.toFixed(2) || '0.00'}</td>
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
