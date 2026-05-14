// Supabase Configuration (Replace with your own credentials)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
let supabaseClient;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Elements
    authOverlay = document.getElementById('auth-overlay');
    loginForm = document.getElementById('login-form');
    signupForm = document.getElementById('signup-form');
    authBtn = document.getElementById('auth-btn');

    // Initialize Supabase safely
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error('Supabase library not found. Please check your internet connection or CDN link.');
    }

    initCountdown();
    initSeatProgress();
    initTheme();
    initSyllabusSearch();
    initStickyNav();
    checkSession();
    
    // Initialize icons after all DOM changes
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// Auth Logic Variables (Defined globally but initialized when ready)
let authOverlay, loginForm, signupForm, authBtn;

function openAuthModal() {
    if (authOverlay) {
        authOverlay.style.display = 'flex';
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
    }
}

function closeAuthModal() {
    if (authOverlay) {
        authOverlay.style.display = 'none';
        document.body.classList.remove('modal-open');
        const pdfModal = document.getElementById('pdfModal');
        if (!pdfModal || !pdfModal.style.display || pdfModal.style.display === 'none') {
            document.body.style.overflow = 'auto';
        }
    }
}

function toggleAuthMode(mode) {
    if (!loginForm || !signupForm) return;
    if (mode === 'signup') {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    } else {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const fullName = document.getElementById('signup-name').value;
    const btn = e.target.querySelector('button');

    btn.innerText = "Creating Account...";
    btn.disabled = true;

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName }
        }
    });

    if (error) {
        alert(error.message);
        btn.innerText = "Create Account";
        btn.disabled = false;
    } else {
        alert("Success! Please check your email for confirmation.");
        closeAuthModal();
    }
}

async function handleSignIn(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = e.target.querySelector('button');

    btn.innerText = "Signing In...";
    btn.disabled = true;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        alert(error.message);
        btn.innerText = "Sign In";
        btn.disabled = false;
    } else {
        closeAuthModal();
    }
}

async function handleSignOut() {
    await supabaseClient.auth.signOut();
    location.reload();
}

async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    updateAuthUI(session);

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        updateAuthUI(session);
    });
}

function updateAuthUI(session) {
    if (session) {
        authBtn.innerText = "Logout";
        authBtn.onclick = handleSignOut;
    } else {
        authBtn.innerText = "Login";
        authBtn.onclick = openAuthModal;
    }
}

// Sticky Navigation
function initStickyNav() {
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('sticky');
            backToTop.style.display = 'flex';
        } else {
            navbar.classList.remove('sticky');
            backToTop.style.display = 'none';
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Syllabus Interaction
function toggleDay(header) {
    const card = header.parentElement;
    const isActive = card.classList.contains('active');

    // Close all cards in the same container
    const allCards = card.parentElement.querySelectorAll('.day-card');
    allCards.forEach(c => c.classList.remove('active'));

    // Toggle selected card
    if (!isActive) {
        card.classList.add('active');
    }
}

// Syllabus Search
function initSyllabusSearch() {
    const searchInput = document.getElementById('search-syllabus');
    const cards = document.querySelectorAll('.day-card');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();

        cards.forEach(card => {
            const topics = card.getAttribute('data-topics').toLowerCase();
            const title = card.querySelector('h3').innerText.toLowerCase();

            if (topics.includes(query) || title.includes(query)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Countdown Timer
function initCountdown() {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);

    function updateTimer() {
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            countdownElement.innerText = "Started!";
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownElement.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

// Seat Progress Simulation
function initSeatProgress() {
    const progressBar = document.getElementById('progress-bar');
    const seatsText = document.getElementById('seats-left');
    if (!progressBar || !seatsText) return;

    let seats = 12;
    const total = 30;

    function updateSeats() {
        const percentage = ((total - seats) / total) * 100;
        progressBar.style.width = percentage + '%';
        seatsText.innerText = `${seats} / ${total} left`;

        if (seats > 3 && Math.random() > 0.8) {
            seats--;
        }
    }

    updateSeats();
    setInterval(updateSeats, 30000);
}

// Theme Toggle
function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    const body = document.body;
    let isDark = true;

    if (!themeBtn) return;

    themeBtn.addEventListener('click', () => {
        isDark = !isDark;
        body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        themeBtn.innerHTML = isDark ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
        lucide.createIcons();
    });
}

// Modal Logic
const modal = document.getElementById('pdfModal');

async function openModal() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        alert("Please login to access the course handbook.");
        openAuthModal();
        return;
    }

    const iframe = document.getElementById('pdf-viewer');
    if (iframe) {
        iframe.src = iframe.getAttribute('data-src');
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.style.display = 'none';
    const iframe = document.getElementById('pdf-viewer');
    if (iframe) {
        iframe.src = "";
    }
    if (authOverlay.style.display !== 'flex') {
        document.body.style.overflow = 'auto';
    }
}

window.onclick = function (event) {
    if (event.target == modal) {
        closeModal();
    }
    if (event.target == authOverlay) {
        closeAuthModal();
    }
}

function printIframe() {
    const iframe = document.getElementById('pdf-viewer');
    if (iframe) {
        try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        } catch (e) {
            window.open(iframe.src.replace('/preview', '/view'), '_blank');
        }
    }
}

// Contact Form Simulation
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.innerText = "Applying...";
        btn.disabled = true;

        setTimeout(() => {
            btn.innerText = "Successfully Joined!";
            btn.style.background = "#28a745";
            e.target.reset();
        }, 2000);
    });
}
// Expose functions to window for global access (needed for HTML event handlers)
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.toggleAuthMode = toggleAuthMode;
window.handleSignUp = handleSignUp;
window.handleSignIn = handleSignIn;
window.handleSignOut = handleSignOut;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleDay = toggleDay;
window.printIframe = printIframe;
