(() => {
  const cv = document.getElementById('orbit-canvas');
  const ctx = cv.getContext('2d');
  const GM = 9000, SUN_R = 12, MAX = 60, TRAIL = 70;
  const colors = ['#3f3', '#5ae', '#ee5', '#fa5', '#a5e', '#f55'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, bodies = [], visible = true;

  function resize() {
    const dpr = devicePixelRatio || 1;
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(x, y) {
    const dx = x - W / 2, dy = y - H / 2, r = Math.hypot(dx, dy);
    if (r < SUN_R * 2) return;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const v = Math.sqrt(GM / r) * (0.7 + Math.random() * 0.5); // от эллипса до почти круга
    bodies.push({
      x, y, vx: -dy / r * v * dir, vy: dx / r * v * dir,
      c: colors[Math.random() * colors.length | 0], trail: []
    });
    if (bodies.length > MAX) bodies.shift();
  }

  function seed() {
    bodies = [];
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * 6.28, r = 70 + Math.random() * Math.min(W, H) * 0.35;
      spawn(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r);
    }
  }

  function step() {
    const cx = W / 2, cy = H / 2, dt = 0.1;
    for (let s = 0; s < 6; s++) {
      for (const b of bodies) {
        const dx = cx - b.x, dy = cy - b.y;
        const r2 = dx * dx + dy * dy + 25, r = Math.sqrt(r2);
        const a = GM / r2;
        b.vx += dx / r * a * dt; b.vy += dy / r * a * dt;
        b.x += b.vx * dt; b.y += b.vy * dt;
      }
    }
    bodies = bodies.filter(b => {
      const r = Math.hypot(b.x - cx, b.y - cy);
      return r > SUN_R && r < Math.max(W, H) * 1.5;
    });
    for (const b of bodies) {
      b.trail.push(b.x, b.y);
      if (b.trail.length > TRAIL * 2) b.trail.splice(0, 2);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const b of bodies) {
      ctx.strokeStyle = b.c; ctx.lineWidth = 1.5;
      const n = b.trail.length / 2;
      for (let i = 1; i < n; i++) {
        ctx.globalAlpha = i / n * 0.6;
        ctx.beginPath();
        ctx.moveTo(b.trail[i * 2 - 2], b.trail[i * 2 - 1]);
        ctx.lineTo(b.trail[i * 2], b.trail[i * 2 + 1]);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = b.c;
      ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, 6.283); ctx.fill();
    }
    ctx.shadowColor = '#3f3'; ctx.shadowBlur = 25; ctx.fillStyle = '#7f7';
    ctx.beginPath(); ctx.arc(W / 2, H / 2, SUN_R, 0, 6.283); ctx.fill();
    ctx.shadowBlur = 0;
  }

  function loop() {
    if (visible) { step(); draw(); }
    requestAnimationFrame(loop);
  }

  cv.addEventListener('pointerdown', e => {
    const r = cv.getBoundingClientRect();
    spawn(e.clientX - r.left, e.clientY - r.top);
    if (reduce) draw();
  });
  document.getElementById('orbit-clear').addEventListener('click', () => { bodies = []; draw(); });
  new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(cv);
  addEventListener('resize', () => { resize(); draw(); });

  resize(); seed(); draw();
  if (!reduce) loop();
})();