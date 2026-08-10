import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TrendingUp, Clock, Cpu, CheckCircle2, AlertTriangle, DollarSign, Boxes } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Table, TableHead, TableBody, TableHeader, TableRow, TableCell } from './UI';

export default function DashboardV2({ currentUser }) {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getKPIs().then(data => {
      setKpi(data);
      setLoading(false);
    });
  }, []);

  if (loading || !kpi) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">Cargando indicadores...</p>
        </div>
      </div>
    );
  }

  const kpiCards = [
    { title: 'Disponibilidad', value: `${kpi.overallAvailability}%`, desc: 'Meta > 95%', icon: TrendingUp, color: 'success' },
    { title: 'MTTR', value: `${kpi.mttrHours}h`, desc: 'T. reparación promedio', icon: Clock, color: 'info' },
    { title: 'MTBF', value: `${kpi.mtbfHours}h`, desc: 'Tiempo entre fallas', icon: Cpu, color: 'primary' },
    { title: 'Cumplimiento', value: `${kpi.preventiveCompliance}%`, desc: 'Preventivo ejecutado', icon: CheckCircle2, color: 'success' },
  ];

  const colorClasses = {
    success: 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400',
    error: 'bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400',
    warning: 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400',
    info: 'bg-info-50 dark:bg-info-900/20 text-info-700 dark:text-info-400',
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400',
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpiCard, i) => {
          const Icon = kpiCard.icon;
          return (
            <Card key={i} elevated>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                    {kpiCard.title}
                  </p>
                  <h3 className="text-3xl font-bold text-neutral-900 dark:text-white mt-2">
                    {kpiCard.value}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    {kpiCard.desc}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[kpiCard.color]}`}>
                  <Icon size={24} className="opacity-60" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Failing Assets */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-error-500" />
              <CardTitle>Activos con Incidencias</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Código / Máquina</TableHeader>
                  <TableHeader>Fallas</TableHeader>
                  <TableHeader>Downtime</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {kpi.topFailingAssets.map((asset, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="font-semibold text-neutral-900 dark:text-white">[{asset.code}]</div>
                      <div className="text-xs text-neutral-600 dark:text-neutral-400">{asset.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="error" size="sm">{asset.failuresCount}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{asset.downtimeMinutes}m</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expenses by CECO */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign size={20} className="text-success-500" />
              <CardTitle>Gastos por CECO</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Centro de Costo</TableHeader>
                  <TableHeader>Gasto</TableHeader>
                  <TableHeader>%</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {kpi.expensesByCostCenter.map((exp, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Badge variant="info" size="sm">{exp.ceco}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">${exp.amount.toFixed(0)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary-500 h-full transition-all"
                            style={{ width: `${exp.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 w-10">
                          {exp.percentage}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Spare Parts Consumption */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Boxes size={20} className="text-primary-500" />
            <CardTitle>Consumo de Repuestos & Canibalización</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Repuesto / Código</TableHeader>
                <TableHeader>Cantidad Usada</TableHeader>
                <TableHeader>Costo Acumulado</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {kpi.sparePartsConsumption.map((part, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <div className="font-semibold text-neutral-900 dark:text-white">{part.code}</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">{part.name}</div>
                  </TableCell>
                  <TableCell>{part.usedQuantity} pcs</TableCell>
                  <TableCell className="font-semibold">
                    {part.totalCost === 0 ? (
                      <Badge variant="warning" size="sm">Canibalizado ($0)</Badge>
                    ) : (
                      `$${part.totalCost.toFixed(2)}`
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
