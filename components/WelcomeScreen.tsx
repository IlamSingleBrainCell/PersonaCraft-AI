
import React from 'react';
import { BotIcon } from './IconComponents';

interface WelcomeScreenProps {
    onPromptClick: (prompt: string) => void;
}

const examplePrompts = [
    "Draft a user story for a new login feature.",
    "What are the key responsibilities of a QA Engineer?",
    "Explain the technical challenges of implementing a real-time chat application.",
    "Generate a list of potential risks for a new e-commerce website launch."
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPromptClick }) => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <BotIcon className="w-10 h-10 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to PersonaCraft AI</h1>
            <p className="text-gray-500 max-w-lg mb-8">
                Select an agent from the dropdown above and start a conversation. I can help you with requirements, technical designs, test cases, and more.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                {examplePrompts.map((prompt, index) => (
                    <button
                        key={index}
                        onClick={() => onPromptClick(prompt)}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-blue-300 transition-all text-left"
                    >
                        <p className="font-semibold text-gray-700">{prompt}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WelcomeScreen;