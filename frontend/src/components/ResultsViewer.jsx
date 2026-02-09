import React, { useState, useEffect } from 'react';
import { formService } from '../services/api';
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { ChevronLeft, FileJson, Table as TableIcon, Download, AlertCircle, Sparkles, Clock, BarChart3, FileText, ImageIcon } from 'lucide-react';

export default function ResultsViewer({ formId, onBack }) {
    const [result, setResult] = useState(null);
    const [view, setView] = useState('table'); // table, json, raw
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
                            value: typeof val === 'object' ? JSON.stringify(val) : String(val),
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
                        value: values.join(', ')
                    });
                }
            });
        }

        // 4. Fallback for other fields
        Object.entries(data).forEach(([key, value]) => {
            if (!['document_type', 'summary', 'sections', 'tables', 'key_entities', 'signatures_detected'].includes(key)) {
                if (typeof value === 'object') {
                    rows.push({ field: key, value: JSON.stringify(value) });
                } else {
                    rows.push({ field: key, value: String(value) });
                }
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

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
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

            {/* Analysis Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-blue-500">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                        <BarChart3 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Confidence Score</p>
                        <p className="text-xl font-bold text-white">{(result.confidenceScore * 100).toFixed(1)}%</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-purple-500">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Fields Extracted</p>
                        <p className="text-xl font-bold text-white">{gridData.length}</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-orange-500">
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                        <Clock className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Processed On</p>
                        <p className="text-sm font-bold text-white">{new Date(result.extractedAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Split View Container */}
            <div className="glass-panel overflow-hidden">
                <div className="border-b border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setView('table')}
                            className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${view === 'table' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <TableIcon className="w-4 h-4" />
                            Data Table
                        </button>
                        <button
                            onClick={() => setView('json')}
                            className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${view === 'json' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <FileJson className="w-4 h-4" />
                            JSON Trace
                        </button>
                        <button
                            onClick={() => setView('raw')}
                            className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${view === 'raw' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <FileText className="w-4 h-4" />
                            Raw Text
                        </button>
                    </div>

                    {result.unclearFields && result.unclearFields !== '[]' && (
                        <div className="flex items-center gap-2 text-orange-400 text-xs font-bold animate-pulse">
                            <AlertCircle className="w-4 h-4" />
                            Review Items Detected
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-[600px]">
                    {/* Left Panel: Image Viewer */}
                    <div className="border-r border-white/5 flex flex-col h-full bg-black/20">
                        <div className="p-3 flex items-center gap-2 bg-white/5 border-b border-white/5">
                            <ImageIcon className="w-3 h-3 text-gray-500" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Source Image</span>
                        </div>
                        <div className="flex-1 relative overflow-hidden group p-4">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt="Source Form"
                                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">
                                    Source image not available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Data View */}
                    <div className="flex flex-col h-full overflow-hidden">
                        {view === 'table' ? (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="ag-theme-quartz-dark flex-1 w-full">
                                    <AgGridReact
                                        rowData={gridData}
                                        columnDefs={[
                                            { field: 'field', headerName: 'Property', flex: 1.5, cellStyle: { fontWeight: '600' } },
                                            {
                                                field: 'value', headerName: 'Extracted Value', flex: 2, cellStyle: (params) => ({
                                                    color: params.data.confidence === 'low' ? '#f97316' : '#60a5fa',
                                                    fontWeight: '500'
                                                })
                                            },
                                            {
                                                field: 'confidence',
                                                headerName: 'Confidence',
                                                width: 120,
                                                cellRenderer: (params) => {
                                                    if (!params.value) return null;
                                                    const colors = {
                                                        high: 'bg-green-500/10 text-green-500 border-green-500/20',
                                                        medium: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
                                                        low: 'bg-red-500/10 text-red-500 border-red-500/20'
                                                    };
                                                    return (
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${colors[params.value] || ''}`}>
                                                            {params.value}
                                                        </span>
                                                    );
                                                }
                                            }
                                        ]}
                                        defaultColDef={{ sortable: true, filter: true, resizable: true }}
                                    />
                                </div>
                                {structuredData.tables && structuredData.tables.length > 0 && (
                                    <div className="border-t border-white/10 bg-[#050510] p-4 space-y-4 max-h-[40%] overflow-auto custom-scrollbar">
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
                            <div className="bg-[#050510] h-full overflow-auto p-6 custom-scrollbar font-mono text-sm leading-relaxed">
                                <pre className="text-blue-200/80">
                                    {JSON.stringify(structuredData, null, 2)}
                                </pre>
                            </div>
                        ) : (
                            <div className="bg-[#050510] h-full overflow-auto p-6 custom-scrollbar font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-400 italic">
                                {result.rawText || "No raw text available for this document."}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
