/**
 * POTFOLIOO — Motion Animation Controller (Vanilla JS + Motion)
 * 
 * Implements the official Motion JavaScript API (https://motion.dev/docs/quick-start)
 * for vanilla HTML/CSS/JavaScript. No React required.
 * 
 * Features:
 * - Browser-compatible ES module import with offline fallback
 * - Subtle entrance animations for dashboard cards (fade-in & slide-up)
 * - Tactile neo-brutalist hover and press effects on buttons
 * - Transaction form cascade & modal pop-in/fade animations
 * - Full compliance with prefers-reduced-motion accessibility
 */

let animate;
let stagger;

// 1. Browser-compatible ES module import with graceful offline fallback
try {
  const motionModule = await import('https://cdn.jsdelivr.net/npm/motion@latest/+esm');
  animate = motionModule.animate;
  stagger = motionModule.stagger;
} catch (cdnErr) {
  try {
    const localModule = await import('./vendor/motion.esm.js');
    animate = localModule.animate;
    stagger = localModule.stagger;
  } catch (localErr) {
    // Ultimate fallback to Web Animations API if offline without local vendor
    console.warn('[Motion] Falling back to Web Animations API fallback', cdnErr, localErr);
    animate = (target, keyframes, options = {}) => {
      const elements = typeof target === 'string' ? document.querySelectorAll(target) : [target];
      elements.forEach((el) => {
        if (el && el.animate) {
          el.animate(keyframes, {
            duration: (options.duration || 0.4) * 1000,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards',
          });
        }
      });
      return { finished: Promise.resolve() };
    };
    stagger = (duration) => (index) => index * duration;
  }
}

// 2. Accessibility: Reduced-Motion Detection
let prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
  prefersReducedMotion = e.matches;
});

/**
 * 3. Dashboard Cards Entrance Animation
 * Fades in and slides upward smoothly
 */
export function animateDashboardCards() {
  if (prefersReducedMotion) {
    // Instantly reveal all elements without motion
    document.querySelectorAll('[data-motion-card], .motion-card').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  // Select main hero card, summary cards, and transaction containers
  const cards = document.querySelectorAll(
    '#net-hero-card, [data-motion-card], .motion-card, section.neo-shadow-lg, section.grid > div, main > section'
  );

  if (cards.length > 0) {
    animate(
      cards,
      {
        opacity: [0, 1],
        y: [18, 0],
      },
      {
        duration: 0.42,
        delay: stagger ? stagger(0.07) : 0.05,
        easing: [0.16, 1, 0.3, 1], // Smooth natural deceleration curve
      }
    );
  }
}

/**
 * 4. Button Micro-Interactions (Hover & Press)
 * Tactile neo-brutalist interaction matching hard offset shadow styling
 */
export function initButtonInteractions() {
  const buttons = document.querySelectorAll(
    'button, .neo-btn, [role="button"], a[class*="neo-"]'
  );

  buttons.forEach((btn) => {
    // Avoid double-binding
    if (btn.dataset.motionBound) return;
    btn.dataset.motionBound = 'true';

    // Hover (desktop pointer)
    btn.addEventListener('pointerenter', () => {
      if (prefersReducedMotion) return;
      animate(
        btn,
        { scale: 1.015, y: -1 },
        { duration: 0.18, easing: [0.16, 1, 0.3, 1] }
      );
    });

    btn.addEventListener('pointerleave', () => {
      if (prefersReducedMotion) return;
      animate(
        btn,
        { scale: 1, x: 0, y: 0 },
        { duration: 0.2, easing: [0.16, 1, 0.3, 1] }
      );
    });

    // Press (pointer down)
    btn.addEventListener('pointerdown', () => {
      if (prefersReducedMotion) return;
      animate(
        btn,
        { x: 2, y: 2, scale: 0.99 },
        { duration: 0.08, easing: 'ease-out' }
      );
    });

    // Release (pointer up)
    btn.addEventListener('pointerup', () => {
      if (prefersReducedMotion) return;
      animate(
        btn,
        { scale: 1.015, x: 0, y: -1 },
        { duration: 0.15, easing: [0.16, 1, 0.3, 1] }
      );
    });
  });
}

/**
 * 5. Transaction Form Entrance Animation
 * Staggers form fields, type switchers, amount inputs, and action buttons
 */
export function animateTransactionForm() {
  if (prefersReducedMotion) {
    document.querySelectorAll('form, [data-motion-form]').forEach((el) => {
      el.style.opacity = '1';
    });
    return;
  }

  const formElements = document.querySelectorAll(
    'form > div, form > fieldset, main > div, [data-motion-field]'
  );

  if (formElements.length > 0) {
    animate(
      formElements,
      {
        opacity: [0, 1],
        y: [14, 0],
      },
      {
        duration: 0.35,
        delay: stagger ? stagger(0.05) : 0.04,
        easing: [0.16, 1, 0.3, 1],
      }
    );
  }

  // Type Switcher (+ Income / - Expense) lively toggle animation
  const typeButtons = document.querySelectorAll('[data-type-switch] button, .type-switcher button');
  typeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (prefersReducedMotion) return;
      animate(
        btn,
        { scale: [0.95, 1.02, 1] },
        { duration: 0.25, easing: 'ease-out' }
      );
    });
  });
}

/**
 * 6. Modal Dialog Entrance and Exit Animations
 * Backdrop fade and Spring Pop-In for modal cards
 */
export function animateModalEntrance() {
  const backdrop = document.querySelector('.modal-backdrop, body > div.fixed.inset-0, [aria-hidden="true"]');
  const modalDialog = document.querySelector(
    '[role="dialog"], .modal-dialog, div[class*="max-w-[360px]"]'
  );

  if (prefersReducedMotion) {
    if (backdrop) backdrop.style.opacity = '1';
    if (modalDialog) {
      modalDialog.style.opacity = '1';
      modalDialog.style.transform = 'none';
    }
    return;
  }

  // Backdrop smooth opacity fade
  if (backdrop) {
    animate(
      backdrop,
      { opacity: [0, 0.6] },
      { duration: 0.25, easing: 'ease-out' }
    );
  }

  // Modal dialog energetic spring entrance
  if (modalDialog) {
    animate(
      modalDialog,
      {
        opacity: [0, 1],
        scale: [0.93, 1],
        y: [16, 0],
      },
      {
        duration: 0.38,
        easing: [0.175, 0.885, 0.32, 1.2], // Energetic spring curve
      }
    );
  }

  // Wire up close buttons with smooth exit animation
  const closeButtons = document.querySelectorAll(
    '[aria-label="Close dialog"], [data-close-modal], button:has-text("Cancel")'
  );
  closeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (prefersReducedMotion) return;
      if (modalDialog) {
        animate(
          modalDialog,
          { opacity: [1, 0], scale: [1, 0.95], y: [0, 10] },
          { duration: 0.2, easing: 'ease-in' }
        );
      }
    });
  });
}

/**
 * 7. Master Initializer (Auto-detects page type)
 */
export function initAutoMotion() {
  // Check if page has a modal
  if (document.querySelector('[role="dialog"]') || document.querySelector('[aria-modal="true"]')) {
    animateModalEntrance();
  }

  // Check if page has a transaction form
  if (document.querySelector('form') || document.querySelector('input[type="number"]') || document.querySelector('#amount-input')) {
    animateTransactionForm();
  }

  // Always animate dashboard cards and bind button interactions
  animateDashboardCards();
  initButtonInteractions();
}

// Auto-run on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAutoMotion());
  } else {
    // DOM already loaded
    initAutoMotion();
  }
}
