import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowRightLeft, 
  Copy, 
  Check, 
  Trash2, 
  Upload, 
  Download, 
  FileCode, 
  Play, 
  History, 
  Sparkles, 
  AlertTriangle, 
  Cpu, 
  HelpCircle, 
  RotateCcw,
  BookOpen,
  CheckCircle,
  FileText,
  Clock,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { 
  SUPPORTED_LANGUAGES, 
  CODE_TEMPLATES, 
  ConversionResult, 
  ConversionHistoryItem, 
  CodeTemplate 
} from "./types";

export default function App() {
  // Input State
  const [code, setCode] = useState<string>(CODE_TEMPLATES[0].code);
  const [fromLanguage, setFromLanguage] = useState<string>("Python");
  const [toLanguage, setToLanguage] = useState<string>("JavaScript");
  const [explanationStyle, setExplanationStyle] = useState<string>("detalhada");
  
  // Output & Loading State
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive UI auxiliary states
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedResult, setCopiedResult] = useState<boolean>(false);
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"code" | "explanation">("code");

  // Drag and Drop ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading messages rotation to decrease user stress during transition
  const loadingMessages = [
    "Iniciando interpretador de Inteligência Artificial...",
    "Analisando árvore de sintaxe abstrata (AST) de origem...",
    "Mapeando construções gramaticais de correspondência...",
    "Traduzindo tipos primitivos, estruturas condicionais e loops...",
    "Ajustando apelidos idiomáticos da linguagem (ex. snake_case vs camelCase)...",
    "Gerando documentação das diferenças principais em português do Brasil...",
    "Finalizando formatação do código estético e notas de eficiência..."
  ];

  // Rotate loading steps while converting
  useEffect(() => {
    let intervalId: any;
    if (loading) {
      setLoadingStep(0);
      intervalId = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(intervalId);
  }, [loading]);

  // Load history from localStorage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem("conversor_historico");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Não foi possível acessar o localStorage:", e);
    }
  }, []);

  // Save history helper
  const saveHistory = (newHistory: ConversionHistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("conversor_historico", JSON.stringify(newHistory));
    } catch (e) {
      console.warn("Não foi possível salvar no localStorage:", e);
    }
  };

  // Helper trigger notification
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((current) => current === msg ? null : current);
    }, 3000);
  };

  // Handle template selection
  const handleTemplateSelect = (template: CodeTemplate) => {
    setCode(template.code);
    setFromLanguage(template.language);
    showNotification(`Modelo "${template.name}" carregado.`);
  };

  // Swap Languages helper
  const handleSwapLanguages = () => {
    const temp = fromLanguage;
    setFromLanguage(toLanguage);
    setToLanguage(temp);
    
    // Also, if we have converted code, we can place it into index
    if (result?.convertedCode) {
      setCode(result.convertedCode);
      setResult(null);
    }
    showNotification("Linguagens de origem e destino invertidas!");
  };

  // Drag over handler
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  // File Drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Load code from File object
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setCode(text);
        
        // Try to guess language based on extension
        const extension = file.name.split(".").pop()?.toLowerCase();
        const guessedLang = guessLanguageFromExtension(extension || "");
        if (guessedLang) {
          setFromLanguage(guessedLang);
        }
        showNotification(`Arquivo "${file.name}" importado!`);
      }
    };
    reader.readAsText(file);
  };

  const guessLanguageFromExtension = (ext: string): string | null => {
    switch (ext) {
      case "py": return "Python";
      case "js": case "jsx": return "JavaScript";
      case "ts": case "tsx": return "TypeScript";
      case "java": return "Java";
      case "cpp": case "h": case "hpp": return "C++";
      case "cs": return "C#";
      case "rs": return "Rust";
      case "go": return "Go";
      case "swift": return "Swift";
      case "php": return "PHP";
      case "rb": return "Ruby";
      case "sql": return "SQL";
      case "kt": case "kts": return "Kotlin";
      default: return null;
    }
  };

  // Trigger converted process
  const handleConvert = async () => {
    if (!code.trim()) {
      setError("Insira algum código na área de entrada antes de converter.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          fromLanguage,
          toLanguage,
          explanationStyle
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro de rede ${response.status}`);
      }

      const data: ConversionResult = await response.json();
      setResult(data);

      // Add to History
      const historyItem: ConversionHistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        fromLanguage,
        toLanguage,
        originalCode: code,
        convertedCode: data.convertedCode,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })
      };
      saveHistory([historyItem, ...history.slice(0, 19)]); // Keep last 20
      showNotification("Código convertido com sucesso!");
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || 
        "Houve um erro inexplicável. Certifique-se de que a variável GEMINI_API_KEY esteja corretamente configurada nos segredos."
      );
    } finally {
      setLoading(false);
    }
  };

  // Copy code helpers
  const copyToClipboard = (text: string, isOriginal: boolean) => {
    navigator.clipboard.writeText(text);
    if (isOriginal) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2000);
    }
    showNotification("Código copiado para a área de transferência!");
  };

  // Clear inputs
  const handleClearOriginal = () => {
    setCode("");
    showNotification("Área de entrada limpa.");
  };

  // Download converted file
  const handleDownloadConverted = () => {
    if (!result?.convertedCode) return;
    
    // Guess extension
    let extension = "txt";
    const lang = toLanguage.toLowerCase();
    if (lang === "python") extension = "py";
    else if (lang === "javascript") extension = "js";
    else if (lang === "typescript") extension = "ts";
    else if (lang === "java") extension = "java";
    else if (lang === "c++") extension = "cpp";
    else if (lang === "c#") extension = "cs";
    else if (lang === "rust") extension = "rs";
    else if (lang === "go") extension = "go";
    else if (lang === "swift") extension = "swift";
    else if (lang === "php") extension = "php";
    else if (lang === "ruby") extension = "rb";
    else if (lang === "sql") extension = "sql";
    else if (lang === "kotlin") extension = "kt";

    const blob = new Blob([result.convertedCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `codigo_convertido_${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("Download iniciado!");
  };

  // Load item from history
  const handleLoadFromHistory = (item: ConversionHistoryItem) => {
    setCode(item.originalCode);
    setFromLanguage(item.fromLanguage);
    setToLanguage(item.toLanguage);
    
    // Build temporary conversion result
    setResult({
      convertedCode: item.convertedCode,
      explanation: "Recuperado do histórico local.",
      keyDifferences: []
    });
    showNotification("Dados recuperados do histórico local!");
  };

  // Delete item from history
  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    saveHistory(updated);
    showNotification("Item excluído do histórico.");
  };

  // Clear all history
  const handleClearHistory = () => {
    if (window.confirm("Deseja realmente limpar todo o histórico local?")) {
      saveHistory([]);
      showNotification("Todo o histórico foi limpo.");
    }
  };

  // Filtered Templates
  const filteredTemplates = searchTerm 
    ? CODE_TEMPLATES.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.language.toLowerCase().includes(searchTerm.toLowerCase()))
    : CODE_TEMPLATES;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* Dynamic Pop-up Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            id="notification-toast"
            className="fixed top-6 right-6 z-50 bg-indigo-600 text-white rounded-xl shadow-2xl shadow-indigo-900/45 border border-indigo-400/40 px-5 py-3 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-indigo-200" />
            <span className="font-medium text-sm">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Container */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ArrowRightLeft className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Conversor de Código
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono border border-indigo-500/30">
                  Powered by Gemini
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Tradução instantânea de linguagens utilizando Inteligência Artificial profunda
              </p>
            </div>
          </div>

          {/* Quick presets bar */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 shrink-0">
              Exemplos Rápidos:
            </span>
            <div className="flex items-center gap-2">
              {CODE_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => handleTemplateSelect(tpl)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 active:bg-slate-700 text-slate-300 font-medium px-2.5 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer shrink-0"
                  id={`btn-example-${i}`}
                >
                  {tpl.language}: {tpl.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Bento Grid layout representing Source vs Destination Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Left Side - SOURCE CODE SECTION (7 cols or 6 depends on state) */}
          <section className="lg:col-span-6 flex flex-col bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-800 shadow-xl overflow-hidden min-h-[520px]">
            {/* Source Header */}
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold tracking-wide text-slate-300">CÓDIGO DE ORIGEM</span>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-medium">De:</label>
                <select
                  value={fromLanguage}
                  onChange={(e) => setFromLanguage(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg text-xs px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer"
                  id="select-from-lang"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Drag & Drop Overlay or standard Code Input */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`flex-1 flex flex-col relative transition ${isDragActive ? "bg-indigo-950/40" : ""}`}
            >
              {isDragActive && (
                <div className="absolute inset-0 z-10 bg-indigo-950/80 border-2 border-indigo-500 border-dashed rounded-b-xl flex flex-col items-center justify-center p-6 text-center">
                  <Upload className="w-12 h-12 text-indigo-400 animate-bounce mb-3" />
                  <p className="text-indigo-200 font-medium text-base">Arraste e solte o arquivo aqui!</p>
                  <p className="text-xs text-slate-400 mt-1">Carregando código do arquivo automaticamente</p>
                </div>
              )}

              {/* Code Textarea Wrapper */}
              <div className="flex-1 flex flex-col">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="// Cole ou escreva seu código aqui... Ou arraste um arquivo de extensão compatível"
                  className="flex-1 w-full bg-slate-900/60 p-4 font-mono text-sm leading-relaxed text-emerald-300 resize-none focus:outline-none placeholder:text-slate-600 focus:bg-slate-900/90 transition-colors min-h-[360px]"
                  id="input-code-area"
                />
              </div>

              {/* Character Metrics & Actions */}
              <div className="bg-slate-900/60 p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span>{code.length} caracteres</span>
                  <span>{code.split(/\r\n|\r|\n/).length} linhas</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(code, true)}
                    disabled={!code}
                    className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 disabled:opacity-40 hover:scale-105 active:scale-95 transition cursor-pointer"
                    title="Copiar código original"
                    id="btn-copy-original"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200 hover:scale-105 active:scale-95 transition cursor-pointer"
                    title="Importar Arquivo de Código"
                    id="btn-import-file"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    className="hidden"
                    accept=".py,.js,.jsx,.ts,.tsx,.java,.cpp,.h,.hpp,.cs,.rs,.go,.swift,.php,.rb,.sql,.kt"
                  />
                  <button
                    onClick={handleClearOriginal}
                    disabled={!code}
                    className="p-1.5 hover:bg-red-950/50 hover:text-red-400 rounded text-slate-400 disabled:opacity-40 hover:scale-105 active:scale-95 transition cursor-pointer"
                    title="Limpar Área de Texto"
                    id="btn-clear-original"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Center Column - CONVERSION FLOW PARAMETERS (for medium to large sizing, is interactive block) */}
          <section className="lg:col-span-12 flex flex-col md:flex-row items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700/60 divide-y md:divide-y-0 md:divide-x divide-slate-700/50 gap-4">
            
            {/* Select Conversion style */}
            <div className="w-full md:w-1/3 flex flex-col md:pr-4">
              <span className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                ESTILO DA EXPLICAÇÃO:
              </span>
              <div className="grid grid-cols-3 bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setExplanationStyle("detalhada")}
                  className={`text-xs font-semibold py-1.5 rounded transition cursor-pointer ${explanationStyle === "detalhada" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                  id="style-detalhada-btn"
                >
                  Detalhada
                </button>
                <button
                  onClick={() => setExplanationStyle("minimalista")}
                  className={`text-xs font-semibold py-1.5 rounded transition cursor-pointer ${explanationStyle === "minimalista" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                  id="style-minimalista-btn"
                >
                  Direta
                </button>
                <button
                  onClick={() => setExplanationStyle("academica")}
                  className={`text-xs font-semibold py-1.5 rounded transition cursor-pointer ${explanationStyle === "academica" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                  id="style-academica-btn"
                >
                  Didática
                </button>
              </div>
            </div>

            {/* Swap Button Controls */}
            <div className="w-full md:w-1/4 flex justify-center py-2 md:py-0">
              <button
                onClick={handleSwapLanguages}
                className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3.5 py-2.5 rounded-lg text-xs font-bold text-indigo-300 hover:border-indigo-500 hover:bg-slate-900 hover:text-indigo-200 transition-colors shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="Inverter Linguagens"
                id="btn-swap-languages"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Inverter Fluxo</span>
              </button>
            </div>

            {/* Execute AI Action Trigger Panel */}
            <div className="w-full md:w-1/3 flex items-center md:pl-4 justify-end">
              <button
                onClick={handleConvert}
                disabled={loading || !code.trim()}
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/10 font-bold text-sm px-6 py-3 rounded-lg border border-indigo-400/20 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                id="btn-trigger-conversion"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Convertendo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>TRADUZIR CÓDIGO</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Main Right Side - DESTINATION CODE SECTION (6 cols) */}
          <section className="lg:col-span-6 flex flex-col bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-800 shadow-xl overflow-hidden min-h-[520px]">
            {/* Destination Header */}
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-sm font-semibold tracking-wide text-slate-300">CÓDIGO DE DESTINO</span>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-medium font-semibold">Para:</label>
                <select
                  value={toLanguage}
                  onChange={(e) => setToLanguage(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg text-xs px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold cursor-pointer"
                  id="select-to-lang"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interactive display context depending on state */}
            <div className="flex-1 flex flex-col relative justify-between bg-slate-950/20">
              
              {loading && (
                <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm rounded-b-xl flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center border border-indigo-500/30 mb-5 relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"
                    />
                    <Sparkles className="w-5 h-5 text-indigo-400 absolute" />
                  </div>
                  
                  {/* Micro-interactive messages showing step information */}
                  <div className="max-w-[400px]">
                    <h3 className="text-white text-base font-semibold mb-1">Mágica em andamento</h3>
                    <p className="text-indigo-400 text-xs font-mono mb-4">Aguardando API do Gemini</p>
                    
                    <p className="text-slate-300 text-sm italic font-medium px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg animate-pulse min-h-[3.5rem] flex items-center justify-center">
                      "{loadingMessages[loadingStep]}"
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="absolute inset-x-4 top-4 z-10 p-4 bg-red-950/80 border border-red-800/80 rounded-xl flex gap-3 text-red-200 text-sm">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-red-300">Falha ao traduzir:</h4>
                    <p className="mt-1 leading-relaxed text-xs">{error}</p>
                    <button 
                      onClick={handleConvert}
                      className="mt-3 inline-flex items-center gap-1 bg-red-900 hover:bg-red-850 px-3 py-1 rounded text-xs font-bold text-white cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Tentar Novamente
                    </button>
                  </div>
                </div>
              )}

              {!result && !loading && !error && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 mb-4">
                    <FileCode className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-slate-400 font-bold mb-1">Pronto para a Tradução</h3>
                  <p className="text-xs max-w-sm">
                    Configure os idiomas, digite seu código de preferência e clique em <b>Traduzir Código</b> para ver a mágica construída em tempo real.
                  </p>
                </div>
              )}

              {result && !loading && (
                <div className="flex-1 flex flex-col">
                  {/* Results Mini-Tabs */}
                  <div className="border-b border-slate-800 bg-slate-900/40 flex justify-between items-center px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab("code")}
                        className={`px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${activeTab === "code" ? "border-indigo-500 text-indigo-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-200"}`}
                      >
                        Código Traduzido
                      </button>
                      <button
                        onClick={() => setActiveTab("explanation")}
                        className={`px-3 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${activeTab === "explanation" ? "border-indigo-500 text-indigo-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-200"}`}
                      >
                        Resumo Geral
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 p-0 flex flex-col justify-between">
                    {activeTab === "code" ? (
                      <textarea
                        readOnly
                        value={result.convertedCode}
                        className="flex-1 w-full bg-slate-950/40 p-4 font-mono text-sm leading-relaxed text-indigo-300 resize-none focus:outline-none min-h-[320px]"
                        id="output-code-area"
                      />
                    ) : (
                      <div className="p-4 overflow-y-auto text-sm text-slate-300 leading-relaxed max-h-[360px] prose prose-invert">
                        <h4 className="text-slate-200 font-bold mb-1.5 flex items-center gap-1">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          Explicação de Funcionamento:
                        </h4>
                        <p className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-xs leading-relaxed text-slate-400 italic">
                          {result.explanation}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Character Metrics & Actions */}
                  <div className="bg-slate-900/60 p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span>{result.convertedCode.length} caracteres</span>
                      <span>{result.convertedCode.split(/\r\n|\r|\n/).length} linhas</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(result.convertedCode, false)}
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-300 hover:scale-105 active:scale-95 transition cursor-pointer"
                        title="Copiar Código Traduzido"
                        id="btn-copy-converted"
                      >
                        {copiedResult ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={handleDownloadConverted}
                        className="p-1.5 hover:bg-slate-700 hover:text-indigo-300 rounded text-slate-400 hover:scale-105 active:scale-95 transition cursor-pointer"
                        title="Baixar arquivo de código transformado (.extension)"
                        id="btn-download-converted"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* SECTION FOR ANALYZED GEMINI INSIGHTS & SPECIFIC SYNTAX COMPRISES */}
        {result && (
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* Explanation card & Difference Map */}
            <div className="md:col-span-8 space-y-6">
              
              {/* Compare Synthetic Structures side-by-side */}
              {result.keyDifferences && result.keyDifferences.length > 0 && (
                <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                      Diferenças de Sintaxe Identificadas
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {result.keyDifferences.map((diff, index) => (
                      <div 
                        key={index}
                        className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden shadow-md"
                      >
                        {/* Header snippet */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 border-b border-slate-800 font-mono text-xs">
                          <div className="p-3 bg-emerald-950/20 text-emerald-300">
                            <span className="text-[10px] text-emerald-500 font-sans block mb-1 uppercase tracking-wider font-extrabold">Original ({fromLanguage})</span>
                            <pre className="whitespace-pre-wrap overflow-x-auto">{diff.originalSnippet}</pre>
                          </div>
                          <div className="p-3 bg-indigo-950/20 text-indigo-300">
                            <span className="text-[10px] text-indigo-500 font-sans block mb-1 uppercase tracking-wider font-extrabold">Convertido ({toLanguage})</span>
                            <pre className="whitespace-pre-wrap overflow-x-auto">{diff.convertedSnippet}</pre>
                          </div>
                        </div>
                        {/* Summary */}
                        <div className="p-3.5 bg-slate-900/80 text-xs text-slate-300">
                          <p className="leading-relaxed">
                            <span className="text-indigo-400 font-semibold uppercase mr-1">[Nota de Tradução]:</span> 
                            {diff.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Basic explanation context block if no explicit comparison snippet was captured */}
              {(!result.keyDifferences || result.keyDifferences.length === 0) && (
                <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5 shadow-xl">
                  <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Explicação da Conversão
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-900 p-4 border border-slate-800 rounded-xl italic">
                    {result.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Side container displaying warnings or performance guidelines */}
            <div className="md:col-span-4 space-y-6">
              
              {/* Efficiencies & idioms */}
              {result.efficiencyNotes && (
                <div className="bg-slate-800/40 rounded-2xl border border-slate-800 p-5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 bg-indigo-500/5 rounded-bl-3xl">
                    <Cpu className="w-5 h-5 text-indigo-500" />
                  </div>
                  <h3 className="text-sm font-extrabold text-indigo-400 uppercase tracking-widest mb-3">
                    Desempenho & Melhores Práticas
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/65 p-3 rounded-xl border border-slate-800/80">
                    {result.efficiencyNotes}
                  </p>
                </div>
              )}

              {/* Standard Warnings / edge cases */}
              {result.warnings && result.warnings.length > 0 && (
                <div className="bg-amber-950/20 rounded-2xl border border-amber-900/30 p-5 shadow-xl">
                  <h3 className="text-sm font-extrabold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Alertas e Cuidados Importantes
                  </h3>
                  <ul className="space-y-2 mb-1">
                    {result.warnings.map((warn, index) => (
                      <li key={index} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/40">
                        <span className="text-amber-500 font-extrabold shrink-0 mt-0.5">•</span>
                        <span>{warn}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
            </div>
          </motion.section>
        )}

        {/* PANEL FOR HISTORY & LOCAL CONVERSIONS LIST */}
        <section className="mt-8 bg-slate-800/30 rounded-2xl border border-slate-800 p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Histórico de Sessões</h3>
                <p className="text-xs text-slate-500">Últimas transformações efetuadas nesta aba do navegador</p>
              </div>
            </div>
            
            {history.length > 0 && (
              <button 
                onClick={handleClearHistory}
                className="text-xs bg-red-950/40 border border-red-900/50 hover:bg-red-950/60 text-red-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                id="btn-clear-history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Histórico
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="p-6 bg-slate-900/40 rounded-xl text-center border border-slate-800/80 text-slate-500 text-xs">
              Você ainda não efetuou conversões nesta sessão. Seus códigos salvos aparecerão aqui.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleLoadFromHistory(item)}
                  className="bg-slate-900/70 hover:bg-slate-900 hover:border-indigo-500/50 p-3.5 rounded-xl border border-slate-800/80 cursor-pointer transition group shadow-sm flex flex-col justify-between"
                  id={`history-item-${item.id}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-extrabold text-emerald-400">{item.fromLanguage}</span>
                        <ArrowRightLeft className="w-3 h-3 text-slate-600" />
                        <span className="text-[10px] bg-indigo-950 px-1.5 py-0.5 rounded font-extrabold text-indigo-400">{item.toLanguage}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        className="p-1 hover:bg-slate-800 text-slate-600 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Excluir do Histórico"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <pre className="font-mono text-[11px] leading-relaxed text-slate-500 h-10 overflow-hidden text-ellipsis line-clamp-2 mt-1">
                      {item.originalCode}
                    </pre>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500/60" />
                      {item.timestamp}
                    </span>
                    <span className="text-slate-400 font-bold group-hover:text-indigo-400 transition-colors">Carregar →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Humble outer Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/40 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-medium text-slate-400">Conversor de Linguagem de Programação Inteligente</p>
            <p className="mt-1">Uma ferramenta de assistência pedagógica e de desenvolvimento rápido.</p>
          </div>
          <div className="flex items-center gap-4">
            <span>Interface React 19 + Tailwind CSS + Gemini v3.5</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
