import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, LoadingSpinner, EmptyState } from './UI';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';

export default function ActivitiesModule() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/activities');
        if (!response.ok) throw new Error('Error al cargar actividades');
        const data = await response.json();
        setActivities(data);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'Alta': return 'error';
      case 'Media': return 'warning';
      default: return 'success';
    }
  };

  const getTypeColor = (type) => {
    return type === 'Preventivo' ? 'success' : 'info';
  };

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-1 max-w-md">
          <Input placeholder="Buscar actividad..." type="search" />
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus size={18} />
          Nueva Actividad
        </Button>
      </div>

      {/* Tabla de Actividades */}
      <Card>
        <CardHeader>
          <CardTitle>Catálogo Maestro de Actividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Código</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Descripción</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Duración (min)</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Departamento</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Complejidad</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id} className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">{activity.id}</td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{activity.code}</td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{activity.name}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-400">
                        <Clock size={14} className="text-primary-500" />
                        {activity.duration}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getTypeColor(activity.type)} size="sm">{activity.type}</Badge>
                    </td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{activity.department}</td>
                    <td className="py-3 px-4">
                      <Badge variant={getComplexityColor(activity.complexity)} size="sm">{activity.complexity}</Badge>
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
