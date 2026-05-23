// Full Clean Málaga — interacciones

(function () {
  // -------- Menú móvil --------
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  // -------- Año dinámico --------
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // -------- Header shadow on scroll --------
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // -------- Reveal on scroll (stagger por hermanos) --------
  if ('IntersectionObserver' in window) {
    const els = document.querySelectorAll('[data-reveal]');

    // Stagger automático: cada hermano con [data-reveal] hereda un delay creciente.
    const grouped = new Map();
    els.forEach((el) => {
      const parent = el.parentElement;
      if (!grouped.has(parent)) grouped.set(parent, []);
      grouped.get(parent).push(el);
    });
    grouped.forEach((siblings) => {
      siblings.forEach((el, i) => {
        if (siblings.length > 1) el.style.setProperty('--rd', `${i * 70}ms`);
      });
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
  }

  // -------- Contadores numéricos --------
  const counters = document.querySelectorAll('[data-count]');
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      el.textContent = val + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  // -------- Before / After Slider --------
  document.querySelectorAll('[data-ba]').forEach((slider) => {
    const handle = slider.querySelector('.ba-handle');

    const setPos = (pct) => {
      const clamped = Math.max(0, Math.min(100, pct));
      slider.style.setProperty('--pos', clamped + '%');
      if (handle) handle.setAttribute('aria-valuenow', Math.round(clamped));
    };

    const posFromEvent = (e) => {
      const rect = slider.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      return (x / rect.width) * 100;
    };

    let dragging = false;

    const start = (e) => {
      dragging = true;
      slider.classList.add('is-dragging');
      setPos(posFromEvent(e));
      e.preventDefault();
    };
    const move = (e) => {
      if (!dragging) return;
      setPos(posFromEvent(e));
    };
    const end = () => {
      dragging = false;
      slider.classList.remove('is-dragging');
    };

    // Mouse
    slider.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    // Touch
    slider.addEventListener('touchstart', start, { passive: false });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', end);

    // Click directo en cualquier zona del slider
    slider.addEventListener('click', (e) => {
      // Evita doble disparo al soltar el drag
      if (e.detail === 0) return;
      setPos(posFromEvent(e));
    });

    // Teclado en el handle
    if (handle) {
      handle.addEventListener('keydown', (e) => {
        const current = parseFloat(slider.style.getPropertyValue('--pos')) || 50;
        const step = e.shiftKey ? 10 : 4;
        if (e.key === 'ArrowLeft') { setPos(current - step); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { setPos(current + step); e.preventDefault(); }
        else if (e.key === 'Home') { setPos(0); e.preventDefault(); }
        else if (e.key === 'End') { setPos(100); e.preventDefault(); }
      });
    }

    // Animación de bienvenida cuando entra en viewport (mueve solo)
    if ('IntersectionObserver' in window) {
      const baIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          baIO.unobserve(slider);
          // Animación: de 50 -> 30 -> 70 -> 50
          const sequence = [
            { to: 30, dur: 700 },
            { to: 70, dur: 900 },
            { to: 50, dur: 700 },
          ];
          let from = 50;
          let i = 0;
          const runStep = () => {
            if (i >= sequence.length || dragging) return;
            const { to, dur } = sequence[i++];
            const startTime = performance.now();
            const startPos = from;
            const tick = (now) => {
              if (dragging) return;
              const p = Math.min((now - startTime) / dur, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              setPos(startPos + (to - startPos) * eased);
              if (p < 1) requestAnimationFrame(tick);
              else { from = to; runStep(); }
            };
            requestAnimationFrame(tick);
          };
          setTimeout(runStep, 250);
        });
      }, { threshold: 0.35 });
      baIO.observe(slider);
    }
  });

  // -------- 3D tilt en tarjetas --------
  const tiltSelector = '.service-card, .price-card, .trust-card';
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (supportsHover && !reduceMotion) {
    document.querySelectorAll(tiltSelector).forEach((card) => {
      card.setAttribute('data-tilt', '');
      let rafId = null;
      const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          card.style.setProperty('--tilt-y', (x * 7).toFixed(2) + 'deg');
          card.style.setProperty('--tilt-x', (-y * 7).toFixed(2) + 'deg');
          card.style.setProperty('--tilt-lift', '-4px');
        });
      };
      const onLeave = () => {
        if (rafId) cancelAnimationFrame(rafId);
        card.style.setProperty('--tilt-y', '0deg');
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-lift', '0');
      };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }

  // -------- Magnetic CTA buttons --------
  if (supportsHover && !reduceMotion) {
    document.querySelectorAll('.btn-primary').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  // -------- Parallax sutil hero photo --------
  const heroPhoto = document.querySelector('.hero-photo img');
  if (heroPhoto && window.matchMedia('(min-width: 800px)').matches) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < 800) heroPhoto.style.transform = `scale(1.02) translateY(${y * 0.06}px)`;
    }, { passive: true });
  }
})();
