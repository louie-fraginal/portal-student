const SUPABASE_URL = 'https://wmgiwnlzsrniwlahhfjl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_gHxe01ud_nzkYeoyYBCWiw_9LPFQ-mT';

// ========== INITIALIZE THE WINDOW.SUPABASE ==========
if (typeof supabase !== 'undefined') {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.error('Supabase library not loaded. Ensure CDN script is present.');
}

// ========== CENTRALIZED CHECK IF USER IS LOGGED IN.==========
async function checkAuth() {
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error || !session) {
            console.log("No active session found, redirecting...");
            if (!window.location.href.includes('login.html')) {
                window.location.href = 'login.html';
            }
        } else {
            document.body.style.display = 'block';
        }
    } catch (err) {
        console.error("Security Check Error:", err);
        if (!window.location.href.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
}
