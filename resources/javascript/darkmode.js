// ========== ADD DARK MODE ==========
// CODE PROPERTY BY LOUIE
function classElementsDarkMode(className) {
    const elements = document.getElementsByClassName(className);
    for (var i = 0; i < elements.length; i++) {
        elements[i].classList.add('dark-mode');
    }
}

// ========== REMOVE DARK MODE ==========

function removeClassElementsDarkMode(className) {
    const elements = document.getElementsByClassName(className);
    for (var i = 0; i < elements.length; i++) {
        elements[i].classList.remove('dark-mode');
    }
}

// ========== WAIT FOR DOCUMENT TO LOAD ==========
window.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    const themeBtn = document.getElementById('theme-toggle');
    const body = document.body;

// ========== CHECK IF THERE'S ANY NEW ELEMENTS ADDED (DYNAMIC ELEMENTS) ==========
    const observer = new MutationObserver(() => {
    if (document.body.classList.contains('dark-mode')) {
        classElementsDarkMode('post-card-bento');
        classElementsDarkMode('post-modal-card');
        classElementsDarkMode('modal-content');
        classElementsDarkMode('post-card')
    }
    });

    observer.observe(document.body, { childList: true, subtree: true });

// ========== IF USER HAS DARK MODE ENABLED BEFORE, ENABLE DARK MODE ==========
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        const classes = ['bento-card', 'announce-area', 'notice-item', 'post-card-bento', 'post-modal-overlay', 'post-modal-card', 'modal-content', 'dept-link'];
        classes.forEach(group => classElementsDarkMode(group));
    }

    themeBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        const classes = ['bento-card', 'announce-area', 'notice-item', 'post-card-bento', 'post-modal-overlay', 'post-modal-card', 'modal-content', 'dept-link'];

        if (isDark) {
            classes.forEach(group => classElementsDarkMode(group));
        } else {
            classes.forEach(group => removeClassElementsDarkMode(group));
        }
});
})
