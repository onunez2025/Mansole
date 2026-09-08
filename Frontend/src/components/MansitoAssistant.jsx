import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  RotateCcw, 
  Sparkles, 
  Database, 
  Maximize2,
  Minimize2,
  PanelRightClose,
  ChevronDown, 
  MessageSquare, 
  User, 
  AlertCircle,
  HelpCircle,
  Zap,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { CURRENT_VERSION } from '../data/changelogData';


export default function MansitoAssistant({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sugerencias rápidas para el usuario
  const quickSuggestions = [
    { label: '📊 KPIs & Disponibilidad', query: '¿Cuáles son los principales indicadores y disponibilidad operativa de la planta este mes?' },
    { label: '👤 Actividades de Usuario', query: `¿Qué tareas u órdenes de trabajo tiene asignadas el usuario ${currentUser?.name || 'admin'}?` },
    { label: '🚨 Máquinas & OTs Críticas', query: '¿Cuáles son las máquinas o paradas críticas que requieren atención inmediata en planta?' },
    { label: '📦 Repuestos & Kardex', query: '¿Qué repuestos tienen stock crítico y cómo se registran las piezas canibalizadas a $0 USD?' },
    { label: '📅 Próximos Preventivos', query: '¿Cuáles son los próximos mantenimientos preventivos programados en el calendario?' }
  ];

  // Auto-scroll al final del chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
      setHasUnread(false);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (customQuery = null) => {
    const textToSend = customQuery || inputMessage;
    if (!textToSend.trim() || loading) return;

    const newMessages = [
      ...messages,
      {
        id: Date.now(),
        sender: 'user',
        text: textToSend.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);

    try {
      // Enviar historial relevante
      const historyForAi = newMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await api.askMansito(textToSend.trim(), historyForAi, currentUser);
      const answer = res?.answer || res?.data?.answer;
      const errorMsg = res?.error || res?.data?.error;
      const modelName = res?.model || res?.data?.model || 'DeepSeek V4 Flash';
      const aiResponse = answer || (errorMsg ? `⚠️ ${errorMsg}` : 'Lo siento, no pude procesar la consulta en este momento.');

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'mansito',
          text: aiResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: modelName
        }
      ]);


    } catch (err) {
      console.error('Error al consultar a Mansito:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'mansito',
          text: '⚠️ Disculpa, hubo un inconveniente al conectar con el motor de inteligencia artificial o con Azure SQL. Por favor verifica tu conexión o intenta nuevamente.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  // Helpers para parsear tablas Markdown
  const isSeparatorRow = (row) => {
    const cells = row.replace(/^\|/, '').replace(/\|$/, '').split('|');
    return cells.length > 0 && cells.every(c => /^[\s:-]+$/.test(c.trim()) && c.trim().length > 0);
  };

  const splitCells = (row) => {
    return row.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  };

  // Renderizado avanzado de Markdown (tablas, negritas, viñetas, listas numeradas, títulos y divisores)
  const formatMarkdown = (content) => {
    if (!content) return null;

    const rawLines = content.split('\n');
    const blocks = [];
    let currentTable = null;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();

      const isTableRow = trimmed.startsWith('|') && trimmed.includes('|', 1);

      if (isTableRow) {
        if (!currentTable) {
          currentTable = [];
        }
        currentTable.push(trimmed);
      } else {
        if (currentTable) {
          if (currentTable.length >= 2 && isSeparatorRow(currentTable[1])) {
            blocks.push({ type: 'table', lines: currentTable });
          } else {
            currentTable.forEach(tl => blocks.push({ type: 'line', line: tl }));
          }
          currentTable = null;
        }
        blocks.push({ type: 'line', line });
      }
    }

    if (currentTable) {
      if (currentTable.length >= 2 && isSeparatorRow(currentTable[1])) {
        blocks.push({ type: 'table', lines: currentTable });
      } else {
        currentTable.forEach(tl => blocks.push({ type: 'line', line: tl }));
      }
    }

    return blocks.map((block, bIdx) => {
      // 1. Renderizado de TABLAS Markdown estilizadas
      if (block.type === 'table') {
        const headers = splitCells(block.lines[0]);
        const rows = block.lines.slice(2).map(splitCells);

        return (
          <div key={bIdx} className="w-full max-w-full overflow-x-auto my-2.5 rounded-xl border border-slate-200/90 shadow-2xs bg-white">
            <table className="min-w-full divide-y divide-slate-200 border-collapse text-left text-[11px]">
              <thead className="bg-slate-100/90 text-slate-900 border-b border-slate-200 font-bold">
                <tr>
                  {headers.map((h, hIdx) => (
                    <th 
                      key={hIdx} 
                      className="px-2.5 py-1.5 font-bold tracking-tight text-slate-900 border-r border-slate-200/70 last:border-r-0 whitespace-nowrap bg-slate-100"
                      dangerouslySetInnerHTML={{ __html: parseBold(h) }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row, rIdx) => (
                  <tr 
                    key={rIdx} 
                    className={rIdx % 2 === 0 ? 'bg-white hover:bg-indigo-50/40 transition-colors' : 'bg-slate-50/50 hover:bg-indigo-50/40 transition-colors'}
                  >
                    {row.map((cell, cIdx) => (
                      <td 
                        key={cIdx} 
                        className="px-2.5 py-1.5 text-slate-800 border-r border-slate-100 last:border-r-0 whitespace-nowrap leading-snug font-normal"
                        dangerouslySetInnerHTML={{ __html: parseBold(cell) }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      const line = block.line;
      const trimmed = line.trim();

      // Línea vacía
      if (!trimmed) return <div key={bIdx} className="h-1.5" />;

      // Separador horizontal
      if (trimmed === '---' || trimmed === '***') {
        return <hr key={bIdx} className="my-2 border-slate-200" />;
      }

      // Elementos de lista no ordenada
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const itemText = trimmed.substring(2);
        return (
          <div key={bIdx} className="flex items-start gap-1.5 ml-1 my-0.5">
            <span className="text-blue-600 font-black leading-tight select-none shrink-0">•</span>
            <span 
              className="flex-1 font-normal leading-relaxed text-slate-900" 
              style={{ color: '#0f172a' }} 
              dangerouslySetInnerHTML={{ __html: parseBold(itemText) }} 
            />
          </div>
        );
      }

      // Elementos de lista ordenada (ej. 1. , 2. )
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        return (
          <div key={bIdx} className="flex items-start gap-1.5 ml-1 my-0.5">
            <span className="text-indigo-600 font-bold leading-tight select-none shrink-0 text-[11px]">
              {numMatch[1]}.
            </span>
            <span 
              className="flex-1 font-normal leading-relaxed text-slate-900" 
              style={{ color: '#0f172a' }} 
              dangerouslySetInnerHTML={{ __html: parseBold(numMatch[2]) }} 
            />
          </div>
        );
      }

      // Títulos
      if (line.startsWith('### ')) {
        return (
          <h5 
            key={bIdx} 
            className="font-bold text-xs sm:text-sm mt-2 mb-1 text-slate-950" 
            style={{ color: '#020617' }} 
            dangerouslySetInnerHTML={{ __html: parseBold(line.replace('### ', '')) }} 
          />
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h4 
            key={bIdx} 
            className="font-bold text-sm mt-2.5 mb-1 text-slate-950" 
            style={{ color: '#020617' }} 
            dangerouslySetInnerHTML={{ __html: parseBold(line.replace('## ', '')) }} 
          />
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h3 
            key={bIdx} 
            className="font-extrabold text-sm sm:text-base mt-3 mb-1 text-slate-950" 
            style={{ color: '#020617' }} 
            dangerouslySetInnerHTML={{ __html: parseBold(line.replace('# ', '')) }} 
          />
        );
      }

      return (
        <p 
          key={bIdx} 
          className="leading-relaxed my-0.5 font-normal text-slate-900" 
          style={{ color: '#0f172a' }} 
          dangerouslySetInnerHTML={{ __html: parseBold(line) }} 
        />
      );
    });
  };

  const parseBold = (str) => {
    if (!str) return '';
    // Reemplaza **texto** por <strong>texto</strong> y `code` por <code>code</code>
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-950" style="color: #020617;">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-blue-50 text-blue-700 px-1 py-0.5 rounded text-[10.5px] font-mono font-bold" style="color: #1d4ed8; background-color: #eff6ff;">$1</code>');
  };


  return (
    <>
      {/* Botón Flotante de Activación cuando el panel está oculto */}
      {!isOpen && (
        <aside aria-label="Abrir asistente de IA Mansito" className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 select-none">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-slate-900 text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl hover:shadow-indigo-500/25 border border-indigo-400/30 transition-all duration-300 hover:scale-105 cursor-pointer"
            title="Abrir Copiloto Mansito"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 group-hover:text-white transition-colors">
                <Bot size={22} className="animate-bounce group-hover:scale-110 transition-transform" />
              </div>
              {/* Indicador de Estado Online */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-white">Mansito</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Copiloto CMMS
                </span>
              </div>
              <span className="text-[10px] text-slate-300 font-medium leading-tight">
                Abrir panel lateral de IA
              </span>
            </div>

            {/* Badge de llamada a la acción */}
            {hasUnread && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-600 text-[9px] text-white font-bold items-center justify-center">
                  ✨
                </span>
              </span>
            )}
          </button>
        </aside>
      )}

      {/* Backdrop semi-transparente cuando el panel está abierto */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[1px] transition-opacity duration-300"
          title="Haz clic para cerrar panel"
        />
      )}

      {/* Panel Lateral Deslizante (Drawer) */}
      <aside 
        aria-label="Panel lateral Copiloto Mansito"
        className={`fixed top-0 right-0 h-screen z-50 bg-white shadow-2xl border-l border-slate-200 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        } ${
          isExpanded 
            ? 'w-full sm:w-[820px] lg:w-[980px] xl:w-[65vw]' 
            : 'w-full sm:w-[480px] md:w-[500px]'
        }`}
      >
        {/* Cabecera del Panel Lateral */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between gap-2 shrink-0 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Bot size={20} />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-extrabold text-white tracking-tight">Mansito</h4>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Copiloto CMMS Grupo SOLE
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium truncate flex items-center gap-1">
                <Database size={10} className="text-emerald-400 shrink-0" />
                <span>Conectado a Azure SQL & RAG (DeepSeek V3)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Botón para Expandir / Contraer Ancho del Panel */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2 py-1 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium border border-white/10"
              title={isExpanded ? "Contraer a ancho estándar (500px)" : "Expandir chat para ver tablas y datos con amplitud"}
            >
              {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span className="hidden sm:inline">
                {isExpanded ? 'Contraer' : 'Expandir'}
              </span>
            </button>

            {/* Botón para Reiniciar Conversación */}
            <button
              onClick={clearChat}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Reiniciar conversación"
            >
              <RotateCcw size={15} />
            </button>

            {/* Botón para Ocultar / Cerrar Panel */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Ocultar panel lateral"
            >
              <PanelRightClose size={18} />
            </button>
          </div>
        </div>

        {/* Cuerpo de Mensajes */}
        <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-3.5 bg-slate-50/50 text-xs">
          {messages.length === 0 ? (
            <div className="py-4 space-y-4 max-w-xl mx-auto">
              {/* Saludo Inicial */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">
                      ¡Hola, {currentUser?.name || 'Compañero'}! 👋
                    </h5>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Soy Mansito, tu Asistente Copiloto de Mantenimiento de Planta
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Tengo acceso en tiempo real a todas las tablas de <strong>MANSOLE</strong>: indicadores (KPIs), órdenes de trabajo, parque de activos, catálogo y stock de repuestos, movimientos de Kardex a $0 USD y cronogramas preventivos.
                </p>
                <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-1.5">
                  <span className="font-semibold text-indigo-600">💡 Tip:</span>
                  <span>Puedes usar el botón <strong>"Expandir"</strong> arriba para ampliar el panel y ver tablas anchas con total comodidad.</span>
                </div>
              </div>

              {/* Chips de Consultas Sugeridas */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Preguntas sugeridas de inicio
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {quickSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(sug.query)}
                      className="w-full text-left p-3 rounded-xl bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-xs text-slate-700 hover:text-indigo-900 font-medium transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                    >
                      <span className="truncate pr-2">{sug.label}</span>
                      <Send size={13} className="text-slate-300 group-hover:text-indigo-600 shrink-0 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex items-end gap-2 ${msg.sender === 'user' ? 'max-w-[85%]' : 'w-full max-w-[99%] min-w-0'}`}>
                  {msg.sender === 'mansito' && (
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mb-1 shadow-xs">
                      <Bot size={15} />
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl shadow-xs text-xs leading-relaxed min-w-0 ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs font-normal ml-auto'
                        : msg.isError
                        ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-bl-xs w-full'
                        : 'bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs shadow-xs w-full overflow-hidden'
                    }`}
                    style={
                      msg.sender === 'user'
                        ? { backgroundColor: '#2563eb', color: '#ffffff' }
                        : { backgroundColor: '#ffffff', color: '#0f172a' }
                    }
                  >
                    {msg.sender === 'user' ? (
                      <p className="whitespace-pre-wrap font-medium m-0 text-white" style={{ color: '#ffffff' }}>
                        {msg.text}
                      </p>
                    ) : (
                      <div className="space-y-1.5 font-normal text-slate-900 min-w-0" style={{ color: '#0f172a' }}>
                        {formatMarkdown(msg.text)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata y hora */}
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1 px-1">
                  <span>{msg.time}</span>
                  {msg.model && (
                    <>
                      <span>•</span>
                      <span className="font-mono">{msg.model}</span>
                    </>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Indicador de Pensando / Cargando */}
          {loading && (
            <div className="flex items-start gap-2 max-w-[85%] animate-pulse">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Bot size={15} />
              </div>
              <div className="p-3.5 bg-white rounded-2xl rounded-bl-xs border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-xs">
                  <Sparkles size={13} className="animate-spin" />
                  <span>Mansito está consultando Azure SQL & Analizando...</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                  <span>Consultando todas las tablas del sistema MANSOLE</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Pie e Input de Texto */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200/90 shrink-0">
          <div className="relative flex items-center gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta a Mansito en lenguaje natural..."
              className="w-full pl-3.5 pr-12 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none max-h-28"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || loading}
              className={`absolute right-2 p-2 rounded-lg transition-all cursor-pointer ${
                inputMessage.trim() && !loading
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
              title="Enviar pregunta a Mansito"
            >
              <Send size={15} />
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Database size={10} className="text-emerald-500" />
              <span>MANSOLE {CURRENT_VERSION} RAG</span>
            </span>

            <span>Presiona <strong>Enter</strong> para enviar • <strong>Shift+Enter</strong> para nueva línea</span>
          </div>
        </div>
      </aside>
    </>
  );
}
