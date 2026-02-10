import React, { useState, useEffect, useMemo } from 'react';
import { formService } from '../services/api';
import { FileText, ChevronRight, Search, Filter, AlertCircle, CheckCircle2, Clock, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryList({ onRowClick, compact, countOnly }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    const fetchHistory = () => {
        setLoading(true);
        formService.getHistory()
            .then(({ data }) => setHistory(data))
            .finally(() => setLoading(false));
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this extraction?')) {
            try {
                await formService.delete(id);
                fetchHistory(); // Refresh list
            } catch (err) {
                console.error("Failed to delete", err);
            }
        }
    };

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 5000);
        return () => clearInterval(interval);
    }, []);

    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            const matchesSearch = item.fileName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = activeFilter === 'ALL' || item.status === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [history, searchTerm, activeFilter]);

    if (countOnly) return <span>{history.length}</span>;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'PROCESSING': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
            case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    if (loading && history.length === 0) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 glass-card animate-pulse shadow-sm" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Table Controls */}
            {!compact && (
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search intelligence log..."
                            className="bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-gray-600 font-medium"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-3 h-3 text-gray-500" />
                            </button>
                        )}
                    </div>

                    <div className="relative w-full sm:w-auto">
                        <button
                            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                            className={`secondary-btn !py-3 !px-6 flex items-center gap-3 w-full sm:w-auto transition-all ${activeFilter !== 'ALL' ? 'border-blue-500/50 text-blue-400' : ''}`}
                        >
                            <Filter className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest">
                                {activeFilter === 'ALL' ? 'Filter' : activeFilter}
                            </span>
                        </button>

                        <AnimatePresence>
                            {isFilterMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsFilterMenuOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-3 w-48 bg-[#0a0a15] border border-white/10 rounded-2xl shadow-2xl z-50 p-2 backdrop-blur-3xl overflow-hidden"
                                    >
                                        {['ALL', 'COMPLETED', 'PROCESSING', 'ERROR'].map((filter) => (
                                            <button
                                                key={filter}
                                                onClick={() => {
                                                    setActiveFilter(filter);
                                                    setIsFilterMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === filter ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                            >
                                                {filter}
                                            </button>
                                        ))}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {filteredHistory.length === 0 ? (
                <div className="text-center py-24 glass-panel border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                    <div className="inline-flex p-6 bg-white/5 rounded-3xl mb-6 shadow-inner">
                        <Search className="w-10 h-10 text-gray-700" />
                    </div>
                    <h3 className="text-white font-black uppercase tracking-widest text-sm mb-2">Null Result</h3>
                    <p className="text-gray-600 font-medium">No matching intelligence units found in the current cluster.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredHistory.map((form) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={form.id}
                            onClick={() => form.status === 'COMPLETED' && onRowClick(form.id)}
                            className={`glass-card p-5 flex items-center justify-between group transition-all relative overflow-hidden ${form.status === 'COMPLETED' ? 'cursor-pointer hover:border-blue-500/40 hover:shadow-[0_0_40px_rgba(59,130,246,0.05)]' : 'opacity-80'}`}
                        >
                            {/* Animated hover gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/[0.02] to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />

                            <div className="flex items-center gap-5 relative z-10">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${form.status === 'COMPLETED' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white' :
                                    form.status === 'PROCESSING' ? 'bg-amber-600/10 text-amber-500 border-amber-500/20' : 'bg-red-600/10 text-red-500 border-red-500/20'
                                    }`}>
                                    <FileText className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="text-white font-black group-hover:text-blue-400 transition-colors uppercase text-sm tracking-tighter">
                                        {form.fileName}
                                    </h4>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5">
                                            {getStatusIcon(form.status)}
                                            <span className={
                                                form.status === 'COMPLETED' ? 'text-green-500' :
                                                    form.status === 'PROCESSING' ? 'text-amber-500' : 'text-red-500'
                                            }>
                                                {form.status}
                                            </span>
                                        </div>
                                        <div className="h-1 w-1 rounded-full bg-gray-700" />
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] italic">
                                            {new Date(form.uploadedAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => handleDelete(e, form.id)}
                                        className="w-10 h-10 rounded-xl hover:bg-red-500/20 flex items-center justify-center text-gray-600 hover:text-red-500 transition-all active:scale-95"
                                        title="Delete Extraction"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {form.status === 'COMPLETED' && (
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-blue-600 group-hover:border-blue-400 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all duration-300">
                                            <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
