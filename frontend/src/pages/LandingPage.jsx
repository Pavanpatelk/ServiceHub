import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';

/* ─── Particle Canvas Hook ─── */
function useParticleCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, animId;
    const COLORS = ['rgba(99,102,241,', 'rgba(139,92,246,', 'rgba(6,182,212,', 'rgba(255,255,255,'];
    let particles = [];
    let mouse = { x: -9999, y: -9999 };

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };

    const mkParticle = () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.6 + 0.3,
      vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32,
      alpha: Math.random() * 0.45 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: Math.random(),
      dLife: (Math.random() * 0.003 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
    });

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      // connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99,102,241,${(1 - d / 110) * 0.1})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      particles.forEach(p => {
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 100) { p.vx += (mdx / md) * (100 - md) / 100 * 0.22; p.vy += (mdy / md) * (100 - md) / 100 * 0.22; }
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 1.1) { p.vx *= 0.94; p.vy *= 0.94; }
        p.vx *= 0.995; p.vy *= 0.995;
        p.x += p.vx; p.y += p.vy;
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
    };

    resize();
    particles = Array.from({ length: 85 }, mkParticle);
    tick();

    const onResize = () => { resize(); };
    const onMouseMove = e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    window.addEventListener('resize', onResize);
    canvas.parentElement?.addEventListener('mousemove', onMouseMove);
    canvas.parentElement?.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      canvas.parentElement?.removeEventListener('mousemove', onMouseMove);
      canvas.parentElement?.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [canvasRef]);
}

