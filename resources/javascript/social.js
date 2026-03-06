// Social Media Feed Logic for social.html

window.addEventListener('profileReady', () => {
    initSocial();
});


async function initSocial() {
    const {data: {user}} = await supabaseClient.auth.getUser();
    let userId = user ? user.id : null;
    console.log("Initializing Social Feed...");

    
    // 1. Handle User Profile
    const profileName = window.profile ? window.profile.full_name : 'Student'
    const userProfile = JSON.parse(localStorage.getItem('user')) || { firstName: profileName };
    const userInitial = document.getElementById('user-initial');
    const userFirstName = document.getElementById('user-firstname');
    
    if (userInitial) userInitial.textContent = userProfile.firstName.charAt(0);
    if (userFirstName) userFirstName.textContent = userProfile.firstName;

    // 2. Fetch and render data
    if (typeof fetchNotices === 'function') {
        const notices = await fetchNotices();
        renderSocialFeed(notices);
    }

    if (typeof fetchEvents === 'function') {
        const events = await fetchEvents();
        renderHeroAnnouncement(events);
    }

    if (typeof fetchRecents === 'function') {
        const recents = await fetchRecents();
        renderRecents(recents);
    }
    

    // 3. Fetch posts per department, scramble for algorithm??? wtf
    const feedContainer = document.getElementById('social-feed-container');
    if (!feedContainer) return;

    const { data, error } = await window.supabaseClient
        .from('department_posts')
        .select('*')

        let userLikes = [];
        if (userId) {
            const {data: likes} = await window.supabaseClient
                .from('post_likes')
                .select('post_id')
                .eq('user_id', userId);
            userLikes = likes.map(l => l.post_id)
        }
        console.log(userId);
        console.log(userLikes);

        data.forEach(post=> {
            const postCard = document.createElement('div');
            postCard.className = 'post-card bento-card';
            const images = [post.image_1, post.image_2, post.image_3, post.image_4, post.image_5];
            const hasLiked = userLikes.includes(post.id)

            let avatarBg = '#6366f1';
            let postWho = post.department || null;
            if (postWho === 'ACADEMIC') avatarBg = '#818cf8';
            if (postWho === 'FACILITY') avatarBg = '#ec4899';
            if (postWho === 'EVENT') avatarBg = '#f59e0b';
            if (postWho === 'JPIA') avatarBg = '#ef4444';
            if (postWho === 'ISSOC') avatarBg = '#4b5563';
            if (postWho === 'SABELA') avatarBg = '#ec4899';
            if (postWho === 'HM') avatarBg = '#f59e0b';
            if (postWho === 'BSBA') avatarBg = '#3b82f6';

            const timeAgo = window.formatTimeAgo(new Date(post.date));

            postCard.innerHTML = `
                <div class = "post-header">
                    <div class="post-avatar" style="background: ${avatarBg}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                        ${postWho.substring(0, 1)}
                    </div>
                    <div class="post-meta">
                        <strong>${postWho}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${timeAgo}</span>
                    </div>
                </div>
            <div class="post-content" style="margin-top: 15px;">
                <p style="font-size: 0.8rem; line-height: 1.5;">${post.content}</p>
                ${post.image_1 ? `<img src="${post.image_1}" alt="Post Image" class="post-image" style="width: 100%; border-radius: 12px; margin-top: 10px;">` : ''}
            </div>

            <div class="modal-gallery">
                ${images && images.length > 0 
                    ? images
                        .slice(1)
                        .filter(img => img) // Removes null/undefined/empty string slots
                        .map(img => `<img src="${img}" class="gallery-image">`)
                        .join('') 
                    : '' // If no images, render nothing
                }
            </div>
            <div class="post-actions">
                    <button onclick="toggleLike(event, ${post.id})">
                        <span id="like-symbol-${post.id}">❤︎</span>
                        <span class="like-count" id="like-count-${post.id}">0</span>
                    </button>
                    
                    <button onclick="toggleComment(event, ${post.id})">
                        <svg width="25" height="25" viewBox="0 0 25 25">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                        <span class="comment-count" id="count-${post.id}">0</span>
                    </button>
                </div>
            `

            if (hasLiked) {
                const symbol = postCard.querySelector(`#like-symbol-${post.id}`);
                if (symbol) symbol.classList.add('liked');
            }
            
            postCard.style.cssText = `
                cursor: pointer;
            `

            postCard.addEventListener('click', function(e) {
                e.preventDefault();
                window.openPostModal(post,images)
            })
            feedContainer.appendChild(postCard);
            updateLikeDisplay(post.id);
            updateCommentCountUI(post.id);
    });
}

