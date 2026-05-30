// cursor-trail.js — falling "starry magic cursor" trail.
// Injects a full-viewport canvas on top of the page (pointer-events: none),
// spawns small stars at the cursor that fall with gravity + drag and fade out.
(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'starCanvas';
  Object.assign(canvas.style, {
    position: 'fixed', top: '0', left: '0',
    width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '9990'
  });
  function mount() {
    document.body.appendChild(canvas);
    init();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else { mount(); }

  function init() {
    const ctx = canvas.getContext('2d');
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width, height;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // pull the brand accent so some stars feel on-theme
    function accentRGB() {
      const hex = (getComputedStyle(document.documentElement)
        .getPropertyValue('--accent') || '#e6b13e').trim();
      const m = hex.replace('#', '');
      return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
    }

    let stars = [];
    const MAX_STARS = 360;

    class Star {
      constructor(x, y, vx, vy) {
        this.x = x; this.y = y;
        this.finalSize = Math.random() * 1.7 + 0.3;
        this.size = this.finalSize * 2;
        this.alpha = 1;
        this.velocityX = vx * 0.05;
        this.velocityY = 1 + Math.random() + vy * 0.05;
        this.gravity = 0.02;
        this.drag = 0.97;
        this.timeElapsed = 0;
        // ~28% of stars carry the accent tint
        this.color = Math.random() < 0.28 ? accentRGB() : [255, 255, 255];
      }
      turbulence() { return Math.random() * 0.5 - 0.25; }
      draw() {
        const [r, g, b] = this.color;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
      update(dt) {
        this.x += this.velocityX + this.turbulence();
        this.velocityX *= this.drag;
        this.y += this.velocityY;
        this.velocityY += this.gravity;
        this.alpha = Math.max(0, this.alpha - 0.006);
        this.timeElapsed += dt;
        if (this.timeElapsed < 2000) {
          this.size = this.finalSize * 2 - (this.finalSize * this.timeElapsed / 2000);
        } else {
          this.size = this.finalSize;
        }
      }
    }

    let lastX = 0, lastY = 0;
    function addStar(e) {
      const vx = e.clientX - lastX;
      const vy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      const ox = (Math.random() - 0.5) * 100;
      const oy = (Math.random() - 0.5) * 100;
      if (stars.length < MAX_STARS) {
        stars.push(new Star(e.clientX, e.clientY, vx + ox, vy + oy));
      }
    }
    window.addEventListener('mousemove', addStar, { passive: true });
    // light-touch support: spawn on touch-move too
    window.addEventListener('touchmove', function (e) {
      const t = e.touches[0];
      if (t) addStar({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: true });

    let last = 0;
    function frame(time) {
      const dt = Math.min(64, time - last);
      last = time;
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) s.update(dt);
      for (const s of stars) s.draw();
      stars = stars.filter(s => s.alpha > 0 && s.y < height + 20 && s.x > -20 && s.x < width + 20);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();
