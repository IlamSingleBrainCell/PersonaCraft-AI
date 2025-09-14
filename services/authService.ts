import type { User } from '../types';
import { REDIRECT_URI } from './oauthConfig';

const USER_STORAGE_KEY = 'personaCraftUser';

export const loginWithGoogle = () => {
    // This is a simulated login flow.
    // In a real app, this would redirect to Google's OAuth consent screen.
    // Here, we redirect back to our app with a fake access token in the URL hash
    // to mimic a successful authentication callback.
    const fakeCallbackUrl = new URL(REDIRECT_URI);
    fakeCallbackUrl.hash = 'access_token=SIMULATED_GOOGLE_TOKEN&token_type=Bearer&expires_in=3600';

    // Navigate the current frame instead of the top frame to avoid cross-origin security errors.
    window.location.href = fakeCallbackUrl.toString();
};

export const loginWithGitHub = () => {
    // This is a simulated login flow.
    // We redirect back to our app with a fake authorization code in the URL
    // to mimic a successful authentication callback.
    const fakeCallbackUrl = new URL(REDIRECT_URI);
    fakeCallbackUrl.searchParams.set('code', 'SIMULATED_GITHUB_CODE');
    
    // Navigate the current frame instead of the top frame to avoid cross-origin security errors.
    window.location.href = fakeCallbackUrl.toString();
};

export const handleOAuthCallback = async (): Promise<User | null> => {
    // --- Google Callback Handler ---
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const googleAccessToken = hashParams.get('access_token');

    if (googleAccessToken) {
        // Simulate a successful login to demonstrate the UI flow.
        // In a real app, you would use the access token to fetch user info from Google's API.
        const user: User = {
            name: 'Google User (Simulated)',
            avatarUrl: 'https://i.pravatar.cc/150?u=google-simulated',
            provider: 'google',
        };
        
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        // Clean the URL of auth tokens
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        return user;
    }

    // --- GitHub Callback Handler ---
    const searchParams = new URLSearchParams(window.location.search);
    const githubCode = searchParams.get('code');
    
    if (githubCode) {
        // In a real app, the backend would exchange this code for an access token.
        // Here, we just simulate a successful login to demonstrate the UI flow.
        const user: User = {
            name: 'GitHub User (Simulated)',
            avatarUrl: 'https://i.pravatar.cc/150?u=github-simulated',
            provider: 'github',
        };
        
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        // Clean the URL of auth tokens
        window.history.replaceState({}, document.title, window.location.pathname);
        return user;
    }

    return null;
};

export const getUser = (): User | null => {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (userJson) {
        try {
            return JSON.parse(userJson);
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            return null;
        }
    }
    return null;
};

export const logout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    // Reload to ensure all state is cleared
    window.location.href = window.location.origin;
};