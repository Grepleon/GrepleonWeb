const russianButton = document.getElementById("button-ru");
const englishButton = document.getElementById("button-eng");

async function changeLanguage(newLang) {
    lang = newLang;

    await loadTexts();
    await unhover();

    document.documentElement.lang = lang;
}

russianButton.addEventListener("click", () => {
    changeLanguage("ru");
});

englishButton.addEventListener("click", () => {
    changeLanguage("eng");
});