/* ═══════════════════════════════════════════════════
   SERVICEHUB — MULTI-PORTAL CINEMATIC EXPERIENCE
   script.js  v2.0
   ═══════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────
   1. HERO PARTICLE CANVAS
───────────────────────────────────────────────── */
(function initParticleCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], mouse = { x: -9999, y: -9999 };
  const PARTICLE_COUNT = 95;
  const BRAND_COLORS = [
    'rgba(99,102,241,',
    'rgba(139,92,246,',
    'rgba(6,182,212,',
    'rgba(255,255,255,',
    'rgba(16,185,129,'
  ];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    const color = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];
    return {
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.8 + 0.4,
      vx:    (Math.random() - 0.5) * 0.35,
      vy:    (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.5 + 0.1,
      color,
      life:  Math.random(),
      dLife: (Math.random() * 0.003 + 0.001) * (Math.random() > 0.5 ? 1 : -1)
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(99,102,241,${(1 - dist / 110) * 0.12})`;
          ctx.lineWidth   = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  let animId;
  function tick() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();

    particles.forEach(p => {
      const mdx = p.x - mouse.x;
      const mdy = p.y - mouse.y;
      const md  = Math.sqrt(mdx * mdx + mdy * mdy);
      if (md < 100 && md > 0) {
        const force = (100 - md) / 100;
        p.vx += (mdx / md) * force * 0.25;
        p.vy += (mdy / md) * force * 0.25;
      }

      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > 1.2) { p.vx *= 0.95; p.vy *= 0.95; }
      p.vx *= 0.995; p.vy *= 0.995;

      p.x += p.vx;
      p.y += p.vy;

      p.life += p.dLife;
      if (p.life <= 0 || p.life >= 1) p.dLife *= -1;

      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${p.alpha * (0.5 + p.life * 0.5)})`;
      ctx.fill();
    });

    animId = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', () => { resize(); });

  const hero = canvas.parentElement;
  hero.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  init();
  tick();
})();

/* ─────────────────────────────────────────────────
   2. NAVBAR SCROLL EFFECT
───────────────────────────────────────────────── */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function update() {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* ─────────────────────────────────────────────────
   3. PORTAL SWITCHER BAR (fixed, appears on scroll)
───────────────────────────────────────────────── */
(function initPortalBar() {
  const bar  = document.getElementById('portal-bar');
  const tabs = bar ? bar.querySelectorAll('.portal-tab') : [];

  if (!bar) return;

  // Show/hide on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      bar.classList.add('visible');
    } else {
      bar.classList.remove('visible');
    }
  }, { passive: true });

  // Portal tab click — scroll to portal showcase & activate
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const portal = tab.dataset.portal;

      // Update bar tabs
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Sync large portal tabs
      const largeTabs = document.querySelectorAll('.portal-tab-large');
      largeTabs.forEach(lt => {
        lt.classList.remove('active');
        lt.setAttribute('aria-selected', 'false');
        if (lt.dataset.portal === portal) {
          lt.classList.add('active');
          lt.setAttribute('aria-selected', 'true');
        }
      });

      // Switch panel
      switchPortalPanel(portal);

      // Scroll to section
      document.getElementById('portal-showcase')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
})();

/* ─────────────────────────────────────────────────
   4. PORTAL SHOWCASE — LARGE TABS
───────────────────────────────────────────────── */
function switchPortalPanel(portal) {
  // Hide all panels
  document.querySelectorAll('.portal-panel').forEach(p => p.classList.remove('active'));
  // Show target
  const panel = document.getElementById('ppanel-' + portal);
  if (panel) panel.classList.add('active');
}

(function initPortalShowcase() {
  const largeTabs = document.querySelectorAll('.portal-tab-large');

  largeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const portal = tab.dataset.portal;

      // Update large tabs
      largeTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Sync small bar tabs
      document.querySelectorAll('#portal-bar .portal-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        if (t.dataset.portal === portal) {
          t.classList.add('active');
          t.setAttribute('aria-selected', 'true');
        }
      });

      switchPortalPanel(portal);
    });
  });
})();

/* ─────────────────────────────────────────────────
   5. SCROLL REVEAL (IntersectionObserver)
───────────────────────────────────────────────── */
(function initReveal() {
  const selectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale';
  const elements  = document.querySelectorAll(selectors);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
})();

/* ─────────────────────────────────────────────────
   6. COUNTER ANIMATION
───────────────────────────────────────────────── */
(function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  function animateCounter(el) {
    const target   = parseFloat(el.dataset.count);
    const suffix   = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals || 0);
    const duration = 2200;
    const start    = performance.now();

    function step(now) {
      const elapsed  = Math.min(now - start, duration);
      const progress = ease(elapsed / duration);
      const value    = target * progress;
      el.textContent = value.toFixed(decimals) + suffix;
      if (elapsed < duration) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals) + suffix;
    }

    requestAnimationFrame(step);
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => obs.observe(c));
})();

