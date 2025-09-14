
import React, { useState } from 'react';
import type { Artifact } from '../types';
import { DownloadIcon, TrashIcon, SearchIcon, CheckIcon, XIcon } from './IconComponents';

interface ArtifactsSidebarProps {
    artifacts: Artifact[];
    onDeleteArtifact: (id: string) => void;
}

const ArtifactsSidebar: React.FC<ArtifactsSidebarProps> = ({ artifacts, onDeleteArtifact }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDownload = (artifact: Artifact) => {
        const blob = new Blob([artifact.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${artifact.title.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDelete = (id: string) => {
        onDeleteArtifact(id);
        setDeletingId(null);
    }

    const filteredArtifacts = artifacts.filter(artifact =>
        artifact.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artifact.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <aside className="w-80 bg-gray-50 p-4 border-r border-gray-200 flex flex-col h-screen">
            <div className="flex-1 flex flex-col min-h-0">
                <h2 className="text-lg font-semibold text-blue-600 mb-4">Project Artifacts</h2>
                
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search artifacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-md py-2 pl-10 pr-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="text-gray-500" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {filteredArtifacts.length > 0 ? (
                        filteredArtifacts.map(artifact => (
                            <div key={artifact.id} className="bg-white p-3 rounded-lg group relative shadow-sm border border-gray-200">
                                <h3 className="font-semibold text-sm truncate pr-16">{artifact.title}</h3>
                                <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center space-x-2">
                                    {deletingId === artifact.id ? (
                                        <>
                                            <button onClick={() => handleDelete(artifact.id)} className="text-gray-500 hover:text-green-500" title="Confirm Delete">
                                                <CheckIcon />
                                            </button>
                                            <button onClick={() => setDeletingId(null)} className="text-gray-500 hover:text-red-500" title="Cancel">
                                                <XIcon />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                                            <button onClick={() => handleDownload(artifact)} className="text-gray-500 hover:text-blue-500" title="Download">
                                                <DownloadIcon />
                                            </button>
                                            <button onClick={() => setDeletingId(artifact.id)} className="text-gray-500 hover:text-red-500" title="Delete">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm text-center mt-4">No artifacts saved yet.</p>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default ArtifactsSidebar;
