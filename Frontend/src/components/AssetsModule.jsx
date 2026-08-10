import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, LoadingSpinner, EmptyState } from './UI';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';

export default function AssetsModule() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/assets');
        if (!response.ok) throw new Error('Error al cargar activos');
        const data = await response.json();
        setAssets(data);
      } catch (err) {
        console.error('Error fetching assets:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'En Riesgo': return 'error';
      case 'Mantenimiento': return 'warning';
      default: return 'success';
    }
  };

  const getStatusIcon = (status) => {
    return status === 'En Riesgo' ? <AlertTriangle size={14} /> : null;
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
          title="Error al cargar Activos"
          description={error}
        />
      </div>
    );
  }

  if (!assets || assets.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          type="noresults"
          title="Sin Activos"
          description="No hay activos registrados"
          action="Registrar Activo"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-1 max-w-md">
          <Input placeholder="Buscar activo..." type="search" />
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus size={18} />
          Nuevo Activo
        </Button>
      </div>

      {/* Tabla de Activos */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario de Activos y CECOs ({assets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Código</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Descripción</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Área</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">CECO</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-neutral-700 dark:text-neutral-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.Id || asset.id} className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">{asset.Code}</td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{asset.Name}</td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{asset.AreaName}</td>
                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-400">{asset.CostCenterCode}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {asset.Status === 'En Riesgo' && <AlertTriangle size={14} className="text-error-500" />}
                        <Badge variant={getStatusColor(asset.Status)} size="sm">{asset.Status}</Badge>
                      </div>
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
