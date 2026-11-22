(() => {
    const box = document.getElementById('stars');
    for (let i = 0; i < 70; i++) {
        const s = document.createElement('i');
        s.style.left = Math.random() * 100 + '%';
        s.style.top = Math.random() * 100 + '%';
        s.style.setProperty('--d', (2 + Math.random() * 4) + 's');
        s.style.setProperty('--w', (-Math.random() * 6) + 's');
        box.appendChild(s);
    }
})();