/* ─────────────────────────────────────────────────
   7. SMOOTH SCROLL (NAV LINKS & IN-PAGE ANCHORS)
───────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const hash   = a.getAttribute('href');
    const target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) mobileNav.classList.remove('open');
  });
});

/* ─────────────────────────────────────────────────
   8. BACK TO TOP BUTTON
───────────────────────────────────────────────── */
(function initBackTop() {
  const btn = document.getElementById('back-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) btn.classList.add('visible');
    else btn.classList.remove('visible');
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* ─────────────────────────────────────────────────
   9. PROVIDER CARD SCROLL (ARROWS)
───────────────────────────────────────────────── */
(function initProviderScroll() {
  const track = document.getElementById('providers-track');
  const prev  = document.getElementById('providers-prev');
  const next  = document.getElementById('providers-next');
  if (!track || !prev || !next) return;

  const SCROLL_AMT = 280;
  prev.addEventListener('click', () => track.scrollBy({ left: -SCROLL_AMT, behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left:  SCROLL_AMT, behavior: 'smooth' }));
})();

/* ─────────────────────────────────────────────────
   10. PRICING TOGGLE
───────────────────────────────────────────────── */
(function initPricingToggle() {
  const btns    = document.querySelectorAll('.pricing-toggle-btn');
  const amounts = document.querySelectorAll('[data-monthly][data-yearly]');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;

      amounts.forEach(el => {
        const newVal = mode === 'monthly' ? el.dataset.monthly : el.dataset.yearly;

        // Animate the number change
        el.style.transform = 'scale(0.8)';
        el.style.opacity   = '0';
        el.style.transition = 'all 0.2s ease';
        setTimeout(() => {
          el.textContent    = newVal;
          el.style.transform = 'scale(1.1)';
          el.style.opacity  = '1';
          setTimeout(() => {
            el.style.transform = 'scale(1)';
          }, 100);
        }, 150);
      });
    });
  });
})();

/* ─────────────────────────────────────────────────
   11. HERO ENTRANCE ANIMATIONS
───────────────────────────────────────────────── */
(function initHeroAnimation() {
  const targets = [
    { sel: '.hero-badge',    delay: 0   },
    { sel: '.hero-title',    delay: 200 },
    { sel: '.hero-sub',      delay: 400 },
    { sel: '.hero-actions',  delay: 600 },
    { sel: '.hero-search',   delay: 750 },
    { sel: '.hero-trust',    delay: 900 },
  ];

  targets.forEach(({ sel, delay }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.style.opacity   = '0';
    el.style.transform = 'translateY(28px)';

    setTimeout(() => {
      el.style.transition = `opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)`;
      el.style.opacity    = '1';
      el.style.transform  = 'translateY(0)';
    }, delay);
  });

  // Floating cards staggered
  document.querySelectorAll('.float-card').forEach((card, i) => {
    card.style.opacity = '0';
    setTimeout(() => {
      card.style.transition = 'opacity 0.8s ease';
      card.style.opacity    = '1';
    }, 1200 + i * 200);
  });
})();

/* ─────────────────────────────────────────────────
   12. PARALLAX — FLOAT CARDS ON SCROLL
───────────────────────────────────────────────── */
(function initParallax() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scroll  = window.scrollY;
        const cards   = hero.querySelectorAll('.float-card');
        cards.forEach((el, i) => {
          const dir = i % 2 === 0 ? 1 : -1;
          el.style.transform = `translateY(${scroll * dir * 0.06}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ─────────────────────────────────────────────────
   13. SEARCH INPUT — ANIMATED TYPEWRITER PLACEHOLDER
───────────────────────────────────────────────── */
(function initSearchDemo() {
  const input = document.getElementById('hero-search-input');
  if (!input) return;

  const suggestions = [
    'Plumbing repair',
    'AC service & cleaning',
    'Electrical wiring',
    'House deep cleaning',
    'Carpenter for furniture',
    'Pest control treatment',
    'CCTV installation',
    'Interior painting',
    'Solar panel cleaning'
  ];

  let idx = 0, t;

  function cycle() {
    if (document.activeElement === input) { t = setTimeout(cycle, 4000); return; }
    const text = suggestions[idx % suggestions.length];
    idx++;
    let i = 0;
    input.placeholder = '';

    const typeInt = setInterval(() => {
      input.placeholder += text[i++];
      if (i >= text.length) {
        clearInterval(typeInt);
        t = setTimeout(() => {
          let back = text.length;
          const eraseInt = setInterval(() => {
            input.placeholder = text.substring(0, --back);
            if (back <= 0) { clearInterval(eraseInt); t = setTimeout(cycle, 800); }
          }, 35);
        }, 2500);
      }
    }, 58);
  }

  t = setTimeout(cycle, 2500);
})();

/* ─────────────────────────────────────────────────
   14. SEARCH BUTTON — REDIRECT TO APP
───────────────────────────────────────────────── */
(function initSearchButton() {
  const btn   = document.getElementById('hero-search-btn');
  const input = document.getElementById('hero-search-input');
  if (!btn || !input) return;

  function doSearch() {
    const query = input.value.trim();
    const url   = query
      ? `http://localhost:5173/signup?q=${encodeURIComponent(query)}`
      : 'http://localhost:5173/signup';
    window.location.href = url;
  }

  btn.addEventListener('click', doSearch);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
})();

