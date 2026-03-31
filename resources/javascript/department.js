// ========== DEPARTMENT PAGE LOGIC ==========

// ========== INITIALIZE THE COLORS, NAME, AND GET THE DATA FOR THE CLICKED DEPARTMENT. ==========
async function initDepartment() {
    const urlParams = new URLSearchParams(window.location.search);
    const deptId = urlParams.get('dept') || 'JPIA';
    const dept = window.DEPT_MAP[deptId];

    if (!dept) {
        console.warn(`Department ${deptId} not found, redirecting to social feed.`);
        window.location.href = 'social-v2.html';
        return;
    }

    // Set theme colors based on department
    document.documentElement.style.setProperty('--dept-color', dept.color);
    document.documentElement.style.setProperty('--dept-color-light', `${dept.color}22`);

    // Update UI elements
    const deptBadge = document.getElementById('dept-badge');
    const deptName = document.getElementById('dept-name');
    const deptIntro = document.getElementById('dept-intro');
    const deptHeader = document.getElementById('dept-header');
    const deptLink = document.getElementById('dept-link');

    if (deptBadge) deptBadge.textContent = dept.shortName;
    if (deptName) deptName.textContent = dept.name;
    if (deptIntro) deptIntro.textContent = dept.intro;
    if (deptHeader) deptHeader.style.backgroundImage = `url(${dept.image})`;

    if (deptLink) {
        if (dept.fb_link) {
            deptLink.style.display = 'inline-block';
            deptLink.onclick = () => window.open(dept.fb_link, '_blank');
        } else {
            deptLink.style.display = 'none';
        }
    }

    document.title = `NCBA.Life | ${dept.shortName}`;

    // Load posts
    const posts = await fetchDepartmentPosts(deptId);
    renderPosts(posts, deptId);

    setupScrollAnimations();
}

// ========== GET ALL THE POSTS FOR THIS SPECIFIC DEPARTMENT ==========
async function fetchDepartmentPosts(deptId) {
    if (deptId === 'ANNOUNCEMENT') {
        const { data, error } = await window.supabaseClient
            .from('notices')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching notices:', error);

        console.log(data);
        // Map notices to a common post format for rendering
        return (data || []).map(notice => ({
            id: notice.id,
            title: notice.department || 'Official Announcement',
            content: notice.content,
            cover_photo: notice.image_url,
            images: notice.image_url ? [notice.image_url] : [],
            date: new Date(notice.created_at).toLocaleDateString(),
            department_key: notice.department_key,
            isNotice: true
        }));
    } else {
        const { data, error } = await window.supabaseClient
            .from('department_posts')
            .select('*')
            .eq('department', deptId)
            .order('date', { ascending: false });

        if (error) console.error('Error fetching department posts:', error);

        return (data || []).map(post => ({
            id: post.id,
            title: post.title,
            content: post.content,
            cover_photo: post.image_1,
            images: [post.image_1, post.image_2, post.image_3, post.image_4, post.image_5].filter(img => img),
            date: new Date(post.date).toLocaleDateString(),
            department: post.department,
            isNotice: false
        }));
    }
}

// ========== DISPLAY ALL THE POSTS. ==========
function renderPosts(posts, deptId) {
    const grid = document.getElementById('posts-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (posts.length === 0) {
        grid.innerHTML = '<p style="grid-column: span 3; text-align: center; padding: 40px; color: var(--text-muted);">No posts available for this department yet.</p>';
        return;
    }

    posts.forEach((post, index) => {
        const card = document.createElement('div');
        card.className = 'post-card-bento';
        card.style.transitionDelay = `${(index % 3) * 0.1}s`;
        card.style.cursor = 'pointer';

        card.addEventListener('click', () => {
            // Use the unified modal from ui-util.js
            window.openPostModal(post, post.images, post.isNotice);
        });

        card.innerHTML = `
            ${post.cover_photo ? `<img src="${post.cover_photo}" class="post-card-image" alt="${post.title}">` : ''}
            <div style="padding: 5px 0;">
                <h2 class="post-card-title">${post.title}</h2>
                <p class="post-card-text">${post.content}</p>
            </div>
            <div class="post-card-footer">
                <span>${post.date}</span>
                <span style="opacity: 0.6;">Read More →</span>
            </div>
        `;

        grid.appendChild(card);
    });
}

// ========== SCROLL ANIMATIONS ==========
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.post-card-bento').forEach(card => {
        observer.observe(card);
    });
}

async function initCreatePostOverlay() {
    let user = window.currentUser;
    if (!user) {
        const { data } = await window.supabaseClient.auth.getUser();
        user = data.user;
        window.currentUser = user;
        window.currentUserId = user.id;
    }

    const {data : profileData} = await window.supabaseClient
        .from('profiles')
        .select('user_type, department')
        .eq('id', user.id)
        .single()

    const userDepartment = profileData.department;
    const userType = profileData ? profileData.user_type : user.user_metadata.user_type;

    console.log("auth type: ", user.user_metadata.user_type);
    console.log('actual type: ', userType);

    const floatingActions = document.getElementById('floating-actions');
    if (userType === 'dept') {
        floatingActions.innerHTML = `
        <button class="v2-fab secondary" onclick="window.openChat(event)">
            <span class="v2-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg></span>
        <button class="v2-fab" onclick="window.createPostOverlay('dept', '${userDepartment}')">
            <span class="v2-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg></span>
        </button>
        `;
    }
}

// Wait for configuration to be ready
document.addEventListener('DOMContentLoaded', () => {
    initDepartment();
    initCreatePostOverlay();
});
