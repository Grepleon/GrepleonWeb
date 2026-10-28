document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  try {
    await navigator.clipboard.writeText(btn.dataset.mail);
    const old = btn.textContent;
    btn.textContent = btn.dataset.copied;
    setTimeout(() => (btn.textContent = old), 1500);
  } catch (err) {
    console.error('Не удалось скопировать:', err);
  }
});