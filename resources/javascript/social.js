// Social Media Feed Logic for social.html

// 1. OVERRIDES: Ensure index.js uses these versions on the social page
window.renderEvents = function(events) { renderHeroAnnouncement(events); };
window.renderRecents = function(recents) { renderRecently(recents); };

window.addEventListener('profileReady', () => {
    initSocial();
});

async function initSocial() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    let userId = user ? user.id : null;
    
    // 1. Handle User Profile Header
    const profileName = window.profile ? window.profile.full_name : 'Student';
    const userInitial = document.getElementById('user-initial');
    const userFirstName = document.getElementById('user-firstname');
    
    if (userInitial) userInitial.textContent = profileName.charAt(0);
    if (userFirstName) userFirstName.textContent = profileName.split(' ')[0];

    // 2. Load Main Feed (Unified)
    await window.renderSocialFeed();
}

window.renderSocialFeed = async function() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    const userId = user ? user.id : null;
    
    const feedContainer = document.getElementById('social-feed-container');
    if (!feedContainer) return;

    // Fetch Department Posts
    const { data: deptPosts, error: deptError } = await window.supabaseClient
        .from('department_posts')
        .select('*')
        .order('date', { ascending: false });

    // Fetch User Posts - Including author profile info for dynamic colors
    const { data: userPosts, error: userError } = await window.supabaseClient
        .from('user_posts')
        .select(`*, profiles!user_posts_author_id_fkey(full_name, department)`)
        .order('created_at', { ascending: false });

    if (deptError) console.error("Error fetching dept posts:", deptError);
    if (userError) console.error("Error fetching user posts:", userError);

    let deptLikes = [];
    let userPostLikes = [];
    if (userId) {
        const { data: dLikes } = await window.supabaseClient.from('post_likes').select('post_id').eq('user_id', userId);
        deptLikes = dLikes ? dLikes.map(l => l.post_id) : [];

        const { data: uLikes } = await window.supabaseClient.from('user_post_likes').select('post_id').eq('user_id', userId);
        userPostLikes = uLikes ? uLikes.map(l => l.post_id) : [];
    }

    feedContainer.innerHTML = ''; 

    const combinedFeed = [
        ...(deptPosts || []).map(p => ({ ...p, type: 'dept', timestamp: new Date(p.date) })),
        ...(userPosts || []).map(p => ({ ...p, type: 'user', timestamp: new Date(p.created_at) }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    combinedFeed.forEach(post => {
        const hasLiked = post.type === 'dept' ? deptLikes.includes(post.id) : userPostLikes.includes(post.id);
        renderPostCard(post, feedContainer, hasLiked, userId);
    });
};

function renderPostCard(post, container, hasLiked, userId) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card bento-card';
    postCard.style.cursor = 'pointer';

    const isDept = post.type === 'dept';
    const authorName = isDept ? post.department : (post.profiles?.full_name || 'Student');
    const deptKey = isDept ? post.department : post.profiles?.department;
    const avatarBg = window.DEPT_MAP[deptKey]?.color || '#6366f1';
    
    const timeAgo = window.formatTimeAgo(post.timestamp);
    const images = [post.image_1, post.image_2, post.image_3, post.image_4, post.image_5].filter(img => img);

    postCard.innerHTML = `
        <div class="post-header">
            <div class="post-avatar" style="background: ${avatarBg}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                ${authorName.substring(0, 1)}
            </div>
            <div class="post-meta">
                <strong>${authorName}</strong>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${timeAgo}</span>
            </div>
        </div>
        <div class="post-content" style="margin-top: 15px;">
            <p style="font-size: 0.85rem; line-height: 1.5;">${post.content}</p>
            ${post.image_1 ? `<img src="${post.image_1}" alt="Post Image" class="post-image" style="width: 100%; border-radius: 12px; margin-top: 10px; max-height: 300px; object-fit: cover;">` : ''}
        </div>
        <div class="post-actions">
            <button onclick="window.toggleLike(event, '${post.id}', '${post.type}')">
                <span id="like-symbol-${post.id}" class="${hasLiked ? 'liked' : ''}">❤︎</span>
                <span class="like-count" id="like-count-${post.id}">0</span>
            </button>
            <button>
                <svg width="20" height="20" viewBox="0 0 25 25" style="fill: none; stroke: currentColor; stroke-width: 2;">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <span class="comment-count" id="count-${post.id}">0</span>
            </button>
        </div>
    `;

    postCard.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        window.openPostModal(post, images, false);
    });

    container.appendChild(postCard);
    
    window.updateLikeDisplay(post.id, post.type);
    window.updateCommentCountUI(post.id);
}

