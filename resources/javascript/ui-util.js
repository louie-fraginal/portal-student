window.openPostModal = async function(post, images) {
    const overlay = document.createElement('div');
    overlay.className = 'post-modal-overlay';
    
    // Use the DEPT_MAP we shared across files
    const deptColor = window.DEPT_MAP[post.department]?.color || '#6366f1';

    overlay.innerHTML = `
        <div class="post-modal-card ig-layout">
            <div class="modal-main">
                ${Array.isArray(images) && images[0] ? 
                    `<img src="${images[0]}" class="modal-image" onclick="openFullImage('${images[0]}')">` : ''}
                <div class="modal-gallery">
                ${Array.isArray(images) 
                    ? images
                        .slice(1)
                        .filter(img => img && img !== 'null' && img !== '') 
                        .map(img => `<img src="${img}" class="gallery-image" onclick="openFullImage('${img}')">`)
                        .join('') 
                    : '' 
                }
                </div>
                    <p class="modal-date">${new Date(post.date).toDateString()}</p>
                </div>
            <aside class="modal-comments-sidebar">
                <div class="comments-header">
                    <span class="tag" style="display: flex; justify-content: center; background-color: ${deptColor} !important;">
                        ${post.department}
                    </span>
                </div>
                <h2 style="color: white; padding: 20px !important;">${post.title}</h2>
                <div class="modal-content" 
                    id="content-${post.id}" 
                    data-full-content="${post.content.replace(/"/g, '&quot;')}" 
                    onclick="this.innerHTML = this.getAttribute('data-full-content'); this.style.cursor='default';"
                    style="padding: 0 20px 15px 20px; cursor: pointer;">${window.checkStringLength(post.content, 100)}</div>                
                <div id="modal-comments-list" class="comments-scroll-area"></div>
                <div class="comment-input-area">
                    <input type="text" id="new-comment-input" placeholder="Add a comment...">
                    <button class="send-comment-btn" onclick="submitComment(event, ${post.id})">
                        <svg viewBox="0 0 24 24" class="send-icon"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                    </button>
                </div>
            </aside>
        </div>
    `;

    overlay.onclick = (e) => {
        if (e.target === overlay || e.target.classList.contains('close-btn')) overlay.remove();
    };

    document.body.appendChild(overlay);

    // Add this after you render the modal
    const input = document.getElementById('new-comment-input');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim() !== '') {
            submitComment(null, post.id);
        }
    });
    
    // Ensure these functions are also global
    if (typeof loadModalComments === 'function') loadModalComments(post.id);
};


///////////////////////////////////


window.openFullImage = function(url) {
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

window.formatTimeAgo = function(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

////////////////////////

window.loadModalComments = async function(postId) {
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
        <div class="comment-item" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 10px 0;">
            <strong style="color: var(--accent-primary); font-size: 0.85rem;">
                ${comment.profiles?.full_name || 'Student'}
            </strong>
            <p style="margin: 2px 0; color: white; font-size: 0.8rem;">${comment.content}</p>
            <span style="font-size: 0.65rem; color: #666;">
                ${window.formatTimeAgo(new Date(comment.created_at))}
            </span>
        </div>
    `).join('');
};



///////////////////////////

window.submitComment = async function(event, postId) {
    if (event) event.preventDefault();
    const input = document.getElementById('new-comment-input');
    const content = input.value.trim();
    if (!content) return;

    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return alert("Log in to comment");

    const { error } = await window.supabaseClient
        .from('post_comments')
        .insert({ post_id: postId, user_id: user.id, content: content });

    if (!error) {
        input.value = '';
        await window.loadModalComments(postId);
        if (typeof window.updateCommentCountUI === 'function') {
            window.updateCommentCountUI(postId);
        }
    }
};


/////////////////////////////

window.checkStringLength = function(string, length) {
    // 1. Convert string to an array of actual characters
    const characters = [...string]; 

    if (characters.length >= length) {
        // 2. Slice the array, then join it back into a string
        const truncated = characters.slice(0, length).join('');
        
        return `${truncated}... <p style='color: var(--text-main)'><strong>Read more...</strong></p>`;
    }
    
    return string;
};

window.showFullContent = function(postId) {
    // Instead of passing the whole string, we'll find the element
    const element = document.getElementById(`content-${postId}`);
    
    // We can use a global variable to store the original content temporarily 
    // or just use a data attribute if you want to be fancy.
    // For now, let's assume you want to expand it based on the post data.
    
    // Since this function is called from the UI, it's easier to just 
    // toggle a 'collapsed' class or use a data attribute.
    if (element.innerHTML.includes('Read more...')) {
        // You'll need to make sure the full content is accessible.
        // A simple trick is to check if we stored it in a global map.
        element.innerHTML = element.getAttribute('data-full-content');
    }
};