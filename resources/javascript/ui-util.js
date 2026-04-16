// Pre-warm the cache when the page loads
window.addEventListener('DOMContentLoaded', async () => {
    const { data } = await window.supabaseClient.auth.getUser();
    if (data?.user) {
        window.currentUser = data.user;
        window.currentUserId = data.user.id;
        window.renderChatList(window.currentUser)
    }
});

window.openAlert = async function (type, text) {
    alertType = {
        'warning': {
            title: 'WARNING',
            color: '#ef4444',
        },
        'success': {
            title: 'SUCCESS',
            color: '#7bff83'
        },
        'caution': {
            title: 'CAUTION',
            color: '#ffbe4d'
        }
    };

    const typeColor = alertType[type].color;
    const typeTitle = alertType[type].title;

    console.log(typeColor);

    const overlay = document.createElement('div');
    overlay.className = 'post-modal-overlay no-blur';

    overlay.innerHTML = `
        <div class="post-modal-card alert fadeIn">
            <div class="modal-header alert-header">
                <h2 class="alert-title" style="color:${typeColor};">${typeTitle}</h2>
                <button class="close-btn static-close">&times;</button>
            </div>

            <h3 class="alert-text">${text}</h3>
            <p class="alert-muted">This pop-up will close in a bit.</p>
        </div>
    `;

    overlay.onclick = (e) => {
        if (e.target === overlay || e.target.classList.contains('close-btn')) overlay.remove();
    };
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.classList.remove('fadeIn');
        overlay.classList.add('fadeOut');

        overlay.addEventListener('animationend', (e) => {
            console.log("Animation detected:", e.animationName);
            if (e.animationName === 'slideUpFadeOut') {
                console.log('Removing from DOM now...');
                overlay.remove();
            }
        }, { once: true });

    }, 5000);
}

window.checkUserProfile = async function () {
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

    if (userType === 'dept') {
        window.location.href = `department.html?dept=${userDepartment}`;
    } else {
        window.location.href = 'profile.html';
    }
}

window.openPostModal = async function (post, images, isNotice = false) {
    const overlay = document.createElement('div');
    overlay.className = 'post-modal-overlay';

    // Unified data mapping
    const content = post.content || post.message || '';
    const title = post.title || post.header || '' // header comes from official announcements
    const authorName = (post.author_name ? post.author_name : post.department_key) // Check if post came from a user first, if not then department.
    const deptColor = window.DEPT_MAP[post.department_key]?.color || '#878787';

    console.log(post)
    console.log(post.department_key)
    console.log(window.DEPT_MAP[post.department_key]);

    // Filter images to see if we actually have any valid URLs
    const validImages = Array.isArray(images) ? images.filter(img => img && img !== 'null' && img !== '') : [];
    const hasImages = validImages.length > 0;

    // Use 'ig-layout' for images, 'vertical-layout' for text-only
    const layoutClass = hasImages ? 'ig-layout' : 'vertical-layout';

    overlay.innerHTML = `
        <div class="post-modal-card ${layoutClass}">
            ${!hasImages ? `
                <div class="modal-header modal-header-padded">
                    <span class="tag" style="background-color: ${deptColor}; color: #000000">${authorName}</span>
                    <button class="close-btn static-close">&times;</button>
                </div>
            ` : ''}

            <div class="modal-main ${!hasImages ? 'modal-main-no-images' : ''}">
                ${hasImages ? `
                    <img src="${validImages[0]}" class="modal-image" onclick="window.openFullImage('${validImages[0]}')">
                    <div class="modal-gallery">
                        ${validImages.slice(1).map(img => `<img src="${img}" class="gallery-image" onclick="window.openFullImage('${img}')">`).join('')}
                    </div>
                ` : `
                    <div class="modal-content modal-content-no-images">${content}</div>
                `}
            </div>

            <aside class="modal-comments-sidebar ${!hasImages ? 'modal-comments-sidebar-no-images' : ''}">
                <div class="comments-header ${!hasImages ? 'comments-header-hidden' : ''}">
                    ${hasImages ? `
                        <span class="tag" style="background-color: ${deptColor};">${authorName}</span>
                        <button class="close-btn static-close">&times;</button>
                    ` : ''}
                </div>

                ${isNotice
            ? `<h2 class="notice-title">${title}</h2>`
            : (title ? `<h2 class="notice-title-standard">${title}</h2>` : '')
        }

                ${hasImages ? `
                    <div class="modal-content modal-content-with-images">${content}</div>` : ''}
                
                ${!isNotice ? `
                    <div id="modal-comments-list" class="comments-scroll-area"></div>
                    <div class="comment-input-area">
                        <input type="text" id="new-comment-input" placeholder="Add a comment...">
                        <button class="send-comment-btn" onclick="window.submitComment(event, '${post.id}')">
                            <svg viewBox="0 0 24 24" class="send-icon"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                        </button>
                    </div>
                ` : `
                    <div class="comments-scroll-area comments-disabled-msg">
                        <p>Comments are disabled for official announcements.</p>
                    </div>
                `}
            </aside>
        </div>
    `;

    overlay.onclick = (e) => {
        if (e.target === overlay || e.target.classList.contains('close-btn')) overlay.remove();
    };

    document.body.appendChild(overlay);

    // Only attach comment listeners if it's NOT a notice
    if (!isNotice) {
        const input = document.getElementById('new-comment-input');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value.trim() !== '') {
                window.submitComment(null, post.id);
            }
        });

        if (typeof window.loadModalComments === 'function') window.loadModalComments(post.id);
    }
};


///////////////////////////////////


window.openFullImage = function (url) {
    const fullView = document.createElement('div');
    fullView.className = 'full-image-overlay';
    fullView.innerHTML = `
        <button class="close-full-view">&times;</button>
        <img src="${url}" class="full-view-content">
    `;
    fullView.onclick = (e) => {
        if (e.target !== document.querySelector('.full-view-content')) fullView.remove();
    };
    document.body.appendChild(fullView);
};

//////////////////////////

