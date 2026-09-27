const heading = document.querySelector(".main-color");
const description = document.querySelector(".dim");
const originalText = heading.textContent;
const desOriginalText = description.textContent;
const logo = document.getElementById("logo");
const jobText = document.getElementById("job");
const originalSrc = logo.src;

async function hover(){
    const response = await fetch("./scripts/data/" + lang + ".json");
    const data = await response.json();

    heading.textContent = data["hover-name"].join(" ");
    description.textContent = data["hover-des"].join(" ");
    logo.src = "res/Grepleon 2026.08 logo150 -re.png"
}

async function unhover(){
    const response = await fetch("./scripts/data/" + lang + ".json");
    const data = await response.json();

    heading.textContent = data["name"].join(" ");
    description.textContent = data["des"].join(" ");
    logo.src = "res/Grepleon 2026.08 logo150.png"
}

const elements = [logo]

for (const element of elements){
    element.addEventListener("mouseenter", hover)
    element.addEventListener("mouseleave", unhover)
}

unhover()