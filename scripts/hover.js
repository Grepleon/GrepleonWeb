const heading = document.querySelector(".main-color");
const originalText = heading.textContent;

heading.addEventListener("mouseenter", () => {
    heading.textContent = ">> Grepleon";
});

heading.addEventListener("mouseleave", () => {
    heading.textContent = originalText;
});