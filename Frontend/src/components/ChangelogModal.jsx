import React, { useState, useMemo, useEffect } from 'react';
import { 
  GitPullRequest, 
  GitCommit, 
  Calendar, 
  Search, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Wrench, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Tag, 
  ArrowUpRight,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CURRENT_VERSION, CHANGELOG_DATA, GITHUB_REPO_URL } from '../data/changelogData';

export default function ChangelogModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVersionFilter, setSelectedVersionFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [expandedVersions, setExpandedVersions] = useState({ [CURRENT_VERSION]: true });

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const toggleVersion = (ver) => {
    setExpandedVersions(prev => ({
      ...prev,
      [ver]: !prev[ver]
    }));
  };

  const expandAll = () => {
    const allExp = {};
    CHANGELOG_DATA.forEach(c => { allExp[c.version] = true; });
    setExpandedVersions(allExp);
  };

  const collapseAll = () => {
    setExpandedVersions({});
  };

  const filteredChangelog = useMemo(() => {
    return CHANGELOG_DATA.filter(item => {
      // Filtro por versión
      if (selectedVersionFilter !== 'ALL') {
        if (selectedVersionFilter === 'v2.10' && !item.version.startsWith('v2.10')) return false;
        if (selectedVersionFilter === 'v2.9' && !item.version.startsWith('v2.9')) return false;
        if (selectedVersionFilter === 'v2.8' && !item.version.startsWith('v2.8')) return false;
        if (selectedVersionFilter === 'v2.0-v2.7' && (item.version.startsWith('v2.10') || item.version.startsWith('v2.9') || item.version.startsWith('v2.8'))) return false;
      }

      // Filtro por tipo de cambio
      if (selectedTypeFilter !== 'ALL') {
        const hasType = item.changes.some(c => c.type === selectedTypeFilter);
        if (!hasType) return false;
      }

      // Filtro por término de búsqueda
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesVersion = item.version.toLowerCase().includes(query);
        const matchesPR = (`pr #${item.prNumber}`).toLowerCase().includes(query) || String(item.prNumber).includes(query);
        const matchesCommit = item.commitHash.toLowerCase().includes(query);
        const matchesSummary = item.summary.toLowerCase().includes(query);
        const matchesHighlights = item.highlights.some(h => h.toLowerCase().includes(query));
        const matchesChanges = item.changes.some(c => 
          c.title.toLowerCase().includes(query) || 
          c.desc.toLowerCase().includes(query) ||
          c.scope.toLowerCase().includes(query)
        );

        return matchesVersion || matchesPR || matchesCommit || matchesSummary || matchesHighlights || matchesChanges;
      }

      return true;
    });
  }, [searchTerm, selectedVersionFilter, selectedTypeFilter]);

  if (!isOpen) return null;

  const getTypeBadge = (type) => {
    switch (type) {
      case 'feat':
        return {
          label: 'Feature',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <Sparkles size={11} className="text-emerald-600 shrink-0" />
        };
      case 'fix':
        return {
          label: 'Fix',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Wrench size={11} className="text-amber-600 shrink-0" />
        };
      case 'ui':
        return {
          label: 'UI/UX',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <Layers size={11} className="text-indigo-600 shrink-0" />
        };
      case 'perf':
        return {
          label: 'Perf',
          bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          icon: <Zap size={11} className="text-cyan-600 shrink-0" />
        };
      case 'security':
        return {
          label: 'Seguridad',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <ShieldCheck size={11} className="text-rose-600 shrink-0" />
        };
      case 'ai':
        return {
          label: 'IA DeepSeek',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <Sparkles size={11} className="text-purple-600 shrink-0" />
        };
      default:
        return {
          label: 'Mejora',
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: <Tag size={11} className="text-slate-500 shrink-0" />
        };
    }
  };

  return (
    <div className="modal-overlay p-2 sm:p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div 
        className="modal-content max-w-4xl w-full p-0 rounded-2xl sm:rounded-3xl shadow-2xl bg-white border border-slate-200/90 overflow-hidden my-auto animate-fadeIn max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera Principal */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-start justify-between gap-3 border-b border-slate-700/60 shrink-0">
          <div className="flex items-start gap-3 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner shrink-0 mt-0.5">
              <GitPullRequest size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Registro de Cambios & Pull Requests
                </h3>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  {CURRENT_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                Trazabilidad oficial de versiones, despliegues y mejoras implementadas en MANSOLE CMMS.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Cerrar registro de cambios"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de Búsqueda y Filtros Rápidos */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Input de Búsqueda */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por palabra clave, módulo o PR (ej. kpi, calendario, loto, pr #24)..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-xs cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Controles Expandir/Colapsar */}
            <div className="flex items-center gap-1.5 justify-end">
              <button
                onClick={expandAll}
                className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Expandir todas las versiones"
              >
                Expandir todo
              </button>
              <button
                onClick={collapseAll}
                className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Colapsar todas las versiones"
              >
                Colapsar todo
              </button>
            </div>
          </div>

          {/* Chips de filtro por versión */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter size={11} /> Versión:
            </span>
            {[
              { id: 'ALL', label: 'Todas las versiones' },
              { id: 'v2.10', label: 'v2.10.x (Actual)' },
              { id: 'v2.9', label: 'v2.9.x' },
              { id: 'v2.8', label: 'v2.8.x' },
              { id: 'v2.0-v2.7', label: 'v2.0 - v2.7' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedVersionFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedVersionFilter === f.id
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Chips de filtro por tipo de cambio */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider shrink-0 mr-1">
              Categoría:
            </span>
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'feat', label: '🚀 Features' },
              { id: 'fix', label: '🛠️ Fixes' },
              { id: 'ui', label: '🎨 UI / Mobile' },
              { id: 'ai', label: '🤖 IA DeepSeek' },
              { id: 'security', label: '🔒 Seguridad' },
              { id: 'perf', label: '⚡ Performance' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedTypeFilter(f.id)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTypeFilter === f.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Versiones & Pull Requests (Timeline) */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6 bg-slate-50/50 dark:bg-slate-950/40">
          {filteredChangelog.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search size={22} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">No se encontraron cambios con ese criterio</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Prueba con otra palabra clave o restablece los filtros aplicados.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedVersionFilter('ALL'); setSelectedTypeFilter('ALL'); }}
                className="btn btn-secondary text-xs cursor-pointer"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            filteredChangelog.map((release) => {
              const isExpanded = !!expandedVersions[release.version];

              return (
                <div 
                  key={release.version}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-xs ${
                    release.isLatest 
                      ? 'border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/10' 
                      : 'border-slate-200/90 dark:border-slate-800'
                  }`}
                >
                  {/* Cabecera de la Versión */}
                  <div 
                    onClick={() => toggleVersion(release.version)}
                    className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/70 transition-colors rounded-t-2xl"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-slate-100 tracking-tight">
                          {release.version}
                        </span>

                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${release.tagColor}`}>
                          {release.tag}
                        </span>

                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar size={13} className="text-slate-400" />
                          {release.date}
                        </span>
                      </div>

                      {/* Pull Request y Commit Hash */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <a
                          href={release.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 font-semibold transition-colors group text-[11px]"
                          title="Ver Pull Request en GitHub"
                        >
                          <GitPullRequest size={12} className="text-purple-600 dark:text-purple-400" />
                          <span>PR #{release.prNumber}</span>
                          <ExternalLink size={10} className="opacity-60 group-hover:opacity-100" />
                        </a>

                        <a
                          href={release.commitUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-mono text-[11px] transition-colors group"
                          title="Ver Commit en GitHub"
                        >
                          <GitCommit size={12} className="text-slate-500 dark:text-slate-400" />
                          <span>{release.commitHash}</span>
                          <ExternalLink size={10} className="opacity-60 group-hover:opacity-100" />
                        </a>

                        <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline truncate max-w-[280px]">
                          {release.prTitle}
                        </span>
                      </div>
                    </div>

                    <button 
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                      aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>

                  {/* Cuerpo Detallado (Acordeón) */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      {/* Resumen Ejecutivo */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm leading-relaxed border border-slate-200/70 dark:border-slate-700 mt-3">
                        {release.summary}
                      </div>

                      {/* Aspectos Destacados */}
                      {release.highlights && release.highlights.length > 0 && (
                        <div className="space-y-1.5">
                          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Aspectos Destacados
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {release.highlights.map((h, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                                <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span>{h}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lista de Cambios Detallados */}
                      <div className="space-y-2">
                        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Detalle de Cambios ({release.changes.length})
                        </h5>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
                          {release.changes.map((change, idx) => {
                            const badge = getTypeBadge(change.type);

                            return (
                              <div key={idx} className="p-3 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors flex items-start gap-2.5 text-xs">
                                <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold shrink-0 flex items-center gap-1 ${badge.bg}`}>
                                  {badge.icon}
                                  <span>{badge.label}</span>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="font-bold text-slate-900 dark:text-slate-100">
                                      [{change.scope}]
                                    </span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                      {change.title}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 dark:text-slate-400 text-[11px] sm:text-xs leading-relaxed">
                                    {change.desc}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Enlace al PR completo */}
                      <div className="pt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Publicado y fusionado en rama <code className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">master</code></span>
                        <a
                          href={release.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold hover:underline"
                        >
                          <span>Ver Pull Request #{release.prNumber} en GitHub</span>
                          <ArrowUpRight size={13} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pie del Modal */}
        <div className="px-4 sm:px-6 py-3 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <span className="font-semibold text-slate-700">MANSOLE CMMS Industrial</span>
            <span>•</span>
            <span>Versión activa: <strong className="text-slate-900 font-mono">{CURRENT_VERSION}</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold transition-colors text-xs"
            >
              <span>Repositorio en GitHub</span>
              <ExternalLink size={13} />
            </a>

            <button
              onClick={onClose}
              className="btn btn-primary text-xs px-4 py-1.5 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
