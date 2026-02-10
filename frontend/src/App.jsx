import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from './components/FileUpload';
import HistoryList from './components/HistoryList';
import ResultsViewer from './components/ResultsViewer';
import { formService } from './services/api';
import { Layout, History, FileText, Settings, Zap, Menu, X, Loader2, Info, BrainCircuit, Sparkles, RotateCcw, Plus } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${active ? 'text-blue-400' : 'text-gray-500 hover:text-white'}`}>
        {active && (
            <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 bg-blue-600/10 border border-blue-500/20 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                initial={false}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
        )}
        <Icon className={`w-5 h-5 relative z-10 ${active ? 'text-blue-400' : 'group-hover:text-white transition-colors'}`} />
        <span className="font-medium relative z-10">{label}</span>
    </button>
);

function App() {
    const [selectedFormId, setSelectedFormId] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [processingItem, setProcessingItem] = useState(null);
    const [showUploadPanel, setShowUploadPanel] = useState(false);

    const handleUploadSuccess = (data) => {
        setProcessingItem({ id: data.id, progress: 10, status: 'PROCESSING', startTime: Date.now() });
        setShowUploadPanel(false);
    };

    useEffect(() => {
        let interval;
        if (processingItem && processingItem.status === 'PROCESSING') {
            interval = setInterval(async () => {
                try {
                    try {
                        const res = await formService.getResults(processingItem.id);
                        if (res.data) {
                            setProcessingItem(prev => ({ ...prev, progress: 100, status: 'COMPLETED' }));
                            clearInterval(interval);
                        }
                    } catch (e) {
                        setProcessingItem(prev => ({ ...prev, progress: Math.min(prev.progress + 5, 95) }));
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [processingItem]);

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    return (
        <div className="min-h-screen flex bg-[#020205] text-slate-200 relative overflow-hidden selection:bg-blue-500/30">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`w-72 border-r border-white/5 bg-[#050510]/80 backdrop-blur-2xl flex flex-col p-6 fixed h-full z-40 transition-all duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3 px-2">
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Zap className="w-6 h-6 text-white fill-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#050510] rounded-full" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tighter glow-text-blue">TRIKAAR</h2>
                            <span className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em]">Vision AI</span>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 p-2 hover:bg-white/5 rounded-lg">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 space-y-1">
                    <SidebarItem
                        icon={Layout}
                        label="Dashboard"
                        active={activeTab === 'dashboard'}
                        onClick={() => { setActiveTab('dashboard'); setSelectedFormId(null); }}
                    />
                    <SidebarItem
                        icon={History}
                        label="History"
                        active={activeTab === 'history'}
                        onClick={() => { setActiveTab('history'); setSelectedFormId(null); }}
                    />
                </nav>

                <div className="mt-auto space-y-4">
                    <div className="px-4 py-4 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 group hover:border-blue-500/20 transition-colors">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <BrainCircuit className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Core Engine</span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium group-hover:text-gray-400 transition-colors">Llama 3.3 70B Orchestrator active for precise extraction.</p>
                    </div>

                    <div className="px-4 py-3 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Public Session</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 w-full transition-all duration-300">
                <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between px-6 lg:px-12 sticky top-0 z-10">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="hidden md:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 group cursor-default">
                            <Zap className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Agent Active</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Refresh Dashboard"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                        <div className="h-8 w-px bg-white/10 mx-2" />
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-white uppercase tracking-wider">Guest User</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Developer Mode</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 flex items-center justify-center">
                                <Settings className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 lg:p-12 max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                        {selectedFormId ? (
                            <motion.div
                                key="results"
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={containerVariants}
                            >
                                <ResultsViewer formId={selectedFormId} onBack={() => setSelectedFormId(null)} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key={activeTab}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={containerVariants}
                                className="space-y-12"
                            >
                                {activeTab === 'dashboard' ? (
                                    <section className="space-y-10">
                                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded uppercase tracking-widest border border-blue-500/20">V3.0 Production</span>
                                                </div>
                                                <h1 className="text-5xl font-black text-white mb-3 tracking-tighter">AI AGENT<span className="text-blue-500">.</span></h1>
                                                <p className="text-gray-500 max-w-xl font-medium">Extract structured intelligence from handwritten documents using our forensic vision pipeline.</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setShowUploadPanel(true)}
                                                    className="primary-btn !py-4 !px-8 flex items-center gap-3 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                    <span className="text-xs font-black uppercase tracking-widest">New Extraction</span>
                                                </motion.button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                            <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                                                <div className="glass-panel p-10 relative overflow-hidden group border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                                                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                                                        <BrainCircuit className="w-64 h-64" />
                                                    </div>
                                                    <div className="relative z-10">
                                                        <h2 className="text-2xl font-black text-white mb-4 tracking-tight uppercase">Recent Processing</h2>
                                                        <div className="bg-black/20 rounded-3xl p-6 border border-white/5">
                                                            <HistoryList compact onRowClick={(id) => setSelectedFormId(id)} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="glass-panel p-6 border border-white/5 hover:border-blue-500/20 transition-all group overflow-hidden">
                                                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-500 mb-4">
                                                            <FileText className="w-6 h-6 text-blue-400 group-hover:text-white" />
                                                        </div>
                                                        <h3 className="text-white font-black text-sm tracking-tight mb-1 uppercase">Universal</h3>
                                                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium uppercase tracking-wider">Auto-recognition across PDFs and JPGs.</p>
                                                    </div>

                                                    <div className="glass-panel p-6 border border-white/5 hover:border-purple-500/20 transition-all group overflow-hidden">
                                                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:bg-purple-500 group-hover:scale-110 transition-all duration-500 mb-4">
                                                            <BrainCircuit className="w-6 h-6 text-purple-400 group-hover:text-white" />
                                                        </div>
                                                        <h3 className="text-white font-black text-sm tracking-tight mb-1 uppercase">Llama 3.3</h3>
                                                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium uppercase tracking-wider">Secondary forensic pass for zero OCR noise.</p>
                                                    </div>

                                                    <div className="glass-panel p-6 border border-white/5 hover:border-green-500/20 transition-all group overflow-hidden">
                                                        <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center group-hover:bg-green-500 group-hover:scale-110 transition-all duration-500 mb-4">
                                                            <Zap className="w-6 h-6 text-green-400 group-hover:text-white" />
                                                        </div>
                                                        <h3 className="text-white font-black text-sm tracking-tight mb-1 uppercase">Real-time</h3>
                                                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium uppercase tracking-wider">Optimized for low-latency inference.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                                                <FileUpload onUploadSuccess={handleUploadSuccess} />
                                            </div>
                                        </div>
                                    </section>
                                ) : (
                                    <section id="history-section" className="space-y-8 animate-fade-in">
                                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                                                        <History className="w-4 h-4 text-blue-400" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Library</span>
                                                </div>
                                                <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Extraction Log</h2>
                                                <p className="text-gray-500 font-medium">A trace of all intelligence processed by the agent within this cluster.</p>
                                            </div>
                                            <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Total Intelligence</p>
                                                <div className="text-2xl font-black text-white flex items-baseline gap-2">
                                                    <HistoryList compact countOnly />
                                                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Units</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-4 lg:p-8">
                                            <HistoryList onRowClick={(id) => setSelectedFormId(id)} />
                                        </div>
                                    </section>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Side Modern Processing Hub */}
                <AnimatePresence>
                    {processingItem && (
                        <motion.div
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            className="fixed top-24 right-8 w-96 z-50 pointer-events-none"
                        >
                            <div className="pointer-events-auto relative">
                                {/* Glowing Background Orbs */}
                                <div className="absolute -inset-4 bg-blue-600/20 blur-3xl rounded-full animate-pulse z-0" />
                                <div className="absolute top-0 right-0 -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 z-0" />

                                <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 relative z-10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                                    {/* Animated Scanner Scanline */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent h-20 w-full z-0 pointer-events-none"
                                        animate={{ top: ['-20%', '120%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    />

                                    <div className="flex flex-col gap-6 relative z-10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                                                    <BrainCircuit className={`w-6 h-6 text-blue-400 ${processingItem.status !== 'COMPLETED' ? 'animate-pulse' : ''}`} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-white tracking-widest uppercase italic">Neural Processing</h3>
                                                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.2em]">Agent V3.0 Active</p>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <svg className="w-16 h-16 transform -rotate-90">
                                                    <circle
                                                        cx="32"
                                                        cy="32"
                                                        r="28"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                        fill="transparent"
                                                        className="text-white/5"
                                                    />
                                                    <motion.circle
                                                        cx="32"
                                                        cy="32"
                                                        r="28"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                        fill="transparent"
                                                        strokeDasharray="175.93"
                                                        initial={{ strokeDashoffset: 175.93 }}
                                                        animate={{ strokeDashoffset: 175.93 - (175.93 * processingItem.progress) / 100 }}
                                                        className="text-blue-500"
                                                    />
                                                </svg>
                                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white italic">
                                                    {Math.round(processingItem.progress)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                                                <span className="text-gray-500 italic">Extraction Pipeline</span>
                                                <span className="text-blue-400">
                                                    {processingItem.progress < 30 ? 'Initializing...' :
                                                        processingItem.progress < 60 ? 'Analyzing Tokens...' :
                                                            processingItem.progress < 90 ? 'Forensics Pass...' : 'Finalizing...'}
                                                </span>
                                            </div>

                                            {/* Data Stream Simulation */}
                                            <div className="bg-black/40 rounded-xl p-3 font-mono text-[8px] text-blue-300/60 overflow-hidden h-16 border border-white/5">
                                                <motion.div
                                                    animate={{ y: [0, -100] }}
                                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                                >
                                                    <div>{`> ANALYZING_BUFFER_0x${processingItem.id.toString(16)}`}</div>
                                                    <div>{`> TOKEN_ID: ${Math.random().toString(36).substring(7)}`}</div>
                                                    <div>{`> MAPPING_STRUCTURAL_NODES...`}</div>
                                                    <div>{`> LLM_VERIFICATION_PASS_1...`}</div>
                                                    <div>{`> DETECTING_HANDWRITING_PATTERNS...`}</div>
                                                    <div>{`> CONFIDENCE_SCORE: 0.9982`}</div>
                                                    <div>{`> DATA_ENTITY_EXTRACTION...`}</div>
                                                </motion.div>
                                            </div>
                                        </div>

                                        {processingItem.status === 'COMPLETED' ? (
                                            <motion.button
                                                initial={{ y: 20, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                onClick={() => { setSelectedFormId(processingItem.id); setProcessingItem(null); }}
                                                className="w-full py-4 bg-white text-black font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-2xl flex items-center justify-center gap-3 relative group overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                                                <span className="relative z-10">Open Extraction</span>
                                                <Zap className="w-4 h-4 fill-current relative z-10" />
                                            </motion.button>
                                        ) : (
                                            <div className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-white/5 border border-white/5">
                                                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse italic">
                                                    Agent Orchestrating Data...
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Floating Upload Hub Panel */}
                <AnimatePresence>
                    {showUploadPanel && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowUploadPanel(false)}
                                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
                            />
                            <motion.div
                                initial={{ x: 500, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 500, opacity: 0 }}
                                className="fixed top-0 right-0 h-full w-[450px] bg-[#050510] border-l border-white/10 z-[70] p-10 shadow-[-50px_0_100px_rgba(0,0,0,0.8)] overflow-y-auto"
                            >
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                                            <Plus className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">Upload Command</h2>
                                    </div>
                                    <button
                                        onClick={() => setShowUploadPanel(false)}
                                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-500 hover:text-white"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-10">
                                    <div className="p-6 rounded-3xl bg-blue-600/10 border border-blue-500/20">
                                        <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <Info className="w-3.5 h-3.5" />
                                            Transmission Protocol
                                        </p>
                                        <p className="text-xs text-gray-400 leading-relaxed font-medium">
                                            Select a document for neural parsing. Our agent will automatically map structures and extract deep intelligence.
                                        </p>
                                    </div>

                                    <FileUpload onUploadSuccess={handleUploadSuccess} />

                                    <div className="space-y-4 opacity-50 pointer-events-none">
                                        <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Advanced Parameters</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Forensic Mode</span>
                                                <div className="w-8 h-4 bg-blue-600 rounded-full" />
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Deep Verify</span>
                                                <div className="w-8 h-4 bg-white/10 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

export default App;
