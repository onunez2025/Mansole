import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, LoadingSpinner, EmptyState } from './UI';
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';

export default function ScheduleModule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/schedule');
        if (!response.ok) throw new Error('Error al cargar cronograma');
        const data = await response.json();
        setSchedules(data);
      } catch (err) {
        console.error('Error fetching schedules:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Vencido': return 'error';
      case 'Pendiente': return 'warning';
      default: return 'success';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-1 max-w-md">
          <Input placeholder="Buscar activo..." type="search" />
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus size={18} />
          Nuevo Cronograma
        </Button>
      </div>

      {/* Tabla de Cronograma */}
      <Card>
        <CardHeader>
          <CardTitle>Cronograma de Mantenimiento Preventivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">ID Plan</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Activo</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Actividad</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Frecuencia</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Próximo Mantenimiento</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">{schedule.id}</td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{schedule.asset}</td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{schedule.activity}</td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{schedule.frequency}</td>
                    <td className="py-3 px-4 flex items-center gap-2 text-neutral-700 dark:text-neutral-400">
                      <Calendar size={14} className="text-primary-500" />
                      {schedule.next}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusColor(schedule.status)} size="sm">{schedule.status}</Badge>
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
