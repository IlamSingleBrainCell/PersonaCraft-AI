
import React, { useRef } from 'react';
import type { ChatMessage, Agent } from '../types';
import { UserIcon, FileIcon, PdfIcon, SaveIcon } from './IconComponents';

interface ChatMessageProps {
    message: ChatMessage;
    agent: Agent;
    onSuggestedQuestionClick: (question: string) => void;
    onCreateArtifact: (content: string) => void;
}

const getInitials = (name: string): string => {
    const parts = name.split(/[\s/]+/);
    if (parts.length > 1 && parts[0] && parts[1]) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 
    'bg-rose-500'
];

const getAgentColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = hash & hash;
    return colors[Math.abs(hash) % colors.length] || 'bg-gray-500';
}


const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, agent, onSuggestedQuestionClick, onCreateArtifact }) => {
    const isUser = message.role === 'user';
    const messageRef = useRef<HTMLDivElement>(null);

    const handleExportPdf = () => {
        const localHtml2canvas = (window as any).html2canvas;
        const localJspdf = (window as any).jspdf;

        if (!localJspdf || !localJspdf.jsPDF || !localHtml2canvas) {
            alert('PDF generation library is not available.');
            console.error('jsPDF or html2canvas not found on window object.');
            return;
        }

        const { jsPDF } = localJspdf;
        const input = messageRef.current;
        if (!input) return;

        localHtml2canvas(input, {
            backgroundColor: '#e5e7eb', // bg-gray-200
            scale: 2,
        }).then((canvas: any) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`response-${message.id}.pdf`);
        });
    };

    return (
        <div className={`flex items-start gap-4 p-4 group ${isUser ? 'justify-end' : ''}`}>
            {!isUser && (
                 <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getAgentColor(agent.name)} flex items-center justify-center`}>
                    <span className="text-sm font-bold text-white">{getInitials(agent.name)}</span>
                </div>
            )}
            <div className="relative max-w-3xl w-full">
                <div ref={messageRef} className={`rounded-xl px-5 py-3 shadow-md ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                    {message.files && message.files.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                            {message.files.map((file, index) => (
                                <div key={index} className="bg-gray-100 p-2 rounded-lg">
                                    {file.type.startsWith('image/') ? (
                                        <img src={file.data} alt={file.name} className="max-w-xs max-h-48 rounded-lg object-contain" />
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <FileIcon className="w-5 h-5 flex-shrink-0" />
                                            <span className="text-sm truncate">{file.name}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="whitespace-pre-wrap">{message.text || <span className="animate-pulse">...</span>}</p>

                    {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-300">
                            <h3 className="text-xs font-semibold text-gray-500 mb-2">Sources</h3>
                            <ol className="list-decimal list-inside space-y-1">
                                {message.sources.map((source, index) => (
                                    <li key={index} className="text-sm">
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                                            {source.title || source.uri}
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                    {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-300">
                            <h3 className="text-xs font-semibold text-gray-500 mb-2">Suggested Questions</h3>
                            <div className="flex flex-wrap gap-2">
                                {message.suggestedQuestions.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => onSuggestedQuestionClick(question)}
                                        className="bg-gray-100 hover:bg-gray-300 text-gray-700 text-sm px-3 py-1 rounded-full transition-colors"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {!isUser && message.text && (
                    <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => onCreateArtifact(message.text)}
                            className="p-1.5 rounded-full bg-white/50 text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-all"
                            title="Save as Artifact"
                        >
                            <SaveIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={handleExportPdf}
                            className="p-1.5 rounded-full bg-white/50 text-gray-500 hover:text-gray-800 hover:bg-gray-200 transition-all"
                            title="Export as PDF"
                        >
                            <PdfIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
             {isUser && (
                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                </div>
            )}
        </div>
    );
};

export default ChatMessageComponent;