function renderRecents(recents) {
    const container = document.getElementById('recently-container')
    if (!container) return;
    
    if (recents.length === 0 ) {
        container.innerHTML = `<p style="padding:20px; font-size:0.8rem;">No recent posts.</p>`;        return;
    }

    container.innerHTML = ``;
    const track = document.createElement('div');
    track.className = 'slider-track';

    recents.forEach(compilation => {
        if (compilation.image_1) {
            const slide = document.createElement('div')
            slide.className = 'hero-slide';
            slide.style.height = '100%';
            slide.innerHTML = `
            <img src='${compilation.image_1}' class="events-bg" ;>
            <div class="hero-content" style="scale: 0.7; padding: 10px; padding-bottom: 0; !important; flex-direction: column !important; bottom: 0;">
                <span class="tag" style="opacity:70%;">Recently</span>
                <h3 style="margin: 5px 0; color: white;">${compilation.department}</h3>
                <p style="opacity: 0.7; font-size: 0.8rem;">${new Date(compilation.date).toLocaleDateString()}</p>
            </div>`
            track.appendChild(slide);
        }
    });
    container.appendChild(track);
    if (recents.length > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'slider-btn prev';
        prevBtn.innerHTML = '←';
        prevBtn.style.scale = 0.7
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'slider-btn next';
        nextBtn.innerHTML = '→';
        nextBtn.style.scale = 0.7


        container.appendChild(prevBtn);
        container.appendChild(nextBtn);

        let currentIndex = 0;
        const totalSlides = recents.length;

        const updateSlider = () => {
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
        };

        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateSlider();
        });

        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateSlider();
        });
    }
}

function renderSocialFeed(notices) {
    const feedContainer = document.getElementById('social-feed-container');
    if (!feedContainer) return;

    if (notices && notices.length > 0) {
        feedContainer.innerHTML = '';
    } else {
        return;
    }

    notices.forEach(notice => {
        const postCard = document.createElement('div');
        postCard.className = 'post-card bento-card';
        
        let avatarBg = '#6366f1';
        let categoryLabel = notice.department || 'CAMPUS';
        if (categoryLabel === 'ACADEMIC') avatarBg = '#818cf8';
        if (categoryLabel === 'FACILITY') avatarBg = '#ec4899';
        if (categoryLabel === 'EVENT') avatarBg = '#f59e0b';

        const timeAgo = window.formatTimeAgo(new Date(notice.created_at));

        postCard.innerHTML = `
            <div class="post-header">
                <div class="post-avatar" style="background: ${avatarBg}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                    ${categoryLabel.substring(0, 1)}
                </div>
                <div class="post-meta">
                    <strong>${categoryLabel}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${timeAgo}</span>
                </div>
            </div>
            <div class="post-content" style="margin-top: 15px;">
                <p style="font-size: 0.8rem; line-height: 1.5;">${notice.content}</p>
                ${notice.image_url ? `<img src="${notice.image_url}" alt="Post Image" class="post-image" style="width: 100%; border-radius: 12px; margin-top: 10px;">` : ''}
            </div>
        `;
        postCard.style.cssText = `
            cursor: pointer;
        `

        postCard.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 1. Create the overlay (the background dim)
                const overlay = document.createElement('div');
                overlay.className = 'post-modal-overlay';
                const images = notices.image_1 ? [notices.image_1, notices.image_2, notices.image_3, notices.image_4, notices.image_5] : null
                
                // 2. Create the content frame
                overlay.innerHTML = `
                    <div class="post-modal-card">
                        <h2 style="color: var(--dept-color)">${notice.department}</h2>
                        <div class="modal-content">${notice.content}</div>
                        ${notice.image_1 ? `<img src="${notice.image_1}" class="modal-image" onclick="openFullImage('${notice.image_1}')" style="cursor:pointer;"> ` : ''}

                        <div class="modal-gallery">
                            ${images && images.length > 0 
                                ? images
                                    .filter(img => img) // Removes null/undefined/empty string slots
                                    .map(img => `<img src="${img}" class="gallery-image" onclick="openFullImage('${img}')" style="cursor:pointer;"> `)
                                    .join('') 
                                : '' // If no images, render nothing
                            }
                        </div>
                        <p class="modal-date">${Date(notice.date)}</p>
                    </div>
                `;

                

                // 3. Close logic (remove from DOM when clicking overlay or button)
                overlay.onclick = (e) => {
                    if (e.target === overlay || e.target.classList.contains('close-btn')) {
                        overlay.remove();
                    }
                };

                document.body.appendChild(overlay);
        })

        feedContainer.appendChild(postCard);
    });
}

