document.addEventListener('DOMContentLoaded', async function() {
    // ==========  CHECK IF USER ALREADY HAS AN ONGOING SESSION / IF ALREADY LOGGED IN. ==========
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();

    if (!session) {
        console.log("No active session found. Redirecting to login...");
        window.location.href = 'login.html';
        return;
    }

    // ========== IF USER LOGGED IN THEN PROCEED: ==========
    const { data: profile, error: profileError } = await window.supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();

    // ========== CONSOLE.ERROR UPON ERROR, THEN SET USER'S full_name AS STUDENT ==========
    if (profileError || !profile) {
        console.error("Error fetching profile:", profileError);
        window.profile = {full_name: 'Student'}; //fallback
        return;
    }

    // ========== IF USER HAS A PROFILE, GET PROFILE, ASSIGN TO WINDOW, FIRE EVENT TO READY THE NAME ON SOCIAL.HTML ==========
    if (profile) {
        window.profile = profile;
        window.dispatchEvent(new CustomEvent('profileReady'))
        console.log('ran this')
    }
});

// ========== FETCHING ALL THE DATA ==========
async function fetchNotices() {
    const { data, error } = await window.supabaseClient
        .from('notices') // Make sure this matches your table name exactly
        .select('*')
        .order('created_at', { ascending: false })  

    if (error) console.error('Error fetching notices:', error);
    return data || [];
}

async function fetchRecentNotice() {
    const {data, error} = await window.supabaseClient
    .from('notices')
    .select('*')
    .order('created_at', {ascending: false})
    .limit(1);

    return data[0]?.id;
}

async function fetchClubs() {
    const { data, error } = await window.supabaseClient
        .from('department')
        .select('*');

    if (error) console.error('Error fetching clubs:', error);
    return data || [];
}

// =========== DEPARTMENT COLORS HERE ==========
const getDepartmentColor = (dept) => {
  const colors = {
    'CAMPUS WIDE': '#64748b',
    'ACADEMIC': '#6366f1',
    'BASIC EDUCATION DEPARTMENT': '#06b6d4',
    'COLLEGE DEPARTMENT': '#3b82f6',
    'LIBRARY': '#10b981',
    'GUIDANCE OFFICE': '#f59e0b',
    'OSA': '#8b5cf6',
    'DISASTER RISK MANAGEMENT': '#ef4444',
    'FACILITY': '#ec4899'
  };

  return colors[dept] || '#94a3b8';
};

// ============ END OF COLORS HERE ==========

// ========== DISPLAY ALL THE ANNOUNCEMENTS ==========
function renderNotices(notices) {
    const container = document.getElementById('announcements-container');
    if (!container) return; 
    
    container.innerHTML = ''; 

    notices.forEach(notice => {
        const color = getDepartmentColor(notice.department);
        const images = [notice.image_url ? notice.image_url : null]; 
         
        
        const item = document.createElement('div');
        const button = document.createElement('button');
        item.className = 'notice-item';
        item.id = ('notice-item-'+notice.id)


        button.innerHTML = `
            <small style="color: ${color}; font-weight: 700;">${notice.department}</small>
            <p style="margin: 5px 0 0 0; font-size: 0.95rem; color: var(--text-main)">${checkStringLength(notice.content, 50)}</p>
        `;

        button.style.cssText = `
            display: block;
            background: transparent;
            border: none;
            text-align: left; 
            padding: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
            font-family: inherit;
        `;
        
        button.addEventListener('click', function(e) {
            e.preventDefault();

            const overlay = document.createElement('div');
            overlay.className = 'post-modal-overlay';
            
            overlay.innerHTML = `
                <button class="close-btn">&times;</button>
                <div class="post-modal-card">
                    <h2 style="color: ${getDepartmentColor(notice.department)}">${notice.department}</h2>
                    <div class="modal-content">${notice.content}</div>
                    ${notice.image_url ? `<img src="${notice.image_url}" class="modal-image" onclick="openFullImage('${notice.image_url}')" style="cursor:pointer;"> ` : ''}

                    <div class="modal-gallery">
                        ${images && images.length > 0 
                            ? images
                                .filter(img => img) 
                                .map(img => `<img src="${img}" class="gallery-image" onclick="openFullImage('${img}')" style="cursor:pointer;"> `)
                                .join('') 
                            : ''
                        }
                    </div>
                    <p class="modal-date">${Date(notice.date)}</p>
                </div>
            `;

            overlay.onclick = (e) => {
                if (e.target === overlay || e.target.classList.contains('close-btn')) {
                    overlay.remove();
                }
            };

            document.body.appendChild(overlay);
        })


        item.appendChild(button);
        container.appendChild(item);
    });
}

