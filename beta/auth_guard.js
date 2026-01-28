
// Ensure Supabase client is available (loaded via CDN in HTML)
// Script expects config.js to be loaded before this script

async function checkAuth() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase client not loaded');
        return;
    }

    const { createClient } = supabase;
    const _supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);

    const { data: { session } } = await _supabase.auth.getSession();

    if (!session) {
        // Redirect to login page
        // Handle different depth levels: beta/index.html vs beta/tools/tool.html
        if (currentPath.includes('/tools/') || currentPath.includes('/training/')) {
            loginPath = '../login.html';
        } else {
            loginPath = 'login.html';
        }

        window.location.href = loginPath;
    }
}

// Run check immediately
checkAuth();
