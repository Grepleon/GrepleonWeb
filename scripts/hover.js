const heading = document.querySelector(".main-color");
const description = document.querySelector(".dim");
const originalText = heading.textContent;
const desOriginalText = description.textContent;
const logo = document.getElementById("logo");
const originalSrc = logo.src;

function hover(){
    heading.textContent = ">> Grepleon";
    description.textContent = "Да, я точно умею работать с кодом!";
    logo.src = "res/Grepleon 2026.08 logo150 -re.png"
}

function unhover(){
    heading.textContent = originalText;
    description.textContent = desOriginalText;
    logo.src = "res/Grepleon 2026.08 logo150.png"
}

heading.addEventListener("mouseenter", () => {
    hover()
});

logo.addEventListener("mouseenter", () => {
    hover()
});

heading.addEventListener("mouseleave", () => {
    unhover()
});

logo.addEventListener("mouseleave", () => {
    unhover()
});