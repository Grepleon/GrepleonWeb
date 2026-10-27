// На сенсорном экране оставляем неподвижное свечение.
const mouseAvailable = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
);

const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
);

document.addEventListener("pointermove", (event) => {
    if (!mouseAvailable.matches || reducedMotion.matches) return;

    // Координаты относительно окна — как у position: fixed.
    document.body.style.setProperty("--mouse-x", `${event.clientX}px`);
    document.body.style.setProperty("--mouse-y", `${event.clientY}px`);
});

(function () {
    const host = document.getElementById('about');
    if (!host) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'about-rain';
    host.append(canvas);
    const ctx = canvas.getContext('2d');

    const CHARS = '01{}[]()<>;/\\=+-*&|~#$%^_:.,'.split('');
    const CELL_W = 11, CELL_H = 22, FONT = 14;
    const MAX_ALPHA = 0.14;   // макс. яркость символа
    const SPAWN = 0.005;      // шанс вспышки на клетку за кадр
    const FPS = 20;
    const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let cols = 0, rows = 0, life, speed, glyph;

    function rnd(n) { return Math.floor(Math.random() * n); }

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const w = host.clientWidth, h = host.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = FONT + 'px Consolas, "Courier New", monospace';
        ctx.textBaseline = 'top';

        cols = Math.ceil(w / CELL_W);
        rows = Math.ceil(h / CELL_H);
        const n = cols * rows;
        life = new Float32Array(n);   // 0 = выключено, 0..1 = прогресс вспышки
        speed = new Float32Array(n);
        glyph = new Array(n);
        for (let i = 0; i < n; i++) glyph[i] = CHARS[rnd(CHARS.length)];
        if (REDUCED) drawStatic();
    }

    function draw() {
        const w = host.clientWidth, h = host.clientHeight;
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < life.length; i++) {
            if (life[i] <= 0) continue;
            const a = MAX_ALPHA * Math.sin(Math.PI * life[i]);
            ctx.fillStyle = 'rgba(83,255,103,' + a.toFixed(3) + ')';
            const x = (i % cols) * CELL_W;
            const y = Math.floor(i / cols) * CELL_H;
            ctx.fillText(glyph[i], x, y);
        }
    }

    function drawStatic() {
        for (let i = 0; i < life.length; i++) {
            if (Math.random() < 0.08) life[i] = 0.2 + Math.random() * 0.6;
        }
        draw();
    }

    function tick() {
        for (let i = 0; i < life.length; i++) {
            if (life[i] > 0) {
                life[i] += speed[i];
                if (life[i] >= 1) life[i] = 0;
                else if (Math.random() < 0.01) glyph[i] = CHARS[rnd(CHARS.length)];
            } else if (Math.random() < SPAWN) {
                life[i] = 0.001;
                speed[i] = 0.03 + Math.random() * 0.07;  // длительность ~0.7–1.6 с
                glyph[i] = CHARS[rnd(CHARS.length)];
            }
        }
        draw();
    }

    resize();
    new ResizeObserver(resize).observe(host);

    if (!REDUCED) {
        let last = 0;
        (function loop(t) {
            if (t - last >= 1000 / FPS) { last = t; tick(); }
            requestAnimationFrame(loop);
        })(0);
    }
})();