document.addEventListener('DOMContentLoaded', async function() {
    // ========== CHECK IF USER ALREADY HAS AN ONGOING SESSION ==========
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();

    if (!session) {
        console.log("No active session found. Redirecting to login...");
        window.location.href = 'login.html';
        return;
    }

    // ========== FETCH PROFILE DATA ==========
    const { data: profile, error: profileError } = await window.supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();

    if (profileError || !profile) {
        console.error("Error fetching profile:", profileError);
        window.profile = {full_name: 'Student'}; // fallback
    } else {
        window.profile = profile;
    }
    
    window.dispatchEvent(new CustomEvent('profileReady'));
});

// ========== DATA FETCHING ==========
async function fetchNotices() {
    const { data, error } = await window.supabaseClient
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) console.error('Error fetching notices:', error);
    return data || [];
}

async function fetchClubs() {
    // Fetch departments from database
    const { data, error } = await window.supabaseClient
        .from('department')
        .select('*');

    if (error) console.error('Error fetching departments:', error);
    return data || [];
}

async function fetchEvents() {
    const { data, error } = await window.supabaseClient
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) console.error('Error fetching events:', error);
    return data || [];
}

async function fetchRecents() {
    const { data, error } = await window.supabaseClient
        .from('department_posts')
        .select('*')
        .order('date', { ascending: false })
        .limit(10);

    if (error) console.error('Error fetching recents:', error);
    return data || [];
}

// ========== RENDERING LOGIC ==========
function renderNotices(notices) {
    const container = document.getElementById('announcements-container');
    if (!container) return; 

    container.innerHTML = ''; 

    notices.forEach(notice => {
        const deptInfo = window.DEPT_MAP[notice.department_key] || { color: '#94a3b8' };
        const color = deptInfo.color;
        const images = [notice.image_url].filter(img => img); 

        const item = document.createElement('div');
        item.className = 'notice-item';
        item.id = 'notice-item-' + notice.id;

        const button = document.createElement('button');
        button.innerHTML = `
            <small class="notice-dept-tag" style="color: ${color};">${notice.department_key || 'OFFICIAL'}</small>
            <p class="notice-text-preview">${window.checkStringLength(notice.content, 50)}</p>
        `;

        button.addEventListener('click', (e) => {
            e.preventDefault();
            window.openPostModal(notice, images, true);
        });

        item.appendChild(button);
        container.appendChild(item);
    });
}

function renderClubs(clubs) {
    const container = document.getElementById('department-container');
    if (!container) return;

    container.innerHTML = '';

    // Create a reverse map for names to IDs
    const nameToId = {};
    Object.keys(window.DEPT_MAP).forEach(id => {
        nameToId[window.DEPT_MAP[id].name] = id;
    });

    clubs.forEach(club => {
        const deptId = nameToId[club.text] || 'JPIA';
        const color = window.DEPT_MAP[deptId]?.color || '#d8d8d8';

        const button = document.createElement('button');
        button.className = "department-button tag";
        button.style.backgroundColor = color;

        button.textContent = club.text;
        button.onclick = () => window.location.href = `department.html?dept=${deptId}`;

        container.appendChild(button);
    });
}

function renderRecents(recents) {
    const container = document.getElementById('events-area-container');
    if (!container) return;

    if (!recents || recents.length === 0) {
        container.innerHTML = `<p class="no-data-msg">No recent updates.</p>`;
        return;
    }

    container.innerHTML = '';
    const track = document.createElement('div');
    track.className = 'slider-track';

    recents.filter(r => r.image_1).forEach(item => {
        const slide = document.createElement('div');
        slide.className = 'hero-slide';
        slide.innerHTML = `
            <img src='${item.image_1}' class="events-bg">
            <div class="hero-content">
                <span class="tag hero-tag-recently">Recently</span>
                <h3 class="hero-dept-title">${item.department}</h3>
                <p class="hero-date">${new Date(item.date).toLocaleDateString()}</p>
            </div>`;
        track.appendChild(slide);
    });

    container.appendChild(track);
}

function renderEvents(events) {
    const container = document.getElementById('main-hero-area');
    if (!container) return;

    if (!events || events.length === 0) {
        container.innerHTML = `<img src="../images/wickedbackground(1).svg" class="hero-bg" alt="NCBA">`;
        return;
    }

    container.innerHTML = '';
    const track = document.createElement('div');
    track.className = 'slider-track';

    events.forEach(event => {
        const slide = document.createElement('div');
        slide.className = 'hero-slide';
        slide.innerHTML = `
            <img src="${event.image_url || '../images/wickedbackground(1).svg'}" class="hero-bg" alt="${event.header}">
            <div class="hero-content">
                <span class="tag">Featured</span>
                <h2 class="hero-header">${event.header}</h2>
                <p class="hero-subheader">${event.subheader}</p>
            </div>
        `;
        track.appendChild(slide);
    });

    container.appendChild(track);
}

// ========== INITIALIZATION ==========
async function init() {
    console.log("Initializing Dashboard...");
    const [notices, clubs, events, recents] = await Promise.all([
        fetchNotices(), fetchClubs(), fetchEvents(), fetchRecents()
    ]);

    renderNotices(notices);
    renderClubs(clubs);
    renderEvents(events);
    renderRecents(recents);
}

// Real-time Subscriptions
const setupSubscriptions = () => {
    window.supabaseClient
        .channel('dashboard-notices')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices' }, payload => {
            const notice = payload.new;
            showPopUpAnnouncement('New Announcement', notice.content, notice);
            fetchNotices().then(renderNotices);
        })
        .subscribe();

    window.supabaseClient
        .channel('dashboard-posts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'department_posts' }, payload => {
            const post = payload.new;
            showPopUpAnnouncement(post.department, post.content, post);
        })
        .subscribe();
};

function showPopUpAnnouncement(title, message, data) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const deptColor = window.DEPT_MAP[data.department_key]?.color || 'var(--accent-primary)';

    toast.className = 'toast-card';
    toast.style.borderLeftColor = deptColor;

    toast.innerHTML = `
        <strong class="toast-title">📢 ${title}</strong>
        <p class="toast-msg">${window.checkStringLength(message, 40)}</p>
    `;

    toast.onclick = () => {
        const images = [data.image_url, data.image_1, data.image_2, data.image_3, data.image_4, data.image_5].filter(img => img);
        window.openPostModal(data, images, !!data.created_at);
    };

    container.appendChild(toast);
    setTimeout(() => toast.style.transform = 'translateX(0)', 10);

    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 6000);
}
init();
setupSubscriptions();