function renderRecently(recents) {
    const container = document.getElementById('recently-container');
    if (!container) return;
    
    if (!recents || recents.length === 0) {
        container.innerHTML = `<p style="padding:20px; font-size:0.8rem; color: var(--text-muted);">No recent updates.</p>`;
        return;
    }

    container.innerHTML = '';
    const track = document.createElement('div');
    track.className = 'slider-track';

    const validRecents = recents.filter(item => item.image_1);

    validRecents.forEach(item => {
        const slide = document.createElement('div');
        slide.className = 'hero-slide';
        slide.style.height = '100%';
        slide.innerHTML = `
            <img src="${item.image_1}" class="events-bg">
            <div class="hero-content" style="padding: 10px; flex-direction: column; justify-content: flex-end; height: 100%; background: linear-gradient(transparent, rgba(0,0,0,0.7));">
                <span class="tag" style="font-size: 0.6rem; margin-bottom: 5px;">Recently</span>
                <h3 style="margin: 0; color: white; font-size: 0.9rem;">${item.department}</h3>
                <p style="opacity: 0.7; font-size: 0.7rem; margin: 2px 0;">${new Date(item.date).toLocaleDateString()}</p>
            </div>`;
        track.appendChild(slide);
    });

    container.appendChild(track);

    if (validRecents.length > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'slider-btn prev';
        prevBtn.innerHTML = '←';
        prevBtn.style.scale = "0.7";
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'slider-btn next';
        nextBtn.innerHTML = '→';
        nextBtn.style.scale = "0.7";

        container.appendChild(prevBtn);
        container.appendChild(nextBtn);

        let currentIndex = 0;
        const totalSlides = validRecents.length;

        const updateSlider = () => {
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
        };

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex + 1) % totalSlides;
            updateSlider();
        });

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateSlider();
        });
    }
}

function renderHeroAnnouncement(events) {
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
        slide.style.height = '100%';
        slide.innerHTML = `
            <img src="${event.image_url || '../images/wickedbackground(1).svg'}" class="hero-bg" alt="${event.header}">
            <div class="hero-content" style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 20px; box-sizing: border-box; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); z-index: 2;">
                <span class="tag" style="font-size: 0.7rem; background: var(--accent-primary);">Featured</span>
                <h2 style="color: white; font-size: 1.1rem; margin: 8px 0;">${event.header}</h2>
                <p style="color: rgba(255,255,255,0.8); font-size: 0.8rem; margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${event.subheader}</p>
            </div>
        `;
        track.appendChild(slide);
    });

    container.appendChild(track);

    if (events.length > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'slider-btn prev';
        prevBtn.innerHTML = '←';
        prevBtn.style.scale = "0.7";
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'slider-btn next';
        nextBtn.innerHTML = '→';
        nextBtn.style.scale = "0.7";

        container.appendChild(prevBtn);
        container.appendChild(nextBtn);

        let currentIndex = 0;
        const totalSlides = events.length;

        const updateSlider = () => {
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
        };

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex + 1) % totalSlides;
            updateSlider();
        });

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateSlider();
        });
    }
}

window.toggleLike = async function(event, postId, postType) {
    event.stopPropagation();
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return alert('Please log in to like posts.');

    const table = postType === 'dept' ? 'post_likes' : 'user_post_likes';

    const { data: existingLike } = await window.supabaseClient
        .from(table)
        .select('post_id')
        .match({ post_id: postId, user_id: user.id })
        .maybeSingle();

    if (existingLike) {
        await window.supabaseClient
            .from(table)
            .delete()
            .match({ post_id: postId, user_id: user.id });
        document.getElementById(`like-symbol-${postId}`)?.classList.remove('liked');
    } else {
        await window.supabaseClient
            .from(table)
            .insert({ post_id: postId, user_id: user.id });
        document.getElementById(`like-symbol-${postId}`)?.classList.add('liked');
    }

    await window.updateLikeDisplay(postId, postType);
}

window.updateLikeDisplay = async function(postId, postType = 'dept') {
    const table = postType === 'dept' ? 'post_likes' : 'user_post_likes';
    const { count } = await window.supabaseClient
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

    const countElement = document.getElementById(`like-count-${postId}`);
    if (countElement) countElement.textContent = count || 0;
}

window.updateCommentCountUI = async function(postId) {
    const { count } = await window.supabaseClient
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

    const countElement = document.getElementById(`count-${postId}`);
    if (countElement) countElement.textContent = count || 0;
}

// Real-time Subscriptions
function setupRealtimeSubscriptions() {
    const tables = ['department_posts', 'user_posts', 'post_likes', 'user_post_likes', 'post_comments'];
    
    tables.forEach(table => {
        window.supabaseClient
            .channel(`${table}-changes`)
            .on('postgres_changes', { event: '*', schema: 'public', table: table }, (payload) => {
                if ((table === 'department_posts' || table === 'user_posts') && payload.eventType === 'INSERT') {
                    window.renderSocialFeed();
                } else if (table === 'post_likes' || table === 'user_post_likes') {
                    const postId = payload.new?.post_id || payload.old?.post_id;
                    const type = table === 'post_likes' ? 'dept' : 'user';
                    if (postId) window.updateLikeDisplay(postId, type);
                } else if (table === 'post_comments') {
                    const postId = payload.new?.post_id || payload.old?.post_id;
                    if (postId) {
                        window.updateCommentCountUI(postId);
                        if (typeof window.loadModalComments === 'function') window.loadModalComments(postId);
                    }
                }
            })
            .subscribe();
    });
}

// Initializing when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupRealtimeSubscriptions();
    if (window.profile) initSocial();
});
