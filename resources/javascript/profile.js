window.addEventListener('profileReady', () => {
    initProfile();
});

async function initProfile() {
    const { data: { user }, error: userError } = await window.supabaseClient.auth.getUser();
    if (userError || !user) {
        window.location.href = 'login.html';
        return;
    }

    window.currentUser = user;
    window.currentUserId = user.id


    const loggedInUserId = user.id;

    // Determine whose profile to load based on URL parameter 'uid'
    const urlParams = new URLSearchParams(window.location.search);
    const targetUserId = urlParams.get('uid') || loggedInUserId;

    // Fetch the full profile details for the target user
    const { data: targetProfile, error: profileError } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

    if (profileError || !targetProfile) {
        console.error("Error fetching full profile:", profileError);
        document.getElementById('profile-name').textContent = 'User Not Found';
        return;
    }

    console.log(targetProfile.id);
    console.log(user.id);
    console.log(targetProfile.profile_picture);

    // Set "profile-avatar" to be clickable if it's your own profile.
    if (user.id === targetProfile.id) {
        document.getElementById('profile-avatar').style.cursor = 'pointer';
        document.getElementById('profile-header').style.cursor = 'pointer';
    } else {
        document.getElementById('profile-avatar').style.pointerEvents = 'none';
        document.getElementById('profile-header').style.pointerEvents = 'none';
    };

    // Values
    const dept = window.DEPT_MAP[targetProfile.department];
    const avatarContainer = document.getElementById('profile-avatar');
    const coverContainer = document.getElementById('cover-photo');
    const profilePicture = targetProfile.profile_picture;
    const coverPhoto = targetProfile.cover_photo;

    // Populate profile avatar 
    if (profilePicture && profilePicture !== 'null' & profilePicture !== 'undefined') {
        avatarContainer.innerHTML = `<img src="${profilePicture}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else {
        avatarContainer.textContent = (targetProfile.full_name || 'U').charAt(0);
    }

    if (coverPhoto && coverPhoto !== 'null' & coverPhoto !== 'undefined') {
        coverContainer.src = coverPhoto;
    }


    // Populate header
    document.getElementById('profile-name').textContent = targetProfile.full_name || 'Unknown Student';
    document.getElementById('profile-role').textContent = targetProfile.role || 'Student';
    document.getElementById('profile-dept').textContent = dept ? dept.name : 'General';

    // Load Posts for the target user, but pass logged in user to check likes
    loadUserPosts(targetUserId, targetProfile, loggedInUserId);
}

async function loadUserPosts(targetUserId, profile, loggedInUserId) {
    const container = document.getElementById('posts-grid');
    container.innerHTML = '<h2 class="empty-state">Loading posts...</h2>';

    const { data: posts, error } = await window.supabaseClient
        .from('user_posts')
        .select('*')
        .eq('author_id', targetUserId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading posts:', error);
        container.innerHTML = '<h2 class="empty-state">Error loading posts.</h2>';
        return;
    }

    if (!posts || posts.length === 0) {
        container.innerHTML = '<div class="empty-state">No posts yet.</div>';
        return;
    }

    container.innerHTML = '';

    // Fetch likes to see if the LOGGED-IN user liked these posts
    const { data: likes } = await window.supabaseClient
        .from('user_post_likes')
        .select('post_id')
        .eq('user_id', loggedInUserId);

    const likedPostIds = likes ? likes.map(l => l.post_id) : [];

    posts.forEach((post, index) => {
        const card = document.createElement('article');
        card.className = 'post-card-bento';
        card.tabIndex = '0';

        setTimeout(() => {
            card.classList.add('visible');
        }, index * 100);

        const timeAgo = window.formatTimeAgo ? window.formatTimeAgo(new Date(post.created_at)) : new Date(post.created_at).toLocaleDateString();

        const coverImage = post.image_1;
        const imageHtml = coverImage ? `<img src="${coverImage}" alt="Post image" class="post-card-image">` : '';

        let contentText = post.content || '';

        const hasLiked = likedPostIds.includes(post.id);
        const heartColor = hasLiked ? 'var(--profile-color)' : 'currentColor';

        card.innerHTML = `
            ${imageHtml}
            <div style="flex-grow: 1;">
                <p class="post-card-text">${contentText}</p>
            </div>
            <div class="post-card-footer">
                <span>${timeAgo}</span>
                <div style="display: flex; gap: 15px;">
                    <span style="display: flex; align-items: center; gap: 5px; color: ${heartColor};">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="${hasLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        <span id="like-count-${post.id}">0</span>
                    </span>
                    <span style="display: flex; align-items: center; gap: 5px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <span id="comment-count-${post.id}">0</span>
                    </span>
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (window.openPostModal) {
                const modalPost = {
                    ...post,
                    type: 'user',
                    author_name: profile.full_name,
                    profiles: {
                        full_name: profile.full_name,
                        department: profile.department
                    },
                    department_key: profile.department
                };
                const images = [post.image_1, post.image_2, post.image_3, post.image_4, post.image_5].filter(img => img);
                window.openPostModal(modalPost, images, false);
            }
        });

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // Prevent page scrolling on Space
                card.click(); // Trigger the existing click listener logic
            }
        });

        container.appendChild(card);
        updateCounts(post.id);
    });
}

