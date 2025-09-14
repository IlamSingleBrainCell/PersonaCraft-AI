import React from 'react';
import type { User } from '../types';
import { GitHubIcon, UpgradeIcon, ChevronDownIcon, GoogleIcon } from './IconComponents';
import * as authService from '../services/authService';

interface AuthProps {
    user: User | null;
    onLogout: () => void;
}

const Auth: React.FC<AuthProps> = ({ user, onLogout }) => {
    
    if (user) {
        return (
            <div className="mt-auto pt-4 border-t border-gray-200">
                <div className="flex items-start justify-center text-center mb-4 space-x-4">
                    <div className="relative">
                        <div 
                            className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center cursor-pointer group"
                            onClick={onLogout} 
                            title="Click to Logout"
                        >
                           <img 
                                src={user.avatarUrl} 
                                alt="User Avatar"
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                        <span className="absolute bottom-1 right-0 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-md border-2 border-gray-50">
                            pro
                        </span>
                    </div>
                    <div className="flex-grow text-left pt-2">
                        <p className="font-semibold text-gray-700 -mt-1 truncate">{user.name}</p>
                        <p className="text-sm text-gray-500">Account</p>
                    </div>
                     <div className="pt-5">
                         <ChevronDownIcon className="w-5 h-5 text-gray-500 cursor-pointer"/>
                     </div>
                </div>
                <button className="w-full flex flex-col items-center justify-center py-3 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center mb-1">
                        <UpgradeIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium" style={{color: '#00474b'}}>Upgrade</span>
                </button>
            </div>
        );
    }

    return (
        <div className="mt-auto pt-4 border-t border-gray-200 space-y-2">
            <button
                onClick={authService.loginWithGoogle}
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm font-semibold border border-gray-300"
            >
                <GoogleIcon className="w-5 h-5" />
                Login with Google
            </button>
            <button
                onClick={authService.loginWithGitHub}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-2 rounded-md hover:bg-gray-900 transition-colors text-sm font-semibold"
            >
                <GitHubIcon className="w-5 h-5" />
                Login with GitHub
            </button>
        </div>
    );
};

export default Auth;
