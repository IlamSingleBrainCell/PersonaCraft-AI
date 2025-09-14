
import React, { useState, useRef } from 'react';
import type { ChatMessageFile } from '../types';
import { PaperclipIcon, SendIcon, CloseIcon, GlobeIcon } from './IconComponents';

interface ChatInputProps {
    onSendMessage: (text: string, files: ChatMessageFile[], useWebSearch: boolean) => void;
    isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
    const [text, setText] = useState('');
    const [files, setFiles] = useState<ChatMessageFile[]>([]);
    const [useWebSearch, setUseWebSearch] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const MAX_FILES = 10;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files ?? []);
        if (selectedFiles.length === 0) return;

        const totalFiles = files.length + selectedFiles.length;
        if (totalFiles > MAX_FILES) {
            alert(`You can only upload a maximum of ${MAX_FILES} files.`);
            return;
        }

        const newFilesPromises = selectedFiles.map(file => {
            return new Promise<ChatMessageFile>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) {
                        resolve({
                            name: file.name,
                            type: file.type,
                            data: reader.result as string,
                        });
                    } else {
                        reject(new Error("Failed to read file."));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        Promise.all(newFilesPromises).then(newlyReadFiles => {
            setFiles(prev => [...prev, ...newlyReadFiles]);
        }).catch(error => {
            console.error("Error reading files:", error);
            alert("There was an error processing your files.");
        });
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = () => {
        if ((text.trim() || files.length > 0) && !isLoading) {
            onSendMessage(text, files, useWebSearch);
            setText('');
            setFiles([]);
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const acceptedFileTypes = "image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv";

    return (
        <div className="p-4 bg-white border-t border-gray-200">
             {files.length > 0 && (
                <div className="pb-2 flex flex-wrap gap-2">
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center bg-gray-200 px-3 py-1 rounded-full text-sm">
                            <span className="max-w-xs truncate">{file.name}</span>
                            <button onClick={() => handleRemoveFile(index)} className="ml-2 text-gray-500 hover:text-gray-800">
                                <CloseIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="relative bg-gray-100 rounded-xl p-2 flex items-center gap-2">
                <button 
                    onClick={handleAttachClick} 
                    className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                    aria-label="Attach file"
                    disabled={files.length >= MAX_FILES}
                >
                    <PaperclipIcon />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={acceptedFileTypes}
                    multiple
                />
                
                <button
                    onClick={() => setUseWebSearch(!useWebSearch)}
                    className={`p-2 rounded-full transition-colors ${useWebSearch ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-blue-500'}`}
                    title={useWebSearch ? 'Web Search Enabled' : 'Enable Web Search'}
                >
                    <GlobeIcon className="w-5 h-5" />
                </button>

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message or attach a file..."
                    className="flex-grow bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none resize-none"
                    rows={1}
                    disabled={isLoading}
                />

                <button
                    onClick={handleSend}
                    disabled={isLoading || (!text.trim() && files.length === 0)}
                    className="p-2 rounded-full bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
                    aria-label="Send message"
                >
                    <SendIcon />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;