/* ─────────────────────────────────────────────────
   15. SERVICE CARD FILTER
───────────────────────────────────────────────── */
(function initServiceFilter() {
  const filterBtns = document.querySelectorAll('.service-filter-btn');
  const cards      = document.querySelectorAll('.service-card');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const category = card.dataset.category || 'all';
        const show     = filter === 'all' || category === filter;

        if (show) {
          card.style.opacity   = '1';
          card.style.transform = 'scale(1)';
          card.style.display   = '';
        } else {
          card.style.opacity   = '0';
          card.style.transform = 'scale(0.94)';
          card.style.transition = 'opacity 0.3s, transform 0.3s';
          setTimeout(() => { if (card.style.opacity === '0') card.style.display = 'none'; }, 300);
        }
      });
    });
  });
})();

/* ─────────────────────────────────────────────────
   16. MOBILE HAMBURGER MENU
───────────────────────────────────────────────── */
(function initMobileNav() {
  const ham      = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  const closeBtn  = document.getElementById('mobile-nav-close');

  if (!ham || !mobileNav) return;

  ham.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    ham.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      ham.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  }

  // Close on nav link click
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      ham.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
      mobileNav.classList.remove('open');
      ham.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
})();

/* ─────────────────────────────────────────────────
   17. PROVIDER BOOK BUTTONS — REDIRECT TO SIGNUP
───────────────────────────────────────────────── */
(function initProviderBookButtons() {
  document.querySelectorAll('.provider-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = 'http://localhost:5173/signup';
    });
  });
})();

/* ─────────────────────────────────────────────────
   18. ANIMATED DASHBOARD CHART BARS (provider panel)
───────────────────────────────────────────────── */
(function initChartAnimation() {
  const bars = document.querySelectorAll('.dash-chart-bar');
  if (!bars.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        bars.forEach((bar, i) => {
          setTimeout(() => {
            bar.style.transition = `height 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s`;
          }, 100);
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });

  if (bars[0].parentElement) {
    observer.observe(bars[0].parentElement);
  }
})();

/* ─────────────────────────────────────────────────
   19. SCROLL-BASED ACTIVE NAV LINK HIGHLIGHTING
───────────────────────────────────────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id], div[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === `#${id}`) {
            link.style.color = '#fff';
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
})();

/* ─────────────────────────────────────────────────
   20. SERVICE CARD — KEYBOARD ACCESSIBILITY (ENTER)
───────────────────────────────────────────────── */
document.querySelectorAll('.service-card[tabindex="0"]').forEach(card => {
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = 'http://localhost:5173/signup';
    }
  });
});

/* ─────────────────────────────────────────────────
   21. STEP CIRCLE HOVER GLOW (CSS is supplemented here)
───────────────────────────────────────────────── */
document.querySelectorAll('.step-circle').forEach(circle => {
  const num = circle.dataset.num;
  circle.addEventListener('mouseenter', () => {
    circle.style.background = `rgba(79,70,229,0.15)`;
  });
  circle.addEventListener('mouseleave', () => {
    circle.style.background = '';
  });
});

/* ─────────────────────────────────────────────────
   22. LIVE DEMO — SIMULATE NEW BOOKING NOTIFICATIONS
───────────────────────────────────────────────── */
(function initLiveNotification() {
  const notifications = [
    { text: 'Ravi K. just accepted a booking in Andheri', icon: '⚡' },
    { text: 'New 5-star review: "Excellent plumbing work!"', icon: '⭐' },
    { text: 'Priya S. completed a cleaning in Bandra', icon: '🧹' },
    { text: 'New provider joined: Amit (Painter) · Pune', icon: '🎨' },
    { text: '847 bookings completed today across India', icon: '🏠' },
  ];

  let idx = 0;
  const existing = document.querySelector('.float-card-3');
  if (!existing) return;

  function showNotification() {
    const n   = notifications[idx++ % notifications.length];
    const info = existing.querySelector('.float-card-info');
    if (!info) return;

    existing.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    existing.style.opacity    = '0';
    existing.style.transform  += ' scale(0.92)';

    setTimeout(() => {
      const span  = info.querySelector('span');
      const small = info.querySelector('small');
      const icon  = existing.querySelector('.float-card-icon');

      if (span)  span.textContent  = 'ServiceHub Live';
      if (small) small.textContent = n.text;
      if (icon)  icon.textContent  = n.icon;

      existing.style.opacity   = '1';
      existing.style.transform = existing.style.transform.replace(' scale(0.92)', '');
    }, 400);

    setTimeout(showNotification, 6000);
  }

  setTimeout(showNotification, 5000);
})();
