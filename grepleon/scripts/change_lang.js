const russianButton = document.getElementById("button-ru");
const englishButton = document.getElementById("button-en");

const buttonLangs = [russianButton, englishButton];

async function changeLanguage(newLang) {
    lang = newLang;

    await loadTexts();
    await unhover();

    document.documentElement.lang = lang;
}

// заменяет второй символ у кнопки
function setMarker(btn, marker) {
    const t = btn.textContent;
    btn.textContent = t.slice(0, 1) + marker + t.slice(2);
}

function reset() {
    for (const btn of buttonLangs) {
        setMarker(btn, " ");
    }
}

russianButton.addEventListener("click", async () => {
    reset();
    setMarker(russianButton, ">");
    await changeLanguage("ru");
});

englishButton.addEventListener("click", async () => {
    reset();
    setMarker(englishButton, ">");
    await changeLanguage("en");
});