function renderClubs(clubs) {
    const container = document.getElementById('clubs-container');
    if (!container) return;

    container.innerHTML = '';

    clubs.forEach(club => {
        let color =  '#d8d8d8';
        let deptId = 'JPIA';
        if (club.text === 'Hospitality Management') {
            color = '#FFCE1b';
            deptId = 'HM';
        } else if (club.text === 'Information Systems Student Organization Council') {
            color = '#4b5563';
            deptId = 'ISSOC';
        } else if (club.text === 'Society of AB & Education Students of Liberal Arts') {
            color = 'rgb(255, 0, 174)';
            deptId = 'SABELA';
        } else if (club.text === 'Business Administration') {
            color = 'rgb(0, 76, 255)';
            deptId = 'BSBA';
        } else if (club.text === 'Junior Philippine Institute of Accountants') {
            color = 'rgb(255,0,0)';
            deptId = 'JPIA';
        }
        
        const item = document.createElement('div');
        const button = document.createElement('button');
        
        button.style.cssText = `
            cursor: pointer;
            text-align: left;
            padding: 8px 15px; 
            background: ${color};
            width: 100%;
            min-height: 40px; 
            color: #ffffff;
            border-style: none;
            border-radius: 20px; 
            font-size: 0.7rem; 
            font-weight: 550;
            
        `;
        button.className = "department-button";
        button.addEventListener('click', () => {
            window.location.href = `department.html?dept=${deptId}`;   
        })
        button.textContent = club.text;
        container.appendChild(button);
    });
}

async function fetchEvents() {
    const {data, error} = await window.supabaseClient
        .from('events')
        .select('*')
        .order('created_at', {ascending: false})
        .limit(5);

    console.log("EVENTS RAW DATA: ", data)

    if (error) console.error('Error fetching events: ', error)
    return data || [];
}

