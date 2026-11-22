(() => {
    const scene = document.getElementById('scene');
    const out = document.getElementById('scene-out');
    if (!scene) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // звёзды
    const box = document.getElementById('stars');
    for (let i = 0; i < 70; i++) {
        const s = document.createElement('i');
        s.style.left = Math.random() * 100 + '%';
        s.style.top = Math.random() * 100 + '%';
        s.style.setProperty('--d', (2 + Math.random() * 4) + 's');
        s.style.setProperty('--w', (-Math.random() * 6) + 's');
        box.appendChild(s);
    }

    // карточка под сценой
    const el = (tag, cls, text) => {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text) e.textContent = text;
        return e;
    };
    function show(b) {
        const parts = [el('div', 'so-cmd', '$ lang --info ' + b.dataset.name), el('div', 'so-text', b.dataset.text)];
        if (b.dataset.href) {
            const a = el('a', '', 'открыть →');
            a.href = b.dataset.href;
            parts.push(a);
        }
        out.replaceChildren(...parts);
    }
    out.replaceChildren(
        el('div', 'so-cmd', '$ lang --info'),
        el('div', 'so-text', 'Наведи на язык. Клик по пустому месту запускает салют.')
    );

    // искры
    const colors = ['#5ae', '#ee5', '#a5e', '#5e5', '#fa5', '#f55', '#3f3'];
    function burst(x, y, palette, n = 14) {
        for (let i = 0; i < n; i++) {
            const c = palette[i % palette.length];
            const s = el('i', 'spark');
            s.style.left = x + 'px';
            s.style.top = y + 'px';
            s.style.background = c;
            s.style.boxShadow = '0 0 8px ' + c;
            scene.appendChild(s);
            const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 90;
            s.animate([
                { transform: 'translate(-2.5px,-2.5px)', opacity: 1 },
                { transform: `translate(${Math.cos(a) * d - 2.5}px,${Math.sin(a) * d - 2.5}px)`, opacity: 0 }
            ], { duration: 600 + Math.random() * 400, easing: 'cubic-bezier(.1,.7,.3,1)' })
                .onfinish = () => s.remove();
        }
    }

    // значки языков
    scene.querySelectorAll('.badge').forEach(b => {
        const ring = b.closest('.ring');
        b.addEventListener('pointerenter', e => {
            if (e.pointerType !== 'mouse') return;
            ring.classList.add('paused');
            show(b);
        });
        b.addEventListener('pointerleave', e => {
            if (e.pointerType === 'mouse') ring.classList.remove('paused');
        });
        b.addEventListener('focus', () => show(b));
        b.addEventListener('click', e => {
            show(b);
            const sr = scene.getBoundingClientRect(), br = b.getBoundingClientRect();
            burst(br.left - sr.left + br.width / 2, br.top - sr.top + br.height / 2, [b.style.getPropertyValue('--c')], 10);
            if (e.pointerType === 'mouse') return;
            ring.classList.add('paused');          // тач: пауза на 4 секунды
            clearTimeout(ring._t);
            ring._t = setTimeout(() => ring.classList.remove('paused'), 4000);
        });
    });

    // клик по пустому месту и по логотипу
    scene.addEventListener('pointerdown', e => {
        if (e.target.closest('.badge')) return;
        const r = scene.getBoundingClientRect();
        burst(e.clientX - r.left, e.clientY - r.top, colors, 16);
        const core = e.target.closest('.core');
        if (core && !reduce) {
            core.classList.remove('hop');
            void core.offsetWidth;
            core.classList.add('hop');
        }
    });

    // параллакс
    if (!reduce) {
        scene.addEventListener('pointermove', e => {
            const r = scene.getBoundingClientRect();
            scene.style.setProperty('--px', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
            scene.style.setProperty('--py', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
        });
        scene.addEventListener('pointerleave', () => {
            scene.style.setProperty('--px', 0);
            scene.style.setProperty('--py', 0);
        });
    }
})();