const names = ["job", "base-1", "headline-1", "base-2", "headline-2", "base-3", "headline-3"]
let lang = "eng"

async function loadTexts() {
    const response = await fetch("./scripts/data/" + lang + ".json");
    const data = await response.json();
    for (const name of names){
        const lines = data[name];
        const text = lines.join(" ");

        document.getElementById(name).innerHTML = text;
    }
}

loadTexts();