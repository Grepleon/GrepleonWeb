(() => {
  const PADDING = 40;     // отступ от краёв экрана
  const DURATION = 350;   // мс, должно совпадать с CSS transition
  let active = null;

  const overlay = document.createElement('div');
  overlay.className = 'zoom-overlay';
  document.body.appendChild(overlay);

  function targetRect(img, rect) {
    const maxW = window.innerWidth - PADDING * 2;
    const maxH = window.innerHeight - PADDING * 2;
    let scale = Math.min(maxW / rect.width, maxH / rect.height);
    // не растягиваем сильнее оригинального размера файла (чтобы не мылилось)
    if (img.naturalWidth) scale = Math.min(scale, img.naturalWidth / rect.width);
    scale = Math.max(scale, 1);
    const w = rect.width * scale;
    const h = rect.height * scale;
    return {
      left: (window.innerWidth - w) / 2,
      top: (window.innerHeight - h) / 2,
      width: w,
      height: h,
    };
  }

  function applyRect(img, r) {
    img.style.left = r.left + 'px';
    img.style.top = r.top + 'px';
    img.style.width = r.width + 'px';
    img.style.height = r.height + 'px';
  }

  function open(img) {
    if (active) return;
    const rect = img.getBoundingClientRect();
    const cs = getComputedStyle(img);

    // placeholder держит место в вёрстке
    const placeholder = document.createElement('div');
    placeholder.style.width = rect.width + 'px';
    placeholder.style.height = rect.height + 'px';
    placeholder.style.margin = cs.margin;
    placeholder.style.display = cs.display === 'inline' ? 'inline-block' : cs.display;
    placeholder.style.flexShrink = '0';
    img.parentNode.insertBefore(placeholder, img);

    const prevStyle = img.style.cssText;
    active = { img, placeholder, prevStyle };

    // фиксируем картинку ровно там, где она была
    img.style.cssText = `
      position: fixed;
      margin: 0;
      max-width: none;
      max-height: none;
      z-index: 1001;
      cursor: zoom-out;
      object-fit: contain;
    `;
    applyRect(img, rect);
    img.getBoundingClientRect(); // форсируем reflow

    img.style.transition = `left ${DURATION}ms ease, top ${DURATION}ms ease, width ${DURATION}ms ease, height ${DURATION}ms ease`;
    overlay.classList.add('active');
    applyRect(img, targetRect(img, rect));
  }

  function close() {
    if (!active) return;
    const { img, placeholder, prevStyle } = active;
    active = null;

    overlay.classList.remove('active');
    applyRect(img, placeholder.getBoundingClientRect());

    setTimeout(() => {
      img.style.cssText = prevStyle;
      placeholder.remove();
    }, DURATION);
  }

  document.querySelectorAll('img.screen').forEach(img => {
    img.addEventListener('click', () => (active && active.img === img ? close() : open(img)));
  });

  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => e.key === 'Escape' && close());

  // если картинка открыта и окно поменяло размер, перецентрируем
  window.addEventListener('resize', () => {
    if (!active) return;
    const { img, placeholder } = active;
    img.style.transition = 'none';
    applyRect(img, targetRect(img, placeholder.getBoundingClientRect()));
  });
})();