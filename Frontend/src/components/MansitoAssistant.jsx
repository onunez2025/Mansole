import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  RotateCcw, 
  Sparkles, 
  Database, 
  Wrench, 
  CheckCircle2, 
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

export default function MansitoAssistant({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
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

  // Renderizado simple de Markdown (negritas, viñetas, saltos)
  // Renderizado simple de Markdown (negritas, viñetas, saltos)
  const formatMarkdown = (content) => {
    if (!content) return null;

    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Línea vacía
      if (!line.trim()) return <div key={idx} className="h-1.5" />;

      // Elementos de lista
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const itemText = line.trim().substring(2);
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5">
            <span className="text-blue-600 font-black leading-tight select-none shrink-0">•</span>
            <span 
              className="flex-1 font-normal leading-relaxed text-slate-900" 
              style={{ color: '#0f172a' }} 
              dangerouslySetInnerHTML={{ __html: parseBold(itemText) }} 
            />
          </div>
        );
      }

      // Títulos simples
      if (line.startsWith('### ')) {
        return (
          <h5 
            key={idx} 
            className="font-bold text-xs sm:text-sm mt-2 mb-1 text-slate-950" 
            style={{ color: '#020617' }} 
            dangerouslySetInnerHTML={{ __html: parseBold(line.replace('### ', '')) }} 
          />
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h4 
            key={idx} 
            className="font-bold text-sm mt-2 mb-1 text-slate-950" 
            style={{ color: '#020617' }} 
            dangerouslySetInnerHTML={{ __html: parseBold(line.replace('## ', '')) }} 
          />
        );
      }

      return (
        <p 
          key={idx} 
          className="leading-relaxed my-0.5 font-normal text-slate-900" 
          style={{ color: '#0f172a' }} 
          dangerouslySetInnerHTML={{ __html: parseBold(line) }} 
        />
      );
    });
  };

  const parseBold = (str) => {
    // Reemplaza **texto** por <strong>texto</strong> y `code` por <code>code</code>
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-950" style="color: #020617;">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-blue-50 text-blue-700 px-1 py-0.5 rounded text-[11px] font-mono font-bold" style="color: #1d4ed8; background-color: #eff6ff;">$1</code>');
  };


  return (
    <aside aria-label="Asistente de IA Mansito" className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 select-none">
      {/* Botón Flotante de Activación de Mansito */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-slate-900 text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl hover:shadow-indigo-500/25 border border-indigo-400/30 transition-all duration-300 hover:scale-105 cursor-pointer"
          title="Abrir Asistente Mansito"
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
                IA Mantenimiento
              </span>
            </div>
            <span className="text-[10px] text-slate-300 font-medium leading-tight">
              Pregúntame sobre cualquier tabla
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
      )}

      {/* Ventana de Chat Flotante */}
      {isOpen && (
        <div className="w-88 sm:w-[430px] h-[550px] max-h-[86vh] max-w-[calc(100vw-24px)] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fadeIn duration-200">
          {/* Cabecera del Asistente */}
          <div className="px-4 py-3 sm:py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between gap-2 shrink-0 border-b border-slate-700/60">
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
                    Copiloto CMMS
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-medium truncate flex items-center gap-1">
                  <Database size={10} className="text-emerald-400 shrink-0" />
                  <span>Conectado a Azure SQL & RAG</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={clearChat}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Reiniciar conversación"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Minimizar Mansito"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Cuerpo de Mensajes */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-slate-50/50 text-xs">
            {messages.length === 0 ? (
              <div className="py-3 space-y-3.5">
                {/* Saludo Inicial */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">
                        ¡Hola, {currentUser?.name || 'Compañero'}! 👋
                      </h5>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Soy Mansito, tu asistente de mantenimiento
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Tengo acceso en tiempo real a todas las tablas de <strong>MANSOLE</strong>: indicadores (KPIs), órdenes de trabajo, actividades por usuario, máquinas críticas, repuestos en almacén y cronogramas preventivos.
                  </p>
                </div>

                {/* Chips de Consultas Sugeridas */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Preguntas sugeridas
                  </span>
                  <div className="space-y-1.5">
                    {quickSuggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(sug.query)}
                        className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-[11px] text-slate-700 hover:text-indigo-900 font-medium transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                      >
                        <span className="truncate pr-2">{sug.label}</span>
                        <Send size={12} className="text-slate-300 group-hover:text-indigo-600 shrink-0 group-hover:translate-x-0.5 transition-all" />
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
                  <div className="flex items-end gap-1.5 max-w-[92%]">
                    {msg.sender === 'mansito' && (
                      <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mb-1">
                        <Bot size={13} />
                      </div>
                    )}

                    <div
                      className={`p-3 rounded-2xl shadow-xs text-[11px] sm:text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-xs font-normal'
                          : msg.isError
                          ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-bl-xs'
                          : 'bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs shadow-xs'
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
                        <div className="space-y-1 font-normal text-slate-900" style={{ color: '#0f172a' }}>
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
              <div className="flex items-start gap-1.5 max-w-[85%] animate-pulse">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={13} />
                </div>
                <div className="p-3 bg-white rounded-2xl rounded-bl-xs border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-[11px]">
                    <Sparkles size={12} className="animate-spin" />
                    <span>Mansito está consultando Azure SQL...</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                    <span>Analizando indicadores y tablas de planta</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Pie e Input de Texto */}
          <div className="p-2.5 sm:p-3 bg-white border-t border-slate-200/90 shrink-0">
            <div className="relative flex items-center gap-1.5">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregúntale a Mansito sobre KPIs, usuarios, activos..."
                className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none max-h-24"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                className={`absolute right-1.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                  inputMessage.trim() && !loading
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
                title="Enviar pregunta a Mansito"
              >
                <Send size={14} />
              </button>
            </div>

            <div className="flex items-center justify-between mt-1.5 px-1 text-[9px] text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <Database size={9} className="text-emerald-500" />
                <span>MANSOLE v2.6.0 RAG</span>
              </span>
              <span>Presiona <strong>Enter</strong> para enviar</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
