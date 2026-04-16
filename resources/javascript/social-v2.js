// Social Media Feed Logic for social-v2.html
// Updated for correct infinite scroll behavior and state management

// Variables for infinite scrolling
window.currentPostOffset = 0;
window.isFetchingPosts = false;
window.hasMorePosts = true;
const POSTS_PER_PAGE = 20;

window.DEPT_MAP = {
    // Academic Organizations
    'JPIA': {
        name: 'Junior Philippine Institute of Accountants',
        shortName: 'JPIA',
        color: '#ef4444',
        intro: 'The premier organization for accountancy students at NCBA, dedicated to professional excellence and integrity in the field of accounting.',
        fb_link: 'https://web.facebook.com/jpia.ncbaf',
        image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1200'
    },
    'BSBA': {
        name: 'Business Administration',
        shortName: 'BSBA',
        color: '#3b82f6',
        intro: 'Shaping the next generation of business leaders and entrepreneurs through innovative management education and practical experience.',
        fb_link: 'https://web.facebook.com/profile.php?id=100054337128757',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200'
    },
    'ISSOC': {
        name: 'Information Systems Student Organization Council',
        shortName: 'ISSOC',
        color: '#785c88',
        intro: 'Advancing technological literacy and innovation within the Information Systems community at NCBA.',
        fb_link: 'https://web.facebook.com/ncba.issoc',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200'
    },
    'SABELA': {
        name: 'Society of AB & Education Students of Liberal Arts',
        shortName: 'SABELA',
        color: '#ec4899',
        intro: 'Promoting excellence in the arts, education, and social sciences, fostering a community of critical thinkers and educators.',
        fb_link: 'https://web.facebook.com/ncbasabela',
        image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1200'
    },
    'HM': {
        name: 'Hospitality Management',
        shortName: 'HM',
        color: '#f59e0b',
        intro: 'Training students for global careers in the hospitality and tourism industry with a focus on service excellence and culinary arts.',
        fb_link: 'https://web.facebook.com/ncbachmofficial',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200'
    },

    // Official Campus Units
    'ACADEMIC': {
        name: 'Academic Affairs',
        shortName: 'ACADEMIC',
        color: '#6366f1',
        intro: 'Official updates regarding academic schedules, policies, and curriculum.',
        image: 'https://images.unsplash.com/photo-1523050853064-85a17f009c5f?auto=format&fit=crop&q=80&w=1200'
    },
    'FACILITY': {
        name: 'Campus Facilities',
        shortName: 'FACILITY',
        color: '#ec4899',
        intro: 'Updates regarding campus infrastructure, maintenance, and room assignments.',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200'
    },
    'LIBRARY': {
        name: 'Library Services',
        shortName: 'LIBRARY',
        color: '#10b981',
        intro: 'Information about library hours, new resources, and study spaces.',
        image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=1200'
    },
    'CAMPUS WIDE': {
        name: 'Campus Wide',
        shortName: 'CAMPUS',
        color: '#64748b',
        intro: 'General announcements applicable to the entire NCBA community.',
        image: 'https://images.unsplash.com/photo-1541339907198-e08756ed8108?auto=format&fit=crop&q=80&w=1200'
    },
    'ANNOUNCEMENT': {
        name: 'Official Announcements',
        shortName: 'ANNOUNCEMENT',
        color: '#7bff83',
        intro: 'The official announcements from the National College Business and Arts Fairview.',
        fb_link: '',
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1200'
    }
};


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

    // Handle User Profile Header
    const profile = window.profile
    const userInitial = document.getElementById('user-initial');
    const userCoverPhoto = document.getElementById('user-cover-photo');
    const userFirstName = document.getElementById('user-firstname');
    const userFullName = document.getElementById('user-fullname');

    // // Populate profile avatar
    // if (profilePicture && profilePicture !== 'null' & profilePicture !== 'undefined') {
    //     userInitial.innerHTML = `<img src="${profilePicture}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    // } else {
    //     userInitial.textContent = profileName.charAt(0);
    // }

    // // Load user details
    // if (userFirstName) userFirstName.textContent = profileName.split(' ')[0];
    // if (userFullName) userFullName.textContent = profileName;

    if (profile) {
        if (profile.profile_picture) {
            console.log('yes')
            userInitial.innerHTML = `<img src="${profile.profile_picture}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            userInitial.textContent = profile.full_name.charAt(0);
        }
        if (profile.cover_photo) {
            userCoverPhoto.src = profile.cover_photo;
        }
        if (userFirstName) userFirstName.textContent = profile.full_name.split(' ')[0];
        if (userFullName) userFullName.textContent = profile.full_name;
    }

    // Load Main Feed (Initial batch)
    await window.renderSocialFeed(true);
    // Setup infinite scroll after initial load
    window.setupInfiniteScroll();
    await initCreatePostOverlay();
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
            .from('unified_social_feed_new')
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

        // if (currentUserId && feed.length > 0) {
        //     const deptPostIds = feed.filter(p => p.type === 'dept').map(p => p.id.toString());
        //     const userPostIds = feed.filter(p => p.type === 'user').map(p => p.id.toString());

        //     if (deptPostIds.length > 0) {
        //         const { data: dLikes } = await window.supabaseClient
        //             .from('post_likes')
        //             .select('post_id')
        //             .in('post_id', deptPostIds)
        //             .eq('user_id', currentUserId);
        //         deptLikes = dLikes ? dLikes.map(l => l.post_id.toString()) : [];
        //     }

        //     if (userPostIds.length > 0) {
        //         const { data: uLikes } = await window.supabaseClient
        //             .from('user_post_likes')
        //             .select('post_id')
        //             .in('post_id', userPostIds)
        //             .eq('user_id', currentUserId);
        //         userPostLikes = uLikes ? uLikes.map(l => l.post_id.toString()) : [];
        //     }
        // }

        if (currentUserId && feed.length > 0) {
            const [deptLikes, userLikes] = await Promise.all([
                window.supabaseClient.from('post_likes').select('post_id').eq('user_id', currentUserId),
                window.supabaseClient.from('user_post_likes').select('post_id').eq('user_id', currentUserId)])

            likedIds = [
                ...(deptLikes.data?.map(l => l.post_id.toString()) || []),
                ...(userLikes.data?.map(l => l.post_id.toString()) || [])
            ];
        }

        // Render posts
        feed.forEach(post => {
            post.timestamp = new Date(post.created_at);
            // const hasLiked = post.type === 'dept' ? deptLikes.includes(post.id.toString()) : userPostLikes.includes(post.id.toString());
            const hasLiked = likedIds.includes(post.id.toString());
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
    const avatarHtml = post.profile_picture
        ? `<img src="${post.profile_picture}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`
        : authorName.charAt(0);

    postCard.style.setProperty('--post-accent', accentColor);
    const timeAgo = window.formatTimeAgo(post.timestamp);
    const images = [post.image_1, post.image_2, post.image_3, post.image_4, post.image_5].filter(img => img);

    const headerClickAction = !isDept && post.author_id
        ? `onclick="event.stopPropagation(); window.location.href='profile.html?uid=${post.author_id}'" style="cursor: pointer;"`
        : '';

    postCard.innerHTML = `
        <div class="v2-post-header" style="position: relative; display: flex; align-items: center; width: 100%;">
            <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" ${headerClickAction}>
                <div class="v2-post-avatar" style="box-shadow: 0 0 10px ${accentColor}44; border-color: ${accentColor};">
                    ${avatarHtml}
                </div>
                <div class="v2-post-meta">
                    <div class="v2-author-name" style="${!isDept ? 'text-decoration: underline transparent; transition: text-decoration 0.2s;' : ''}" onmouseover="this.style.textDecoration='${!isDept ? 'underline' : 'none'}'" onmouseout="this.style.textDecoration='none'">${authorName}</div>
                    <div class="v2-post-time">${timeAgo}</div>
                </div>
            </div>

            <div class="dropdown v2-post-more">
                <button class="dropdown-trigger" style="background: none; border: none; cursor: pointer; color: var(--text-muted);">
                    ⋮
                </button>
                <div class="dropdown-menu">
                    <div class="dropdown-column">
                        <a href="#" class="dropdown-item" onclick="window.reportPost(event, '${post.id}')">
                            <div class="dropdown-info">
                                <div class="dropdown-title">Report</div>
                                <p class="dropdown-desc" style="font-size: 0.7rem;">Notify moderators about this post.</p>
                            </div>
                        </a>
                    </div>
                </div>
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
        if (e.target.closest('.dropdown')) return;
        window.openPostModal(post, images, false);
    });

    container.appendChild(postCard);

    window.updateLikeDisplay(post.id, post.type);
    window.updateCommentCountUI(post.id);
}

window.reportPost = async (event, postId) => {
    event.preventDefault();
    event.stopPropagation();

    const { data: post, error: to_error } = await window.supabaseClient
        .from('unified_social_feed_new')
        .select('*')
        .eq('id', postId)
        .single();

    const dropdown = event.target.closest('.dropdown');
    if (dropdown) dropdown.classList.remove('is-open');



    const reason = prompt("Why are you reporting this post?");
    if (reason) {
        const newValue = { ...post, reason: reason, reported_post_id: postId }
        delete newValue.id;


        const { data: rejected_post, error: report_error } = await window.supabaseClient
            .from('reported_posts')
            .insert(newValue);

        console.error(rejected_post);
        if (report_error) console.error(report_error);

        console.log(`Post ${postId} reported for: ${reason}`);
    }
};

window.showPostOptions = async (event, postId) => {
    event.stopPropagation();
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

async function initCreatePostOverlay() {
    let user = window.currentUser;
    if (!user) {
        const { data } = await window.supabaseClient.auth.getUser();
        user = data.user;
        window.currentUser = user;
        window.currentUserId = user.id;
    }

    const { data: profileData } = await window.supabaseClient
        .from('profiles')
        .select('user_type, department')
        .eq('id', user.id)
        .single()

    const userDepartment = profileData.department;
    const userType = profileData ? profileData.user_type : user.user_metadata.user_type;

    console.log("auth type: ", user.user_metadata.user_type);
    console.log('actual type: ', userType);

    const deptId = userDepartment
    const dept = window.DEPT_MAP[deptId];

    console.log(dept);
    console.log(deptId);

    const floatingActions = document.getElementById('v2-floating-actions');
    // // For departmental posts.
    // if (userType === 'dept' && userDepartment === dept.shortName) {
    //     floatingActions.innerHTML = `
    //     <button class="v2-fab secondary" onclick="window.openChat(event)">
    //         <span class="v2-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    //                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    //                 <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    //         </svg></span>
    //     <button class="v2-fab" onclick="window.createPostOverlay('dept', '${userDepartment}')">
    //         <span class="v2-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    //                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    //                 <line x1="12" y1="5" x2="12" y2="19"></line>
    //                 <line x1="5" y1="12" x2="19" y2="12"></line>
    //             </svg></span>
    //     </button>
    //     `;
    // }
    // // For official announcements
    // if (userType === 'official' && userDepartment === 'official') {
    //     floatingActions.innerHTML = `
    //     <button class="v2-fab secondary" onclick="window.openChat(event)">
    //         <span class="v2-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    //                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    //                 <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    //         </svg></span>
    //     <button class="v2-fab" onclick="window.createPostOverlay('official', 'official')">
    //         <span class="v2-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    //                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    //                 <line x1="12" y1="5" x2="12" y2="19"></line>
    //                 <line x1="5" y1="12" x2="19" y2="12"></line>
    //             </svg></span>
    //     </button>
    //     `;
    // Default for Students
    // } 
    if (userType === 'student') {
         floatingActions.innerHTML = `
        <button class="v2-fab secondary" onclick="window.openChat(event)">
            <span class="v2-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg></span>
        <button class="v2-fab" onclick="window.createPostOverlay()">
            <span class="v2-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg></span>
        </button>
        `;
    }
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
