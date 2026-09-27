const heading = document.querySelector(".main-color");
const description = document.querySelector(".dim");
const originalText = heading.textContent;
const desOriginalText = description.textContent;

heading.addEventListener("mouseenter", () => {
    heading.textContent = ">> Grepleon";
    description.textContent = "Да, я точно умею работать с кодом!";
});

heading.addEventListener("mouseleave", () => {
    heading.textContent = originalText;
    description.textContent = desOriginalText;
});