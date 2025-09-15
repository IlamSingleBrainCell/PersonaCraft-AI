
import React from 'react';
import type { Agent } from '../types';
import { AGENTS } from '../constants';

interface HeaderProps {
    selectedAgent: Agent;
    onAgentChange: (agent: Agent) => void;
}

const Header: React.FC<HeaderProps> = ({ selectedAgent, onAgentChange }) => {
    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedAgent = AGENTS.find(p => p.name === event.target.value);
        if (selectedAgent) {
            onAgentChange(selectedAgent);
        }
    };

    return (
        <header className="bg-white p-4 shadow-sm flex justify-between items-center border-b border-gray-200">
            <h1 className="text-xl font-bold text-blue-600">PersonaCraft AI</h1>
            <div className="flex items-center space-x-2">
                <label htmlFor="agent-select" className="text-sm font-medium text-gray-600">Agent:</label>
                <select
                    id="agent-select"
                    value={selectedAgent.name}
                    onChange={handleSelectChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                    {AGENTS.map(agent => (
                        <option key={agent.name} value={agent.name}>
                            {agent.name}
                        </option>
                    ))}
                </select>
            </div>
        </header>
    );
};

export default Header;