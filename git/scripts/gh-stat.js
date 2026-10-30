const GITHUB_USER = "Grepleon";
const API = "https://api.github.com";

// Кеш результата, чтобы не тратить лимит GitHub API при каждой перезагрузке страницы.
const CACHE_KEY = "gh_stat_v2";
const CACHE_TTL = 30 * 60 * 1000; // 30 минут

const totalElement = document.getElementById("github-total-commits");
const repoCountElement = document.getElementById("github-repo-count");
const statusElement = document.getElementById("github-status");
const listElement = document.getElementById("github-repo-list");
const updatedElement = document.getElementById("github-updated");
const refreshButton = document.getElementById("github-refresh");

// Получение данных GitHub API
async function githubFetch(url) {
    const response = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json"
        }
    });

    if (response.status === 403 || response.status === 429) {
        throw new Error(
            "Превышен лимит GitHub API. Попробуйте позже."
        );
    }

    if (!response.ok) {
        throw new Error(`GitHub API: HTTP ${response.status}`);
    }

    return response;
}

// Получаем все публичные репозитории, владельцем которых является пользователь
async function getRepositories() {
    const repositories = [];
    let page = 1;

    while (true) {
        const response = await githubFetch(
            `${API}/users/${GITHUB_USER}/repos` +
            `?type=owner&per_page=100&page=${page}&sort=updated`
        );

        const data = await response.json();
        repositories.push(...data);

        if (data.length < 100) break;
        page++;
    }

    // Приводим к единому виду. own = пользователь владелец репозитория.
    return repositories.map((repo) => ({
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        own: true
    }));
}

// Чужие репозитории, в которые пользователь вносил коммиты:
// 1) где он участник или соавтор;
// 2) где приняты (merged) его pull request'ы.
// Ошибки не прерывают сбор, а возвращаются списком.
async function getExternalRepositories(ownRepositories) {
    const known = new Set(
        ownRepositories.map((repo) => repo.fullName.toLowerCase())
    );
    const repos = [];
    const errors = [];

    function add(fullName, url) {
        const key = fullName.toLowerCase();
        if (known.has(key)) return;
        known.add(key);
        repos.push({ name: fullName, fullName, url, own: false });
    }

    try {
        const response = await githubFetch(
            `${API}/users/${GITHUB_USER}/repos?type=member&per_page=100`
        );
        for (const repo of await response.json()) {
            add(repo.full_name, repo.html_url);
        }
    } catch (error) {
        errors.push(error);
    }

    try {
        const query = encodeURIComponent(
            `author:${GITHUB_USER} type:pr is:merged`
        );
        const response = await githubFetch(
            `${API}/search/issues?q=${query}&per_page=100`
        );
        const data = await response.json();

        for (const item of data.items || []) {
            const match = /\/repos\/(.+)$/.exec(item.repository_url || "");
            if (match) add(match[1], `https://github.com/${match[1]}`);
        }
    } catch (error) {
        errors.push(error);
    }

    return { repos, errors };
}

// Определяем количество коммитов ПОЛЬЗОВАТЕЛЯ в репозитории.
// Фильтр author оставляет только его коммиты: коммиты друга и других людей не считаются.
// Используем последнюю страницу API с per_page=1,
// чтобы не скачивать историю целиком.
async function getCommitCount(repo) {
    const path = repo.fullName
        .split("/")
        .map(encodeURIComponent)
        .join("/");

    const url =
        `${API}/repos/${path}/commits` +
        `?author=${encodeURIComponent(GITHUB_USER)}&per_page=1`;

    const response = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json"
        }
    });

    // У пустого репозитория GitHub может вернуть HTTP 409.
    // 404 и 451: репозиторий удалён или недоступен.
    if (
        response.status === 409 ||
        response.status === 404 ||
        response.status === 451
    ) {
        return 0;
    }

    if (response.status === 403 || response.status === 429) {
        throw new Error("Превышен лимит GitHub API.");
    }

    if (!response.ok) {
        throw new Error(
            `Ошибка при чтении ${repo.name}: HTTP ${response.status}`
        );
    }

    const commits = await response.json();

    if (!Array.isArray(commits) || commits.length === 0) {
        return 0;
    }

    const link = response.headers.get("Link");

    if (link) {
        const lastPage = link.match(
            /[?&]page=(\d+)[^>]*>\s*;\s*rel="last"/
        );

        if (lastPage) {
            return Number(lastPage[1]);
        }
    }

    // Если последней страницы нет, найден один коммит.
    return 1;
}

