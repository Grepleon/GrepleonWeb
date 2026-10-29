
const GITHUB_USER = "Grepleon";
const API = "https://api.github.com";

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

// Получаем все публичные репозитории пользователя
async function getRepositories() {
    const repositories = [];
    let page = 1;

    while (true) {
        const response = await githubFetch(
            `${API}/users/${GITHUB_USER}/repos` +
            `?type=public&per_page=100&page=${page}&sort=updated`
        );

        const data = await response.json();
        repositories.push(...data);

        if (data.length < 100) break;
        page++;
    }

    return repositories;
}

// Определяем количество коммитов в репозитории.
// Используем последнюю страницу API с per_page=1,
// чтобы не скачивать историю целиком.
async function getCommitCount(repo) {
    const url =
        `${API}/repos/${GITHUB_USER}/${encodeURIComponent(repo.name)}` +
        `/commits?per_page=1`;

    const response = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json"
        }
    });

    // У пустого репозитория GitHub может вернуть HTTP 409.
    if (response.status === 409) return 0;

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
                    url: repo.html_url,
                    commits
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

// Отрисовка статистики на странице
function renderStatistics(results) {
    results.sort((a, b) => b.commits - a.commits);

    const total = results.reduce(
        (sum, repo) => sum + repo.commits,
        0
    );

    totalElement.textContent = total.toLocaleString("ru-RU");
    repoCountElement.textContent = results.length.toLocaleString("ru-RU");

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

// Основной цикл сбора
async function updateGitHubStatistics() {
    refreshButton.disabled = true;
    statusElement.textContent = "* Получение списка репозиториев...";

    try {
        const repositories = await getRepositories();

        statusElement.textContent =
            `* Найдено репозиториев: ${repositories.length}. Сбор коммитов...`;

        const { results, errors } =
            await processRepositories(repositories);

        renderStatistics(results);

        if (errors.length > 0) {
            statusElement.textContent =
                `* Готово с ошибками: ${errors.length}. ` +
                `Успешно обработано: ${results.length}.`;
        } else {
            statusElement.textContent =
                "* Сбор завершён успешно.";
        }

        updatedElement.textContent =
            "Последнее обновление: " +
            new Date().toLocaleString("ru-RU");

    } catch (error) {
        statusElement.textContent = `* Ошибка: ${error.message}`;
    } finally {
        refreshButton.disabled = false;
    }
}

refreshButton.addEventListener(
    "click",
    updateGitHubStatistics
);

// Первый запуск при загрузке страницы
updateGitHubStatistics();
