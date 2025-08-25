// Year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Animated particle background
(function initParticles() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const density = Math.min(120, Math.floor((width * height) / 16000));
  const particles = [];
  const mouse = { x: width / 2, y: height / 2 };

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function resetParticle(p) {
    p.x = rand(0, width);
    p.y = rand(0, height);
    p.vx = rand(-0.15, 0.15);
    p.vy = rand(-0.1, 0.12);
    p.size = rand(0.6, 2.2);
    p.parallax = rand(0.015, 0.05);
    p.hue = 200 + rand(-30, 80); // cyan to purple
    p.alpha = rand(0.20, 0.7);
  }

  for (let i = 0; i < density; i++) {
    const p = {};
    resetParticle(p);
    particles.push(p);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // subtle gradient backdrop
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, 'rgba(124,58,237,0.05)');
    g.addColorStop(1, 'rgba(34,211,238,0.05)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    for (const p of particles) {
      // parallax toward mouse
      const dx = (mouse.x - width / 2) * p.parallax;
      const dy = (mouse.y - height / 2) * p.parallax;

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -10 || p.x > width + 10 || p.y < -10 || p.y > height + 10) {
        resetParticle(p);
      }

      ctx.beginPath();
      ctx.arc(p.x + dx, p.y + dy, p.size, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = `hsla(${p.hue}, 85%, 64%, ${p.alpha})`;
      ctx.shadowColor = `hsla(${p.hue}, 95%, 65%, ${Math.min(0.5, p.alpha + 0.15)})`;
      ctx.shadowBlur = 16;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  function onResize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  draw();
})();

// Proximity glow effect
(function proximityGlow() {
  const elements = Array.from(document.querySelectorAll('.proximity'));
  if (!elements.length) return;

  let rects = [];
  function measure() {
    rects = elements.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        el,
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
        radius: Number(el.getAttribute('data-proximity-radius') || 180)
      };
    });
  }

  function update(e) {
    const x = e.clientX;
    const y = e.clientY;
    for (const it of rects) {
      const dx = it.cx - x;
      const dy = it.cy - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const p = Math.max(0, 1 - d / it.radius);
      it.el.style.setProperty('--p', p.toFixed(3));
    }
  }

  window.addEventListener('resize', measure);
  window.addEventListener('scroll', measure, { passive: true });
  window.addEventListener('mousemove', update);
  measure();
})();

// Reveal on scroll
(function revealOnScroll() {
  const revealEls = document.querySelectorAll('[data-reveal], .card, .btn, .section-title, .subtitle');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.setAttribute('data-reveal', '');
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach((el) => io.observe(el));
})();

// Image placeholders (until user adds real images)
(function imageFallbacks() {
  const placeholder = (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">` +
        `<defs>` +
          `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
            `<stop offset="0%" stop-color="#7c3aed" stop-opacity="0.85"/>` +
            `<stop offset="100%" stop-color="#06b6d4" stop-opacity="0.85"/>` +
          `</linearGradient>` +
        `</defs>` +
        `<rect width="1200" height="675" fill="url(#g)"/>` +
        `<g fill="#fff" fill-opacity="0.9">` +
          `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Cairo, sans-serif" font-weight="700" font-size="64">صورة اللعبة</text>` +
        `</g>` +
      `</svg>`
    )
  );

  document.querySelectorAll('.game-card img').forEach((img) => {
    img.addEventListener('error', () => {
      if (!img.dataset.fallback) {
        img.dataset.fallback = '1';
        img.src = placeholder;
      }
    }, { once: true });
  });
})();

