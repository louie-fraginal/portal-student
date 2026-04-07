
let currentWebpage = ''

document.body.innerHTML += `
    <nav class="v2-bottom-nav">
        <a href="social-v2.html" class="v2-nav-item" id="socialItem">
            <span class="v2-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
            </span>
            <span>Home</span>
        </a>
        <a href="javascript:void(0)" class="v2-nav-item" id="discoverItem" onclick="window.toggleDiscoverMenu()">
            <span class="v2-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </span>
            <span>Discover</span>
        </a>
        <a href="javascript:void(0)" class="v2-nav-item center-post" onclick="window.createPostOverlay()">
            <div class="v2-nav-post-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bg-color)" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </div>
        </a>
        <a href="javascript:void(0)" class="v2-nav-item" onclick="window.openChat(event)">
            <span class="v2-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </span>
            <span>Chat</span>
        </a>
        <a href="javascript:void(0)" class="v2-nav-item" id="profileItem"onclick="window.checkUserProfile()">
            <span class="v2-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </span>
            <span>Profile</span>
        </a>
    </nav>

    <!-- Discovery Modal for Mobile -->
    <div id="v2-discover-modal" class="v2-discover-overlay">
        <div class="v2-discover-content">
            <div class="v2-discover-header">
                <h3>Discover</h3>
                <button class="v2-close-discover" onclick="window.toggleDiscoverMenu()">&times;</button>
            </div>

            <div class="v2-discover-section">
                <label>OFFICIAL</label>
                <a href="department.html?dept=ANNOUNCEMENT" class="v2-discover-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="m3 11 18-5v12L3 13v-2Z" />
                        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                    </svg>
                    <span>Announcements</span>
                </a>
            </div>

            <div class="v2-discover-section">
                <label>About</label>
                <a href="landing.html" class="v2-discover-link">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                    </svg>
                    <span>About Us</span>
                </a>
            </div>

            <div class="v2-discover-section">
                <label>DEPARTMENTS</label>
                <div class="v2-discover-grid">
                    <a href="department.html?dept=ISSOC" class="v2-discover-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="20" height="14" x="2" y="3" rx="2" />
                            <line x1="8" x2="16" y1="21" y2="21" />
                            <line x1="12" x2="12" y1="17" y2="21" />
                        </svg>
                        <span>BSIS</span>
                    </a>
                    <a href="department.html?dept=HM" class="v2-discover-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                            <line x1="6" x2="6" y1="2" y2="4" />
                            <line x1="10" x2="10" y1="2" y2="4" />
                            <line x1="14" x2="14" y1="2" y2="4" />
                        </svg>
                        <span>BSHM</span>
                    </a>
                    <a href="department.html?dept=BSBA" class="v2-discover-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" x2="12" y1="20" y2="10" />
                            <line x1="18" x2="18" y1="20" y2="4" />
                            <line x1="6" x2="6" y1="20" y2="16" />
                        </svg>
                        <span>BSBA</span>
                    </a>
                    <a href="department.html?dept=JPIA" class="v2-discover-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="16" height="20" x="4" y="2" rx="2" />
                            <line x1="8" x2="16" y1="6" y2="6" />
                            <line x1="16" x2="16" y1="14" y2="18" />
                            <path d="M16 10h.01" />
                            <path d="M12 10h.01" />
                            <path d="M8 10h.01" />
                            <path d="M12 14h.01" />
                            <path d="M8 14h.01" />
                            <path d="M12 18h.01" />
                            <path d="M8 18h.01" />
                        </svg>
                        <span>BSA</span>
                    </a>
                    <a href="department.html?dept=SABELA" class="v2-discover-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                        <span>BSED</span>
                    </a>
                </div>
            </div>
        </div>
    </div>
`;


window.toggleDiscoverMenu = function () {
    const modal = document.getElementById('v2-discover-modal');
    if (!modal) return;

    const isActive = modal.classList.contains('active');
    if (isActive) {
        modal.classList.remove('active');
        document.body.classList.remove('discover-open');
    } else {
        modal.classList.add('active');
        document.body.classList.add('discover-open');
    }
};

// Close Discovery Modal on background click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('v2-discover-modal');
    if (modal && modal.classList.contains('active') && e.target === modal) {
        window.toggleDiscoverMenu();
    }
});

const path = window.location.pathname.split("/").pop();
const navMap = {
    'social-v2.html': 'socialItem',
    'profile.html': 'profileItem',
    'department.html': 'discoverItem'
};

const activeId = navMap[path];

if (activeId) {
    document.getElementById(activeId).classList.add('active');
}