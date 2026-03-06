// ========== DEPARTMENT PAGE CODE PROPERTY OF LOUIE! ==========

// ==========  MAP OF EACH DEPARTMENT AND ITS PROPERTIES/METADATA ==========
const DEPT_MAP = {
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
        color: '#4b5563',
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
    'ANNOUNCEMENT': {
        name: 'Official Announcements',
        shortName: 'announcement',
        color: '#7bff83',
        intro: 'The official announcements from the National College Business and Arts Fairview.',
        fb_link: '',
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
    document.getElementById('dept-link').addEventListener('click', function(e) {window.open(dept.fb_link)});
    document.getElementById('dept-link').style.cssText = `cursor: pointer;`;
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
                    cover_photo: post.image_1 ? post.image_1 : null,
                    images: post.image_1 ? [post.image_1, post.image_2, post.image_3, post.image_4, post.image_5] : [],
                    date: post.date,
                    id: post.id,
                    department: post.department
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
            window.openPostModal(post, post.images)
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
window.DEPT_MAP = DEPT_MAP