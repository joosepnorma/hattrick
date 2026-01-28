
// Ensure Supabase client is available (loaded via CDN in HTML)
// Script expects config.js to be loaded before this script

async function checkAuth() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not loaded');
        return;
    }

    const { createClient } = supabase;
    const _supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

    try {
        const { data: { session }, error } = await _supabase.auth.getSession();
        if (error) throw error;

        if (!session) {
            throw new Error('No session');
        }

        // Show body content if authenticated
        document.body.classList.remove('invisible');
    } catch (e) {
        // Redirect to login page on error or no session
        const currentPath = window.location.pathname;
        let loginPath = 'login.html';

        if (currentPath.includes('/tools/') || currentPath.includes('/training/')) {
            loginPath = '../login.html';
        } else {
            loginPath = 'login.html';
        }

        window.location.href = loginPath;
    }
}

// Hide body immediately to prevent flash of content
const style = document.createElement('style');
style.innerHTML = 'body { visibility: hidden; }';
document.head.appendChild(style);

// Run check
checkAuth();

// Run check immediately
checkAuth();
