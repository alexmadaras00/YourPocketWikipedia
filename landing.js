// Initialize Lucide Icons
lucide.createIcons();

// Dynamically set current year in footer
document.getElementById('current-year').textContent = new Date().getFullYear();

// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('bg-background/90', 'backdrop-blur-md', 'shadow-md', 'py-4');
    navbar.classList.remove('bg-transparent', 'py-6');
  } else {
    navbar.classList.add('bg-transparent', 'py-6');
    navbar.classList.remove('bg-background/90', 'backdrop-blur-md', 'shadow-md', 'py-4');
  }
});

// Mobile Drawer Navigation
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeDrawerBtn = document.getElementById('close-drawer-btn');
const mobileDrawer = document.getElementById('mobile-drawer');

function openDrawer() {
  mobileDrawer.classList.remove('translate-y-[-100%]');
  document.body.classList.add('overflow-hidden');
}

function closeDrawer() {
  mobileDrawer.classList.add('translate-y-[-100%]');
  document.body.classList.remove('overflow-hidden');
}

mobileMenuBtn.addEventListener('click', openDrawer);
closeDrawerBtn.addEventListener('click', closeDrawer);

// Close mobile drawer on any link click
['drawer-link-guide', 'drawer-link-content', 'drawer-link-hunts', 'drawer-link-contact'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('click', closeDrawer);
  }
});

// Waitlist Modal triggers
const openWaitlistBtn = document.getElementById('open-waitlist-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const waitlistModal = document.getElementById('waitlist-modal');
const waitlistForm = document.getElementById('waitlist-form');
const waitlistSuccess = document.getElementById('waitlist-success');

function openModal() {
  waitlistModal.classList.remove('hidden');
  // Force trigger reflow for smooth transitions
  void waitlistModal.offsetWidth;
  waitlistModal.classList.remove('opacity-0');
  waitlistModal.classList.add('opacity-100');
  waitlistModal.querySelector('.bg-card').classList.remove('translate-y-4');
  waitlistModal.querySelector('.bg-card').classList.add('translate-y-0');
  document.body.classList.add('overflow-hidden');
}

function closeModal() {
  waitlistModal.classList.remove('opacity-100');
  waitlistModal.classList.add('opacity-0');
  waitlistModal.querySelector('.bg-card').classList.add('translate-y-4');
  waitlistModal.querySelector('.bg-card').classList.remove('translate-y-0');
  
  setTimeout(() => {
    waitlistModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    // Reset form states if closed
    waitlistForm.classList.remove('hidden');
    waitlistSuccess.classList.add('hidden');
    waitlistForm.reset();
  }, 300);
}

openWaitlistBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);

// Close modal when clicking on the backdrop overlay
waitlistModal.addEventListener('click', (e) => {
  if (e.target === waitlistModal) {
    closeModal();
  }
});

// Handle form submit
waitlistForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('waitlist-email').value;
  if (email) {
    // Here we could send the email to a backend/spreadsheet, but since this is static,
    // we show an elegant success state!
    waitlistForm.classList.add('hidden');
    waitlistSuccess.classList.remove('hidden');
  }
});

// Certificate Modal triggers
const openCertBtn = document.getElementById('open-cert-btn');
const closeCertBtn = document.getElementById('close-cert-btn');
const certModal = document.getElementById('cert-modal');

function openCertModal() {
  certModal.classList.remove('hidden');
  // Force trigger reflow for smooth transitions
  void certModal.offsetWidth;
  certModal.classList.remove('opacity-0');
  certModal.classList.add('opacity-100');
  certModal.querySelector('.bg-card').classList.remove('translate-y-4');
  certModal.querySelector('.bg-card').classList.add('translate-y-0');
  document.body.classList.add('overflow-hidden');
}

function closeCertModal() {
  certModal.classList.remove('opacity-100');
  certModal.classList.add('opacity-0');
  certModal.querySelector('.bg-card').classList.add('translate-y-4');
  certModal.querySelector('.bg-card').classList.remove('translate-y-0');
  
  setTimeout(() => {
    certModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }, 300);
}

openCertBtn.addEventListener('click', openCertModal);
closeCertBtn.addEventListener('click', closeCertModal);

// Close certificate modal when clicking on the backdrop overlay
certModal.addEventListener('click', (e) => {
  if (e.target === certModal) {
    closeCertModal();
  }
});

// Monument Suggestion Form handling
const suggestionForm = document.getElementById('monument-suggestion-form');
const suggestionFormContainer = document.getElementById('suggestion-form-container');
const suggestionSuccessContainer = document.getElementById('suggestion-success-container');

if (suggestionForm) {
  suggestionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city     = document.getElementById('monument-city').value.trim();
    const country  = document.getElementById('monument-country').value.trim();
    const monument = document.getElementById('monument-name').value.trim();

    if (city && country && monument) {
      // Instantly show the success checkmark for a lightning-fast responsive feel
      suggestionFormContainer.classList.add('hidden');
      suggestionSuccessContainer.classList.remove('hidden');

      // Post all three fields to Google Sheets (via Apps Script Web App)
      const config = window.POCKETPEDIA_CONFIG || {};
      const suggestionsUrl = config.SUGGESTIONS_URL || '';

      if (suggestionsUrl) {
        fetch(suggestionsUrl, {
          method: 'POST',
          mode: 'no-cors', // Crucial for static sites: prevents CORS pre-flight block from Google Script
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city, country, monument })
        }).catch(err => console.warn('Google Sheet submission failed:', err));
      }
    }
  });
}
