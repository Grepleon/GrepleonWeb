const names = ["job", "base-1"]
let lang = "ru"

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