import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessageFile } from '../types';
import { PaperclipIcon, SendIcon, CloseIcon, TuneIcon, GlobeIcon, JiraIcon, ConfluenceIcon, GitHubIcon, BitbucketIcon } from './IconComponents';

interface ChatInputProps {
    onSendMessage: (text: string, files: ChatMessageFile[], connectors: { [key: string]: boolean }) => void;
    isLoading: boolean;
}

const ToggleSwitch: React.FC<{ checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
    </label>
);

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
    const [text, setText] = useState('');
    const [files, setFiles] = useState<ChatMessageFile[]>([]);
    const [isConnectorsMenuOpen, setIsConnectorsMenuOpen] = useState(false);
    const [connectors, setConnectors] = useState({
        webSearch: false,
        jira: false,
        confluence: false,
        github: false,
        bitbucket: false,
    });
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const MAX_FILES = 10;
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsConnectorsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

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
            onSendMessage(text, files, connectors);
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
    
    const handleConnectorToggle = (connectorName: keyof typeof connectors) => {
        setConnectors(prev => ({ ...prev, [connectorName]: !prev[connectorName] }));
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
                
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsConnectorsMenuOpen(!isConnectorsMenuOpen)}
                        className={`p-2 rounded-full transition-colors ${Object.values(connectors).some(v => v) ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-blue-500'}`}
                        title="Tools and Connectors"
                    >
                        <TuneIcon className="w-5 h-5" />
                    </button>
                    {isConnectorsMenuOpen && (
                         <div className="absolute bottom-full left-0 mb-2 w-72 bg-gray-800 text-white rounded-lg shadow-lg z-10 p-2 space-y-1">
                            <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700">
                                <div className="flex items-center gap-3">
                                    <GlobeIcon className="w-5 h-5 text-gray-300"/>
                                    <span className="text-sm font-medium">Web search</span>
                                </div>
                                <ToggleSwitch checked={connectors.webSearch} onChange={() => handleConnectorToggle('webSearch')} />
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700">
                                <div className="flex items-center gap-3">
                                    <JiraIcon />
                                    <span className="text-sm font-medium">Jira</span>
                                </div>
                                <ToggleSwitch checked={connectors.jira} onChange={() => handleConnectorToggle('jira')} />
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700">
                                <div className="flex items-center gap-3">
                                    <ConfluenceIcon />
                                    <span className="text-sm font-medium">Confluence</span>
                                </div>
                                <ToggleSwitch checked={connectors.confluence} onChange={() => handleConnectorToggle('confluence')} />
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700">
                                <div className="flex items-center gap-3">
                                    <GitHubIcon className="w-5 h-5 text-gray-300"/>
                                    <span className="text-sm font-medium">GitHub</span>
                                </div>
                                <ToggleSwitch checked={connectors.github} onChange={() => handleConnectorToggle('github')} />
                            </div>
                             <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700">
                                <div className="flex items-center gap-3">
                                    <BitbucketIcon />
                                    <span className="text-sm font-medium">Bitbucket</span>
                                </div>
                                <ToggleSwitch checked={connectors.bitbucket} onChange={() => handleConnectorToggle('bitbucket')} />
                            </div>
                            <div className="border-t border-gray-600 my-1 mx-[-8px]"></div>
                            <button className="w-full text-left p-2 rounded-md text-sm font-medium hover:bg-gray-700 text-gray-300 opacity-50 cursor-not-allowed">+ Add connectors</button>
                            <button className="w-full text-left p-2 rounded-md text-sm font-medium hover:bg-gray-700 text-gray-300 opacity-50 cursor-not-allowed">Manage connectors</button>
                         </div>
                    )}
                </div>

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