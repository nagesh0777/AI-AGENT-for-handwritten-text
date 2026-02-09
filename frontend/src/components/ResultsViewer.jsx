import React, { useState, useEffect } from 'react';
import { formService } from '../services/api';
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { ChevronLeft, FileJson, Table as TableIcon, Download, AlertCircle, Sparkles, Clock, BarChart3, FileText, ImageIcon, LayoutDashboard, Grid, Type, Info } from 'lucide-react';

export default function ResultsViewer({ formId, onBack }) {
    const [result, setResult] = useState(null);
    const [view, setView] = useState('smart'); // smart, table, json, raw
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        if (formId) {
            formService.getResults(formId).then(({ data }) => setResult(data));
            setImageUrl(formService.getImageUrl(formId));
        }
    }, [formId]);

    if (!result) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-gray-400 animate-pulse">Analyzing processed data...</p>
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
            return JSON.stringify(val);
        }
        return String(val);
    };

    const getGridData = (data) => {
        const rows = [];

        // 1. Basic properties
        if (data.document_type) rows.push({ field: 'Document Type', value: data.document_type });
        if (data.summary) rows.push({ field: 'Summary', value: data.summary });
        if (typeof data.signatures_detected !== 'undefined') {
            rows.push({ field: 'Signatures Detected', value: data.signatures_detected ? 'Yes' : 'No' });
        }

        // 2. Sections (Robust handling for different naming conventions)
        const sections = data.sections || data.cleaned_sections || [];
        if (Array.isArray(sections)) {
            sections.forEach(section => {
                const sectionName = section.section_name || section.title || 'General';
                const fields = section.fields || [];
                if (Array.isArray(fields)) {
                    fields.forEach(f => {
                        const name = f.field_name || f.label || f.key || 'Field';
                        const val = f.field_value || f.value || '';
                        rows.push({
                            field: `[${sectionName}] ${name}`,
                            value: formatValue(val),
                            confidence: f.confidence
                        });
                    });
                }
            });
        }

        // 3. Key Entities
        if (data.key_entities) {
            Object.entries(data.key_entities).forEach(([key, values]) => {
                if (Array.isArray(values) && values.length > 0) {
                    rows.push({
                        field: `Entity: ${key.replace(/_/g, ' ')}`,
                        value: formatValue(values)
                    });
                }
            });
        }

        // 4. Fallback for other fields
        Object.entries(data).forEach(([key, value]) => {
            if (!['document_type', 'summary', 'sections', 'tables', 'key_entities', 'signatures_detected'].includes(key)) {
                rows.push({ field: key, value: formatValue(value) });
            }
        });

        return rows;
    };

    const gridData = getGridData(structuredData || {});

    const downloadJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(structuredData, null, 2));
        const link = document.createElement('a');
        link.href = dataStr;
        link.download = `extraction_${formId}.json`;
        link.click();
    };

    const downloadCsv = () => {
        const headers = ['Field', 'Value'];
        const rows = gridData.map(row => `${row.field},"${row.value.replace(/"/g, '""')}"`);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const link = document.createElement('a');
        link.href = encodeURI(csvContent);
        link.download = `extraction_${formId}.csv`;
        link.click();
    };

    // Helper for Smart View
    const renderSmartView = () => {
        const sections = structuredData.sections || structuredData.cleaned_sections || [];
        const tables = structuredData.tables || [];
        const hasSections = Array.isArray(sections) && sections.length > 0;

        return (
            <div className="bg-[#0f172a] h-full overflow-y-auto p-6 custom-scrollbar space-y-8">
                {/* Top Summary Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <FileText className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <h3 className="text-lg font-bold text-white tracking-tight">Document Summary</h3>
                            <p className="text-gray-300 leading-relaxed text-sm">
                                {structuredData.summary || "No summary available."}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400">
                                    Type: <span className="text-blue-300">{structuredData.document_type || "Unknown"}</span>
                                </span>
                                {structuredData.signatures_detected && (
                                    <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-400">
                                        Signed Document
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sections Grid */}
                {hasSections ? (
                    <div className="space-y-6">
                        {sections.map((section, idx) => (
                            <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                                    <h4 className="font-bold text-white flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        {section.section_name || section.title || `Section ${idx + 1}`}
                                    </h4>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {section.fields && section.fields.length > 0 ? (
                                        section.fields.map((field, fIdx) => (
                                            <div key={fIdx} className="group">
                                                <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 block mb-1.5 group-hover:text-blue-400 transition-colors">
                                                    {field.field_name || field.label || field.key}
                                                </label>
                                                <div className="text-sm font-medium text-gray-200 border-b border-white/10 pb-1 break-words">
                                                    {formatValue(field.field_value || field.value) || <span className="text-gray-600 italic">Empty</span>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic text-sm col-span-2">No fields detected in this section.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Info className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No structured sections found in this document.</p>
                    </div>
                )}

                {/* Tables Section */}
                {tables.length > 0 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <TableIcon className="w-5 h-5 text-blue-400" />
                            Extracted Tables
                        </h3>
                        {tables.map((table, tIdx) => (
                            <div key={tIdx} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden p-4">
                                <div className="mb-3 font-medium text-blue-300 text-sm">{table.table_name || `Table ${tIdx + 1}`}</div>
                                <div className="ag-theme-quartz-dark h-[200px] rounded-lg">
                                    <AgGridReact
                                        rowData={table.rows}
                                        columnDefs={table.headers.map(h => ({ field: h, headerName: h, flex: 1 }))}
                                        defaultColDef={{ sortable: true, filter: true, resizable: true }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section with glassmorphism */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
                <div className="space-y-4">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to dashboard</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            Extraction Analysis
                            <Sparkles className="w-6 h-6 text-blue-400" />
                        </h1>
                        <p className="text-gray-400 mt-1">Review and export the AI-processed form data</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={downloadJson} className="secondary-btn flex items-center gap-2 !py-2.5">
                        <FileJson className="w-4 h-4 text-blue-400" />
                        <span>JSON</span>
                    </button>
                    <button onClick={downloadCsv} className="primary-btn flex items-center gap-2 !py-2.5">
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Analysis Stats (Original, cleaned up) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-5 flex items-center gap-4 border-l-4 border-purple-500 bg-gradient-to-r from-purple-500/5 to-transparent">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Fields Extracted</p>
                        <p className="text-2xl font-black text-white">{gridData.length}</p>
                    </div>
                </div>
                <div className="glass-card p-5 flex items-center gap-4 border-l-4 border-orange-500 bg-gradient-to-r from-orange-500/5 to-transparent">
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                        <Clock className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Processed On</p>
                        <p className="text-sm font-bold text-white tracking-wide">{new Date(result.extractedAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
            </div>

            {/* Split View Container */}
            <div className="glass-panel overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
                {/* Visual View Switcher */}
                <div className="border-b border-white/10 bg-black/40 p-2 flex items-center justify-between backdrop-blur-md">
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                        <button
                            onClick={() => setView('smart')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 ${view === 'smart' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Form View
                        </button>
                        <button
                            onClick={() => setView('table')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 ${view === 'table' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <TableIcon className="w-4 h-4" />
                            Data Grid
                        </button>
                        <button
                            onClick={() => setView('json')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 ${view === 'json' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <FileJson className="w-4 h-4" />
                            JSON
                        </button>
                        <button
                            onClick={() => setView('raw')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 ${view === 'raw' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <FileText className="w-4 h-4" />
                            Raw
                        </button>
                    </div>

                    {result.unclearFields && result.unclearFields !== '[]' && (
                        <div className="mr-4 flex items-center gap-2 text-orange-400 text-xs font-bold animate-pulse px-3 py-1.5 bg-orange-500/10 rounded-full border border-orange-500/20">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Wait, review needed
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-[700px]">
                    {/* Left Panel: Image Viewer */}
                    <div className="border-r border-white/10 flex flex-col h-full bg-[#050505] relative">
                        <div className="absolute top-4 left-4 z-10">
                            <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-widest border border-white/10 flex items-center gap-2">
                                <ImageIcon className="w-3 h-3" /> Source Document
                            </span>
                        </div>
                        <div className="flex-1 relative overflow-hidden group p-8 flex items-center justify-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-100">
                            {/* Dotted pattern background */}
                            <div className="absolute inset-0 opacity-10"
                                style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                            />

                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt="Source Form"
                                    className="max-w-full max-h-full object-contain shadow-2xl shadow-black rounded-lg transform transition-transform duration-500 hover:scale-[1.02]"
                                />
                            ) : (
                                <div className="text-gray-500 text-sm flex flex-col items-center gap-2">
                                    <ImageIcon className="w-8 h-8 opacity-50" />
                                    <span>Source image not available</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Data View */}
                    <div className="flex flex-col h-full overflow-hidden bg-[#0a0a0f]">
                        {view === 'smart' ? (
                            renderSmartView()
                        ) : view === 'table' ? (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="ag-theme-quartz-dark flex-1 w-full">
                                    <AgGridReact
                                        rowData={gridData}
                                        columnDefs={[
                                            {
                                                field: 'field',
                                                headerName: 'Field Name',
                                                flex: 2,
                                                minWidth: 200,
                                                cellStyle: { fontWeight: '600', textWrap: 'wrap' },
                                                autoHeight: true
                                            },
                                            {
                                                field: 'value',
                                                headerName: 'Extracted Content',
                                                flex: 3,
                                                minWidth: 300,
                                                cellStyle: (params) => ({
                                                    color: '#60a5fa',
                                                    fontWeight: '500',
                                                    textWrap: 'wrap'
                                                }),
                                                autoHeight: true
                                            }
                                        ]}
                                        defaultColDef={{ sortable: true, filter: true, resizable: true }}
                                    />
                                </div>
                                {structuredData.tables && structuredData.tables.length > 0 && (
                                    <div className="border-t border-white/10 bg-[#050510] p-4 space-y-4 max-h-[30%] overflow-auto custom-scrollbar">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <TableIcon className="w-3 h-3" />
                                            Extracted Tables
                                        </h4>
                                        {structuredData.tables.map((table, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <p className="text-[10px] text-blue-400 font-bold uppercase">{table.table_name || `Table ${idx + 1}`}</p>
                                                <div className="ag-theme-quartz-dark h-[150px] border border-white/5 rounded-lg overflow-hidden">
                                                    <AgGridReact
                                                        rowData={table.rows}
                                                        columnDefs={table.headers.map(h => ({ field: h, headerName: h, flex: 1 }))}
                                                        defaultColDef={{ sortable: true, filter: true, resizable: true }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : view === 'json' ? (
                            <div className="bg-[#0b101a] h-full overflow-auto p-6 custom-scrollbar font-mono text-sm leading-relaxed">
                                <pre className="text-blue-200/80">
                                    {JSON.stringify(structuredData, null, 2)}
                                </pre>
                            </div>
                        ) : (
                            <div className="bg-[#0b101a] h-full overflow-auto p-6 custom-scrollbar font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-400 italic">
                                {result.rawText || "No raw text available for this document."}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
