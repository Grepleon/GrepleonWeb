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