/* ─── Counter Hook ─── */
function useCounter(target, decimals = 0, suffix = '') {
  const [val, setVal] = useState('0' + suffix);
  const ref = useRef(null);
  const observed = useRef(false);

  const elRef = useCallback(node => {
    if (ref.current) return;
    ref.current = node;
    if (!node) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !observed.current) {
        observed.current = true;
        const dur = 2000, start = performance.now();
        const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const step = now => {
          const p = Math.min((now - start) / dur, 1);
          setVal((target * ease(p)).toFixed(decimals) + suffix);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(node);
  }, [target, decimals, suffix]);

  return [val, elRef];
}

/* ─── Reveal Hook ─── */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ─── Reveal Wrapper ─── */
const Reveal = ({ children, className = '', direction = 'up', delay = 0, style = {} }) => {
  const [ref, visible] = useReveal();
  const base = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : direction === 'left' ? 'translateX(-50px)' : direction === 'right' ? 'translateX(50px)' : direction === 'scale' ? 'scale(0.88)' : 'translateY(44px)',
    transition: `opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    ...style,
  };
  return <div ref={ref} className={className} style={base}>{children}</div>;
};

/* ─── Data ─── */
const SERVICES = [
  { emoji: '🔧', name: 'Plumbing', desc: 'Leak repairs, pipe replacement, bathroom fittings, water heater installation, and emergency drain unblocking.', tags: ['Leak Repair', 'Water Heater', 'Drain Fix'], bg: 'rgba(79,70,229,0.15)', featured: true },
  { emoji: '⚡', name: 'Electrical', desc: 'Wiring, fan installation, switchboard repairs, MCB replacement, and complete home electrical audits.', tags: ['Wiring', 'Fan Install', 'Switchboard'], bg: 'rgba(245,158,11,0.15)' },
  { emoji: '❄️', name: 'AC Service', desc: 'Deep cleaning, gas top-up, compressor repair, installation, and seasonal maintenance for all AC brands.', tags: ['Deep Clean', 'Gas Refill', 'Installation'], bg: 'rgba(6,182,212,0.15)' },
  { emoji: '🧹', name: 'Deep Cleaning', desc: 'Full home sanitization, kitchen degreasing, sofa shampooing, bathroom descaling, and post-construction cleanup.', tags: ['Sanitize', 'Kitchen', 'Sofa'], bg: 'rgba(16,185,129,0.15)' },
  { emoji: '🪵', name: 'Carpentry', desc: 'Custom furniture, door & window repairs, modular kitchen assembly, wall panelling, and wardrobe fixing.', tags: ['Furniture', 'Doors', 'Kitchen'], bg: 'rgba(139,92,246,0.15)' },
  { emoji: '🎨', name: 'Painting', desc: 'Interior & exterior painting, texture walls, waterproofing, wood polish, and anti-corrosion coatings.', tags: ['Interior', 'Exterior', 'Waterproof'], bg: 'rgba(236,72,153,0.15)' },
];

const STEPS = [
  { num: '1', emoji: '🔍', title: 'Search & Pick', desc: 'Browse verified professionals by service type, location, rating, and real-time availability.' },
  { num: '2', emoji: '📅', title: 'Book Instantly', desc: 'Choose a slot, confirm your address, and book with transparent upfront pricing. No hidden charges.' },
  { num: '3', emoji: '📍', title: 'Track Live', desc: 'Watch your professional on the live map. Get real-time ETA from the moment they\'re dispatched.' },
  { num: '4', emoji: '⭐', title: 'Pay & Review', desc: 'Pay securely via UPI, card, or wallet after the job is done. Leave a review to help the community.' },
];

const PROVIDERS = [
  { name: 'Ravi Kumar',   role: '⚡ Master Electrician', rating: '4.9', jobs: '847',  exp: '8 yrs',  tags: ['Wiring', 'Fans', 'MCB'],         price: '₹299+', avail: 'green', color: '4F46E5' },
  { name: 'Priya Sharma', role: '🧹 Cleaning Specialist', rating: '5.0', jobs: '1,203', exp: '6 yrs', tags: ['Deep Clean', 'Kitchen', 'Sofa'],  price: '₹499+', avail: 'green', color: '06B6D4' },
  { name: 'Arjun Patel',  role: '🔧 Senior Plumber',     rating: '4.8', jobs: '562',  exp: '11 yrs', tags: ['Leaks', 'Drainage', 'Fittings'],  price: '₹349+', avail: 'amber', color: '8B5CF6' },
  { name: 'Sunita Singh', role: '❄️ AC Technician',      rating: '4.9', jobs: '389',  exp: '5 yrs',  tags: ['All Brands', 'Gas Refill', 'Install'], price: '₹599+', avail: 'green', color: 'EC4899' },
  { name: 'Deepak Verma', role: '🪵 Master Carpenter',   rating: '4.7', jobs: '718',  exp: '14 yrs', tags: ['Furniture', 'Modular', 'Doors'],   price: '₹449+', avail: 'green', color: '10B981' },
];

const TESTIMONIALS = [
  { text: 'I had a pipe burst at midnight on a Sunday. ServiceHub had a plumber at my door within 40 minutes. The pricing was fair and there were zero hidden charges. Absolutely blown away — this is what 5-star service looks like.', name: 'Meera Nair', meta: 'Homeowner · Mumbai', stars: 5, emoji: '👩', featured: true },
  { text: 'As someone who travels constantly, I needed reliable help for my apartment. ServiceHub\'s recurring cleaning service is a game changer. My apartment is spotless every time I return.', name: 'Siddharth Rao', meta: 'Software Engineer · Bangalore', stars: 5, emoji: '👨' },
  { text: 'Got my AC serviced before summer. The technician was punctual, professional, and explained everything he was doing. The cool air is back and it cost less than I expected. Definitely booking again!', name: 'Anjali Mishra', meta: 'Teacher · Delhi NCR', stars: 5, emoji: '👧' },
  { text: 'The live tracking feature is brilliant. I could see exactly where the electrician was and got an accurate ETA. No more waiting all day — this is the future of home services.', name: 'Rahul Gupta', meta: 'Business Owner · Pune', stars: 4, emoji: '👨‍💼' },
  { text: 'I\'m a single mom and safety is my top priority. Knowing every professional is background-verified gives me real peace of mind. The ServiceHub guarantee means I never feel at risk. Highly recommended.', name: 'Kavya Reddy', meta: 'Working Mom · Hyderabad', stars: 5, emoji: '👩‍👧' },
  { text: 'Booked a full home deep cleaning for my new flat. The team arrived on time, brought all their own equipment, and left the place looking brand new. Worth every rupee!', name: 'Vikram Shah', meta: 'New Homeowner · Ahmedabad', stars: 5, emoji: '🧑‍🎓' },
];

const PLANS = [
  {
    tier: 'Starter', priceMonthly: 0, priceYearly: 0, desc: 'Perfect for occasional home services. Pay per service, no commitments.',
    features: [
      { yes: true, text: 'Book any service' },
      { yes: true, text: 'Verified professionals' },
      { yes: true, text: 'Live tracking' },
      { yes: false, text: 'Priority booking' },
      { yes: false, text: 'Discounts on services' },
      { yes: false, text: 'Dedicated support agent' },
    ],
    btn: 'outline', btnText: 'Get Started Free', link: '/signup',
  },
  {
    tier: 'Pro', priceMonthly: 299, priceYearly: 209, desc: 'For busy households that need regular, reliable service with added perks.',
    features: [
      { yes: true, text: 'All Starter features' },
      { yes: true, text: 'Priority booking' },
      { yes: true, text: '15% off all services' },
      { yes: true, text: 'Faster response time' },
      { yes: true, text: 'Repeat professional matching' },
      { yes: false, text: 'Dedicated support agent' },
    ],
    popular: true, btn: 'solid', btnText: 'Start Pro Plan', link: '/signup',
  },
  {
    tier: 'Business', priceMonthly: 799, priceYearly: 559, desc: 'For offices, societies, and property managers needing ongoing care.',
    features: [
      { yes: true, text: 'All Pro features' },
      { yes: true, text: 'Dedicated support agent' },
      { yes: true, text: '25% off all services' },
      { yes: true, text: 'Multi-location management' },
      { yes: true, text: 'Team access & controls' },
      { yes: true, text: 'Monthly analytics report' },
    ],
    btn: 'outline', btnText: 'Contact Sales', link: '/signup',
  },
];

const MARQUEE_ITEMS = ['🔧 Plumbing', '⚡ Electrical', '❄️ AC Repair', '🧹 Deep Cleaning', '🪵 Carpentry', '🎨 Painting', '🐛 Pest Control', '📷 CCTV Install', '🚿 Bathroom Repair', '☀️ Solar Panels', '🔒 Locksmith', '📦 Moving Help'];

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const trackRef  = useRef(null);

  const [navScrolled,   setNavScrolled]   = useState(false);
  const [showBackTop,   setShowBackTop]   = useState(false);
  const [pricingMode,   setPricingMode]   = useState('monthly');
  const [searchVal,     setSearchVal]     = useState('');
  const [mobileOpen,    setMobileOpen]    = useState(false);

  // Particle canvas
  useParticleCanvas(canvasRef);

  // Counters
  const [c1, r1] = useCounter(12400, 0, '+');
  const [c2, r2] = useCounter(3.2,   1, 'M+');
  const [c3, r3] = useCounter(4.9,   1, '/5');
  const [c4, r4] = useCounter(50,    0, '+');

  // Scroll effects
  useEffect(() => {
    const onScroll = () => {
      setNavScrolled(window.scrollY > 40);
      setShowBackTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Search placeholder cycling
  useEffect(() => {
    const suggestions = ['Plumbing repair', 'AC service & cleaning', 'Electrical wiring', 'House deep cleaning', 'Carpenter', 'Pest control'];
    let idx = 0;
    const el = document.getElementById('lp-search-input');
    if (!el) return;
    let t;
    const cycle = () => {
      if (document.activeElement === el) { t = setTimeout(cycle, 3500); return; }
      const text = suggestions[idx++ % suggestions.length];
      let i = 0;
      el.placeholder = '';
      const type = () => {
        el.placeholder += text[i++];
        if (i < text.length) t = setTimeout(type, 55);
        else t = setTimeout(() => {
          let b = text.length;
          const erase = () => { el.placeholder = text.slice(0, --b); if (b > 0) t = setTimeout(erase, 30); else t = setTimeout(cycle, 700); };
          erase();
        }, 2200);
      };
      type();
    };
    t = setTimeout(cycle, 2000);
    return () => clearTimeout(t);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const scrollProviders = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  const REPEAT = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]; // duplicate for seamless loop

  return (
    <div className="landing-root">

      {/* ── BACK TO TOP ── */}
      <button className={`lp-back-top${showBackTop ? ' visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">↑</button>

      {/* ── MOBILE NAV ── */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(11,15,25,0.97)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <button onClick={() => setMobileOpen(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', fontSize: 28, color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
          {['services', 'how-it-works', 'providers', 'testimonials', 'pricing'].map(id => (
            <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: '#fff', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 28, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.03em', textTransform: 'capitalize' }}>
              {id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
          <Link to="/login" style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 600 }}>Log In</Link>
          <Link to="/signup" className="lp-btn-primary lg">Get Started →</Link>
        </div>
      )}

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav className={`lp-nav${navScrolled ? ' scrolled' : ''}`}>
        <div className="lp-container lp-nav-inner">
          <Link to="/" className="lp-nav-logo">
            <div className="lp-nav-logo-icon">🔧</div>
            ServiceHub
          </Link>

          <ul className="lp-nav-links">
            {[['services', 'Services'], ['how-it-works', 'How It Works'], ['providers', 'Providers'], ['testimonials', 'Reviews'], ['pricing', 'Pricing']].map(([id, label]) => (
              <li key={id}><a href={`#${id}`} onClick={e => { e.preventDefault(); scrollTo(id); }}>{label}</a></li>
            ))}
          </ul>

          <div className="lp-nav-cta">
            <Link to="/login"  className="lp-btn-ghost">Log In</Link>
            <Link to="/signup" className="lp-btn-primary">Get Started <span>→</span></Link>
          </div>

          <button style={{ display: 'none', background: 'none', border: 'none', padding: 6, cursor: 'pointer', flexDirection: 'column', gap: 5 }} className="lp-hamburger" onClick={() => setMobileOpen(true)}>
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--text-light)', borderRadius: 99 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--text-light)', borderRadius: 99 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--text-light)', borderRadius: 99 }} />
          </button>
        </div>
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section id="hero" className="lp-hero">
        <canvas ref={canvasRef} className="lp-hero-canvas" />
        <div className="lp-hero-gradient" />

        {/* Floating ambient cards */}
        <div className="lp-float-cards" aria-hidden="true">
          {[
            { icon: '🔧', bg: 'rgba(79,70,229,0.15)', name: 'Ravi Electricals', sub: 'Electrician · Just booked' },
            { icon: '❄️', bg: 'rgba(6,182,212,0.15)',  name: 'AC Cooling Pro',   sub: 'AC Repair · ₹599 flat' },
            { icon: '✅', bg: 'rgba(16,185,129,0.15)', name: 'Booking Confirmed', sub: 'Plumber arriving in 25 min' },
            { icon: '⭐', bg: 'rgba(245,158,11,0.15)', name: '4.9 / 5.0 Rating', sub: '12,400+ reviews' },
          ].map((c, i) => (
            <div key={i} className="lp-float-card">
              <div className="lp-float-icon" style={{ background: c.bg }}>{c.icon}</div>
              <div>
                <span>{c.name}</span>
                <small className="lp-float-small">{c.sub}</small>
                {i < 2 && <div className="lp-float-stars">★★★★★</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span className="lp-badge-dot" />
            Now live in 50+ cities across India
          </div>

          <h1 className="lp-hero-title">
            Your Home Deserves<br />
            <span className="shimmer">Expert Care, Instantly</span>
          </h1>

          <p className="lp-hero-sub">
            Connect with verified, background-checked local professionals for plumbing, electrical, AC repair, cleaning & more — all in under 60 seconds.
          </p>

          <div className="lp-hero-actions">
            <Link to="/signup" className="lp-btn-primary lg">🚀 Book a Service Now</Link>
            <button className="lp-btn-secondary" onClick={() => scrollTo('how-it-works')}>▶ See How It Works</button>
          </div>

          <div className="lp-hero-search">
            <input
              id="lp-search-input"
              type="text"
              className="lp-hero-search-input"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && navigate('/signup')}
              placeholder="Search for a service…"
              aria-label="Search for a service"
              autoComplete="off"
            />
            <button className="lp-hero-search-btn" onClick={() => navigate('/signup')}>🔍 Search</button>
          </div>

          <div className="lp-hero-trust">
            {[['✅', '100% Verified Pros'], ['🛡️', 'Insured & Certified'], ['⭐', '4.9 Avg Rating'], ['💰', 'Transparent Pricing']].map(([icon, text], i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="lp-trust-divider" />}
                <div className="lp-trust-item"><span>{icon}</span><span>{text}</span></div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="lp-scroll-indicator" aria-hidden="true">
          <div className="lp-scroll-mouse"><div className="lp-scroll-wheel" /></div>
        </div>
      </section>

      {/* ═══════════════ MARQUEE ═══════════════ */}
      <div className="lp-marquee">
        <div className="lp-marquee-track">
          {REPEAT.map((item, i) => (
            <React.Fragment key={i}>
              <div className="lp-marquee-item">{item}</div>
              <div className="lp-marquee-dot" />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ═══════════════ STATS ═══════════════ */}
      <section id="stats" className="lp-stats">
        <div className="lp-container">
          <div className="lp-stats-grid">
            {[
              { icon: '👨‍🔧', val: c1, ref: r1, label: 'Verified Professionals' },
              { icon: '🏠',   val: c2, ref: r2, label: 'Homes Served' },
              { icon: '⭐',   val: c3, ref: r3, label: 'Average Rating' },
              { icon: '🌆',   val: c4, ref: r4, label: 'Cities Covered' },
            ].map(({ icon, val, ref, label }, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="lp-stat-card" ref={ref}>
                  <span className="lp-stat-icon">{icon}</span>
                  <span className="lp-stat-num">{val}</span>
                  <span className="lp-stat-label">{label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SERVICES ═══════════════ */}
      <section id="services" className="lp-services">
        <div className="lp-container">
          <div className="lp-services-header">
            <Reveal><p className="lp-section-label">What We Offer</p></Reveal>
            <Reveal delay={0.1}><h2 className="lp-section-title">Every Service Your Home<br />Could Ever Need</h2></Reveal>
            <Reveal delay={0.2}><p className="lp-section-sub" style={{ maxWidth: 520, margin: '0 auto' }}>From emergency repairs to scheduled maintenance, we've got every corner of your home covered with elite local professionals.</p></Reveal>
          </div>

          <div className="lp-services-grid">
            {SERVICES.map((svc, i) => (
              <Reveal key={i} delay={(i % 3) * 0.1}>
                <div className={`lp-svc-card${svc.featured ? ' featured' : ''}`} onClick={() => navigate('/signup')}>
                  <div className="lp-svc-card-top">
                    <div className="lp-svc-icon" style={{ background: svc.bg }}>{svc.emoji}</div>
                    <div className="lp-svc-arrow">→</div>
                  </div>
                  <h3 className="lp-svc-name">{svc.name}</h3>
                  <p className="lp-svc-desc">{svc.desc}</p>
                  <div className="lp-svc-tags">{svc.tags.map(t => <span key={t} className="lp-svc-tag">{t}</span>)}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section id="how-it-works" className="lp-how">
        <div className="lp-container">
          <div className="lp-how-header">
            <Reveal><p className="lp-section-label">Simple 4-Step Process</p></Reveal>
            <Reveal delay={0.1}>
              <h2 className="lp-section-title">
                From Problem to Fixed<br />
                <span className="gradient-text">In Under 60 Minutes</span>
              </h2>
            </Reveal>
          </div>

          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 0.12}>
                <div className="lp-step">
                  <div className="lp-step-circle">
                    <span className="lp-step-num">{s.num}</span>
                    <div className="lp-step-emoji">{s.emoji}</div>
                  </div>
                  <h3 className="lp-step-title">{s.title}</h3>
                  <p className="lp-step-desc">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section id="features" className="lp-features">
        <div className="lp-container">

          {/* Split 1 — Customer */}
          <div className="lp-split">
            <Reveal direction="left">
              <div>
                <p className="lp-section-label">Built for You</p>
                <h2 className="lp-section-title">Booking That Feels<br />Like Magic ✨</h2>
                <p className="lp-section-sub">From the first tap to the final invoice, ServiceHub makes the entire experience effortless, transparent, and stress-free.</p>
                <div className="lp-feature-list">
                  {[
                    ['Real-Time Live Tracking', 'See your professional on a live map as they head to your home. Know exactly when they\'ll arrive.'],
                    ['Upfront Transparent Pricing', 'Get a firm price before booking. No surprises. No hidden fees. What you see is what you pay.'],
                    ['Background-Checked Pros', 'Every professional is verified, certified, and background-checked before joining our platform.'],
                    ['ServiceHub Guarantee', 'Not satisfied? We\'ll send another professional for free or give you a full refund. No questions asked.'],
                  ].map(([title, desc], i) => (
                    <div key={i} className="lp-feature-item">
                      <div className="lp-feature-check">✓</div>
                      <div><div className="lp-feature-item-title">{title}</div><div className="lp-feature-item-desc">{desc}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Phone Mockup */}
            <Reveal direction="right">
              <div className="lp-phone-wrap">
                <div className="lp-phone-glow" />
                <div className="lp-phone-orbit lp-phone-orbit-1" />
                <div className="lp-phone-orbit lp-phone-orbit-2" />

                <div className="lp-orbit-badge lp-orbit-badge-1">
                  <span style={{ fontSize: 18 }}>⚡</span>
                  <div><div style={{ fontSize: 11, fontWeight: 700 }}>Live Tracking</div><div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Pro en route</div></div>
                </div>
                <div className="lp-orbit-badge lp-orbit-badge-2">
                  <span style={{ fontSize: 18 }}>🛡️</span>
                  <div><div style={{ fontSize: 11, fontWeight: 700 }}>Insured Job</div><div style={{ fontSize: 10, color: 'var(--text-dim)' }}>100% protected</div></div>
                </div>

                <div className="lp-phone-frame">
                  <div className="lp-phone-notch" />
                  <div className="lp-phone-screen">
                    <div className="lp-ps-logo">
                      <span style={{ background: 'linear-gradient(135deg,#4F46E5,#8B5CF6)', borderRadius: 7, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>🔧</span>
                      ServiceHub
                    </div>
                    <div className="lp-ps-search"><span style={{ fontSize: 11 }}>🔍</span><span>Search services…</span></div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Popular Services</div>
                    <div className="lp-ps-grid">
                      {[['🔧', 'Plumbing', '4F46E5'], ['⚡', 'Electric', 'F59E0B'], ['❄️', 'AC Repair', '06B6D4'], ['🧹', 'Cleaning', '10B981']].map(([icon, label, col]) => (
                        <div key={label} className="lp-ps-tile" style={{ background: `rgba(${parseInt(col.slice(0,2),16)},${parseInt(col.slice(2,4),16)},${parseInt(col.slice(4,6),16)},0.12)`, border: `1px solid rgba(${parseInt(col.slice(0,2),16)},${parseInt(col.slice(2,4),16)},${parseInt(col.slice(4,6),16)},0.2)` }}>
                          <span className="lp-ps-tile-icon">{icon}</span>{label}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Active Booking</div>
                    <div className="lp-ps-booking">
                      <div className="lp-ps-avatar">🔧</div>
                      <div><div className="lp-ps-info-title">Ravi Kumar</div><div className="lp-ps-info-sub">Arriving in 18 min · 4.9 ⭐</div></div>
                      <div className="lp-ps-live">LIVE</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, marginTop: 10 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 5 }}>Order Summary</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#fff' }}><span>AC Deep Clean · 1 unit</span><span>₹599</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}><span>ServiceHub guarantee</span><span style={{ color: '#34D399' }}>✓ Included</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Split 2 — Provider */}
          <div className="lp-split reverse" style={{ marginTop: 100 }}>
            <Reveal direction="right">
              <div>
                <p className="lp-section-label">For Service Professionals</p>
                <h2 className="lp-section-title">Grow Your Business<br /><span className="gradient-text">With Zero Hassle</span></h2>
                <p className="lp-section-sub">Join 12,000+ skilled professionals who are growing their income and building their reputation on ServiceHub.</p>
                <div className="lp-feature-list">
                  {[
                    ['Get Customers Automatically', 'Our smart matching system connects you with nearby customers actively looking for your skills.'],
                    ['Earn More, Earn Faster', 'Set your own rates, choose your hours, and get paid directly to your bank within 24 hours.'],
                    ['Manage Your Schedule', 'Accept or decline bookings with full flexibility. Take days off, set working hours, all from the app.'],
                    ['Dedicated Support', '24/7 support team, dispute resolution, and performance coaching to help you grow your ratings.'],
                  ].map(([title, desc], i) => (
                    <div key={i} className="lp-feature-item">
                      <div className="lp-feature-check">✓</div>
                      <div><div className="lp-feature-item-title">{title}</div><div className="lp-feature-item-desc">{desc}</div></div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 32 }}>
                  <Link to="/signup?role=provider" className="lp-btn-primary lg">🤝 Join as a Professional</Link>
                </div>
              </div>
            </Reveal>

            {/* Provider Stats UI */}
            <Reveal direction="left">
              <div className="lp-provider-ui">
                <div className="lp-earn-card">
                  <div className="lp-earn-label">Monthly Earnings</div>
                  <div className="lp-earn-amount">₹38,400</div>
                  <div className="lp-earn-growth">↑ 24% from last month</div>
                  <div className="lp-earn-bars">
                    {[35, 55, 45, 70, 60, 85, 100].map((h, i) => (
                      <div key={i} className="lp-earn-bar" style={{ height: `${h}%`, background: i === 6 ? 'linear-gradient(180deg,#4F46E5,#8B5CF6)' : `rgba(79,70,229,${0.2 + i * 0.07})` }} />
                    ))}
                  </div>
                </div>

                <div className="lp-mini-grid">
                  <div className="lp-mini-card">
                    <div className="lp-mini-num">4.9</div>
                    <div className="lp-mini-stars">★★★★★</div>
                    <div className="lp-mini-label">Your Rating</div>
                  </div>
                  <div className="lp-mini-card">
                    <div className="lp-mini-num" style={{ background: 'linear-gradient(135deg,#fff,#10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>142</div>
                    <div className="lp-mini-label">Jobs Done</div>
                    <div className="lp-mini-sub">This month</div>
                  </div>
                </div>

                <div className="lp-bookings-card">
                  <div className="lp-bookings-title">Upcoming Bookings</div>
                  <div className="lp-booking-row accent">
                    <span style={{ fontSize: 18 }}>🔧</span>
                    <div><div className="lp-booking-title">Pipe Leakage Repair</div><div className="lp-booking-sub">Today · 2:30 PM · Andheri</div></div>
                    <span className="lp-booking-badge soon">SOON</span>
                  </div>
                  <div className="lp-booking-row plain">
                    <span style={{ fontSize: 18 }}>⚡</span>
                    <div><div className="lp-booking-title">Switchboard Repair</div><div className="lp-booking-sub">Tomorrow · 11:00 AM · Bandra</div></div>
                    <span className="lp-booking-badge paid">PAID</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

        </div>
      </section>

      {/* ═══════════════ PROVIDERS ═══════════════ */}
      <section id="providers" className="lp-providers">
        <div className="lp-container">
          <div className="lp-providers-header">
            <Reveal><p className="lp-section-label">Top-Rated Pros</p></Reveal>
            <Reveal delay={0.1}><h2 className="lp-section-title">Meet Our Star Professionals</h2></Reveal>
            <Reveal delay={0.2}><p className="lp-section-sub" style={{ maxWidth: 500, margin: '0 auto' }}>Hand-picked, background-verified, and consistently rated 4.8★ or higher by thousands of happy customers.</p></Reveal>
          </div>

          <Reveal>
            <div className="lp-providers-track" ref={trackRef}>
              {PROVIDERS.map((p, i) => (
                <article key={i} className="lp-pro-card">
                  <div className={`lp-pro-avail ${p.avail}`}>{p.avail === 'green' ? 'Available Now' : 'In 2 hrs'}</div>
                  <div className="lp-pro-avatar-wrap">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=${p.color}&color=fff&size=132&bold=true&rounded=true`}
                      alt={`${p.name} - ${p.role}`}
                      className="lp-pro-avatar"
                      width={66} height={66}
                    />
                    <div className="lp-pro-verified">✓</div>
                  </div>
                  <h3 className="lp-pro-name">{p.name}</h3>
                  <p className="lp-pro-role">{p.role}</p>
                  <div className="lp-pro-stats">
                    <div className="lp-pro-stat"><strong>{p.rating}</strong> ⭐</div>
                    <div className="lp-pro-stat"><strong>{p.jobs}</strong> Jobs</div>
                    <div className="lp-pro-stat"><strong>{p.exp}</strong> Exp</div>
                  </div>
                  <div className="lp-pro-tags">{p.tags.map(t => <span key={t} className="lp-pro-tag">{t}</span>)}</div>
                  <button className="lp-pro-btn" onClick={() => navigate('/signup')}>Book Now — {p.price}</button>
                </article>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <div className="lp-providers-nav">
              <button className="lp-providers-nav-btn" onClick={() => scrollProviders(-1)}>←</button>
              <button className="lp-providers-nav-btn" onClick={() => scrollProviders(1)}>→</button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section id="testimonials" className="lp-testimonials">
        <div className="lp-container">
          <div className="lp-testimonials-header">
            <Reveal><p className="lp-section-label">Real Customer Stories</p></Reveal>
            <Reveal delay={0.1}><h2 className="lp-section-title">Trusted by 3 Million+ Families</h2></Reveal>
            <Reveal delay={0.2}><p className="lp-section-sub" style={{ maxWidth: 500, margin: '0 auto' }}>Don't just take our word for it. See why families across India choose ServiceHub again and again.</p></Reveal>
          </div>

          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={(i % 3) * 0.1}>
                <article className={`lp-testi-card${t.featured ? ' featured' : ''}`}>
                  <span className="lp-testi-quote">"</span>
                  <p className="lp-testi-text">{t.text}</p>
                  <div className="lp-testi-author">
                    <div className="lp-testi-avatar">{t.emoji}</div>
                    <div>
                      <div className="lp-testi-name">{t.name}</div>
                      <div className="lp-testi-meta">{t.meta}</div>
                    </div>
                    <div className="lp-testi-stars">{'★'.repeat(t.stars)}{'☆'.repeat(5 - t.stars)}</div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section id="pricing" className="lp-pricing">
        <div className="lp-container">
          <div className="lp-pricing-header">
            <Reveal><p className="lp-section-label">Simple, Honest Pricing</p></Reveal>
            <Reveal delay={0.1}><h2 className="lp-section-title">No Hidden Fees. Ever.</h2></Reveal>
            <Reveal delay={0.2}><p className="lp-section-sub" style={{ maxWidth: 480, margin: '0 auto' }}>Pick the plan that suits you. Cancel anytime, no contracts, no strings attached.</p></Reveal>
            <Reveal delay={0.3}>
              <div className="lp-pricing-toggle">
                <button className={`lp-toggle-btn${pricingMode === 'monthly' ? ' active' : ''}`} onClick={() => setPricingMode('monthly')}>Monthly</button>
                <button className={`lp-toggle-btn${pricingMode === 'yearly' ? ' active' : ''}`} onClick={() => setPricingMode('yearly')}>
                  Yearly <span className="lp-save-badge">Save 30%</span>
                </button>
              </div>
            </Reveal>
          </div>

          <div className="lp-pricing-grid">
            {PLANS.map((plan, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className={`lp-price-card${plan.popular ? ' popular' : ''}`}>
                  {plan.popular && <div className="lp-popular-label">⚡ Most Popular</div>}
                  <p className="lp-price-tier" style={plan.popular ? { color: 'var(--brand-glow)' } : {}}>{plan.tier}</p>
                  <div className="lp-price-row">
                    <span className="lp-price-cur">₹</span>
                    <span className="lp-price-amt">{pricingMode === 'monthly' ? plan.priceMonthly : plan.priceYearly}</span>
                    <span className="lp-price-period">/mo</span>
                  </div>
                  <p className="lp-price-desc">{plan.desc}</p>
                  <ul className="lp-price-features">
                    {plan.features.map((f, j) => (
                      <li key={j} className={`lp-price-feature ${f.yes ? 'yes' : 'no'}`}>
                        <span className="lp-feat-icon">{f.yes ? '✓' : '✗'}</span>
                        {f.text}
                      </li>
                    ))}
                  </ul>
                  <Link to={plan.link} className={`lp-price-btn ${plan.btn}`}>{plan.btnText}</Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="lp-cta">
        <div className="lp-container">
          <Reveal direction="scale">
            <div className="lp-cta-card">
              <div className="lp-cta-glow" />
              <div className="lp-cta-grid" />
              <div className="lp-cta-content">
                <div className="lp-badge" style={{ marginBottom: 28 }}>
                  <span className="lp-badge-dot" />
                  Limited Time Offer — First Service Free
                </div>
                <h2 className="lp-cta-title">
                  Ready for a Home That's<br />
                  <span className="gradient-text">Always at Its Best?</span>
                </h2>
                <p className="lp-cta-sub">
                  Join 3 million families who trust ServiceHub for every home repair, cleaning, and maintenance need. Sign up in 30 seconds.
                </p>
                <div className="lp-cta-actions">
                  <Link to="/signup" className="lp-btn-primary lg">🚀 Create Free Account</Link>
                  <Link to="/signup?role=provider" className="lp-btn-secondary">🤝 Join as Professional</Link>
                </div>
                <div className="lp-cta-fine">
                  {['No credit card required', 'Cancel anytime', '30-day money-back guarantee'].map(t => (
                    <span key={t}>✓ {t}</span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div>
              <div className="lp-footer-logo">
                <div className="lp-footer-logo-icon">🔧</div>
                ServiceHub
              </div>
              <p className="lp-footer-desc">India's most trusted on-demand home services platform. Connecting skilled professionals with families — instantly, reliably, affordably.</p>
              <div className="lp-footer-social">
                {['𝕏', 'f', '◈', 'in', '▶'].map((icon, i) => (
                  <button key={i} className="lp-social-btn">{icon}</button>
                ))}
              </div>
            </div>

            {[
              ['Services', ['Plumbing', 'Electrical', 'AC Repair', 'Deep Cleaning', 'Carpentry', 'Painting', 'Pest Control']],
              ['Company',  ['About Us', 'Careers', 'Blog', 'Press Kit', 'Partners', 'Contact']],
            ].map(([title, links]) => (
              <div key={title}>
                <h3 className="lp-footer-col-title">{title}</h3>
                <ul className="lp-footer-links">
                  {links.map(l => <li key={l}><a href="#">{l}</a></li>)}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="lp-footer-col-title">Support</h3>
              <ul className="lp-footer-links">
                {['Help Center', 'Safety', 'Become a Pro', 'Community', 'Sitemap'].map(l => <li key={l}><a href="#">{l}</a></li>)}
              </ul>
              <div className="lp-support-box">
                <div className="lp-support-label">24/7 Customer Support</div>
                <div className="lp-support-number">1800-123-4567</div>
                <div className="lp-support-sub">Toll Free · All Days</div>
              </div>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <p className="lp-footer-copy">© 2025 ServiceHub Technologies Pvt. Ltd. · Made with ❤️ in India</p>
            <nav className="lp-footer-legal">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => <a key={l} href="#">{l}</a>)}
            </nav>
          </div>
        </div>
      </footer>

    </div>
  );
}
