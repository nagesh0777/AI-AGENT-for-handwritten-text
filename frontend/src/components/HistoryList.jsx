import React, { useState, useEffect } from 'react';
import { formService } from '../services/api';
import { FileText, ChevronRight, Search, Filter, AlertCircle, CheckCircle2, Clock, Trash2 } from 'lucide-react';

export default function HistoryList({ onRowClick, compact, countOnly }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (countOnly) return <span>{history.length}</span>;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'PROCESSING': return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
            case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    if (loading && history.length === 0) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 glass-card animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Table Controls */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by filename..."
                        className="bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>
                <button className="secondary-btn !py-2.5 !px-4 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm">Filter</span>
                </button>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-20 glass-panel">
                    <div className="inline-flex p-4 bg-white/5 rounded-full mb-4">
                        <FileText className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-500">No records found. Upload your first form to begin.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map((form) => (
                        <div
                            key={form.id}
                            onClick={() => form.status === 'COMPLETED' && onRowClick(form.id)}
                            className={`glass-card p-4 flex items-center justify-between group transition-all ${form.status === 'COMPLETED' ? 'cursor-pointer hover:border-blue-500/30' : 'opacity-80'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${form.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400' :
                                    form.status === 'PROCESSING' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold group-hover:text-blue-400 transition-colors uppercase text-sm tracking-wide">
                                        {form.fileName}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                            {getStatusIcon(form.status)}
                                            <span className={
                                                form.status === 'COMPLETED' ? 'text-green-500' :
                                                    form.status === 'PROCESSING' ? 'text-blue-500' : 'text-red-500'
                                            }>
                                                {form.status}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                                            {new Date(form.uploadedAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {form.extractionResults && form.extractionResults.confidenceScore && (
                                    <div className="hidden md:flex flex-col items-end">
                                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Confidence</span>
                                        <span className="text-sm font-bold text-white">{(form.extractionResults.confidenceScore * 100).toFixed(0)}%</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleDelete(e, form.id)}
                                        className="w-8 h-8 rounded-full hover:bg-red-500/20 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {form.status === 'COMPLETED' && (
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:shadow-lg group-hover:shadow-blue-600/30 transition-all duration-300">
                                            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