async function updateCounts(postId) {
    const { count: likeCount } = await window.supabaseClient
        .from('user_post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

    const likeEl = document.getElementById(`like-count-${postId}`);
    if (likeEl) likeEl.textContent = likeCount || 0;

    const { count: commentCount } = await window.supabaseClient
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

    const commentEl = document.getElementById(`comment-count-${postId}`);
    if (commentEl) commentEl.textContent = commentCount || 0;
}

async function clickAvatar(event) {
    event.stopPropagation();
    const avatarDiv = document.getElementById('profile-avatar')
    const fileInput = document.getElementById('fileSelect')

    avatarDiv.addEventListener('click', () => {
        fileInput.click();
    })

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];

        // User canceled the file dialog
        if (!file) return;
        try {
            const publicUrl = await uploadAvatar(file);
            document.getElementById('profile-avatar').innerHTML = `<img src="${publicUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%">`;
        } catch (err) {
            console.error("upload image failed", err);
        }

        const profilePicture = await uploadAvatar(file)

    });
}

async function clickCoverPhoto() {
    const headerDiv = document.getElementById('profile-header')
    const fileInput = document.getElementById('headerSelect')

    headerDiv.addEventListener('click', () => {
        fileInput.click();
    })

    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];

        // User canceled the file dialog
        if (!file) return;
        try {
            const publicUrl = await uploaderCoverPhoto(file);
            document.getElementById('cover-photo').src = publicUrl
        } catch (err) {
            console.error("upload image failed", err);
        }

        // Variable just in case we need to call
        const headerPicture = await uploaderCoverPhoto(file)
    });
}

async function uploadAvatar(file) {
    const compressedImage = await window.compressImage(file, { quality: 0.8, maxWidth: 800 });
    const bucket = 'images';
    const filePath = `profileAvatars/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    // Save to Storage
    const { data, error } = await window.supabaseClient.storage
        .from(bucket)
        .upload(filePath, compressedImage, {
            contentType: 'image/jpeg',
            upsert: false
        });

    // Error Handler
    if (error) throw error;

    // Get the image link from the Storage
    const { data: { publicUrl } } = window.supabaseClient.storage
        .from(bucket)
        .getPublicUrl(filePath);

    const { profile, profileError } = await window.supabaseClient
        .from('profiles')
        .update({ profile_picture: publicUrl })
        .eq('id', window.currentUserId)
        .single();

    return publicUrl;
}

async function uploaderCoverPhoto(file) {
    const compressedImage = await window.compressImage(file, { quality: 0.8, maxWidth: 800 });
    const bucket = 'images';
    const filePath = `profileHeaders/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    // Save to Storage
    const { data, error } = await window.supabaseClient.storage
        .from(bucket)
        .upload(filePath, compressedImage, {
            contentType: 'image/jpeg',
            upsert: false
        });

    // Error Handler
    if (error) throw error;

    // Get the image link from the Storage
    const { data: { publicUrl } } = window.supabaseClient.storage
        .from(bucket)
        .getPublicUrl(filePath);

    // Set the cover photo
    const { profile, profileError } = await window.supabaseClient
        .from('profiles')
        .update({ cover_photo: publicUrl })
        .eq('id', window.currentUserId)
        .single();

    return publicUrl;
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.profile) {
        initProfile();
    }
});