function renderEvents(events) {
    const container = document.getElementById('main-hero-area')
    if (!container) return;

    // Fallback if no events
    if (events.length === 0) {
        container.innerHTML = `<img src="https://scontent.fmnl8-6.fna.fbcdn.net/v/t39.30808-6/630692543_891649603842351_3250378362948845917_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=13d280&_nc_ohc=3xHr0QRmposQ7kNvwG6G8o1&_nc_oc=AdkFY_2ZIY5nA8WaB4gpSk3cg5DKO5Zbf9nICnlgXV3TKAAP2MSK0qrDH6IoKaGHlxk&_nc_zt=23&_nc_ht=scontent.fmnl8-6.fna&_nc_gid=AjZduWEK06pgn6FHp_JqaA&oh=00_AftjTmH2N6eYAgZgodGe5HqtrcEhWj78y-Q15UekoHzXPg&oe=699E43D1" class="hero-bg" alt="NCBA">`;
        return;
    }

    container.innerHTML = '';
    const track = document.createElement('div');
    track.className = 'slider-track';

    events.forEach(event => {
        const slide = document.createElement('div');
        slide.className = 'hero-slide';
        slide.innerHTML = `
            <img src="${event.image_url || 'https://scontent.fmnl8-6.fna.fbcdn.net/v/t39.30808-6/630692543_891649603842351_3250378362948845917_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=13d280&_nc_ohc=3xHr0QRmposQ7kNvwG6G8o1&_nc_oc=AdkFY_2ZIY5nA8WaB4gpSk3cg5DKO5Zbf9nICnlgXV3TKAAP2MSK0qrDH6IoKaGHlxk&_nc_zt=23&_nc_ht=scontent.fmnl8-6.fna&_nc_gid=AjZduWEK06pgn6FHp_JqaA&oh=00_AftjTmH2N6eYAgZgodGe5HqtrcEhWj78y-Q15UekoHzXPg&oe=699E43D1'}" class="hero-bg" alt="${event.header}">
            <div class="hero-content">
                <span class="tag">Featured</span>
                <h2 style="font-size: 2.2rem; margin: 10px 0; color: white; -webkit-text-fill-color: white;">${event.header}</h2>
                <p style="opacity: 0.9; margin: 0; color: rgba(255,255,255,0.9); font-size: 1.1rem; max-width: 600px;">${event.subheader}</p>
            </div>
        `;
        track.appendChild(slide);
    });

    container.appendChild(track);

    if (events.length > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'slider-btn prev';
        prevBtn.innerHTML = '←';
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'slider-btn next';
        nextBtn.innerHTML = '→';

        container.appendChild(prevBtn);
        container.appendChild(nextBtn);

        let currentIndex = 0;
        const totalSlides = events.length;

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

        // // Auto-slide every 6 seconds
        // setInterval(() => {
        //     currentIndex = (currentIndex + 1) % totalSlides;
        //     updateSlider();
        // }, 6000);
    }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 4. MAIN EXECUTION
async function init() {
    console.log("Initializing Dashboard...");
    const [notices, clubs, events] = await Promise.all([
        fetchNotices(),
        fetchClubs(),
        fetchEvents()
    ]);


    renderNotices(notices);
    renderClubs(clubs);
    renderEvents(events);
    // showPopUpAnnouncement('Welcome to NCBA.life!', "You presence is much appreciated.")
    // await delay(3000)
    // showPopUpAnnouncement('Welcome to NCBA.life!', "You presence is much appreciated.")
    // await delay(1000)
    // showPopUpAnnouncement('Welcome to NCBA.life!', "You presence is much appreciated.")
    // const images = [image_1 = 'https://scontent.fmnl17-8.fna.fbcdn.net/v/t39.30808-6/566214510_1325523929268832_2424369844554894690_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=13d280&_nc_ohc=o41vJmfHS_QQ7kNvwEYW9Iw&_nc_oc=AdliYhw5DmWZjT2-4GkMX8XImgIdN0RkKhoUwq2S2ilnmMmACCOFOwur4O-nazD6664&_nc_zt=23&_nc_ht=scontent.fmnl17-8.fna&_nc_gid=h0QZurp_z33zdDQxbKOMnA&_nc_ss=8&oh=00_Aft8Brqx_yxKpiQpQ0wlbKUX5QZxJ2QnLCf7N7K01X6LZQ&oe=69A9A8A7'];
    // showPopUpAnnouncement('SABELA', 'LOREM IPSUM LOREM IPSUM LOREM IPSUM LOREM IPSUM LOREM IPSUM', null, images);
}

function checkStringLength(string, length) {
    // If string length more than length, then cut off until the 20th char. Then add "... Read more"
    if (string.length >= length) {
        const thisString = (string.slice(0, length) + "... <p style='color: var(--text-main)'><strong>Read more...</strong></p>");
        console.log(thisString)
        return thisString;
    }
    else {
        const newString = string;
        return string;
    }
}

const channel = window.supabaseClient
    .channel('table-db-changes')
    .on(
        'postgres_changes',
        {
            event: "*",
            schema: 'public',
            table: 'notices'
        },
        async (payload) => {
            console.log('detected', payload)
            const notices = await fetchNotices();
            if (payload.eventType === 'INSERT') {
                const newNotice = payload.new;
                renderNotices(notices);
                showPopUpAnnouncement(('Update from: ' + newNotice.department), checkStringLength(newNotice.message, 20), newNotice.id);
            }
        }
    ).subscribe()

const departmentPost = window.supabaseClient
    .channel('department-post-changes')
    .on(
        'postgres_changes',
        {
            event: "*",
            schema: 'public',
            table: 'department_posts'
        },
        async (payload) => {
            console.log('detected', payload)
            if (payload.eventType === 'INSERT') {
                const newPost = payload.new;
                const images = [newPost.image_1, newPost.image_2, newPost.image_3, newPost.image_4, newPost.image_5];
                showPopUpAnnouncement((newPost.department), newPost.content, newPost.id, images);
            }
        }
    ).subscribe()


init();

function showPopUpAnnouncement(title, message, id, images) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const button = document.createElement('button');

    button.style.cssText = 'z-index: 2; background-color: transparent; border: none; cursor: pointer; outline: none; padding: 0;'
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const notice = document.getElementById('notice-item-'+id);
        console.log(id);
        console.log(notice);
        
        // 1. Create the overlay (the background dim)
                const overlay = document.createElement('div');
                overlay.className = 'post-modal-overlay';
                
                // 2. Create the content frame
                overlay.innerHTML = `
                    <button class="close-btn">&times;</button>
                    <div class="post-modal-card">
                        <h2 style="color: var(--dept-color)">${title}</h2>
                        <div class="modal-content">${message}</div>
                        ${images.image_1 ? `<img src="${images.image_1}" class="modal-image" onclick="openFullImage('${images.image_1}')" style="cursor:pointer;"> ` : ''}

                        <div class="modal-gallery">
                            ${images && images.length > 0 
                                ? images
                                    .filter(img => img) // Removes null/undefined/empty string slots
                                    .map(img => `<img src="${img}" class="gallery-image" onclick="openFullImage('${img}')" style="cursor:pointer;"> `)
                                    .join('') 
                                : '' // If no images, render nothing
                            }
                        </div>
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
    
    toast.style.cssText = `
        background: var(--card-bg);
        color: var(--text-main);
        padding: 15px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        border-left: 4px solid var(--dept-color, var(--accent-color));
        backdrop-filter: blur(10px);
        transform: translateX(120%);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        max-width: 300px;
        text-align: left;
    `;
    
    toast.innerHTML = `
        <strong style="display: block; margin-bottom: 5px; font-size: 0.95rem;">📢 ${title}</strong>
        <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">${checkStringLength(message, 20)}</p>
    `;

    container.appendChild(button);
    button.appendChild(toast);

    // Slide in
    setTimeout(() => toast.style.transform = 'translateX(0)', 10);

    // Slide out and remove after 5 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
        setTimeout(() => button.remove(), 300);
    }, 5000);
}