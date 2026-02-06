import React, { useState, useRef } from 'react';
import { formService } from '../services/api';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

export default function FileUpload({ onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setStatus(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setStatus(null);
        try {
            const response = await formService.upload(file);
            setStatus({ type: 'success', message: 'File uploaded and processing started!' });
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setTimeout(() => onUploadSuccess(response.data), 1500);
        } catch (err) {
            setStatus({ type: 'error', message: err.response?.data?.message || 'Upload failed. Please try again.' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="glass-panel p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                Upload New Form
            </h2>

            <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-10 transition-all cursor-pointer group flex flex-col items-center justify-center gap-4
                    ${file ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}
                    ${uploading ? 'pointer-events-none opacity-60' : ''}`}
            >
                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                />

                {!file ? (
                    <>
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
                            <Upload className="w-8 h-8 text-gray-400 group-hover:text-white" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-medium mb-1">Click to upload or drag & drop</p>
                            <p className="text-sm text-gray-500">Supports JPG, PNG or PDF (max 10MB)</p>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3 animate-fade-in">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                            <FileText className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-medium">{file.name}</p>
                            <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 bg-dark-bg/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4 z-10">
                        <div className="relative">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            <div className="absolute inset-0 animate-ping bg-blue-500/20 rounded-full" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-bold text-lg">Scanning Form...</p>
                            <p className="text-sm text-gray-400">Our AI Agent is processing your data</p>
                        </div>
                    </div>
                )}
            </div>

            {status && (
                <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <p className="text-sm font-medium">{status.message}</p>
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="primary-btn w-full mt-8"
            >
                Extract Data Now
            </button>
        </div>
    );
}
