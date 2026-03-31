// Social Media Feed Logic for social-v2.html
// Updated for correct infinite scroll behavior and state management

// Variables for infinite scrolling
window.currentPostOffset = 0;
window.isFetchingPosts = false;
window.hasMorePosts = true;
const POSTS_PER_PAGE = 20;

window.renderEvents = function (events) { renderHeroAnnouncement(events); };
window.renderRecents = function (recents) { renderRecently(recents); };

// Profile ready listener for index.js integration
window.addEventListener('profileReady', () => {
    initSocial();
});

window.setupInfiniteScroll = function () {
    const feedContainer = document.getElementById('social-feed-container');
    if (!feedContainer) return;

    let loader = document.getElementById('feed-loader-element');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'feed-loader-element';
        loader.style.cssText = 'text-align: center; padding: 20px; color: var(--v2-text-dim); width: 100%; font-size: 0.9rem;';
        feedContainer.appendChild(loader);
    }

    const options = {
        root: feedContainer,
        rootMargin: '200px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        const target = entries[0];
        if (target.isIntersecting && !window.isFetchingPosts && window.hasMorePosts) {
            console.log("Infinite scroll triggered...");
            window.renderSocialFeed(false);
        }
    }, options);

    observer.observe(loader);
};

async function initSocial() {
    // Ensure we only init once
    if (window.socialInitialized) return;
    window.socialInitialized = true;

    console.log("Initializing Social V2...");

    // 1. Handle User Profile Header
    const profileName = window.profile ? window.profile.full_name : 'Student';
    const userInitial = document.getElementById('user-initial');
    const userFirstName = document.getElementById('user-firstname');
    const userFullName = document.getElementById('user-fullname');

    if (userInitial) userInitial.textContent = profileName.charAt(0);
    if (userFirstName) userFirstName.textContent = profileName.split(' ')[0];
    if (userFullName) userFullName.textContent = profileName;

    // 2. Load Main Feed (Initial batch)
    await window.renderSocialFeed(true);

    // 3. Setup infinite scroll after initial load
    window.setupInfiniteScroll();
}

window.renderSocialFeed = async function (isInitialLoad = true) {
    const feedContainer = document.getElementById('social-feed-container');
    let loader = document.getElementById('feed-loader-element');
    if (!feedContainer) return;

    if (isInitialLoad) {
        window.currentPostOffset = 0;
        window.hasMorePosts = true;
        feedContainer.innerHTML = '';
        // Re-create loader if cleared
        if (loader) feedContainer.appendChild(loader);
    }

    if (window.isFetchingPosts || !window.hasMorePosts) return;

    window.isFetchingPosts = true;
    loader = document.getElementById('feed-loader-element');

    try {
        const from = window.currentPostOffset;
        const to = from + POSTS_PER_PAGE - 1;

        const { data: feed, error } = await window.supabaseClient
            .from('unified_social_feed')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        if (feed.length < POSTS_PER_PAGE) {
            window.hasMorePosts = false;
            if (loader) loader.textContent = 'You have caught up on all posts!';
        } else {
            if (loader) loader.textContent = 'Loading...';
        }

        window.currentPostOffset += feed.length;

        // Fetch likes
        let deptLikes = [];
        let userPostLikes = [];
        const userObj = window.currentUser || (await window.supabaseClient.auth.getUser()).data?.user;
        const currentUserId = userObj ? userObj.id : null;

        if (currentUserId && feed.length > 0) {
            const deptPostIds = feed.filter(p => p.type === 'dept').map(p => p.id.toString());
            const userPostIds = feed.filter(p => p.type === 'user').map(p => p.id.toString());

            if (deptPostIds.length > 0) {
                const { data: dLikes } = await window.supabaseClient
                    .from('post_likes')
                    .select('post_id')
                    .in('post_id', deptPostIds)
                    .eq('user_id', currentUserId);
                deptLikes = dLikes ? dLikes.map(l => l.post_id.toString()) : [];
            }

            if (userPostIds.length > 0) {
                const { data: uLikes } = await window.supabaseClient
                    .from('user_post_likes')
                    .select('post_id')
                    .in('post_id', userPostIds)
                    .eq('user_id', currentUserId);
                userPostLikes = uLikes ? uLikes.map(l => l.post_id.toString()) : [];
            }
        }

        // Render posts
        feed.forEach(post => {
            post.timestamp = new Date(post.created_at);
            const hasLiked = post.type === 'dept' ? deptLikes.includes(post.id.toString()) : userPostLikes.includes(post.id.toString());
            renderPostCard(post, feedContainer, hasLiked, currentUserId);
        });

        // Always move loader to the bottom
        if (loader) feedContainer.appendChild(loader);

    } catch (err) {
        console.error("Feed Error:", err);
        if (loader) loader.textContent = 'Failed to load posts.';
    } finally {
        window.isFetchingPosts = false;
    }
}


