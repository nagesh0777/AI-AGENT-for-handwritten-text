import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import HistoryList from './components/HistoryList';
import ResultsViewer from './components/ResultsViewer';
import { formService } from './services/api';
import { Layout, History, FileText, Settings, Zap, Menu, X, Loader2, Info } from 'lucide-react';

function App() {
    const [selectedFormId, setSelectedFormId] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [processingItem, setProcessingItem] = useState(null);

    const handleUploadSuccess = (data) => {
        setProcessingItem({ id: data.id, progress: 10, status: 'PROCESSING' });
    };

    useEffect(() => {
        let interval;
        if (processingItem && processingItem.status === 'PROCESSING') {
            interval = setInterval(async () => {
                try {
                    try {
                        await formService.getResults(processingItem.id);
                        setProcessingItem(prev => ({ ...prev, progress: 100, status: 'COMPLETED' }));
                        clearInterval(interval);
                    } catch (e) {
                        setProcessingItem(prev => ({ ...prev, progress: Math.min(prev.progress + 10, 90) }));
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [processingItem]);

    return (
        <div className="min-h-screen flex bg-[#050510] relative overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`w-72 border-r border-white/5 bg-[#050510]/95 backdrop-blur-xl flex flex-col p-6 fixed h-full z-40 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Zap className="w-6 h-6 text-white fill-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">FormFlow</h2>
                            <span className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em]">Agentic OCR</span>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 space-y-2">
                    <button
                        onClick={() => { setActiveTab('dashboard'); setSelectedFormId(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-600/5' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                        <Layout className="w-5 h-5" />
                        <span className="font-medium">Dashboard</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('history'); setSelectedFormId(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-600/5' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                        <History className="w-5 h-5" />
                        <span className="font-medium">History</span>
                    </button>
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5">
                    <div className="px-4 py-4 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 text-blue-400 mb-1">
                            <Info className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Public Access</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">Authentication has been disabled as per project requirements.</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 w-full transition-all duration-300">
                <header className="h-20 border-b border-white/5 bg-black/10 backdrop-blur-md flex items-center justify-between px-4 lg:px-10 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg">
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="hidden md:block text-xs font-bold text-gray-500 uppercase tracking-widest">Workspace</span>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">System Online</span>
                        </div>
                    </div>
                </header>

                <div className="p-10 max-w-6xl mx-auto">
                    {selectedFormId ? (
                        <ResultsViewer formId={selectedFormId} onBack={() => setSelectedFormId(null)} />
                    ) : (
                        <div className="space-y-12">
                            {activeTab === 'dashboard' && (
                                <section className="animate-fade-in space-y-8">
                                    <div>
                                        <h1 className="text-4xl font-bold text-white mb-2">Workspace Dashboard</h1>
                                        <p className="text-gray-500">Universal vision extraction pipeline is active. No login required.</p>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <FileUpload onUploadSuccess={handleUploadSuccess} />

                                            {processingItem && (
                                                <div className="glass-panel p-6 animate-fade-in border border-blue-500/30">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            {processingItem.status === 'COMPLETED' ? (
                                                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                                                    <Zap className="w-5 h-5 text-green-500" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
                                                                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <h3 className="text-white font-bold text-sm">
                                                                    {processingItem.status === 'COMPLETED' ? 'Extraction Complete' : 'Processing Image...'}
                                                                </h3>
                                                                <p className="text-xs text-gray-400">TaskID: #{processingItem.id}</p>
                                                            </div>
                                                        </div>
                                                        {processingItem.status === 'COMPLETED' && (
                                                            <button
                                                                onClick={() => { setSelectedFormId(processingItem.id); setProcessingItem(null); }}
                                                                className="text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                                                            >
                                                                Review Data
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${processingItem.status === 'COMPLETED' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
                                                            style={{ width: `${processingItem.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="glass-panel p-8 flex flex-col justify-center">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                                        <FileText className="w-6 h-6 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold">Universal Parser</h3>
                                                        <p className="text-sm text-gray-500">Supports handwritten notes, receipts, & forms</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                                                        <Settings className="w-6 h-6 text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold">Open Access</h3>
                                                        <p className="text-sm text-gray-500">System simplified for immediate public usage</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
                                                        <Zap className="w-6 h-6 text-green-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold">Llama 4 Scout</h3>
                                                        <p className="text-sm text-gray-500">Lightning-fast vision extraction model</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'history' && (
                                <section id="history-section" className="animate-fade-in">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <History className="w-6 h-6 text-blue-400" />
                                            <h2 className="text-2xl font-bold text-white tracking-tight">Public History</h2>
                                        </div>
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            Total Extractions: <HistoryList compact countOnly />
                                        </div>
                                    </div>
                                    <HistoryList onRowClick={(id) => setSelectedFormId(id)} />
                                </section>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
