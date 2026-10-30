// Дополнительная статистика GitHub для git.grepleon.
// Заполняет только новые карточки (PR, ревью, issues, звёзды, форки, подписчики, языки).
// Существующие карточки, таблицу, статус и кнопку обновления ведёт gh-stat.js, здесь они не затрагиваются.
// Только публичные запросы к GitHub API, токенов в коде нет.
(function () {
    "use strict";

    const USER = "Grepleon";
    const API = "https://api.github.com";
    const CACHE_KEY = "gh_extra_v2";
    const CACHE_TTL = 30 * 60 * 1000;   // 30 минут
    const FORCE_COOLDOWN = 60 * 1000;   // принудительное обновление не чаще раза в минуту

    let lastForce = 0;

    function setValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function render(d) {
        setValue("github-prs", d.prs);
        setValue("github-reviews", d.reviews);
        setValue("github-issues", d.issues);
        setValue("github-stars", d.stars);
        setValue("github-forks", d.forks);
        setValue("github-followers", d.followers);
        setValue("github-langs", d.langs);
    }

    function readCache() {
        try {
            return JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
        } catch (e) {
            return null;
        }
    }

    async function getJSON(url) {
        const r = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
    }

    function searchCount(query) {
        return getJSON(API + "/search/issues?per_page=1&q=" + encodeURIComponent(query));
    }

    async function collect() {
        const [user, repos, prs, issues, reviewed] = await Promise.all([
            getJSON(API + "/users/" + USER),
            getJSON(API + "/users/" + USER + "/repos?per_page=100"),
            searchCount("author:" + USER + " type:pr"),
            searchCount("author:" + USER + " type:issue"),
            searchCount("reviewed-by:" + USER + " -author:" + USER + " type:pr"),
        ]);

        const own = repos.filter((r) => !r.fork);

        // Все языки каждого репозитория, а не только основной.
        // Если запрос для какого-то репозитория не удался, берём его основной язык.
        const langSets = await Promise.all(own.map(async (r) => {
            try {
                const byBytes = await getJSON(API + "/repos/" + USER + "/" + r.name + "/languages");
                return Object.keys(byBytes);
            } catch (e) {
                return r.language ? [r.language] : [];
            }
        }));
        const langs = new Set(langSets.flat());

        return {
            t: Date.now(),
            prs: prs.total_count,
            reviews: reviewed.total_count,
            issues: issues.total_count,
            stars: own.reduce((s, r) => s + r.stargazers_count, 0),
            forks: own.reduce((s, r) => s + r.forks_count, 0),
            followers: user.followers,
            langs: langs.size,
        };
    }

    async function load(force) {
        const cached = readCache();

        if (!force && cached && Date.now() - cached.t < CACHE_TTL) {
            render(cached);
            return;
        }

        try {
            const data = await collect();
            try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) { /* хранилище недоступно */ }
            render(data);
        } catch (err) {
            // Лимит API или сеть: показываем старые данные, если они есть, иначе остаётся «—»
            if (cached) render(cached);
            console.warn("gh-extra:", err.message);
        }
    }

    const btn = document.getElementById("github-refresh");
    if (btn) {
        btn.addEventListener("click", () => {
            const now = Date.now();
            if (now - lastForce < FORCE_COOLDOWN) return;
            lastForce = now;
            load(true);
        });
    }

    load(false);
})();