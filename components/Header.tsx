
import React from 'react';
import type { Persona } from '../types';
import { PERSONAS } from '../constants';

interface HeaderProps {
    selectedPersona: Persona;
    onPersonaChange: (persona: Persona) => void;
}

const Header: React.FC<HeaderProps> = ({ selectedPersona, onPersonaChange }) => {
    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedPersona = PERSONAS.find(p => p.name === event.target.value);
        if (selectedPersona) {
            onPersonaChange(selectedPersona);
        }
    };

    return (
        <header className="bg-white p-4 shadow-sm flex justify-between items-center border-b border-gray-200">
            <h1 className="text-xl font-bold text-blue-600">PersonaCraft AI</h1>
            <div className="flex items-center space-x-2">
                <label htmlFor="persona-select" className="text-sm font-medium text-gray-600">Persona:</label>
                <select
                    id="persona-select"
                    value={selectedPersona.name}
                    onChange={handleSelectChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                >
                    {PERSONAS.map(persona => (
                        <option key={persona.name} value={persona.name}>
                            {persona.name}
                        </option>
                    ))}
                </select>
            </div>
        </header>
    );
};

export default Header;