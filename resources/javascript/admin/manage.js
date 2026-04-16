document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth - assuming window.checkAuth() is defined in ui-util.js or similar
    if (window.checkAuth) {
        await window.checkAuth();
    }

    initTabs();

    // Initial Load
    refreshDashboard();

    // Refresh every 5 minutes
    setInterval(refreshDashboard, 300000);
});

// ========== TABS ==========
function initTabs() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const sections = document.querySelectorAll('.admin-section');

    sidebarItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = item.getAttribute('data-section');

            // Update UI
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === targetSection) {
                    s.classList.add('active');
                }
            });

            // Load section specific data if needed
            if (targetSection === 'posts') window.refreshPosts();
            if (targetSection === 'reports') refreshReports();
            if (targetSection === 'timeline') refreshTimeline();
        });
    });
}

// ========== DASHBOARD LOGIC ==========
async function refreshDashboard() {
    console.log('Refreshing Dashboard Data...');

    try {
        const [usersCount, deptPostsCount, userPostsCount, messagesCount] = await Promise.all([
            fetchCount('profiles'),
            fetchCount('department_posts'),
            fetchCount('user_posts'),
            fetchCount('message')
        ]);

        document.getElementById('total-users-count').textContent = usersCount;
        document.getElementById('total-posts-count').textContent = deptPostsCount + userPostsCount;
        document.getElementById('total-messages-count').textContent = messagesCount;
        document.getElementById('last-sync-time').textContent = new Date().toLocaleTimeString();

        initCharts(deptPostsCount, userPostsCount, messagesCount);
        window.totalUsersCount = usersCount;
        window.totalPostCount = deptPostsCount + userPostsCount;
    } catch (err) {
        console.error('Error refreshing dashboard:', err);
    }
}

async function fetchCount(table) {
    const { count, error } = await window.supabaseClient
        .from(table)
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error(`Error counting ${table}:`, error);
        return 0;
    }
    return count || 0;
}

// ========== CHARTS ==========
let postTrendChart, engagementDonut;

async function initCharts(deptPosts, userPosts, messages) {
    // 1. Post Trend Chart (Last 7 Days)
    const ctxTrend = document.getElementById('postTrendChart')?.getContext('2d');
    if (ctxTrend) {
        if (postTrendChart) postTrendChart.destroy();

        // Fetch trend data
        const days = 7;
        const labels = [];
        const data = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            // In a real app, we'd query by date. For now, we'll randomize or use a simplified query.
            data.push(Math.floor(Math.random() * 10) + 2);
        }

        postTrendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Activity',
                    data: data,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 2. Engagement Donut
    const ctxDonut = document.getElementById('engagementDonut')?.getContext('2d');
    if (ctxDonut) {
        if (engagementDonut) engagementDonut.destroy();

        engagementDonut = new Chart(ctxDonut, {
            type: 'doughnut',
            data: {
                labels: ['Dept Posts', 'User Posts', 'Messages'],
                datasets: [{
                    data: [deptPosts, userPosts, messages],
                    backgroundColor: ['#10b981', '#3b82f6', '#ec4899'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8' } }
                },
                cutout: '70%'
            }
        });
    }
}

// ========== POSTS SECTION ==========
window.refreshPosts = async function refreshPosts() {
    // Placeholder for real logic since schema is limited
    try {
        const [pending, rejected] = await Promise.all([
            window.supabaseClient.from('pending_posts').select('*', { count: 'exact', head: true }),
            window.supabaseClient.from('rejected_posts').select('*', { count: 'exact', head: true })
        ]);

        console.dir(pending);

        document.getElementById('pending-posts-count').textContent = pending.count || 0;
        document.getElementById('accepted-posts-count').textContent = window.totalPostCount;
        document.getElementById('rejected-posts-count').textContent = rejected.count || 0;



    } catch (err) {
        console.error('Error fetching pending posts count', err);
    }


    const list = document.getElementById('posts-review-list');
    if (!list) return;

    // Fetch pending posts
    const { data, error } = await window.supabaseClient
        .from('pending_posts')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })

    console.log(data);
    if (!data || data.length === 0) {
        list.innerHTML = `<div style="text-align: center; padding: 2rem; opacity: 0.5;">No posts to review</div>`;
    } else {
        list.innerHTML = data.map(post => `
            <div class="activity-item">
                <div class="activity-info">
                    <span class="activity-user">${post.profiles?.full_name || 'Anonymous'}</span>
                    <span class="activity-content">${window.checkStringLength ? window.checkStringLength(post.content, 60) : post.content.substring(0, 60)}</span>
                    <div class="modal-gallery">
                    ${post.image_1 ? `${images = [post.image_1, post.image_2, post.image_3, post.image_4, post.image_5].filter(item => item !== null).map(image => `<img class="image" src="${image}">`)}` : ``
            }
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="nav-btn active" style="padding: 4px 12px; font-size: 0.75rem;" onclick="window.approvePost('${post.id}')">Approve</button>
                    <button class="nav-btn" style="padding: 4px 12px; font-size: 0.75rem; border-color: #ef4444; color: #ef4444;" onclick="window.rejectPost('${post.id}')">Reject</button>
                </div>
            </div>
        `).join('');
    }
}

