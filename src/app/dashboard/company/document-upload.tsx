"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Upload, Plus, FileText, X, Check, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    category: string;
    files: UploadedFile[];
    onAddFiles: (files: File[]) => void;
    onRemoveFile: (fileId: string) => void;
}

export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    uploadDate: Date;
    status: 'uploading' | 'completed' | 'error';
    progress: number;
}

export function DocumentUpload({ title, description, icon, category, files, onAddFiles, onRemoveFile }: DocumentUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        handleFiles(files);
        // Reset input value to allow uploading the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFiles = (files: File[]) => {
        const validFiles: File[] = [];

        files.forEach(file => {
            // Validate file type
            const validTypes = [
                'application/pdf',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!validTypes.includes(file.type)) {
                alert(`El archivo ${file.name} no es un tipo válido. Solo se aceptan PDF, Excel y Word.`);
                return;
            }

            // Validate file size (50MB)
            if (file.size > 50 * 1024 * 1024) {
                alert(`El archivo ${file.name} excede el tamaño máximo de 50MB.`);
                return;
            }

            validFiles.push(file);
        });

        if (validFiles.length > 0) {
            onAddFiles(validFiles);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl card-gradient-primary card-shimmer shadow-glow"
        >
            <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                    <p className="text-sm text-zinc-400">{description}</p>
                </div>
            </div>

            {/* Uploaded Files List */}
            {files.length > 0 && (
                <div className="mb-6 space-y-3">
                    <h4 className="text-sm font-medium text-zinc-400 mb-3">
                        Documentos Subidos ({files.length})
                    </h4>
                    <AnimatePresence>
                        {files.map((file: UploadedFile) => (
                            <motion.div
                                key={file.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-white/5 border border-white/10 rounded-lg p-4"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        {file.status === 'completed' ? (
                                            <Check className="w-5 h-5 text-primary" />
                                        ) : file.status === 'uploading' ? (
                                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                        ) : (
                                            <FileText className="w-5 h-5 text-zinc-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {file.name}
                                            </p>
                                            <button
                                                onClick={() => onRemoveFile(file.id)}
                                                className="flex-shrink-0 text-zinc-400 hover:text-red-400 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                                            <span>{formatFileSize(file.size)}</span>
                                            <span>•</span>
                                            <span>{formatDate(file.uploadDate)}</span>
                                        </div>
                                        {file.status === 'uploading' && (
                                            <div className="mt-2">
                                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-primary"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${file.progress}%` }}
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}



            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
            />
        </motion.div>
    );
}