window.formatTimeAgo = function (date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

////////////////////////

window.loadModalComments = async function (postId) {
    const container = document.getElementById('modal-comments-list');
    if (!container) return; // Exit if the modal isn't open anymore

    const { data, error } = await window.supabaseClient
        .from('post_comments')
        .select(`
            content,
            created_at,
            profiles (full_name)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading comments:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p style="color: #666; padding: 10px; font-size: 0.8rem;">No comments yet...</p>';
        return;
    }

    container.innerHTML = data.map(comment => `
        <div class="comment-item-footer">
            <strong class="comment-author">
                ${comment.profiles?.full_name || 'Student'}
            </strong>
            <p class="comment-text">${comment.content}</p>
            <span class="comment-time">
                ${window.formatTimeAgo(new Date(comment.created_at))}
            </span>
        </div>
    `).join('');
};



///////////////////////////

window.submitComment = async function (event, postId) {
    if (event) event.preventDefault();
    const input = document.getElementById('new-comment-input');
    const content = input.value.trim();
    if (!content) return;

    const user = window.currentUser
    if (!user) return window.openAlert('warning', "login to comment")

    const { error } = await window.supabaseClient
        .from('post_comments')
        .insert({
            post_id: postId,
            user_id: user.id,
            content: content
        });

    if (!error) {
        input.value = '';
        await window.loadModalComments(postId);
        if (typeof window.updateCommentCountUI === 'function') {
            window.updateCommentCountUI(postId);
        }
    }
};


/////////////////////////////

window.checkStringLength = function (string, length) {
    // 1. Convert string to an array of actual characters
    const characters = [...string];

    if (characters.length >= length) {
        // 2. Slice the array, then join it back into a string
        const truncated = characters.slice(0, length).join('');

        return `${truncated}... <p style='color: var(--text-main)'><strong>Read more...</strong></p>`;
    }

    return string;
};

// -- Dropdown Toggle Logic! -- //
document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.dropdown-trigger');
    const container = e.target.closest('.dropdown');
    console.log(e);


    // Handle clicking the trigger
    if (trigger) {
        console.log(trigger);
        // Toggle the current one
        container.classList.toggle('is-open');

        // Close any other open dropdowns
        document.querySelectorAll('.dropdown.is-open').forEach(openDropdown => {
            if (openDropdown !== container) {
                openDropdown.classList.remove('is-open');
            }
        });
        return;
    }

    // Handle clicking outside (if the click is NOT inside an open dropdown)
    if (!container) {
        document.querySelectorAll('.dropdown.is-open').forEach(openDropdown => {
            openDropdown.classList.remove('is-open');
        });
    }
});

window.showFullContent = function (postId) {
    // Instead of passing the whole string, we'll find the element
    const element = document.getElementById(`content-${postId}`);

    // Use global variable to store the original content temporarily because why not
    // or use a data attribute kung gusto sosyal
    // assume expand based on the post data
    // this function is bery much broken
    // for now

    // Since this function is called from the UI, it's easier to just 
    // toggle a 'collapsed' class or use a data attribute.
    if (element.innerHTML.includes('Read more...')) {
        // You'll need to make sure the full content is accessible.
        // A simple trick is to check if we stored it in a global map.
        element.innerHTML = element.getAttribute('data-full-content');
    }
};

window.createPostOverlay = function (postType = 'user', departmentId = null) {

    const overlay = document.createElement('div');
    overlay.className = 'post-modal-overlay';

    const modalTitle = postType === 'dept' ? `Create Post for ${departmentId}` : 'Create New Post';

    overlay.innerHTML = `
        <div class="post-modal-card vertical-layout" style="padding: 30px; max-width: 600px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: var(--accent-primary);">${modalTitle}</h3>
                <button class="close-btn" style="position: static; font-size: 1.5rem;">&times;</button>
            </div>

            ${postType === 'dept' ? `
                <div class="input-group">
                <label style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">WHAT'S ON YOUR MIND?</label>
                <textarea id="new-post-title" oninput='this.style.height = "";this.style.height = this.scrollHeight + "px"' placeholder="Write a title"></textarea>
            </div>` : ''}
            

            <div class="input-group">
                <label style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">WHAT'S ON YOUR MIND?</label>
                <textarea id="new-post-content" oninput='this.style.height = "";this.style.height = this.scrollHeight + "px"' placeholder="Write something..."></textarea>
            </div>

            ${postType === 'official' ? `
                <div class="input-group">
                <label style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">DEPARTMENT</label>
                <select name="official_department" id="official_department" required>
                    <option value="">Pick a department...</option>
                    <option value="CAMPUS WIDE">CAMPUS WIDE</option>
                    <option value="COLLEGE DEPARTMENT">COLLEGE DEPARTMENT</option>
                    <option value="LIBRARY">LIBRARY</option>
                    <option value="GUIDANCE OFFICE">GUIDANCE OFFICE</option>
                    <option value="OSA">OSA</option>
                    <option value="ACADEMIC">ACADEMIC</option>
                </select>
            </div>` : ''}

            <div class="upload-section" style="margin-top: 20px;">
                <label style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 10px;">
                    ATTACH IMAGES (MAX 5)
                </label>
                <input type="file" id="post-image-input" accept="image/*" multiple style="display: none;">
                <button id="post-image-visual"; onclick="document.getElementById('post-image-input').click()" 
                        style="background: var(--input-bg); border: 1px dashed var(--border-color); color: var(--text-main); padding: 10px; width: 100%; border-radius: 8px; cursor: pointer;">
                    + Select Images
                </button>
                <div id="image-preview-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 15px;"></div>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 20px;">
                <button class="btn-primary" id="submit-post-btn" style="flex: 1; font-weight: 600">POST</button>
            </div>
        </div>
    `;

    overlay.onclick = (e) => {
        if (e.target === overlay || e.target.classList.contains('close-btn')) overlay.remove();
    };

    document.body.appendChild(overlay);

    const imageInput = document.getElementById('post-image-input');
    const previewGrid = document.getElementById('image-preview-grid');
    let selectedFiles = [];

    // Handle Image Selection and Preview
    imageInput.onchange = (e) => {
        const files = Array.from(e.target.files);

        // Ensure total does not exceed 5
        if (selectedFiles.length + files.length > 5) {
            window.openAlert('caution', "You can only upload a maximum of 5 images.");
            return;
        }

        files.forEach(file => {
            selectedFiles.unshift(file);

            // Create container immediately at the top to preserve descending order
            const imgContainer = document.createElement('div');
            imgContainer.style.position = 'relative';
            imgContainer.innerHTML = `<div class="preview-loading" style="width: 100%; height: 80px; background: var(--input-bg); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 10px;">LOADING</div>`;
            previewGrid.prepend(imgContainer);

            const reader = new FileReader();
            reader.onload = (event) => {
                imgContainer.innerHTML = `
                    <img src="${event.target.result}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px;">
                    <div class="remove-img" style="position: absolute; top: -5px; right: -5px; background: red; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px;">&times;</div>
                `;

                imgContainer.querySelector('.remove-img').onclick = () => {
                    selectedFiles = selectedFiles.filter(f => f !== file);
                    imgContainer.remove();
                };
            };
            reader.readAsDataURL(file);
        });
    };

    // Handle Submit
    document.getElementById('submit-post-btn').onclick = async () => {
        const content = document.getElementById('new-post-content').value.trim();

        let title = null;

        if (postType === 'dept') {
            const titleElement = document.getElementById('new-post-title');
            if (titleElement) {
                title = titleElement.value.trim();
            }

            if (!title) {
                window.openAlert('warning', "Department posts must have a title.");
                return;
            }
        }

        if (postType === 'official') {
            const department = document.getElementById('official_department').value;

            if (!department) {
                window.openAlert('warning', "Department posts must have a department.");
                return;
            }
        }

        const dynamicDepartmentId = (postType === 'official' ? document.getElementById('official_department').value : departmentId)


        if (content || selectedFiles.length > 0) {
            // Updated to handle both content and images
            window.handlePostSubmission(content, selectedFiles, postType, dynamicDepartmentId, title);
            overlay.remove();
        }
    };
};

window.handlePostSubmission = async function (content, selectedFiles = [], postType = 'user', departmentId = null, title = null) {
    const user = window.currentUser;
    if (!user) {
        window.openAlert('warning', "Please log in to post.");
        return;
    }

    try {
        console.log("Starting upload...");

        // Upload all selected images in parallel but maintain order (Max 5)
        const imageUrls = await Promise.all(selectedFiles.map(async (file) => {
            const compressedBlob = await window.compressImage(file, { quality: 0.7 });
            return await uploadPostImage(compressedBlob, file.name);
        }));

        if (postType === 'dept') {
            const deptPostData = {
                author_id: user.id,
                content: content,
                department_key: departmentId,
                title: title,
                image_1: imageUrls[0] || null,
                image_2: imageUrls[1] || null,
                image_3: imageUrls[2] || null,
                image_4: imageUrls[3] || null,
                image_5: imageUrls[4] || null,
                type: 'dept'
            };

            const { error } = await window.supabaseClient
                .from('pending_posts')
                .insert([deptPostData])

            if (error) throw error;

        } else if (postType === 'user') {
            const postData = {
                content: content,
                author_id: user.id,
                image_1: imageUrls[0] || null,
                image_2: imageUrls[1] || null,
                image_3: imageUrls[2] || null,
                image_4: imageUrls[3] || null,
                image_5: imageUrls[4] || null,
                type: 'user'
            };

            const { error } = await window.supabaseClient
            // from user_posts to pending_posts (to be handled by admin)
                .from('pending_posts')
                .insert([postData]);

            if (error) throw error;
        } else if (postType === 'official') {
            const postData = {
                content: content,
                image_url: imageUrls[0] || null,
                department_key: departmentId
            }

            const {error} = await window.supabaseClient
                .from('notices')
                .insert([postData]);
            if (error) throw error;
        }

        window.openAlert('success', "Posted successfully!");
        // Refresh feed if function exists
        if (typeof window.renderSocialFeed === 'function') {
            window.renderSocialFeed();
        } else if (typeof window.initDepartment === 'function') {
            // If on department page, refresh posts
            window.initDepartment();
        }

    } catch (err) {
        console.error("Submission failed:", err.message);
        window.openAlert('caution', "Error: " + err.message + "\nPlease try again.");
    }
};

// 1. Extracted Compression Logic
window.compressImage = async function compressImage(file, { quality = 0.8, maxWidth = 1200 }) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
            img.src = event.target.result;
            img.onerror = (err) => reject(err);
        };
        reader.readAsDataURL(file)
        reader.onerror = (err) => reject(err);
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}

// 2. Extracted Supabase Storage Logic
async function uploadPostImage(blob, fileName) {
    const bucket = 'images';
    const filePath = `social/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    const { data: buckets, error: bucketError } = await window.supabaseClient.storage.listBuckets();
    console.log("Available buckets:", buckets);
    if (bucketError) console.error("Bucket fetch error:", bucketError);

    const { data, error } = await window.supabaseClient.storage
        .from(bucket)
        .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: false
        });

    if (error) throw error;

    const { data: { publicUrl } } = window.supabaseClient.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return publicUrl;
}

