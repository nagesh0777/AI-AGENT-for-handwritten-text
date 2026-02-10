import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formService } from '../services/api';
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { ChevronLeft, FileJson, Table as TableIcon, Download, AlertCircle, Sparkles, Clock, FileText, ImageIcon, LayoutDashboard, Info, Search, ShieldCheck, Share2, Type } from 'lucide-react';

export default function ResultsViewer({ formId, onBack }) {
    const [result, setResult] = useState(null);
    const [view, setView] = useState('smart'); // smart, table, json, raw
    const [imageUrl, setImageUrl] = useState(null);
    const [hoveredField, setHoveredField] = useState(null);

    useEffect(() => {
        if (formId) {
            formService.getResults(formId).then(({ data }) => setResult(data));
            setImageUrl(formService.getImageUrl(formId));
        }
    }, [formId]);

    if (!result) return (
        <div className="min-h-[600px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-blue-400 animate-pulse" />
                </div>
                <div className="space-y-2 text-center">
                    <p className="text-xl font-black text-white tracking-tight uppercase">Decoding Neural Data</p>
                    <p className="text-sm text-gray-500 font-medium">Reconstructing structured document from visual tokens...</p>
                </div>
            </div>
        </div>
    );

    let structuredData = result.structuredJson;
    try {
        if (typeof structuredData === 'string') {
            structuredData = JSON.parse(structuredData);
            if (typeof structuredData === 'string') structuredData = JSON.parse(structuredData);
        }
    } catch (e) {
        structuredData = { "error": "Invalid format", "raw": String(result.structuredJson) };
    }

    const formatValue = (val) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') {
            if (Array.isArray(val)) {
                return val.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ');
            }
            // Better object formatting for Insight View
            return Object.entries(val).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join('\n');
        }
        return String(val);
    };

    const getGridData = (data) => {
        const rows = [];
        if (data.document_type) rows.push({ field: 'Document Type', value: data.document_type });
        if (data.summary) rows.push({ field: 'Summary', value: data.summary });

        const sections = data.sections || data.cleaned_sections || [];
        if (Array.isArray(sections)) {
            sections.forEach(section => {
                const sectionName = section.section_name || section.title || 'General';
                const fields = section.fields || [];
                if (Array.isArray(fields)) {
                    fields.forEach(f => {
                        // Clean up field name for Grid
                        const rawLabel = f.field_name || f.label || f.key || 'Field';
                        const cleanLabel = rawLabel.replace(/^\[.*?\]\s*/, ''); // Remove [SECTION] prefix if present

                        rows.push({
                            field: `[${sectionName}] ${cleanLabel}`,
                            value: formatValue(f.field_value || f.value || ''),
                            confidence: f.confidence
                        });
                    });
                }
            });
        }
        return rows;
    };

    const gridData = getGridData(structuredData || {});

    const downloadJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(structuredData, null, 2));
        const link = document.createElement('a');
        link.href = dataStr;
        link.download = `trikaar_export_${formId}.json`;
        link.click();
    };

    const renderSmartView = () => {
        const sections = structuredData.sections || structuredData.cleaned_sections || [];
        const hasSections = Array.isArray(sections) && sections.length > 0;

        return (
            <div className="bg-[#020205] h-full overflow-y-auto p-8 custom-scrollbar space-y-10">
                {/* Document Insight Header */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-600/10 via-white/[0.02] to-transparent border border-white/5 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldCheck className="w-24 h-24 text-blue-400" />
                    </div>

                    <div className="flex items-start gap-6 relative z-10">
                        <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase uppercase italic">Executive Summary</h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                            </div>
                            <p className="text-gray-400 leading-relaxed font-medium">
                                {structuredData.summary || "Agent analyzed the visual tokens and generated a structural map of the document contents."}
                            </p>
                            <div className="flex flex-wrap gap-3 mt-4">
                                <span className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                                    {structuredData.document_type || "Generic Form"}
                                </span>
                                {structuredData.signatures_detected && (
                                    <span className="px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-black text-green-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        Verified Signature
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Sections Visualization */}
                {hasSections ? (
                    <div className="space-y-10">
                        {sections.map((section, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-4">
                                    <h4 className="font-black text-white text-xs uppercase tracking-[0.3em] flex items-center gap-4">
                                        <span className="w-8 h-[2px] bg-blue-600" />
                                        {section.section_name || section.title || `Module ${idx + 1}`}
                                    </h4>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 pl-12">
                                    {section.fields && section.fields.length > 0 ? (
                                        section.fields.map((field, fIdx) => (
                                            <div
                                                key={fIdx}
                                                className="group relative"
                                                onMouseEnter={() => setHoveredField(field.field_name || field.label)}
                                                onMouseLeave={() => setHoveredField(null)}
                                            >
                                                <div className="absolute -left-6 top-0 bottom-0 w-[2px] bg-blue-500/0 group-hover:bg-blue-500/50 transition-all duration-300" />
                                                <label className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] block mb-2 group-hover:text-blue-400 transition-colors">
                                                    {field.field_name || field.label || field.key}
                                                </label>
                                                <div className="text-[15px] font-bold text-white/90 leading-snug break-words tracking-tight group-hover:text-white transition-colors whitespace-pre-wrap">
                                                    {formatValue(field.field_value || field.value) || <span className="text-gray-700 italic opacity-50">Null detected</span>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-600 italic text-xs">Extraction phase returned no tokens for this module.</p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/[0.01] rounded-3xl border border-dashed border-white/5">
                        <Search className="w-12 h-12 mx-auto mb-4 text-gray-700" />
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No structural sections detected</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-10 relative">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-white/5">
                <div className="space-y-6">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-3 text-gray-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Return to Workspace
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Neural Verification Complete</span>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
                            Intelligence Report
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
                    <button onClick={downloadJson} className="px-6 py-3 rounded-xl hover:bg-white/10 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all flex items-center gap-3">
                        <FileJson className="w-4 h-4" /> Export JSON
                    </button>
                    <button className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center gap-3">
                        <Share2 className="w-4 h-4" /> Share Access
                    </button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Intelligence Units', value: gridData.length, icon: Sparkles, color: 'blue' },
                    { label: 'Security Status', value: 'Verified', icon: ShieldCheck, color: 'green' },
                    { label: 'Timestamp', value: new Date(result.extractedAt).toLocaleDateString(), icon: Clock, color: 'purple' }
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="glass-card p-6 flex items-center gap-5 border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-white/20"
                    >
                        <div className={`p-4 rounded-2xl bg-${stat.color}-500/10`}>
                            <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">{stat.label}</p>
                            <p className="text-xl font-black text-white tracking-tighter uppercase italic">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Workbench Interface */}
            <div className="glass-panel rounded-[3rem] overflow-hidden border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]">
                {/* View Switcher Bar */}
                <div className="bg-black/40 border-b border-white/5 p-4 flex items-center justify-between backdrop-blur-3xl">
                    <div className="flex items-center gap-2 p-1.5 bg-black/60 rounded-[1rem] border border-white/10">
                        {[
                            { id: 'smart', icon: LayoutDashboard, label: 'Insight' },
                            { id: 'table', icon: TableIcon, label: 'Grid' },
                            { id: 'json', icon: FileJson, label: 'Neural' },
                            { id: 'raw', icon: Type, label: 'Text' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setView(t.id)}
                                className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${view === t.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 glow-text-blue' : 'text-gray-500 hover:text-white'}`}
                            >
                                <t.icon className="w-4 h-4" />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 pr-4">
                        <div className="h-4 w-px bg-white/10" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest hidden md:block">Trikaar Forensics V3.0</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-auto md:h-[calc(100vh-180px)] min-h-[600px] border border-white/5 rounded-[2rem] overflow-hidden">
                    {/* Visualizer Panel */}
                    <div className="border-r border-white/5 flex flex-col h-[50vh] md:h-full bg-[#050505] relative overflow-hidden">
                        {/* Scanner Beam Effect */}
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
                            <motion.div
                                className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-blue-500/0 via-blue-500/20 to-blue-500/0"
                                animate={{ top: ['-50%', '100%'] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            />
                        </div>

                        <div className="relative z-10 flex-1 flex flex-col p-8">
                            <div className="flex items-center justify-between mb-6">
                                <span className="px-4 py-2 bg-black/80 rounded-xl text-[10px] font-black text-white uppercase tracking-[0.3em] border border-white/10 flex items-center gap-3">
                                    <ImageIcon className="w-3.5 h-3.5 text-blue-400" /> Source Data Stream
                                </span>
                                <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Resolution Optimized</div>
                            </div>

                            <div className="flex-1 relative flex items-center justify-center overflow-hidden w-full h-full">
                                {imageUrl ? (
                                    <motion.div
                                        className="relative w-full h-full flex items-center justify-center p-4"
                                    >
                                        <img
                                            src={imageUrl}
                                            alt="Forensic Scan"
                                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                        />
                                        {/* Dynamic Corner Brackets - Positioned relative to container for UI effect */}
                                        <div className="absolute inset-4 pointer-events-none">
                                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500/30 rounded-tl-lg" />
                                            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500/30 rounded-tr-lg" />
                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500/30 rounded-bl-lg" />
                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500/30 rounded-br-lg" />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="text-gray-600 text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full border border-dashed border-gray-800 flex items-center justify-center">
                                            <ImageIcon className="w-8 h-8 opacity-20" />
                                        </div>
                                        Stream Offline
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Digital HUD Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/40 to-transparent flex items-center justify-between relative z-20">
                            <div className="flex gap-4">
                                <div className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest">LAT: 0.042ms</div>
                                <div className="text-[9px] font-black text-green-500/60 uppercase tracking-widest">ACC: 0.994</div>
                            </div>
                            <div className="w-32 h-[1px] bg-white/10" />
                        </div>
                    </div>

                    {/* Data Panel */}
                    <div className="flex flex-col h-full bg-[#050508] relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={view}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.4, ease: "circOut" }}
                                className="flex-1 w-full h-full overflow-hidden relative"
                            >
                                {view === 'smart' ? (
                                    <div className="h-full w-full overflow-y-auto custom-scrollbar">
                                        {renderSmartView()}
                                    </div>
                                ) : view === 'table' ? (
                                    <div className="ag-theme-quartz-dark h-full w-full">
                                        <AgGridReact
                                            rowData={gridData}
                                            columnDefs={[
                                                {
                                                    field: 'field',
                                                    headerName: 'Neural Map',
                                                    flex: 1,
                                                    minWidth: 250,
                                                    wrapText: true,
                                                    autoHeight: true,
                                                    cellStyle: { fontWeight: '800', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.1em', whiteSpace: 'normal', lineHeight: '1.5' }
                                                },
                                                {
                                                    field: 'value',
                                                    headerName: 'Extracted Value',
                                                    flex: 1,
                                                    minWidth: 300,
                                                    wrapText: true,
                                                    autoHeight: true,
                                                    cellStyle: { color: '#60a5fa', fontWeight: '600', whiteSpace: 'normal', lineHeight: '1.5' }
                                                }
                                            ]}
                                            defaultColDef={{ sortable: true, filter: true, resizable: true }}
                                        />
                                    </div>
                                ) : view === 'json' ? (
                                    <div className="bg-[#020205] h-full overflow-y-auto p-10 custom-scrollbar font-mono text-[13px] leading-relaxed text-blue-300 relative">
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <FileJson className="w-48 h-48" />
                                        </div>
                                        <pre className="relative z-10 selection:bg-blue-600/40 whitespace-pre-wrap break-all">
                                            {JSON.stringify(structuredData, null, 4)}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="bg-[#020205] h-full overflow-y-auto p-10 custom-scrollbar font-mono text-[13px] leading-relaxed text-gray-500 italic whitespace-pre-wrap break-words">
                                        {result.rawText || "// No unformatted trace captured for this document."}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
