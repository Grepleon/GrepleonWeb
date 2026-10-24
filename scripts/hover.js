document.addEventListener("DOMContentLoaded", () => {
    const heading = document.querySelector(".main-color");
    const description = document.querySelector(".dim");
    const logo = document.getElementById("logo");

    if (!logo || !heading || !description) {
        console.error("Не найдены элементы:", { logo, heading, description });
        return;
    }

    const LONG_HOVER_MS = 5000;
    let longHoverTimer = null;
    let isLongHover = false;

    async function getData() {
        const response = await fetch("./scripts/data/" + lang + ".json");
        if (!response.ok) throw new Error("Не загрузился JSON: " + response.status);
        return response.json();
    }

    async function hover() {
        isLongHover = false;

        let data;
        try {
            data = await getData();
        } catch (e) {
            console.error("hover: не удалось загрузить данные", e);
            return;
        }

        heading.textContent = data["hover-name"].join(" ");
        description.textContent = data["hover-des"].join(" ");
        logo.src = "res/Grepleon 2026.08 logo150 -re.png";

        clearTimeout(longHoverTimer);
        longHoverTimer = setTimeout(() => {
            isLongHover = true;
            if (data["long-hover-des"]) {
                description.textContent = data["long-hover-des"].join(" ");
            }
        }, LONG_HOVER_MS);
    }

    async function unhover() {
        clearTimeout(longHoverTimer);
        longHoverTimer = null;
        isLongHover = false;

        let data;
        try {
            data = await getData();
        } catch (e) {
            console.error("unhover: не удалось загрузить данные", e);
            return;
        }

        heading.textContent = data["name"].join(" ");
        description.textContent = data["des"].join(" ");
        logo.src = "res/Grepleon 2026.08 logo150.png";
    }

    logo.addEventListener("mouseenter", hover);
    logo.addEventListener("mouseleave", unhover);

    unhover();
});