function renderMemberTags(members, container) {
    container.innerHTML = members.map(m => `
        <span class="tag" style="background: var(--accent-primary); padding: 4px 8px; border-radius: 4px; font-size: 12px; color: white; display: flex; align-items: center; gap: 5px;">
            ${m.name}
            <b style="cursor: pointer;" class="remove-member-btn" data-id="${m.id}">&times;</b>
        </span>
    `).join('');
}

window.hasChats = async function (user) {
    const { data, error } = await window.supabaseClient
        .from('chat_room_member')
        .select('member_id')
        .eq('member_id', user.id)

    if (data.length <= 0) {
        console.log('no chats found for user!')
        console.log(data);
        return false;
    } else {
        console.log('chats found for user!')
        return true;
    }
}

window.doesUserExist = async function (searchQuery) {
    const user = window.currentUser;
    if (!user) return [];

    const { data, error } = await window.supabaseClient
        .from('profiles')
        .select('id, full_name, profile_picture') // Select ID so you can add them to a chat
        .ilike('full_name', `%${searchQuery}%`) // Finds matches anywhere in the name
        .neq('id', user.id) // dont search yourself 
        .limit(10);

    if (error) {
        console.error("Search error:", error.message);
        return [];
    }

    console.log(data);
    return data;
};

function formatDisplayTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}


window.cachedChatList = null;

