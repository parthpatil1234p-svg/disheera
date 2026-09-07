/**
 * main.js — CareerPath AI Frontend JavaScript
 *
 * This file handles all baseline UI interactions for the landing page:
 *  - Navbar scroll behavior (adds .scrolled class for glass effect)
 *  - Smooth scroll for anchor links
 *  - Scroll-triggered fade-in animations for sections
 *  - Career card click placeholders (will navigate to assessment in later steps)
 *
 * Three.js scenes (3D career universe, skill orbit, roadmap path) will be
 * added in separate files (landing3d.js, orbit3d.js, roadmap3d.js) in
 * a later development step.
 */

// ============================================================
// 1. Navbar — Add 'scrolled' class on scroll for solid BG
// ============================================================
const mainNav = document.getElementById('mainNav');

if (mainNav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      mainNav.classList.add('scrolled');
    } else {
      mainNav.classList.remove('scrolled');
    }
  });
}

// ============================================================
// 2. Smooth Scroll — for all internal anchor links
//    (CSS scroll-behavior: smooth handles basic cases,
//     this handles cases where offset is needed for fixed nav)
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    // Skip if it's just '#' with no target
    if (targetId === '#') return;

    const targetEl = document.querySelector(targetId);
    if (targetEl) {
      e.preventDefault();
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ============================================================
// 3. Scroll Animations — fade-in-up for sections and cards
//    Uses IntersectionObserver to trigger CSS animation
//    when elements enter the viewport.
// ============================================================

/**
 * Adds the 'fade-in-up' class to an element when it enters
 * the viewport. The animation is defined in style.css.
 */
function initScrollAnimations() {
  const animatableElements = document.querySelectorAll(
    '.step-card, .career-card, .feature-card, .section-header'
  );

  if (!animatableElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add stagger delay based on element's position in its row
          const siblings = Array.from(entry.target.closest('.row')?.children ?? []);
          const index = siblings.indexOf(entry.target.closest('[class*="col"]'));
          const delay = index >= 0 ? index * 80 : 0;

          setTimeout(() => {
            entry.target.classList.add('fade-in-up');
          }, delay);

          // Stop observing once animated
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,       // Trigger when 10% of element is visible
      rootMargin: '0px 0px -40px 0px', // Trigger slightly before fully in view
    }
  );

  animatableElements.forEach((el) => {
    // Set initial hidden state before animation
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'none'; // Let CSS animation handle it
    observer.observe(el);
  });
}

// ============================================================
// 4. Career Card Interaction — placeholder for later steps
//    In Step 2+, clicking a career card will navigate the user
//    to the assessment page with that career pre-selected.
// ============================================================
function initCareerCards() {
  const careerCards = document.querySelectorAll('.career-card');

  careerCards.forEach((card) => {
    card.addEventListener('click', () => {
      const career = card.getAttribute('data-career');
      if (career) {
        // TODO (Step 2): Navigate to assessment with pre-selected career
        // window.location.href = `assessment.html?career=${career}`;
        console.log(`Career card clicked: ${career}`);

        // Visual feedback — brief scale pulse
        card.style.transform = 'scale(0.97)';
        setTimeout(() => {
          card.style.transform = '';
        }, 150);
      }
    });

    // Add keyboard accessibility
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

// ============================================================
// 5. CTA Button — pulse animation after 3s to draw attention
// ============================================================
function initCTAPulse() {
  const ctaBtn = document.getElementById('startAssessmentBtn');
  if (!ctaBtn) return;

  // Add pulse glow after 3 seconds on the page
  setTimeout(() => {
    ctaBtn.classList.add('pulse-glow');
  }, 3000);
}

// ============================================================
// 6. Mobile nav — auto-close when a nav link is clicked
// ============================================================
function initMobileNavClose() {
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  const navCollapse = document.getElementById('navMenu');

  if (!navCollapse) return;

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      // Only collapse if the menu is currently open (mobile)
      if (navCollapse.classList.contains('show')) {
        // Bootstrap's collapse instance
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
        if (bsCollapse) bsCollapse.hide();
      }
    });
  });
}

// ============================================================
// Init — Run all functions after DOM is ready
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  window.Auth?.initNav();
  initScrollAnimations();
  initCareerCards();
  initCTAPulse();
  initMobileNavClose();

  console.log(
    '%cCareerPath AI 🚀',
    'color: #22D3EE; font-size: 18px; font-weight: bold;'
  );
  console.log(
    '%cTeam 404 Brain Not Found · Hack2Ignite 2026–27',
    'color: #7C3AED; font-size: 12px;'
  );
});
