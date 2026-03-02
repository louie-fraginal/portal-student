// ========== DEPARTMENT PAGE CODE PROPERTY OF LOUIE! ==========
// ========== OPEN THE FULL IMAGE FUNCTION (GLOBAL) ==========
window.openFullImage = function(url) {
    const fullView = document.createElement('div');
    fullView.className = 'full-image-overlay';
    
    fullView.innerHTML = `
        <button class="close-full-view">&times;</button>
        <img src="${url}" class="full-view-content">
    `;

    fullView.onclick = (e) => {
        if (e.target !== document.querySelector('.full-view-content')) {
            fullView.remove();
        }
    };

    document.body.appendChild(fullView);
};

// ==========  MAP OF EACH DEPARTMENT AND ITS PROPERTIES/METADATA ==========
const DEPT_MAP = {
    'JPIA': {
        name: 'Junior Philippine Institute of Accountants',
        shortName: 'JPIA',
        color: '#ef4444',
        intro: 'The premier organization for accountancy students at NCBA, dedicated to professional excellence and integrity in the field of accounting.',
        image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1200'
    },
    'BSBA': {
        name: 'Business Administration',
        shortName: 'BSBA',
        color: '#3b82f6',
        intro: 'Shaping the next generation of business leaders and entrepreneurs through innovative management education and practical experience.',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200'
    },
    'ISSOC': {
        name: 'Information Systems Student Organization Council',
        shortName: 'ISSOC',
        color: '#4b5563',
        intro: 'Advancing technological literacy and innovation within the Information Systems community at NCBA.',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200'
    },
    'SABELA': {
        name: 'Society of AB & Education Students of Liberal Arts',
        shortName: 'SABELA',
        color: '#ec4899',
        intro: 'Promoting excellence in the arts, education, and social sciences, fostering a community of critical thinkers and educators.',
        image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=1200'
    },
    'HM': {
        name: 'Hospitality Management',
        shortName: 'HM',
        color: '#f59e0b',
        intro: 'Training students for global careers in the hospitality and tourism industry with a focus on service excellence and culinary arts.',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200'
    },
    'ANNOUNCEMENT': {
        name: 'Official Announcements',
        shortName: 'announcement',
        color: '#7bff83',
        intro: 'The official announcements from the National College Business and Arts Fairview.',
        image: ''

    }
};

// ==========  INITIALIZE THE COLORS, NAME, AND GET THE DATA FOR THE CLICKED DEPARTMENT. ==========
async function initDepartment() {
    const urlParams = new URLSearchParams(window.location.search);
    const deptId = urlParams.get('dept') || 'JPIA';
    const dept = DEPT_MAP[deptId];

    if (!dept) {
        window.location.href = 'social.html';
        return;
    }

    document.documentElement.style.setProperty('--dept-color', dept.color);
    document.documentElement.style.setProperty('--dept-color-light', `${dept.color}22`);
    
    document.getElementById('dept-badge').textContent = dept.shortName;
    document.getElementById('dept-name').textContent = dept.name;
    document.getElementById('dept-intro').textContent = dept.intro;
    document.getElementById('dept-header').style.backgroundImage = `url(${dept.image})`;
    document.title = `NCBA.Life | ${dept.shortName}`;

    const posts = await fetchDepartmentPosts(deptId);
    renderPosts(posts);

    setupScrollAnimations();
}

// ========== GET ALL THE POSTS FOR THIS SPECIFIC DEPARTMENT ==========
async function fetchDepartmentPosts(deptId) {
    // ========== IF THE DEPARTMENT IS AN ANNOUNCEMENT, CHANGE TABLE ==========
    if (deptId === 'ANNOUNCEMENT') {
        const {data, error} = await window.supabaseClient
            .from('notices')
            .select('*')
            .order('created_at', { ascending: false })
            
            var thisIsThePost = [];
            data.forEach(post => {
                thisIsThePost.push({
                    title: post.department,
                    content: post.content,
                    cover_photo: post.image_1 ? post.image_1 : null,
                    images: null,
                    date: Date(post.created_at),
                    id: post.id
                })
            })

            console.log('announcement')
            return thisIsThePost || [];
    } else {
        // ========== ELSE, IF IT'S AN ACTUAL COLLEGE DEPARTMENT THEN GET THE DATA HERE. ==========
        const {data, error} = await window.supabaseClient
            .from('department_posts')
            .select('*')
            .eq('department', deptId)
            .order('date', { ascending: false })
            console.log('actual department')
            var thisIsThePost = [];
            data.forEach(post => {
                thisIsThePost.push({
                    title: post.title,
                    content: post.content,
                    cover_photo: post.image_1,
                    images: [post.image_2, post.image_3, post.image_4, post.image_5],
                    date: post.date,
                    id: post.id
                })
            })

        if (error) console.error('Error fetching clubs:', error)
        return thisIsThePost || [];
    }
}

// ==========  DISPLAY ALL THE POSTS. ==========
function renderPosts(posts) {
    const grid = document.getElementById('posts-grid');
    grid.innerHTML = '';

    posts.forEach((post, index) => {
        const card = document.createElement('div');

        card.className = 'post-card-bento';
        card.style.transitionDelay = `${(index % 3) * 0.1}s`;

        card.addEventListener('click', function() {
            console.log(`clicked:`, post.id);

            const overlay = document.createElement('div');
            overlay.className = 'post-modal-overlay';
            
            overlay.innerHTML = `
                <button class="close-btn">&times;</button>
                <div class="post-modal-card">
                    <h2 style="color: var(--dept-color)">${post.title}</h2>
                    <div class="modal-content">${post.content}</div>
                    ${post.cover_photo ? `<img src="${post.cover_photo}" class="modal-image" onclick="openFullImage('${post.cover_photo}')" style="cursor:pointer;"> ` : ''}

                    <div class="modal-gallery">
                        ${post.images && post.images.length > 0 
                            ? post.images
                                .filter(img => img) // ========== FILTER ONLY TO IMAGES ==========
                                .map(img => `<img src="${img}" class="gallery-image" onclick="openFullImage('${img}')" style="cursor:pointer;"> `)
                                .join('') // ========== IF NO IMAGE THEN DISPLAY NOTHING ==========
                            : '' 
                        }
                    </div>

                    <p class="modal-date">${Date(post.date).toUpperCase()}</p>
                </div>
            `;
            
            // ========== CLOSE BUTTON ==========
            overlay.onclick = (e) => {
                if (e.target === overlay || e.target.classList.contains('close-btn')) {
                    overlay.remove();
                }
            };

            document.body.appendChild(overlay);
        });

        // ========== THE ACTUAL POST THAT'S GONNA BE POSTED UP ON THE DEPARTMENT PAGE ==========
        card.innerHTML = `
            ${post.cover_photo ? `<img src="${post.cover_photo}" class="post-card-image" alt="${post.title}">` : ''}
            <h2 class="post-card-title">${post.title}</h2>
            <p class="post-card-text">${post.content}</p>
            <div class="post-card-footer">
                <span>${post.date}</span>
            </div>
        `;

        card.style.cssText = `
            cursor: pointer;

        `;

        grid.appendChild(card);
    });
}


// ========== UPON LOADING, ADD VISIBLE CLASS TO ANIMATE THE POST. ==========
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.post-card-bento').forEach(card => {
        observer.observe(card);
    });
}

initDepartment();
