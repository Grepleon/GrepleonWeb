const start = new Date('2026-08-01'); // дата «первого коммита» сайта
const days = Math.floor((Date.now() - start) / 864e5);
document.getElementById('uptime').textContent = days + ' дн.';