window.renderChatList = async function (user) {
    const listContainer = document.getElementById('chat-previews-list');
    if (!listContainer) return;

    const drawListHTML = (rooms) => {
        if (!rooms || rooms.length === 0) {
            listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8;">No chats yet</div>';
            return;
        }

        listContainer.innerHTML = rooms.map(room => {
            const initial = room.room_name.charAt(0).toUpperCase();
            const profile_picture = room.profile_picture || initial;
            const displayTime = formatDisplayTime(room.last_message_time);
            let safeText = room.last_message_text ? room.last_message_text.replace(/[&<>'"]/g,
                tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])
            ) : 'No messages yet';

            if (safeText.length > 30) safeText = safeText.substring(0, 30) + '...';
            const safeRoomName = room.room_name.replace(/'/g, "\\'");

            const avatarHtml = room.profile_picture
                ? `<img src="${room.profile_picture}" style="width:100%; height: 100%; object-fit: cover; border-radius: 50%">`
                : `<div style="width: 100%; height: 100%; background: var(--accent-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 50%;">${initial}</div>`;

            return `
                    <div class="chat-preview" onclick="window.loadConversation('${room.room_id}', '${safeRoomName}', '${room.profile_picture}', this)"><div class="profile-avatar">${avatarHtml}</div>
                    <div class="chat-info">
                        <div class="chat-name-row">
                            <span class="chat-name">${room.room_name}</span>
                            <span class="chat-time" style="font-size: 0.75rem; color: var(--text-muted);">${displayTime}</span>
                        </div>
                        <div class="chat-last-msg-row">
                            <span class="chat-last-msg" id="last-msg-${room.room_id}" style="font-size: 0.85rem; color: var(--text-muted);">${safeText}</span>
                            <span class="unread-badge" style="display: none;">0</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    if (window.cachedChatList) {
        drawListHTML(window.cachedChatList);
    } else {
        listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8;">Loading chats...</div>';
    }

    const { data: rooms, error } = await window.supabaseClient
        .from('user_chat_list')
        .select('*')
        .eq('member_id', user.id)
        .order('last_message_time', { ascending: false, nullsFirst: false });

    if (error) {
        console.error("Error fetching chat list:", error);
        if (!window.cachedChatList) {
            listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #ef4444;">Failed to load chats</div>';
        }
        return;
    }

    console.log(window.cachedChatList);


    // 4 Only redraw the UI if the new data is actually different from the cache
    if (JSON.stringify(window.cachedChatList) !== JSON.stringify(rooms)) {
        window.cachedChatList = rooms; // Update cache
        drawListHTML(rooms);           // Redraw UI silently
    }
}

async function renderMessages(messages, currentUserId, currentName) {
    const container = document.querySelector('.messages-wrapper');
    if (!container) return;


    console.log(currentName)

    if (!messages || messages.length === 0) {
        container.innerHTML = `<div style="display: flex; height: 100%; align-items: center; justify-content: center; color: #94a3b8;">No messages yet. Say hi!</div>`;
        return;
    }

    const processedMessages = await Promise.all(messages.map(msg => {
        const isMe = msg.author_id === currentUserId;
        const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const { text, gif } = parseMessageContent(msg.text);
        return `
            <div class="message-bubble-wrapper ${isMe ? 'is-me' : ''}">
                <span class="chat-username">${msg.profiles?.full_name || ''}</span>
                <div style="display: flex; align-items: center; gap: 4px; ${isMe ? 'flex-direction: row-reverse;' : ''}">
                    <div class="message-bubble">
                        ${text ? text : ''}
                        ${gif && gif.length > 0 ? gif.map(url => `<img src="${url}" class="chat-gif-embed" />`).join('') : ''}
                    </div>

                    <div class="dropdown message-options">
                        <button class="dropdown-trigger" style="background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; font-size: 1rem;">
                            ⋮
                        </button>
                        <div class="dropdown-menu">
                            <div class="dropdown-column">
                                <a href="#" class="dropdown-item" onclick="window.reportMessage(event, '${msg.id}')">
                                    <div class="dropdown-info">
                                        <div class="dropdown-title">Report</div>
                                        <p class="dropdown-desc" style="font-size: 0.7rem;">Notify moderators about this message.</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="message-meta">
                    ${time} ${isMe ? '✓' : ''}
                </div>
            </div>
        `;
    }));

    container.innerHTML = processedMessages.join('');

    setTimeout(() => container.scrollTop = container.scrollHeight, 10);
}

window.reportMessage = async (event, msgId) => {
    event.preventDefault();
    event.stopPropagation();
    
    const { data: msg, error: fetch_error } = await window.supabaseClient
        .from('message')
        .select('*')
        .eq('id', msgId)
        .single();

    const dropdown = event.target.closest('.dropdown');
    if (dropdown) dropdown.classList.remove('is-open');

    const reason = prompt("Why are you reporting this message?");
    if (reason) {
        const newValue = { ...msg, reason: reason, reported_message_id: msgId };
        delete newValue.id;

        const { data: rejected_msg, error: report_error } = await window.supabaseClient
            .from('reported_messages')
            .insert(newValue);

        if (report_error) {
            console.error("Report failed:", report_error);
        } else {
            console.log(`Message ${msgId} reported for: ${reason}`);
            alert("Thank you. Our moderators will review this message.");
        }
    }
};

async function appendSingleMessage(msg, currentUserId) {
    const container = document.querySelector('.messages-wrapper');
    if (!container) return;
    if (container.innerHTML.includes('No messages yet')) container.innerHTML = '';

    const isMe = msg.author_id === currentUserId;
    const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const { text, gifs } = await parseMessageContent(msg.text);
    const msgHTML = `
        <div class="message-bubble-wrapper ${isMe ? 'is-me' : ''}">
            <span class="chat-username">${msg?.profiles?.full_name || ''}</span>
            <div style="display: flex; align-items: center; gap: 4px; ${isMe ? 'flex-direction: row-reverse;' : ''}">
                <div class="message-bubble">
                    ${text ? text : ''}
                    ${gifs ? gifs.map(url => `<img src="${url}" class="chat-gif-embed" alt="${url}" />`).join('') : ''}            
                </div>

                <div class="dropdown message-options">
                    <button class="dropdown-trigger" style="background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; font-size: 1rem;">
                        ⋮
                    </button>
                    <div class="dropdown-menu">
                        <div class="dropdown-column">
                            <a href="#" class="dropdown-item" onclick="window.reportMessage(event, '${msg.id}')">
                                <div class="dropdown-info">
                                    <div class="dropdown-title">Report</div>
                                    <p class="dropdown-desc" style="font-size: 0.7rem;">Notify moderators about this message.</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="message-meta">
                ${time} ${isMe ? '✓' : ''}
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', msgHTML);
    setTimeout(() => container.scrollTop = container.scrollHeight, 10);
}

// We need a place to store the compressed file so your upload function can access it later.
window.compressedChatroomPhoto = null;

window.previewImage = async function (event) {
    const input = event.target;
    const previewImg = document.getElementById('previewImg');
    const previewContainer = document.getElementById('previewContainer');
    const uploadLabel = document.getElementById('uploadLabel');

    if (input.files && input.files[0]) {
        const originalFile = input.files[0];

        try {
            const compressedBlob = await window.compressImage(originalFile, { quality: 0.7, maxWidth: 800 });

            // Save the compressed Blob, submit button can grab it later
            window.compressedChatroomPhoto = compressedBlob;

            const objectUrl = URL.createObjectURL(compressedBlob);
            previewImg.src = objectUrl;
            previewContainer.style.display = 'block';
            uploadLabel.style.borderStyle = 'solid';

            console.log(window.compressedChatroomPhoto);

        } catch (error) {
            console.error("Compression failed:", error);
            uploadLabel.innerHTML = 'UPLOAD CHATROOM PHOTO';
            if (typeof window.openAlert === 'function') {
                window.openAlert('warning', "Failed to process image. Please try another.");
            }
        }
    }
};

window.showCreateChatUI = function () {
    const container = document.querySelector('.messages-wrapper');
    if (!container) return;

    // Disable chat input while creating room
    const chatInput = document.getElementById('chat-message-input');
    if (chatInput) chatInput.disabled = true;

    container.innerHTML = `
        <div class="create-chat-room-form" style="padding: 40px; margin: 0 auto; width: 100%;">
            <h3 style="color: var(--text-main); margin-bottom: 24px; font-size: 1.5rem;">Start a New Chat</h3>

            <div class="input-group" style="margin-bottom: 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <input type="file" id="imageInput" accept="image/*" onchange="previewImage(event)" style="display: none;">
                <label for="imageInput" id="previewContainer" style="display: block; cursor: pointer; transition: opacity 0.3s;">
                    <img id="previewImg" src="" style="width: 120px; height: 120px; object-fit: cover; border-radius: 50%; border: 3px solid var(--accent-primary); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                </label>
                <label for="imageInput" id="uploadLabel" class="btn-primary" style="display: block; width: 100%; padding: 14px; font-weight: 700; border: 2px dashed var(--accent-primary); border-radius: 12px; cursor: pointer; background: rgba(0,0,0,0.02); color: var(--accent-primary); box-sizing: border-box; transition: 0.2s; margin: 0;">
                    📸 UPLOAD CHATROOM PHOTO
                </label>
                <small style="color: var(--text-muted); margin-top: -4px;">(optional)</small>
            </div>
            
            <div class="input-group" style="margin-bottom: 20px;">
                <label style="display: block; color: var(--text-muted); font-size: 0.75rem; font-weight: 700; margin-bottom: 8px; text-transform: uppercase;">Chatroom Name</label>
                <input type="text" class="global-input" id="new-room-name" placeholder="e.g. Project Group" 
                       style="width: 100%; padding: 12px; border: 1px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.02); color: var(--text-main); border-radius: 8px; outline: none;">
            </div>

            <div class="input-group" style="margin-bottom: 20px; position: relative;">
                <label style="display: block; color: var(--text-muted); font-size: 0.75rem; font-weight: 700; margin-bottom: 8px; text-transform: uppercase;">Add Members</label>
                <input class="global-input" type="text" id="room-members-input" placeholder="Search students..." autocomplete="off"
                       style="width: 100%; padding: 12px; border: 1px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.02); color: var(--text-main); border-radius: 8px; outline: none;">
                
                <div id="search-results-dropdown" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--bg-color); border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; z-index: 10; max-height: 200px; overflow-y: auto; margin-top: 5px; box-shadow: var(--shadow-soft);"></div>
                
                <div id="selected-members-tags" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px;"></div>
            </div>

            <button id="confirm-create-room" class="btn-primary" 
                    style="width: 100%; padding: 14px; font-weight: 700; border-radius: 12px; cursor: pointer; background: var(--accent-primary); color: var(--inverted-text-color); border: none;">
                CREATE CHATROOM
            </button>
        </div>
    `;

    // Re-attach listeners for the new elements
    const roomMembers = document.getElementById('room-members-input');
    const resultsDropdown = document.getElementById('search-results-dropdown');
    const tagsContainer = document.getElementById('selected-members-tags');
    let selectedMembers = [];

    tagsContainer.onclick = (e) => {
        if (e.target.classList.contains('remove-member-btn')) {
            const id = e.target.getAttribute('data-id');
            selectedMembers = selectedMembers.filter(m => m.id !== id);
            renderMemberTags(selectedMembers, tagsContainer);
        }
    };

    roomMembers.addEventListener('input', async function (e) {
        const query = e.target.value.trim();
        if (query.length < 3) {
            resultsDropdown.style.display = 'none';
            return;
        }

        const users = await window.doesUserExist(query);
        if (users && users.length > 0) {
            resultsDropdown.innerHTML = users.map(student => `
                <div class="search-result-item" 
                    data-id="${student.id}" 
                    data-name="${student.full_name}"
                    style="padding: 12px; cursor: pointer; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; align-items: center; gap: 10px;">
                    <div style="background: var(--accent-primary); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: var(--inverted-text-color);">
                        ${student.full_name.substring(0, 1)}
                    </div>
                    <span style="color: var(--text-main); font-size: 14px;">${student.full_name}</span>
                </div>
            `).join('');
            resultsDropdown.style.display = 'block';

            document.querySelectorAll('.search-result-item').forEach(item => {
                item.onclick = () => {
                    const id = item.getAttribute('data-id');
                    const name = item.getAttribute('data-name');
                    if (!selectedMembers.some(m => m.id === id)) {
                        selectedMembers.push({ id, name });
                        renderMemberTags(selectedMembers, tagsContainer);
                    }
                    roomMembers.value = '';
                    resultsDropdown.style.display = 'none';
                };
            });
        } else {
            resultsDropdown.innerHTML = `<p style="color: var(--text-muted); padding: 12px; font-size: 12px;">No students found...</p>`;
            resultsDropdown.style.display = 'block';
        }
    });

    const confirmBtn = document.getElementById('confirm-create-room');
    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            const name = document.getElementById('new-room-name').value.trim();
            const chatRoomPhoto = window.compressedChatroomPhoto;

            // Process upload image file to database (ONLY if an image was selected)
            let photoUrl = null;
            if (chatRoomPhoto) {
                // Blobs don't have names, so we just provide a default one
                photoUrl = await uploadPostImage(chatRoomPhoto, 'chatroom_avatar.jpg');
                window.compressedChatroomPhoto = null;
            }
            if (!name) return alert('Please enter a room name');


            const user = window.currentUser;
            if (!user) return alert("please login")

            try {
                const { data: room, error: roomError } = await window.supabaseClient
                    .from('chat_room')
                    .insert([{ name: name, profile_picture: photoUrl }])
                    .select()
                    .single();
                if (roomError) throw roomError;

                const membershipRows = [{
                    chat_room_id: room.id,
                    member_id: user.id
                },
                ...selectedMembers.map(m => ({
                    chat_room_id: room.id,
                    member_id: m.id
                }))
                ];

                const { error: memberError } = await window.supabaseClient
                    .from('chat_room_member')
                    .insert(membershipRows);

                if (memberError) throw memberError;

                window.openAlert('success', (`Group "${name}" created successfully!`));
                await window.renderChatList(user);
                window.loadConversation(room.id, name);
            } catch (err) {
                console.error("Creation failed:", err.message);
                window.openAlert('warning', ("Error: " + err.message));
            }
        };
    }
}

window.openChat = async function (e) {
    let user = window.currentUser

    if (!user) {
        const { data } = await window.supabaseClient.auth.getUser();
        if (!data?.user) return alert("Log in to chat");

        user = data.user;

        window.currentUser = user;
        window.currentUserId = user.id
    }


    window.currentUser = user;
    window.currentUserId = user.id;

    const overlay = document.createElement('div');
    overlay.className = 'post-modal-overlay';


    overlay.innerHTML = `
        <div class="post-modal-card chat mobile-view-list" id="chat-modal-card" style="min-width: 95vw; min-height:95vh; max-width: 95vw;">
            <!-- Left Navigation Sidebar - Simplified -->

            <!-- Middle Chat List Sidebar -->
            <aside class="left-sidebar-chat">
                <div class="chat-list-header">
                    <h2>My Chats <button class="create-chat-btn" id="open-create-chat">+</button></h2>
                    <div class="search-container">
                        <input type="text" id="chat-search-input" placeholder="Search chats..." onInput="searchConversation()">
                    </div>
                </div>
                
                <div class="chat-tabs">
                    <div class="chat-tab active">All Messages</div>
                </div>

                <div class="chat-previews" id="chat-previews-list">
                    <!-- Loaded via JS -->
                </div>
            </aside>

            <!-- Main Chat Area -->
            <div class="main-chats-container" id="main-chats-container">
                <div class="chat-header">
                    <button class="chat-back-btn" id="chat-back-to-list" style="display: none; background: none; border: none; color: var(--text-main); font-size: 1.5rem; cursor: pointer; padding: 0 10px;">←</button>
                    <div class="chat-header-user">
                        <div id="active-chat-avatar" style="width: 40px; height: 40px; background: var(--accent-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--inverted-text-color); position: relative;">
                            ?
                            <div class="status-dot"></div>
                        </div>
                        <div>
                            <div id="active-chat-name" style="font-weight: 700; color: var(--text-main);">Select a chat</div>
                            <div id="active-chat-status" style="font-size: 0.75rem; color: var(--text-muted);"></div>
                        </div>
                    </div>
                    <div class="chat-header-actions">
                        <button class="info-btn" id="info-btn" style="position: static; font-size: 1.5rem;">...</button>
                        <button class="close-btn" style="position: static; font-size: 1.5rem;">&times;</button>
                    </div>
                </div>

                <div class="messages-wrapper">
                    <div style="display: flex; height: 100%; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); gap: 16px;">
                        <span style="font-size: 3rem; opacity: 0.2;">💬</span>
                        <span>Select a conversation to start chatting</span>
                    </div>
                </div>

                <div class="chat-input-container">
                    <div class="chat-input-wrapper">
                        <input type="text" id="chat-message-input" placeholder="Type a message..." disabled>
                        <button style="background: none; border: none; font-size: 1.25rem; cursor: pointer; color: var(--accent-primary);" id="send-chat-btn">➔</button>
                    </div>
                </div>
            </div>

            <!-- Right Sidebar Info -->
            <aside class="right-sidebar-info hidden" id="chat-info-sidebar">
                <div class="info-header-mobile" style="display: none; align-items: center; padding: 10px 20px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <button id="info-back-to-chat" style="background: none; border: none; color: var(--text-main); font-size: 1.5rem; cursor: pointer; padding: 0 10px 0 0;">←</button>
                    <h3 style="margin: 0; font-size: 1.1rem;">Chat Info</h3>
                </div>
                <div class="info-profile-section">
                    <div class="info-avatar-large" id="info-room-avatar">?</div>
                    <div class="info-room-name" id="info-room-name">Chat Name</div>
                    
                    <div class="info-actions-dropdown">
                        <button class="info-actions-btn" id="info-actions-toggle">
                            Settings ▾
                        </button>
                        <div class="chat-info-dropdown" id="info-dropdown-menu">
                            <div class="chat-info-dropdown-item" id="change-chat-name-btn">
                                <span>✏️</span> Change Name
                            </div>
                            <div class="chat-info-dropdown-item" id="change-chat-photo-btn"}">
                                <span>📸</span> Change Photo
                            </div>
                            <input id="change-room-photo" type="file" accept="image/*" onclick="">
                        </div>
                    </div>
                </div>
                <div class="info-members-section">
                    <span class="info-section-title">Members</span>
                        <div class="info-members-list" id="info-members-list">
                             <!-- Members loaded here -->
                        </div>
                     </div>
            </aside>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.onclick = (e) => {
        if (e.target === overlay || e.target.classList.contains('close-btn')) overlay.remove();
    };

    // Listeners
    document.getElementById('open-create-chat').onclick = () => window.showCreateChatUI();
    document.getElementById('info-btn').onclick = () => window.toggleInfoSidebar();

    // Mobile Back Buttons
    const backToList = document.getElementById('chat-back-to-list');
    if (backToList) {
        backToList.onclick = () => {
            const card = document.getElementById('chat-modal-card');
            card.classList.remove('mobile-view-chat');
            card.classList.add('mobile-view-list');
        };
    }

    const backToChat = document.getElementById('info-back-to-chat');
    if (backToChat) {
        backToChat.onclick = () => {
            window.toggleInfoSidebar();
        };
    }

    document.getElementById('change-chat-name-btn').onclick = () => window.changeChatName();
    document.getElementById('change-chat-photo-btn').onclick = () => window.changeChatPhoto();

    const actionsToggle = document.getElementById('info-actions-toggle');
    if (actionsToggle) {
        actionsToggle.onclick = (e) => {
            e.stopPropagation();
            document.getElementById('info-dropdown-menu').classList.toggle('show');
        };
    }

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('info-dropdown-menu');
        const toggle = document.getElementById('info-actions-toggle');
        if (menu && menu.classList.contains('show') && !toggle.contains(e.target)) {
            menu.classList.remove('show');
        }
    });

    const chatInput = document.getElementById('chat-message-input');
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim() !== '' && window.currentChatRoomId) {
            submitChatMessage(chatInput.value, window.currentChatRoomId);
            chatInput.value = '';
        }
    });

    document.getElementById('send-chat-btn').onclick = () => {
        if (chatInput.value.trim() !== '' && window.currentChatRoomId) {
            submitChatMessage(chatInput.value, window.currentChatRoomId);
            chatInput.value = '';
        }
    };

    // Initial Load
    window.renderChatList(user);
}

function searchConversation() {
    const searchInput = document.getElementById('chat-search-input').value.toLowerCase();
    const chats = document.querySelectorAll('.chat-preview')

    chats.forEach((chat) => {
        const chatName = chat.querySelector('.chat-name').textContent.toLowerCase();
        
        if (chatName.includes(searchInput)) {
            chat.style.display = 'flex';
        } else {
            chat.style.display = 'none';
        }
    });

}

window.toggleInfoSidebar = function () {
    const sidebar = document.getElementById('chat-info-sidebar');
    if (!sidebar) return;

    const card = document.getElementById('chat-modal-card');
    sidebar.classList.toggle('hidden');

    if (!sidebar.classList.contains('hidden')) {
        if (card) {
            card.classList.remove('mobile-view-chat');
            card.classList.add('mobile-view-info');
        }
        const roomId = window.currentChatRoomId;
        const roomName = document.getElementById('active-chat-name').textContent;
        // Grab the photo we saved globally in loadConversation
        const profilePicture = window.currentChatRoomPhoto;

        if (roomId && roomName !== 'Select a chat') {
            window.renderChatInfo(roomId, roomName, profilePicture);
        }
    } else {
        if (card) {
            card.classList.remove('mobile-view-info');
            card.classList.add('mobile-view-chat');
        }
    }
};

window.renderChatInfo = async function (roomId, roomName, profilePicture) {
    const nameEl = document.getElementById('info-room-name');
    const avatarEl = document.getElementById('info-room-avatar');
    const membersList = document.getElementById('info-members-list');

    if (!nameEl || !avatarEl || !membersList) return;

    nameEl.textContent = roomName;


    // Apply the custom photo logic to the big RIGHT SIDEBAR avatar (avatarEl)
    if (profilePicture && profilePicture !== 'null' && profilePicture !== 'undefined') {
        avatarEl.innerHTML = `<img src="${profilePicture}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        avatarEl.style.background = 'transparent'; // Optional: removes the background color if the image has transparency
    } else {
        avatarEl.innerHTML = roomName.charAt(0).toUpperCase();
        avatarEl.style.background = 'var(--accent-primary)'; // Restore default background
    }

    membersList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 10px;">Loading members...</div>';

    const { data, error } = await window.supabaseClient
        .from('chat_room_member')
        .select(`
            member_id,
            profiles (
                full_name,
                profile_picture
            )
        `)
        .eq('chat_room_id', roomId);

    if (error) {
        console.error("Error fetching members:", error);
        membersList.innerHTML = '<div style="color: #ef4444; font-size: 0.85rem; padding: 10px;">Failed to load members</div>';
        return;
    }

    membersList.innerHTML = data.map(m => `
        <div class="info-member-item">
            <div class="info-member-avatar">
                ${m.profiles?.profile_picture
            ? `<img src="${m.profiles.profile_picture}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
            : (m.profiles?.full_name?.charAt(0).toUpperCase() || '?')}
            </div>
            <span class="info-member-name">${m.profiles?.full_name || 'Unknown User'}</span>
        </div>
    `).join('');
};


window.changeChatName = async function () {
    const roomId = window.currentChatRoomId;
    if (!roomId) return;

    const oldName = document.getElementById('active-chat-name').textContent.trim();

    const overlay = document.createElement('div');
    overlay.className = 'post-modal-overlay';

    overlay.innerHTML = `
        <div class="post-modal-card vertical-layout" style="padding: 30px; max-width: 600px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: var(--accent-primary);">Change Chat Name</h3>
                <button class="close-btn" style="position: static; font-size: 1.5rem;">&times;</button>
            </div>

            <div class="input-group">
                <label style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">WHAT'S ON YOUR MIND?</label>
                <textarea id="new-name-chatroom" oninput='this.style.height = "";this.style.height = this.scrollHeight + "px"' placeholder="..."></textarea>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 20px;">
                <button class="btn-primary" id="change-name-btn" style="flex: 1; font-weight: 600">Change Name</button>
            </div>
        </div>
    `;

    overlay.onclick = (e) => {
        if (e.target === overlay || e.target.classList.contains('close-btn')) overlay.remove();
    };

    document.body.appendChild(overlay);

    document.getElementById('change-name-btn').onclick = async () => {
        const newName = document.getElementById('new-name-chatroom').value;
        if (newName && newName.trim() && newName !== oldName) {
            try {
                const { data, error, count } = await window.supabaseClient
                    .from('chat_room')
                    .update({ name: newName.trim() })
                    .eq('id', roomId)
                    .select();

                if (error) throw error;

                const trimmedName = newName.trim();
                document.getElementById('active-chat-name').textContent = trimmedName;
                document.getElementById('info-room-name').textContent = trimmedName;
                document.getElementById('info-room-avatar').textContent = trimmedName.charAt(0).toUpperCase();
                document.getElementById('active-chat-avatar').textContent = trimmedName.charAt(0).toUpperCase();

                console.log("Rows affected:", count);
                console.log("Updated data:", data);

                if (error) throw error;
                if (!data || data.length === 0) {
                    console.log(roomId)
                    console.warn("No rows matched that ID or RLS blocked the update.");
                    return;
                }

                // Refresh chat list to update name there
                if (window.currentUser) {
                    window.renderChatList(window.currentUser);
                    window.loadConversation(roomId, trimmedName, window.currentChatRoomPhoto);
                }

                window.openAlert('success', "Chat name updated!");
                overlay.remove();
            } catch (err) {
                console.error("Failed to update chat name:", err);
                window.openAlert('warning', "Error: " + err.message);
            }
        }
    }
};

window.changeChatPhoto = async function () {
    const roomId = window.currentChatRoomId;
    if (!roomId) return;
    const imageInput = document.getElementById('change-room-photo')
    const roomName = document.getElementById('active-chat-name').textContent;


    imageInput.click();

    imageInput.onchange = async (e) => {
        const image = e.target.files[0]
        if (!image) return;

        try {
            // Upload to supabase
            const imageUrl = await uploadPostImage(image, image.name);


            const { data, error, count } = await window.supabaseClient
                .from('chat_room')
                .update({ profile_picture: imageUrl })
                .eq('id', roomId)
                .select();

            if (error) throw error;

            if (data && data.length > 0) {
                window.openAlert('success', 'Photo Updated!')
                window.renderChatList(window.currentUser);
                window.renderChatInfo(roomId, roomName, imageUrl);
            }

        } catch (err) {

        }
    }

};

window.loadConversation = async function (roomId, roomName, profilePicture, element) {
    document.querySelectorAll('.chat-preview').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    const card = document.getElementById('chat-modal-card');
    if (card) {
        card.classList.remove('mobile-view-list');
        card.classList.add('mobile-view-chat');
    }

    const chatInput = document.getElementById('chat-message-input');
    if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = "Type a message...";
        chatInput.focus();
    }

    window.currentChatRoomId = roomId;
    window.currentChatRoomPhoto = profilePicture;

    if (roomName) {
        window.renderChatInfo(roomId, roomName, profilePicture);
        console.log(roomName);
        document.getElementById('active-chat-name').textContent = roomName;
        const avatarContainer = document.getElementById('active-chat-avatar');
        if (profilePicture && profilePicture !== 'null' & profilePicture !== 'undefined') {
            avatarContainer.innerHTML = `<img src="${profilePicture}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            avatarContainer.innerHTML = roomName.charAt(0).toUpperCase();
        }


        const sidebar = document.getElementById('chat-info-sidebar hidden');
        if (sidebar && !sidebar.classList.contains('hidden')) {
            window.renderChatInfo(roomId, roomName, profilePicture);
        }
    }

    const container = document.querySelector('.messages-wrapper');
    container.innerHTML = `<div style="display: flex; height: 100%; align-items: center; justify-content: center; color: #94a3b8;">Loading messages...</div>`;

    const { data, error } = await window.supabaseClient
        .from('message')
        .select(`
            id,
            text,
            created_at,
            author_id,
            profiles(full_name)`)
        .eq('chat_room_id', roomId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Er loading messages', error);
        container.innerHTML = `<div style="display: flex; height: 100%; align-items: center; justify-content: center; color: #ef4444;">Failed to load messages</div>`;
        return;
    }

    renderMessages(data, window.currentUserId, window.currentUser);
    if (typeof subscribeToRoom === 'function') subscribeToRoom(roomId, window.currentUserId);
};