function renderPostCard(post, container, hasLiked, userId) {
    const postCard = document.createElement('div');
    postCard.className = 'v2-post-card';

    // const authorName = post.author_name || 'Student';
    const deptKey = post.department_key;
    const accentColor = window.DEPT_MAP[deptKey]?.color || 'var(--v2-green)';
    const isDept = post.type === 'dept';
    const authorName = isDept ? window.DEPT_MAP[deptKey].name : post.author_name || 'Student';

    postCard.style.setProperty('--post-accent', accentColor);
    const timeAgo = window.formatTimeAgo(post.timestamp);
    const images = [post.image_1, post.image_2, post.image_3, post.image_4, post.image_5].filter(img => img);

    const headerClickAction = !isDept && post.author_id
        ? `onclick="event.stopPropagation(); window.location.href='profile.html?uid=${post.author_id}'" style="cursor: pointer;"`
        : '';

    postCard.innerHTML = `
        <div class="v2-post-header" ${headerClickAction}>
            <div class="v2-post-avatar" style="box-shadow: 0 0 10px ${accentColor}44; border-color: ${accentColor};">
                ${authorName.substring(0, 1)}
            </div>
            <div class="v2-post-meta">
                <div class="v2-author-name" style="${!isDept ? 'text-decoration: underline transparent; transition: text-decoration 0.2s;' : ''}" onmouseover="this.style.textDecoration='${!isDept ? 'underline' : 'none'}'" onmouseout="this.style.textDecoration='none'">${authorName}</div>
                <div class="v2-post-time">${timeAgo}</div>
            </div>
        </div>
        <div class="v2-post-content">
            ${post.title ? `<h2 style="margin-top:0"> ${post.title} </h2>` : ''}
            <p>${post.content}</p>
            ${post.image_1 ? `<img src="${post.image_1}" alt="Post Image" class="v2-content-image" loading="lazy">` : ''}
        </div>
        <div class="v2-post-actions">
            <button class="v2-action-btn ${hasLiked ? 'active' : ''}" onclick="window.toggleLike(event, '${post.id}', '${post.type}')">
                <span class="v2-icon">❤</span>
                <span id="like-count-${post.id}">0</span>
            </button>
            <button class="v2-action-btn">
                <span class="v2-icon">💬</span>
                <span id="count-${post.id}">0</span>
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
        container.innerHTML = `<p style="padding:20px; font-size:0.8rem; color: #666;">No recent updates.</p>`;
        return;
    }

    container.innerHTML = '';
    const track = document.createElement('div');
    track.className = 'v2-slider-track';

    const validRecents = recents.filter(item => item.image_1);

    validRecents.forEach(item => {
        const slide = document.createElement('div');
        slide.className = 'v2-hero-slide';
        slide.innerHTML = `
            <img src="${item.image_1}" class="v2-slide-bg">
            <div class="v2-slide-content">
                <span class="v2-tag">Recent</span>
                <h3 style="margin:0">${item.department_key}</h3>
            </div>`;
        track.appendChild(slide);
    });

    container.appendChild(track);
}

function renderHeroAnnouncement(events) {
    const container = document.getElementById('main-hero-area');
    if (!container) return;

    if (!events || events.length === 0) {
        container.innerHTML = `<div class="v2-empty-hero" style="padding:20px; text-align:center;">Welcome back, ${window.profile?.full_name?.split(' ')[0] || 'User'}!</div>`;
        return;
    }

    container.innerHTML = '';
    const track = document.createElement('div');
    track.className = 'v2-slider-track';

    events.forEach(event => {
        const slide = document.createElement('div');
        slide.className = 'v2-hero-slide';
        slide.innerHTML = `
            <img src="${event.image_url || '../images/wickedbackground(1).svg'}" class="v2-slide-bg">
            <div class="v2-slide-content">
                <span class="v2-tag" style="background: var(--v2-green);">Featured</span>
                <h2 style="margin: 5px 0;">${event.header}</h2>
                <p style="font-size: 0.85rem; opacity: 0.9;">${event.subheader}</p>
            </div>
        `;
        track.appendChild(slide);
    });

    container.appendChild(track);
}

window.toggleLike = async function (event, postId, postType) {
    event.stopPropagation();
    const user = window.currentUser || (await window.supabaseClient.auth.getUser()).data.user;
    if (!user) return alert("Please log in to like posts.");

    const btn = event.currentTarget;
    const wasLiked = btn.classList.contains('active');

    if (wasLiked) {
        btn.classList.remove('active');
    } else {
        btn.classList.add('active');
    }

    const table = postType === 'dept' ? 'post_likes' : 'user_post_likes';
    const safeId = postType === 'dept' ? parseInt(postId) : postId;

    try {
        if (wasLiked) {
            await window.supabaseClient
                .from(table)
                .delete()
                .eq('post_id', safeId)
                .eq('user_id', user.id);
        } else {
            await window.supabaseClient
                .from(table)
                .insert({ post_id: safeId, user_id: user.id });
        }
    } catch (err) {
        console.error("Like toggle failed:", err);
    }

    await window.updateLikeDisplay(postId, postType);
}

window.updateLikeDisplay = async function (postId, postType = 'dept') {
    const table = postType === 'dept' ? 'post_likes' : 'user_post_likes';
    const safeId = postType === 'dept' ? parseInt(postId) : postId;

    const { count, error } = await window.supabaseClient
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('post_id', safeId);

    if (error) return;

    const countElement = document.getElementById(`like-count-${postId}`);
    if (countElement) {
        countElement.textContent = count || 0;
    }
}

window.updateCommentCountUI = async function (postId) {
    const { count } = await window.supabaseClient
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

    const countElement = document.getElementById(`count-${postId}`);
    if (countElement) countElement.textContent = count || 0;
}

function setupRealtimeSubscriptions() {
    const tables = ['department_posts', 'user_posts', 'post_likes', 'user_post_likes', 'post_comments'];

    tables.forEach(table => {
        window.supabaseClient
            .channel(`${table}-changes-v2`)
            .on('postgres_changes', { event: '*', schema: 'public', table: table }, (payload) => {
                if ((table === 'department_posts' || table === 'user_posts') && payload.eventType === 'INSERT') {
                    // Initial load refresh for new posts
                    window.renderSocialFeed(true);
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

document.addEventListener('DOMContentLoaded', () => {
    setupRealtimeSubscriptions();

    // If profile is already attached to window (from index.js fast load)
    if (window.profile) {
        initSocial();
    } else {
        // Fallback: wait for event but also setup loader
        window.setupInfiniteScroll();
    }
});