// APPROVE POST
window.approvePost = async function approvePost(id) {
    const { data: post, error } = await window.supabaseClient
        .from('pending_posts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return console.error(error);

    console.log("TO BE APPROVED POST: ", post);

    try {
        if (post.type === 'user') {
            const postData = {
                content: post.content,
                author_id: post.author_id,
                image_1: post.image_1 || null,
                image_2: post.image_2 || null,
                image_3: post.image_3 || null,
                image_4: post.image_4 || null,
                image_5: post.image_5 || null,
            };
            const { error: userPostsError } = await window.supabaseClient
                .from('user_posts')
                .insert(postData);
            
            if (userPostsError) return console.error(deptPostsError);
        } else if (post.type === 'dept') {
            console.log(post);
            const deptPostData = {
                author_id: post.author_id,
                content: post.content,
                department_key: post.department_key,
                title: post.title,
                image_1: post.image_1 || null,
                image_2: post.image_2 || null,
                image_3: post.image_3 || null,
                image_4: post.image_4 || null,
                image_5: post.image_5 || null
            };
            const { error: deptPostsError } = await window.supabaseClient
                .from('department_posts')
                .insert(deptPostData);

            if (deptPostsError) return console.error(deptPostsError);
        }

        const { error: deleteError } = await window.supabaseClient
            .from('pending_posts')
            .delete()
            .eq('id', id);

        if (deleteError) console.error("Cleanup Error:", deleteError);
        window.refreshPosts();
    } catch (err) {
        console.error("ERROR: ", err);
    };
}

window.rejectPost = async function rejectPost(id) {
    const { data: post, error } = await window.supabaseClient
        .from('pending_posts')
        .delete()
        .eq('id', id)
        .select('*')
        .single();

    const { error: rejectedError } = await window.supabaseClient
        .from('rejected_posts')
        .insert(post);

    if (rejectedError) return console.error(rejectedError);
    if (error) return console.error(error);

    window.refreshPosts();
}

// ========== REPORTS SECTION ==========
async function refreshReports() {
    try {
        const [repPosts, repMsgs] = await Promise.all([
            window.supabaseClient.from('reported_posts').select('*').order('created_at', { ascending: false }),
            window.supabaseClient.from('reported_messages').select('*').order('created_at', { ascending: false })
        ]);

        document.getElementById('reported-messages-count').textContent = repMsgs.data?.length || 0;
        document.getElementById('reported-posts-count').textContent = repPosts.data?.length || 0;
        // reported_comments doesn't exist in schema yet
        document.getElementById('reported-comments-count').textContent = 0;

        const list = document.getElementById('reports-list');
        if (!list) return;

        list.innerHTML = '';

        if ((!repPosts.data || repPosts.data.length === 0) && (!repMsgs.data || repMsgs.data.length === 0)) {
            list.innerHTML = '<div style="text-align: center; padding: 2rem; opacity: 0.5;">Queue is clean</div>';
            return;
        }

        // Render Reported Posts
        if (repPosts.data) {
            repPosts.data.forEach(report => {
                const item = document.createElement('div');
                item.className = 'activity-item';
                item.innerHTML = `
                    <div class="activity-info">
                        <span class="activity-user" style="color: #ec4899;">Reported POST</span>
                        <span class="activity-user">${report.author_name || 'Anonymous'}</span>
                        <span class="activity-content">
                            <strong>Reason:</strong> ${report.reason}<br>
                            <strong>Content:</strong> ${report.content || report.title || '(No content)'}
                        </span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="nav-btn" style="padding: 4px 12px; font-size: 0.75rem;" onclick="window.dismissReport('${report.id}', 'reported_posts')">Dismiss</button>
                        <button class="nav-btn" style="padding: 4px 12px; font-size: 0.75rem; border-color: #ef4444; color: #ef4444;" onclick="window.deleteReportedItem('${report.id}', 'reported_posts', '${report.reported_post_id}', '${report.type}')">Delete Post</button>
                    </div>
                `;
                list.appendChild(item);
            });
        }

        // Render Reported Messages
        if (repMsgs.data) {
            repMsgs.data.forEach(report => {
                const item = document.createElement('div');
                item.className = 'activity-item';
                item.innerHTML = `
                    <div class="activity-info">
                        <span class="activity-user" style="color: #3b82f6;">Reported MESSAGE</span>
                        <span class="activity-user">${report.author_name || 'Anonymous'}</span>
                        <span class="activity-content">
                            <strong>Reason:</strong> ${report.reason}<br>
                            <strong>Text:</strong> ${report.text}
                        </span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="nav-btn" style="padding: 4px 12px; font-size: 0.75rem;" onclick="window.dismissReport('${report.id}', 'reported_messages')">Dismiss</button>
                        <button class="nav-btn" style="padding: 4px 12px; font-size: 0.75rem; border-color: #ef4444; color: #ef4444;" onclick="window.deleteReportedItem('${report.id}', 'reported_messages', '${report.reported_message_id}')">Delete Message</button>
                    </div>
                `;
                list.appendChild(item);
            });
        }

    } catch (err) {
        console.error('Error fetching reports:', err);
    }
}

// Action: Dismiss Report (just remove the report entry)
window.dismissReport = async function (reportId, table) {
    const { error } = await window.supabaseClient
        .from(table)
        .delete()
        .eq('id', reportId);

    if (error) console.error("Error dismissing report:", error);
    refreshReports();
};

// Action: Delete Reported Item (remove the item itself AND the report)
window.deleteReportedItem = async function (reportId, reportTable, originalId, postType = null) {
    if (!confirm("Are you sure you want to permanently delete this item?")) return;

    try {
        // 1. Delete original item
        let originalTable = '';
        let safeOriginalId = originalId;

        if (reportTable === 'reported_posts') {
            if (postType === 'dept') {
                originalTable = 'department_posts';
                safeOriginalId = parseInt(originalId);
            } else {
                originalTable = 'user_posts';
            }
        } else {
            originalTable = 'message';
        }

        const { error: delError } = await window.supabaseClient
            .from(originalTable)
            .delete()
            .eq('id', safeOriginalId);

        if (delError) throw delError;

        // 2. Delete report
        await window.supabaseClient
            .from(reportTable)
            .delete()
            .eq('id', reportId);

        alert("Item deleted successfully.");
        refreshReports();   
    } catch (err) {
        console.error("Error deleting reported item:", err);
        alert("Failed to delete item: " + err.message);
    }
};

// ========== TIMELINE SECTION ==========
async function refreshTimeline() {
    const list = document.getElementById('timeline-list');
    if (!list) return;

    try {
        const [posts, comments, messages] = await Promise.all([
            window.supabaseClient.from('user_posts').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(5),
            window.supabaseClient.from('post_comments').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(5),
            window.supabaseClient.from('message').select('*').order('created_at', { ascending: false }).limit(5)
        ]);

        let allActivity = [];

        if (posts.data) posts.data.forEach(p => allActivity.push({ ...p, type: 'post', time: new Date(p.created_at) }));
        if (comments.data) comments.data.forEach(c => allActivity.push({ ...c, type: 'comment', time: new Date(c.created_at) }));
        if (messages.data) messages.data.forEach(m => allActivity.push({ ...m, type: 'message', time: new Date(m.created_at) }));

        allActivity.sort((a, b) => b.time - a.time);

        if (allActivity.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 2rem; opacity: 0.5;">No recent activity found</div>';
            return;
        }

        list.innerHTML = allActivity.map(act => `
            <div class="activity-item">
                <div class="activity-info">
                    <span class="activity-user">${act.profiles?.full_name || act.author_name || 'System'}</span>
                    <span class="activity-content">
                        <strong style="color: var(--accent-primary);">${act.type.toUpperCase()}</strong>: 
                        ${act.content || act.text || 'New activity'}
                    </span>
                </div>
                <span class="activity-time">${act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error fetching timeline:', err);
        list.innerHTML = '<div style="text-align: center; padding: 2rem; opacity: 0.5; color: #ef4444;">Failed to load timeline</div>';
    }
}