function findGifLinks(text) {
    if (!text) return [];
    const gifRegex = /https?:\/\/\S+\.(?:gif|webp|jpg|png)(?:\?[^\s]*)?/gi;
    const matches = text.match(gifRegex) || [];
    console.log("Regex Found Links:", matches); // Debug log 1
    return matches;
}

function parseMessageContent(text) {
    const links = findGifLinks(text.trim());
    let cleanText = text;

    links.forEach(link => {
        cleanText = cleanText.replace(link, "");
    });

    console.log(cleanText.trim(), links[0])

    return {
        text: escapeHTML(cleanText.trim()),
        gif: links
    }
}

async function submitChatMessage(text, roomId) {
    if (!text.trim()) return;

    const user = window.currentUser;
    if (!user) return alert("Log in to chat!");

    const tempId = window.crypto.randomUUID();


    const newMsg = {
        id: tempId,
        text: text.trim(),
        author_id: user.id,
        created_at: new Date().toISOString(),
        profiles: { full_name: user.user_metadata?.full_name || 'You' }
    }

    window.renderedMessagesIds.add(tempId)
    appendSingleMessage(newMsg, user.id);


    // Everyone will receive the notification via the 'postgres_changes' listener.
    // whereas before it only goes through the broadcast changes and doesn't change a single thing in the database.

    const { error } = await window.supabaseClient
        .from('message')
        .insert({
            id: tempId,
            chat_room_id: roomId,
            author_id: user.id,
            text: escapeHTML(text.trim())
        });

    if (error) {
        console.error("failed to save message: ", error);
    }
}


window.renderedMessagesIds = new Set();


// Watch the message table and let the client know whenever a row is inserted 
// where the 'chat_room_id' matches the room
function subscribeToRoom(roomId, currentUserId) {
    if (window.chatChannel) window.supabaseClient.removeChannel(window.chatChannel);

    window.chatChannel = window.supabaseClient
        .channel(`room-${roomId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'message',
                filter: `chat_room_id=eq.${roomId}`
            },
            (payload) => {
                const newMessage = payload.new;

                // Deduplication check
                // Prevents the sender from seeing their own message
                // Minutes wasted: 5 hours
                console.log(payload.new)

                if (!window.renderedMessagesIds.has(newMessage.id)) {
                    window.renderedMessagesIds.add(newMessage.id);

                    const displayMsg = {
                        ...newMessage,
                        profiles: { full_name: newMessage.author_name || 'user' }
                    };

                    appendSingleMessage(displayMsg, currentUserId);
                }
            }
        )
        .subscribe();
}