// Ограничиваем количество одновременных запросов
async function processRepositories(repositories) {
    const results = [];
    const errors = [];
    let nextIndex = 0;

    async function worker() {
        while (nextIndex < repositories.length) {
            const index = nextIndex++;

            try {
                const repo = repositories[index];
                const commits = await getCommitCount(repo);

                results.push({
                    name: repo.name,
                    url: repo.url,
                    commits,
                    own: repo.own
                });
            } catch (error) {
                errors.push(error);
            }
        }
    }

    const workers = Array.from(
        { length: 4 },
        () => worker()
    );

    await Promise.all(workers);

    return { results, errors };
}

// Отрисовка статистики на странице.
// ownCount: число репозиториев, где пользователь владелец.
function renderStatistics(results, ownCount) {
    results.sort((a, b) => b.commits - a.commits);

    const total = results.reduce(
        (sum, repo) => sum + repo.commits,
        0
    );

    totalElement.textContent = total.toLocaleString("ru-RU");
    repoCountElement.textContent = ownCount.toLocaleString("ru-RU");

    listElement.replaceChildren();

    for (const repo of results) {
        const row = document.createElement("tr");
        const nameCell = document.createElement("td");
        const countCell = document.createElement("td");
        const link = document.createElement("a");

        link.href = repo.url;
        link.textContent = repo.name;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        nameCell.appendChild(link);
        countCell.textContent = repo.commits.toLocaleString("ru-RU");

        row.append(nameCell, countCell);
        listElement.appendChild(row);
    }
}

function readCache() {
    try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
        if (cached && Date.now() - cached.t < CACHE_TTL) return cached;
    } catch (error) {
        // кеш недоступен, идём в сеть
    }
    return null;
}

function writeCache(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
        // хранилище недоступно
    }
}

function showUpdated(timestamp) {
    updatedElement.textContent =
        "Последнее обновление: " +
        new Date(timestamp).toLocaleString("ru-RU");
}

// Основной цикл сбора
// force = true: игнорировать кеш (кнопка «Обновить статистику»)
async function updateGitHubStatistics(force = false) {
    if (!force) {
        const cached = readCache();

        if (cached) {
            renderStatistics(cached.results, cached.ownCount);
            showUpdated(cached.t);
            statusElement.textContent = "* Данные из кеша.";
            return;
        }
    }

    refreshButton.disabled = true;
    statusElement.textContent = "* Получение списка репозиториев...";

    try {
        const ownRepositories = await getRepositories();

        statusElement.textContent =
            `* Найдено своих репозиториев: ${ownRepositories.length}. ` +
            "Поиск чужих репозиториев с вашими коммитами...";

        const external = await getExternalRepositories(ownRepositories);
        const allRepositories = [...ownRepositories, ...external.repos];

        statusElement.textContent =
            `* Репозиториев для проверки: ${allRepositories.length}. ` +
            "Сбор коммитов...";

        const { results, errors } =
            await processRepositories(allRepositories);

        errors.push(...external.errors);

        // Чужие репозитории без ваших коммитов в таблицу не попадают
        const visible = results.filter(
            (repo) => repo.own || repo.commits > 0
        );

        renderStatistics(visible, ownRepositories.length);

        if (errors.length > 0) {
            statusElement.textContent =
                `* Готово с ошибками: ${errors.length}. ` +
                `Успешно обработано: ${results.length}.`;
        } else {
            statusElement.textContent =
                "* Сбор завершён успешно.";
            // Кешируем только полностью успешный сбор
            writeCache({
                t: Date.now(),
                results: visible,
                ownCount: ownRepositories.length
            });
        }

        showUpdated(Date.now());

    } catch (error) {
        statusElement.textContent = `* Ошибка: ${error.message}`;
    } finally {
        refreshButton.disabled = false;
    }
}

refreshButton.addEventListener(
    "click",
    () => updateGitHubStatistics(true)
);

// Первый запуск при загрузке страницы
updateGitHubStatistics();