async function submitComment(event, postId) {
    if (event) event.preventDefault();

    const input = document.getElementById('new-comment-input');
    const content = input.value.trim();

    if (!content) return;

    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;

    const {error} = await window.supabaseClient
        .from('post_comments')
        .insert({
            post_id: postId,
            user_id: user.id,
            content: content
        })

    if (error) {
        console.error("Error posting comment:", error.message);
        alert("Failed to post comment.");
    } else {
        input.value = '';
        console.log("Comment posted successfully!");
        window.loadModalComments(postId);
        updateCommentCountUI(postId);
    }
}

async function updateCommentCountUI(postId) {
    const { count } = await window.supabaseClient
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

    const countElement = document.getElementById(`count-${postId}`);
    if (countElement) {
        countElement.textContent = count || 0;
    }
}


async function updateLikeDisplay(postId) {
    const count = await getLikeCount(postId);
    const countElement = document.getElementById(`like-count-${postId}`);
    if (countElement) {
        countElement.textContent = count;
    }
}


function renderHeroAnnouncement(events) {
    const container = document.getElementById('main-hero-area');
    if (!container || !events || events.length === 0) return;

    const event = events[0]; 
    
    container.innerHTML = `
        <div class="hero-slide" style="height: 200px; position: relative; overflow: hidden; border-radius: 24px;">
            <img src="${event.image_url || 'resources/images/wickedbackground(1).svg'}" class="hero-bg" style="width: 100%; height: 100%; object-fit: cover;">
            <div class="hero-content" style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 15px; box-sizing: border-box; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); z-index: 2;">
                <span class="tag" style="font-size: 0.6rem;">Featured</span>
                <h2 style="color: white; font-size: 1.1rem; margin: 5px 0; -webkit-text-fill-color: white;">${event.header}</h2>
                <p style="color: rgba(255,255,255,0.9); font-size: 0.75rem; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${event.subheader}</p>
            </div>
        </div>
    `;
}

async function isLiked(postId) {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return false;

    const { data, error } = await window.supabaseClient
        .from('post_likes')
        .select('id')
        .match({ post_id: postId, user_id: user.id })
        .maybeSingle();

    return !!data;
}

async function toggleLike(event, postId) {
    event.stopPropagation();
    console.log('clicked!');
    const {data: {user}} = await window.supabaseClient.auth.getUser();
    if (!user) return alert('404: USER NOT FOUND');

    // 1. Attempt to insert the like
    const { error } = await window.supabaseClient
        .from('post_likes')
        .insert({
            post_id: postId,
            user_id: user.id
        });

    // 2. If error code is 23505 (Unique Violation), it means they already liked it
    if (error && error.code === '23505') {
        await window.supabaseClient
            .from('post_likes')
            .delete()
            .match({post_id: postId, user_id: user.id});

        console.log('Post unliked.');
        document.getElementById(`like-symbol-${postId}`).classList.remove('liked');
    } else if (!error) {
        console.log('Post liked');
        document.getElementById(`like-symbol-${postId}`).classList.add('liked');
    } else {
        console.error('Error toggling like:', error.message);
    }

    // 3. CRITICAL: Refresh the UI after the database change
    await updateLikeDisplay(postId);
}

async function getLikeCount(postId) {
    const { count, error } = await window.supabaseClient
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

    console.log(count);
    return count || 0; // This returns the integer total
}

function createPostOverlay() {

}


document.addEventListener('DOMContentLoaded', () => {
    // Override before index.js init runs if possible, or right after
    window.renderEvents = (events) => {
        renderHeroAnnouncement(events);
    };

    window.renderClubs = (clubs) => {
        // Left sidebar links are static, but we can update them if needed
    };
});
