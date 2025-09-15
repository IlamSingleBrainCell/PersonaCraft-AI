import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ChatMessageComponent from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ArtifactsSidebar from './components/ArtifactsSidebar';
import WelcomeScreen from './components/WelcomeScreen';
import { streamMessageToGemini } from './services/geminiService';
import type { Agent, ChatMessage, ChatMessageFile, Artifact } from './types';
import { AGENTS } from './constants';

// Helper functions for agent avatar
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


const App: React.FC = () => {
    const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS[0]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const connectorsOff = { webSearch: false, jira: false, confluence: false, github: false, bitbucket: false };

    const handleSuggestedQuestionClick = (question: string) => {
        handleSendMessage(question, [], connectorsOff);
    };

    const handleCreateArtifact = (content: string) => {
        const newArtifact: Artifact = {
            id: `artifact-${Date.now()}`,
            title: content.substring(0, 40) + (content.length > 40 ? '...' : ''),
            content: content,
        };
        setArtifacts(prev => [newArtifact, ...prev]);
    };

    const handleDeleteArtifact = (id: string) => {
        setArtifacts(prev => prev.filter(a => a.id !== id));
    };


    const handleSendMessage = async (text: string, files: ChatMessageFile[], connectors: { [key: string]: boolean }) => {
        if (!text.trim() && files.length === 0) return;
        
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text,
            files,
        };
        
        const modelMessageId = (Date.now() + 1).toString();
        const modelMessagePlaceholder: ChatMessage = {
            id: modelMessageId,
            role: 'model',
            text: '',
            sources: [],
            suggestedQuestions: []
        };
        
        setMessages(prev => [...prev, userMessage, modelMessagePlaceholder]);
        setIsLoading(true);
        setError(null);

        try {
            const stream = streamMessageToGemini(text, selectedAgent.description, connectors.webSearch, files);
            let fullText = '';
            
            for await (const chunk of stream) {
                fullText += chunk.text;
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === modelMessageId
                            ? {
                                ...msg,
                                text: fullText,
                                sources: chunk.sources && chunk.sources.length > 0 ? chunk.sources : msg.sources,
                            }
                            : msg
                    )
                );
            }
             // Post-streaming processing for suggested questions
            const lines = fullText.split('\n');
            const suggestions = lines
                .filter(line => line.startsWith('SUGGESTION:'))
                .map(line => line.replace('SUGGESTION:', '').trim());
            const cleanText = lines.filter(line => !line.startsWith('SUGGESTION:')).join('\n').trim();

            setMessages(prev =>
                prev.map(msg =>
                    msg.id === modelMessageId
                        ? { ...msg, text: cleanText, suggestedQuestions: suggestions }
                        : msg
                )
            );

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
            setError(`Failed to get response: ${errorMessage}`);
             setMessages(prev =>
                prev.map(msg =>
                    msg.id === modelMessageId
                        ? { ...msg, text: `Sorry, something went wrong. ${errorMessage}` }
                        : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-white text-gray-800">
            <ArtifactsSidebar 
                artifacts={artifacts} 
                onDeleteArtifact={handleDeleteArtifact}
            />
            <div className="flex flex-col flex-1">
                <Header selectedAgent={selectedAgent} onAgentChange={setSelectedAgent} />
                <main className="flex-1 overflow-y-auto p-4 flex flex-col">
                    {messages.length === 0 ? (
                        <WelcomeScreen onPromptClick={(prompt) => handleSendMessage(prompt, [], connectorsOff)} />
                    ) : (
                        <div className="space-y-4">
                            {messages.map(msg => (
                                <ChatMessageComponent 
                                    key={msg.id} 
                                    message={msg} 
                                    agent={selectedAgent}
                                    onSuggestedQuestionClick={handleSuggestedQuestionClick}
                                    onCreateArtifact={handleCreateArtifact}
                                />
                            ))}
                            {isLoading && messages[messages.length - 1]?.role === 'model' && !messages[messages.length - 1]?.text && (
                                 <div className="flex items-start gap-4 p-4">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getAgentColor(selectedAgent.name)} flex items-center justify-center`}>
                                        <span className="text-sm font-bold text-white">{getInitials(selectedAgent.name)}</span>
                                    </div>
                                    <div className="max-w-xl rounded-xl px-5 py-3 shadow-md bg-gray-200 flex items-center space-x-2">
                                         <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-0"></span>
                                         <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200"></span>
                                         <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-400"></span>
                                    </div>
                                </div>
                            )}
                             {error && (
                                <div className="flex justify-center">
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg">
                                        {error}
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    )}
                </main>
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            </div>
        </div>
    );
};

export default App;