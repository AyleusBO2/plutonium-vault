/* ---------- SUPABASE CONNECTION ---------- */

const SUPABASE_URL =
    "https://elehnmxyftpljfyslahf.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_vfKK8KwMX5_TMkjEv1FPzw_W3Y4oCz4";

const supabaseClient = window.supabase
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    )
    : null;

    /* ---------- PROFILE NAV ---------- */

async function setupProfileNav() {

    const profileLink =
        document.getElementById("profile-nav-link");

    if (!profileLink || !supabaseClient) {
        return;
    }

    const {
        data: {
            user
        }
    } = await supabaseClient.auth.getUser();

    // User is not logged in
    if (!user) {
        profileLink.textContent = "◉ PROFILE";
        return;
    }

    // Get the user's Vault profile
    const {
        data: profile,
        error
    } = await supabaseClient
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

    if (error || !profile) {
        profileLink.textContent = "◉ PROFILE";
        return;
    }

    profileLink.textContent =
        "◉ " + (profile.username || "PROFILE");
}

    /* ---------- SHARED VAULT DATA ---------- */

let vaultArchiveDataPromise = null;
let vaultDownloadDataPromise = null;

async function getVaultArchiveData() {

    if (!vaultArchiveDataPromise) {

        vaultArchiveDataPromise =
            Promise.all([
                fetch("callingcards.html"),
                fetch("emblems.html")
            ])
            .then(async responses => {

                const [
                    callingCardsResponse,
                    emblemsResponse
                ] = responses;


                if (
                    !callingCardsResponse.ok ||
                    !emblemsResponse.ok
                ) {
                    throw new Error(
                        "Unable to load Vault archives."
                    );
                }


                const [
                    callingCardsHTML,
                    emblemsHTML
                ] = await Promise.all([
                    callingCardsResponse.text(),
                    emblemsResponse.text()
                ]);


                const parser =
                    new DOMParser();


                return {
                    callingCardsDocument:
                        parser.parseFromString(
                            callingCardsHTML,
                            "text/html"
                        ),

                    emblemsDocument:
                        parser.parseFromString(
                            emblemsHTML,
                            "text/html"
                        )
                };

            });

    }


    return vaultArchiveDataPromise;

}


async function getVaultDownloadData() {

    if (!vaultDownloadDataPromise) {

        vaultDownloadDataPromise =
            supabaseClient
                ? supabaseClient
                    .from("downloads")
                    .select("id, count")
                    .then(({ data, error }) => {

                        if (error) {
                            throw error;
                        }

                        return data || [];

                    })
                : Promise.resolve([]);

    }


    return vaultDownloadDataPromise;

}


/* ---------- PAGE SETUP ---------- */

document.addEventListener("DOMContentLoaded", () => {
    setupProfileNav();
    setupSiteWideVaultNav();
    setupSearchAndFilters();
    setupFeaturedShowcase();
    setupDownloadCounters();
    setupArchiveVaultButtons();
    setupMyVault();
    renderMyVaultPage();
    setupMyVaultControls();
    setupRecentReleases();
    setupTrendingVault();
    setupLiveVaultStats();
    setupGlobalVaultSearch();
    setupVaultChangelog();
});

/* =========================================================
   VAULT CHANGELOG
   ========================================================= */

function setupVaultChangelog() {

    const openButton =
        document.querySelector(
            "#vault-build-button"
        );

    const overlay =
        document.querySelector(
            "#vault-changelog"
        );

    const closeButton =
        document.querySelector(
            "#vault-changelog-close"
        );


    if (
        !openButton ||
        !overlay ||
        !closeButton
    ) {
        return;
    }


    function openChangelog() {

        overlay.classList.add(
            "active"
        );

        document.body.style.overflow =
            "hidden";
    }


    function closeChangelog() {

        overlay.classList.remove(
            "active"
        );

        document.body.style.overflow =
            "";
    }


    openButton.addEventListener(
        "click",
        openChangelog
    );


    closeButton.addEventListener(
        "click",
        closeChangelog
    );


    overlay.addEventListener(
        "click",
        event => {

            if (event.target === overlay) {
                closeChangelog();
            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                overlay.classList.contains(
                    "active"
                )
            ) {
                closeChangelog();
            }

        }
    );

}

/* =========================================================
   GLOBAL VAULT SEARCH
   ========================================================= */

function setupGlobalVaultSearch() {

    const openButton =
        document.querySelector(
            "#vault-global-search-btn"
        );

    const overlay =
        document.querySelector(
            "#vault-search-overlay"
        );

    const closeButton =
        document.querySelector(
            "#vault-search-close"
        );

    const input =
        document.querySelector(
            "#vault-global-search-input"
        );

        const results =
    document.querySelector(
        "#vault-search-results"
    );

const status =
    document.querySelector(
        "#vault-search-status"
    );


    if (
    !openButton ||
    !overlay ||
    !closeButton ||
    !input ||
    !results ||
    !status
) {
    return;
}

let searchItems = [];
let searchLoaded = false;
let selectedResultIndex = -1;


async function loadSearchContent() {

    if (searchLoaded) {
        return;
    }

    status.textContent =
        "LOADING VAULT INDEX...";

    try {

        const [
            callingCardsResponse,
            emblemsResponse
        ] = await Promise.all([
            fetch("callingcards.html"),
            fetch("emblems.html")
        ]);


        const [
            callingCardsHTML,
            emblemsHTML
        ] = await Promise.all([
            callingCardsResponse.text(),
            emblemsResponse.text()
        ]);


        const parser =
            new DOMParser();


        const callingCardsDocument =
            parser.parseFromString(
                callingCardsHTML,
                "text/html"
            );


        const emblemsDocument =
            parser.parseFromString(
                emblemsHTML,
                "text/html"
            );


        searchItems = [];


        /* CALLING CARDS */

        callingCardsDocument
            .querySelectorAll(".card")
            .forEach(card => {

                const name =
                    card.querySelector("h3")
                        ?.textContent
                        .trim();

                const series =
                    card.querySelector("h3 + p")
                        ?.textContent
                        .trim() || "Other";

                const image =
                    card.querySelector(
                        ".preview img"
                    )
                        ?.getAttribute("src");

                const link =
                    card.querySelector(
                        'a[href$=".html"]'
                    )
                        ?.getAttribute("href");

                const creatorElement =
                    Array.from(
                        card.querySelectorAll(
                            ".card-meta span"
                        )
                    ).find(span =>
                        span.textContent
                            .toUpperCase()
                            .includes("CREATOR")
                    );

                const creator =
                    card.dataset.creator ||
                    creatorElement
                        ?.textContent
                        .replace(
                            /CREATOR:/i,
                            ""
                        )
                        .trim() ||
                    "Unknown";


                if (
                    !name ||
                    !image ||
                    !link
                ) {
                    return;
                }


                searchItems.push({
                    name,
                    series,
                    creator,
                    image,
                    url: link,
                    type: "CALLING CARD"
                });

            });


        /* EMBLEMS */

        emblemsDocument
            .querySelectorAll(".card")
            .forEach(card => {

                const name =
                    card.querySelector("h3")
                        ?.textContent
                        .trim();

                const series =
                    card.querySelector("h3 + p")
                        ?.textContent
                        .trim() || "Other";

                const image =
                    card.querySelector(
                        ".emblem-preview img"
                    )
                        ?.getAttribute("src");

                const creator =
                    card.dataset.creator ||
                    "Unknown";

                const detailsLink =
                    card.querySelector(
                        'a[href$=".html"]'
                    )
                        ?.getAttribute("href");

                const url =
                    detailsLink ||
                    "emblems.html";


                if (
                    !name ||
                    !image
                ) {
                    return;
                }


                searchItems.push({
                    name,
                    series,
                    creator,
                    image,
                    url,
                    type: "EMBLEM"
                });

            });


        searchLoaded = true;

        status.textContent =
            `${searchItems.length} VAULT ITEMS INDEXED`;


    } catch (error) {

        console.error(
            "Unable to load global search:",
            error
        );

        status.textContent =
            "VAULT SEARCH UNAVAILABLE";

    }

}

function renderSearchResults(query) {

    const searchTerm =
        query.trim().toLowerCase();


    if (!searchTerm) {

        results.innerHTML = "";

        status.textContent =
            `${searchItems.length} VAULT ITEMS INDEXED`;

        return;
    }


    const matches =
        searchItems.filter(item => {

            const searchableText = [
                item.name,
                item.series,
                item.creator,
                item.type
            ]
                .join(" ")
                .toLowerCase();


            return searchableText.includes(
                searchTerm
            );

        });


    status.textContent =
        matches.length === 1
            ? "1 RESULT FOUND"
            : `${matches.length} RESULTS FOUND`;


    if (matches.length === 0) {

        results.innerHTML = `
            <div class="vault-search-empty">
                <span>NO MATCHES FOUND</span>
                <p>TRY ANOTHER NAME, SERIES OR CREATOR</p>
            </div>
        `;

        return;
    }


selectedResultIndex = -1;

results.innerHTML =
    matches.map((item, index) => {

        const highlightMatch = value => {

            const text = String(value || "");

            const position =
                text.toLowerCase().indexOf(
                    searchTerm
                );

            if (position === -1) {
                return text;
            }

            return (
                text.slice(0, position) +
                '<mark class="vault-search-highlight">' +
                text.slice(
                    position,
                    position + searchTerm.length
                ) +
                "</mark>" +
                text.slice(
                    position + searchTerm.length
                )
            );

        };


        return `

            <a
                class="vault-search-result"
                href="${item.url}"
                data-search-result="${index}"
            >

                <div class="vault-search-result-preview">

                    <img
                        src="${item.image}"
                        alt="${item.name}"
                    >

                </div>

                <div class="vault-search-result-info">

                    <div class="vault-search-result-tags">

                        <span>
                            ${item.type}
                        </span>

                        <span>
                            ${highlightMatch(item.series)}
                        </span>

                    </div>

                    <h3>
                        ${highlightMatch(item.name)}
                    </h3>

                    <p>
                        CREATED BY
                        <strong>
                            ${highlightMatch(item.creator)}
                        </strong>
                    </p>

                    <div class="vault-search-result-view">
                        VIEW →
                    </div>

                </div>

            </a>

        `;

    }).join("");

}

function updateSelectedResult() {

    const resultElements =
        Array.from(
            results.querySelectorAll(
                ".vault-search-result"
            )
        );

    resultElements.forEach(
        (element, index) => {

            element.classList.toggle(
                "vault-search-selected",
                index === selectedResultIndex
            );

        }
    );

    if (
        selectedResultIndex >= 0 &&
        resultElements[selectedResultIndex]
    ) {

        resultElements[
            selectedResultIndex
        ].scrollIntoView({
            block: "nearest"
        });

    }

}


    function openSearch() {

        loadSearchContent();

        overlay.classList.add(
            "search-open"
        );

        overlay.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";


        window.setTimeout(() => {

            input.focus();

        }, 120);

    }


    function closeSearch() {

        overlay.classList.remove(
            "search-open"
        );

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow =
            "";

        input.value = "";

    }


    openButton.addEventListener(
        "click",
        openSearch
    );


    closeButton.addEventListener(
        "click",
        closeSearch
    );


    overlay.addEventListener(
        "click",
        event => {

            if (event.target === overlay) {
                closeSearch();
            }

        }
    );


    document.addEventListener(
    "keydown",
    event => {

        /* CTRL + K / CMD + K */

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            if (
                overlay.classList.contains(
                    "search-open"
                )
            ) {
                closeSearch();
            } else {
                openSearch();
            }

            return;
        }


        /* ESCAPE */

        if (
            event.key === "Escape" &&
            overlay.classList.contains(
                "search-open"
            )
        ) {
            closeSearch();
        }

    }
);

    input.addEventListener(
    "input",
    () => {

        renderSearchResults(
            input.value
        );

    }
);

input.addEventListener(
    "keydown",
    event => {

        const resultElements =
            Array.from(
                results.querySelectorAll(
                    ".vault-search-result"
                )
            );

        if (resultElements.length === 0) {
            return;
        }


        if (event.key === "ArrowDown") {

            event.preventDefault();

            selectedResultIndex =
                (
                    selectedResultIndex + 1
                ) % resultElements.length;

            updateSelectedResult();

        }


        if (event.key === "ArrowUp") {

            event.preventDefault();

            selectedResultIndex =
                selectedResultIndex <= 0
                    ? resultElements.length - 1
                    : selectedResultIndex - 1;

            updateSelectedResult();

        }


        if (
            event.key === "Enter" &&
            selectedResultIndex >= 0
        ) {

            event.preventDefault();

            resultElements[
                selectedResultIndex
            ].click();

        }

    }
);

}

/* ---------- SITE-WIDE MY VAULT NAV ---------- */

function setupSiteWideVaultNav() {

    const nav =
        document.querySelector("body > nav");

    if (!nav) {
        return;
    }

    const existingVaultLink =
        nav.querySelector(
            'a[href="my-vault.html"]'
        );

    /*
        If this page already has a My Vault
        link, don't create another one.
    */
    if (existingVaultLink) {

        ensureVaultCountBadge(
            existingVaultLink
        );

        markVaultNavActive(
            existingVaultLink
        );

        return;
    }


    const vaultLink =
        document.createElement("a");

    vaultLink.href =
        "my-vault.html";

    vaultLink.className =
        "my-vault-nav-link";

    vaultLink.innerHTML = `
        MY VAULT
        <span class="my-vault-count">0</span>
    `;


    const discordLink =
    Array.from(
        nav.querySelectorAll("a")
    ).find(link =>
        link.textContent
            .trim()
            .toLowerCase() === "discord"
    );

if (discordLink) {

    nav.insertBefore(
        vaultLink,
        discordLink
    );

} else {

    nav.appendChild(
        vaultLink
    );

}


    markVaultNavActive(
        vaultLink
    );

}


function ensureVaultCountBadge(
    link
) {

    let badge =
        link.querySelector(
            ".my-vault-count"
        );

    if (!badge) {

        badge =
            document.createElement(
                "span"
            );

        badge.className =
            "my-vault-count";

        badge.textContent =
            "0";

        link.appendChild(
            badge
        );

    }

}


function markVaultNavActive(
    link
) {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    if (
        currentPage ===
        "my-vault.html"
    ) {

        link.classList.add(
            "active"
        );

    }

}

/* ---------- RECENT RELEASES ---------- */

const RECENT_CONTENT = [

    {
        name: "L. Lawliet",
        series: "Death Note",
        type: "emblem",
        creator: "Slowder",
        image: "images/emblems/l-lawliet.png",
        url: "emblems.html"
    },

    {
        name: "Hello Kitty",
        series: "Hello Kitty",
        type: "emblem",
        creator: "Dre",
        image: "images/emblems/hello-kitty.png",
        url: "emblems.html"
    },

    {
        name: "Itachi",
        series: "Naruto",
        type: "emblem",
        creator: "K2",
        image: "images/emblems/itachi 2.png",
        url: "emblems.html"
    },

    {
        name: "Broly",
        series: "Dragon Ball",
        type: "emblem",
        creator: "Dre",
        image: "images/emblems/broly.png",
        url: "emblems.html"
    },

    {
        name: "Ado",
        series: "Music",
        type: "emblem",
        creator: "Ren",
        image: "images/emblems/ado-2.png",
        url: "emblems.html"
    },

    {
        name: "Ken Kaneki X Tokyo Ghoul",
        series: "Tokyo Ghoul",
        type: "calling-card",
        creator: "K2",
        image: "images/callingcards/ken-kaneki.gif",
        url: "ken-kaneki.html"
    }

];


function setupRecentReleases() {

    const grid =
        document.querySelector(
            "#recent-releases-grid"
        );

        const latestDropElement =
    document.querySelector(
        "#status-latest-drop"
    );

    if (!grid) {
        return;
    }

    if (
    latestDropElement &&
    RECENT_CONTENT.length > 0
) {

    latestDropElement.textContent =
        RECENT_CONTENT[0].name.toUpperCase();

}

    grid.innerHTML = "";

    RECENT_CONTENT
        .slice(0, 6)
        .forEach((item) => {

            const card =
                document.createElement("article");

            card.className =
                `recent-release-card recent-${item.type}`;

            const typeLabel =
                item.type === "calling-card"
                    ? "CALLING CARD"
                    : "EMBLEM";

            card.innerHTML = `

                <span class="recent-new-badge">
                    NEW
                </span>

                <a
                    href="${item.url}"
                    class="recent-release-preview"
                >
                    <img
                        src="${item.image}"
                        alt="${item.name}"
                    >
                </a>

                <div class="recent-release-content">

                    <div class="recent-release-meta">

                        <span>
                            ${typeLabel}
                        </span>

                        <span>
                            ${item.series}
                        </span>

                    </div>

                    <h3>
                        ${item.name}
                    </h3>

                    <p>
                        CREATED BY
                        <strong>
                            ${item.creator}
                        </strong>
                    </p>

                    <a
                        href="${item.url}"
                        class="recent-release-btn"
                    >
                        VIEW →
                    </a>

                </div>
            `;

            grid.appendChild(card);

        });

}

/* =========================================================
   TRENDING IN THE VAULT
   ========================================================= */

async function setupTrendingVault() {

    const grid =
        document.querySelector(
            "#trending-grid"
        );

    if (!grid) {
        return;
    }

    grid.innerHTML = `
    <div class="trending-skeleton">
        <div class="skeleton-preview"></div>
        <div class="skeleton-line skeleton-small"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-button"></div>
    </div>

    <div class="trending-skeleton">
        <div class="skeleton-preview"></div>
        <div class="skeleton-line skeleton-small"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-button"></div>
    </div>

    <div class="trending-skeleton">
        <div class="skeleton-preview"></div>
        <div class="skeleton-line skeleton-small"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-button"></div>
    </div>
`;

    if (!supabaseClient) {
        return;
    }


    try {

        /*
            LOAD BOTH ARCHIVE PAGES
        */

        const [
            callingCardsResponse,
            emblemsResponse
        ] = await Promise.all([
            fetch("callingcards.html"),
            fetch("emblems.html")
        ]);


        if (
            !callingCardsResponse.ok ||
            !emblemsResponse.ok
        ) {
            throw new Error(
                "Unable to load Vault archives."
            );
        }


        const [
            callingCardsHTML,
            emblemsHTML
        ] = await Promise.all([
            callingCardsResponse.text(),
            emblemsResponse.text()
        ]);


        const parser =
            new DOMParser();


        const callingCardsDocument =
            parser.parseFromString(
                callingCardsHTML,
                "text/html"
            );

        const emblemsDocument =
            parser.parseFromString(
                emblemsHTML,
                "text/html"
            );


        const contentItems = [];


        /* ---------------------------------
           CALLING CARDS
           --------------------------------- */

        callingCardsDocument
            .querySelectorAll(
                ".card"
            )
            .forEach(card => {

                const name =
                    card.querySelector("h3")
                        ?.textContent
                        .trim();

                const series =
                    card.querySelector(
                        "h3 + p"
                    )
                        ?.textContent
                        .trim() || "Other";

                const image =
                    card.querySelector(
                        ".preview img"
                    )
                        ?.getAttribute("src");

                const detailsLink =
                    card.querySelector(
                        'a[href$=".html"]'
                    );

                if (
                    !name ||
                    !image ||
                    !detailsLink
                ) {
                    return;
                }


                const url =
                    detailsLink.getAttribute(
                        "href"
                    );


                const pageID =
                    url
                        .replace(
                            /\.html$/i,
                            ""
                        )
                        .toLowerCase();


                const creatorElement =
                    Array.from(
                        card.querySelectorAll(
                            ".card-meta span"
                        )
                    ).find(span =>
                        span.textContent
                            .trim()
                            .toUpperCase()
                            .startsWith(
                                "CREATOR:"
                            )
                    );


                const creator =
                    card.dataset.creator ||
                    creatorElement
                        ?.textContent
                        .replace(
                            /CREATOR:/i,
                            ""
                        )
                        .trim() ||
                    "Unknown";


                contentItems.push({

                    id:
                        `${pageID}-calling-card`,

                    name:
                        name,

                    series:
                        series,

                    type:
                        "calling-card",

                    creator:
                        creator,

                    image:
                        image,

                    url:
                        url

                });

            });


        /* ---------------------------------
           EMBLEMS
           --------------------------------- */

        emblemsDocument
            .querySelectorAll(
                ".card"
            )
            .forEach(card => {

                const name =
                    card.querySelector("h3")
                        ?.textContent
                        .trim();

                const series =
                    card.querySelector(
                        "h3 + p"
                    )
                        ?.textContent
                        .trim() || "Other";

                const image =
                    card.querySelector(
                        ".emblem-preview img"
                    )
                        ?.getAttribute("src");

                const downloadButton =
                    card.querySelector(
                        ".download-btn[data-download]"
                    );


                if (
                    !name ||
                    !image ||
                    !downloadButton
                ) {
                    return;
                }


                const downloadID =
                    downloadButton.dataset.download;


                const creator =
                    card.dataset.creator ||
                    "Unknown";


                contentItems.push({

                    id:
                        downloadID,

                    name:
                        name,

                    series:
                        series,

                    type:
                        "emblem",

                    creator:
                        creator,

                    image:
                        image,

                    url:
                        "emblems.html"

                });

            });


        /* ---------------------------------
           SUPABASE DOWNLOAD COUNTS
           --------------------------------- */

        const {
            data,
            error
        } =
            await supabaseClient
                .from("downloads")
                .select("id, count");


        if (error) {
            throw error;
        }


        const counts =
            new Map(
                data.map(item => [
                    item.id,
                    Number(item.count) || 0
                ])
            );


        /* ---------------------------------
           ADD COUNTS + RANK
           --------------------------------- */

        const rankedItems =
            contentItems
                .map(item => ({
                    ...item,

                    downloads:
                        counts.get(
                            item.id
                        ) || 0
                }))
                .sort(
                    (a, b) =>
                        b.downloads -
                        a.downloads
                )
                .slice(
                    0,
                    6
                );


        /* ---------------------------------
           RENDER
           --------------------------------- */

        grid.innerHTML =
            "";


        rankedItems.forEach(
            (item, index) => {

                const rank =
                    index + 1;

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    `trending-card trending-${item.type}`;

                if (rank === 1) {

                    card.classList.add(
                        "trending-number-one"
                    );

                }


                const typeLabel =
                    item.type ===
                    "calling-card"
                        ? "CALLING CARD"
                        : "EMBLEM";


                card.innerHTML = `

                    <div class="trending-rank">
                        #${rank}
                    </div>

                    ${
                        rank === 1
                            ? `
                                <div class="trending-top-badge">
                                    TOP DOWNLOAD
                                </div>
                            `
                            : ""
                    }

                    <a
                        href="${escapeVaultHTML(
                            item.url
                        )}"
                        class="trending-preview"
                    >

                        <img
                            src="${escapeVaultHTML(
                                item.image
                            )}"
                            alt="${escapeVaultHTML(
                                item.name
                            )}"
                        >

                    </a>


                    <div class="trending-content">

                        <div class="trending-meta">

                            <span>
                                ${typeLabel}
                            </span>

                            <span>
                                ${escapeVaultHTML(
                                    item.series
                                )}
                            </span>

                        </div>


                        <h3>
                            ${escapeVaultHTML(
                                item.name
                            )}
                        </h3>


                        <p class="trending-creator">

                            CREATED BY

                            <strong>
                                ${escapeVaultHTML(
                                    item.creator
                                )}
                            </strong>

                        </p>


                        <div class="trending-downloads">

                            🔥

                            <strong>
                                ${item.downloads}
                            </strong>

                            ${
                                item.downloads === 1
                                    ? "DOWNLOAD"
                                    : "DOWNLOADS"
                            }

                        </div>


                        <a
                            href="${escapeVaultHTML(
                                item.url
                            )}"
                            class="trending-view-btn"
                        >
                            VIEW →
                        </a>

                    </div>

                `;


                grid.appendChild(
                    card
                );

            });


    } catch (error) {

        console.error(
            "Unable to load trending content:",
            error
        );

    }

}

/* =========================================================
   LIVE VAULT STATISTICS
   ========================================================= */

async function setupLiveVaultStats() {

    const totalElement =
        document.querySelector(
            "#stat-total-content"
        );

    const callingCardsElement =
        document.querySelector(
            "#stat-calling-cards"
        );

    const emblemsElement =
        document.querySelector(
            "#stat-emblems"
        );

    const downloadsElement =
        document.querySelector(
            "#stat-total-downloads"
        );

        const statusTotalElement =
    document.querySelector(
        "#status-total-content"
    );

const statusDownloadsElement =
    document.querySelector(
        "#status-total-downloads"
    );


    if (
        !totalElement ||
        !callingCardsElement ||
        !emblemsElement ||
        !downloadsElement
    ) {
        return;
    }

    [
    totalElement,
    callingCardsElement,
    emblemsElement,
    downloadsElement
].forEach(element => {

    if (element) {
        element.classList.add(
            "vault-stat-loading"
        );
    }

});


    try {

        /* LOAD BOTH ARCHIVES */

        const [
            callingCardsResponse,
            emblemsResponse
        ] = await Promise.all([
            fetch("callingcards.html"),
            fetch("emblems.html")
        ]);


        if (
            !callingCardsResponse.ok ||
            !emblemsResponse.ok
        ) {
            throw new Error(
                "Unable to load Vault archives."
            );
        }


        const [
            callingCardsHTML,
            emblemsHTML
        ] = await Promise.all([
            callingCardsResponse.text(),
            emblemsResponse.text()
        ]);


        const parser =
            new DOMParser();


        const callingCardsDocument =
            parser.parseFromString(
                callingCardsHTML,
                "text/html"
            );

        const emblemsDocument =
            parser.parseFromString(
                emblemsHTML,
                "text/html"
            );


        const callingCardCards =
            Array.from(
                callingCardsDocument
                    .querySelectorAll(
                        ".card-grid .card"
                    )
            );


        const emblemCards =
            Array.from(
                emblemsDocument
                    .querySelectorAll(
                        ".card-grid .card"
                    )
            );


        /* CONTENT COUNTS */

        const callingCardCount =
            callingCardCards.length;

        const emblemCount =
            emblemCards.length;

        const totalContent =
            callingCardCount +
            emblemCount;


        totalElement.textContent =
            totalContent;

        callingCardsElement.textContent =
            callingCardCount;

        emblemsElement.textContent =
            emblemCount;

            if (statusTotalElement) {
    statusTotalElement.textContent =
        totalContent;
}


        /* BUILD CURRENT DOWNLOAD ID LIST */

        const contentIDs =
            new Set();


        callingCardCards.forEach(card => {

            const detailsLink =
                card.querySelector(
                    'a[href$=".html"]'
                );

            if (!detailsLink) {
                return;
            }


            const pageID =
                detailsLink
                    .getAttribute("href")
                    .replace(
                        /\.html$/i,
                        ""
                    )
                    .toLowerCase();


            contentIDs.add(
                `${pageID}-calling-card`
            );

        });


        emblemCards.forEach(card => {

            const downloadButton =
                card.querySelector(
                    ".download-btn[data-download]"
                );

            if (!downloadButton) {
                return;
            }


            contentIDs.add(
                downloadButton.dataset.download
            );

        });


        /* TOTAL DOWNLOADS */

        if (!supabaseClient) {

            downloadsElement.textContent =
                "0";

            return;

        }


        const {
            data,
            error
        } =
            await supabaseClient
                .from("downloads")
                .select("id, count");


        if (error) {
            throw error;
        }


        const totalDownloads =
            data.reduce(
                (total, item) => {

                    if (
                        !contentIDs.has(
                            item.id
                        )
                    ) {
                        return total;
                    }


                    return (
                        total +
                        (
                            Number(
                                item.count
                            ) || 0
                        )
                    );

                },
                0
            );


        downloadsElement.textContent =
            totalDownloads;

            /* REMOVE LOADING STATE */

[
    totalElement,
    callingCardsElement,
    emblemsElement,
    downloadsElement
].forEach(element => {

    if (element) {
        element.classList.remove(
            "vault-stat-loading"
        );
    }

});

            if (statusDownloadsElement) {
    statusDownloadsElement.textContent =
        totalDownloads;
}


    } catch (error) {

        console.error(
            "Unable to load live Vault statistics:",
            error
        );

    }

}


/* ---------- SEARCH AND FILTERS ---------- */

function setupSearchAndFilters() {

    const searchInputs =
        document.querySelectorAll(
            "#card-search, #emblem-search"
        );

    const filterButtons =
        document.querySelectorAll(
            ".filter-btn"
        );

    const creatorFilter =
        document.querySelector(
            "#creator-filter"
        );

        const sortSelect =
    document.querySelector(
        "#archive-sort"
    );

    const cards =
        document.querySelectorAll(
            ".card"
        );

        const originalCardOrder =
    Array.from(cards);

    let downloadCounts =
    new Map();


    if (cards.length === 0) {
        return;
    }


    let activeCategory =
        "all";

    let activeCreator =
        "all";


    /* ---------- GET CREATOR ---------- */

    function getCardCreator(card) {

        if (card.dataset.creator) {
            return card.dataset.creator.trim();
        }


        const creatorElement =
            Array.from(
                card.querySelectorAll(
                    ".card-meta span"
                )
            ).find(span =>
                span.textContent
                    .trim()
                    .toUpperCase()
                    .startsWith(
                        "CREATOR:"
                    )
            );


        if (!creatorElement) {
            return "";
        }


        return creatorElement
            .textContent
            .replace(
                /CREATOR:/i,
                ""
            )
            .trim();

    }

    /* ---------- LOAD DOWNLOAD COUNTS ---------- */

async function loadArchiveDownloadCounts() {

    if (!supabaseClient) {
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("downloads")
            .select("id, count");

    if (error) {
        console.error(error);
        return;
    }

    downloadCounts =
        new Map(
            data.map(item => [
                item.id,
                Number(item.count) || 0
            ])
        );

}

   /* ---------- SORT CARDS ---------- */

function sortCards(mode) {

    const cardGrid =
        document.querySelector(
            ".card-grid"
        );

    if (!cardGrid) {
        return;
    }


    let cardArray =
    Array.from(cards);


if (mode === "newest") {

    cardArray =
        [...originalCardOrder];

}


if (mode === "az") {

    cardArray.sort((a, b) => {

        const nameA =
            a.querySelector("h3")
                ?.textContent
                .trim()
                .toLowerCase() || "";

        const nameB =
            b.querySelector("h3")
                ?.textContent
                .trim()
                .toLowerCase() || "";

        return nameA.localeCompare(nameB);

    });

}


if (mode === "downloads") {

 const getDownloadID = card => {

    /*
        EMBLEMS:
        Use the download ID directly.
    */

    const downloadButton =
        card.querySelector(
            ".download-btn[data-download]"
        );

    if (downloadButton) {

        return (
            downloadButton.dataset.download ||
            ""
        );

    }


    /*
        CALLING CARDS:
        Build the ID from the details page.
    */

    const detailsLink =
        card.querySelector(
            'a[href$=".html"]'
        );

    if (!detailsLink) {
        return "";
    }


    const pageName =
        detailsLink
            .getAttribute("href")
            .replace(
                /\.html$/i,
                ""
            )
            .toLowerCase();


    return `${pageName}-calling-card`;

};   


    cardArray.sort((a, b) => {

        const idA = getDownloadID(a);
        const idB = getDownloadID(b);

        const downloadsA =
            downloadCounts.get(idA) || 0;

        const downloadsB =
            downloadCounts.get(idB) || 0;

        return downloadsB - downloadsA;

    });

}


    cardArray.forEach(card => {
        cardGrid.appendChild(card);
    });

} 


    /* ---------- BUILD CREATOR LIST ---------- */

    if (creatorFilter) {

        const creators =
            new Set();


        cards.forEach(card => {

            const creator =
                getCardCreator(card);

            if (creator) {
                creators.add(creator);
            }

        });


        Array.from(creators)
            .sort((a, b) =>
                a.localeCompare(b)
            )
            .forEach(creator => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    creator.toLowerCase();

                option.textContent =
                    creator.toUpperCase();

                creatorFilter.appendChild(
                    option
                );

            });

    }


    /* ---------- FILTER CONTENT ---------- */

    function filterContent() {

        let searchText =
            "";

        searchInputs.forEach(input => {

            searchText =
                input.value
                    .toLowerCase()
                    .trim();

        });


        let visibleCards =
            0;


        cards.forEach(card => {

            const name =
                card
                    .querySelector("h3")
                    ?.textContent
                    .toLowerCase() || "";

            const series =
                card
                    .querySelector("h3 + p")
                    ?.textContent
                    .toLowerCase() || "";

            const category =
                card.dataset.category
                    ?.toLowerCase() ||
                "other";

            const categoryList =
                category.split(" ");

            const creator =
                getCardCreator(card)
                    .toLowerCase();


            const matchesSearch =
                name.includes(
                    searchText
                ) ||
                series.includes(
                    searchText
                ) ||
                category.includes(
                    searchText
                ) ||
                creator.includes(
                    searchText
                );


            const matchesCategory =
                activeCategory ===
                    "all" ||
                categoryList.includes(
                    activeCategory
                );


            const matchesCreator =
                activeCreator ===
                    "all" ||
                creator ===
                    activeCreator;


            const shouldShow =
                matchesSearch &&
                matchesCategory &&
                matchesCreator;


            card.style.display =
                shouldShow
                    ? ""
                    : "none";


            if (shouldShow) {

                card.classList.add(
                    "card-visible"
                );

                visibleCards++;

            } else {

                card.classList.remove(
                    "card-visible"
                );

            }

        });


        showNoResultsMessage(
            visibleCards
        );

    }


    /* ---------- NO RESULTS ---------- */

    function showNoResultsMessage(
        visibleCards
    ) {

        const cardGrid =
            document.querySelector(
                ".card-grid"
            );

        if (!cardGrid) {
            return;
        }


        let message =
            document.querySelector(
                ".no-results"
            );


        if (visibleCards === 0) {

            if (!message) {

                message =
                    document.createElement(
                        "p"
                    );

                message.className =
                    "no-results";

                message.textContent =
                    "NO CONTENT FOUND";

                cardGrid.after(
                    message
                );

            }

        } else if (message) {

            message.remove();

        }

    }


    /* ---------- SEARCH ---------- */

    searchInputs.forEach(input => {

        input.addEventListener(
            "input",
            filterContent
        );

    });


    /* ---------- CATEGORY ---------- */

    filterButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach(
                    item => {
                        item.classList.remove(
                            "active-filter"
                        );
                    }
                );


                button.classList.add(
                    "active-filter"
                );


                activeCategory =
                    button.dataset.filter
                        ?.toLowerCase() ||
                    "all";


                filterContent();

            }
        );

    });


    /* ---------- CREATOR ---------- */

    if (creatorFilter) {

        creatorFilter.addEventListener(
            "change",
            () => {

                activeCreator =
                    creatorFilter.value
                        .toLowerCase();


                filterContent();

            }
        );

    }

/* ---------- SORT ---------- */

if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        () => {

            sortCards(
                sortSelect.value
            );

            filterContent();

        }
    );

}

loadArchiveDownloadCounts();

    filterContent();

}


/* ---------- FEATURED SHOWCASE ---------- */

function setupFeaturedShowcase() {
    const showcase =
        document.querySelector(
            "#featured-showcase"
        );

    if (!showcase) {
        return;
    }

    const image =
        document.querySelector(
            "#featured-image"
        );

    const name =
        document.querySelector(
            "#featured-name"
        );

    const series =
        document.querySelector(
            "#featured-series"
        );

    const badge =
        document.querySelector(
            "#featured-badge"
        );

    const description =
        document.querySelector(
            "#featured-description"
        );

    const dots =
        document.querySelectorAll(
            ".featured-dot"
        );

    const featuredItems = [
        {
            name: "Pain",
            series: "Naruto",
            image:
                "images/callingcards/pain.gif",
            badge:
                "COMMUNITY FAVOURITE",
            description:
                "A community-favourite animated calling card inspired by Pain from Naruto."
        },
        {
            name: "Gojo",
            series: "Jujutsu Kaisen",
            image:
                "images/callingcards/gojo.gif",
            badge:
                "FEATURED ANIME",
            description:
                "A striking animated Gojo calling card made for Black Ops II Plutonium."
        },
        {
            name: "Makima",
            series: "Chainsaw Man",
            image:
                "images/callingcards/Makima.gif",
            badge:
                "NEW RELEASE",
            description:
                "A newly added Makima calling card inspired by Chainsaw Man."
        },
        {
            name: "Itachi",
            series: "Naruto",
            image:
                "images/callingcards/Itachi.gif",
            badge:
                "NEW RELEASE",
            description:
                "A dark animated Itachi calling card inspired by the Naruto series."
        },
        {
            name: "Playboi Carti",
            series: "Music",
            image:
                "images/callingcards/playboi-carti.gif",
            badge:
                "MUSIC FEATURE",
            description:
                "A Playboi Carti animated calling card for music-themed BO2 setups."
        }
    ];

    let currentSlide = 0;
    let rotationTimer;

    function showSlide(index) {
        const item =
            featuredItems[index];

        showcase.classList.add(
            "changing-slide"
        );

        window.setTimeout(() => {
            if (image) {
                image.src = item.image;
                image.alt =
                    `${item.name} Calling Card`;
            }

            if (name) {
                name.textContent = item.name;
            }

            if (series) {
                series.textContent =
                    item.series;
            }

            if (badge) {
                badge.textContent =
                    item.badge;
            }

            if (description) {
                description.textContent =
                    item.description;
            }

            dots.forEach(
                (dot, dotIndex) => {
                    dot.classList.toggle(
                        "active-dot",
                        dotIndex === index
                    );
                }
            );

            showcase.classList.remove(
                "changing-slide"
            );
        }, 250);

        currentSlide = index;
    }

    function startRotation() {
        window.clearInterval(
            rotationTimer
        );

        rotationTimer =
            window.setInterval(() => {
                const nextSlide =
                    (currentSlide + 1) %
                    featuredItems.length;

                showSlide(nextSlide);
            }, 8000);
    }

    dots.forEach((dot) => {
        dot.addEventListener(
            "click",
            () => {
                const index =
                    Number(
                        dot.dataset.slide
                    );

                showSlide(index);
                startRotation();
            }
        );
    });

    showcase.addEventListener(
        "mouseenter",
        () => {
            window.clearInterval(
                rotationTimer
            );
        }
    );

    showcase.addEventListener(
        "mouseleave",
        startRotation
    );

    startRotation();
}

/* ---------- USER DOWNLOAD HISTORY ---------- */

async function recordUserDownload(downloadID) {

    if (!supabaseClient || !downloadID) {
        return;
    }

    try {

        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();

        // Visitors can still download normally.
        // We only track personal stats for logged-in accounts.
        if (userError || !user) {
            return;
        }

        const contentType =
            downloadID.endsWith("-calling-card")
                ? "calling-card"
                : "emblem";

        const { error } =
            await supabaseClient
                .from("user_downloads")
                .insert({
                    user_id: user.id,
                    content_id: downloadID,
                    content_type: contentType
                });

        /*
            23505 = already downloaded.

            The database intentionally counts each
            piece of content once per account.
        */
        if (
            error &&
            error.code !== "23505"
        ) {
            console.error(
                "Unable to record user download:",
                error
            );
        }

    } catch (error) {

        console.error(
            "User download tracking error:",
            error
        );

    }

}


/* ---------- DOWNLOAD COUNTERS ---------- */

async function setupDownloadCounters() {

    const downloadButtons =
        document.querySelectorAll(".download-btn");

    const countElements =
        document.querySelectorAll(".download-count");

    if (!supabaseClient) {
        return;
    }

    async function loadDownloadCounts() {

        const { data, error } =
            await supabaseClient
                .from("downloads")
                .select("id, count");

        if (error) {
            console.error(error);
            return;
        }

        data.forEach(item => {

            const element = document.querySelector(
                `[data-count-id="${item.id}"]`
            );

            if (element) {

                element.textContent =
                    `${item.count} ${item.count === 1 ? "DOWNLOAD" : "DOWNLOADS"}`;

            }

        });

    }

    downloadButtons.forEach(button => {

        button.addEventListener("click", async () => {

            const downloadID =
                button.dataset.download;

            if (!downloadID) return;

            const { data, error } =
                await supabaseClient.rpc(
                    "increment_download",
                    {
                        download_id: downloadID
                    }
                );

            if (error) {
                console.error(error);
                return;
            }

            await recordUserDownload(downloadID);

            const element = document.querySelector(
                `[data-count-id="${downloadID}"]`
            );

            if (element) {

                element.textContent =
                    `${data} ${data === 1 ? "DOWNLOAD" : "DOWNLOADS"}`;

            }

        });

    });

    await loadDownloadCounts();

}

/* ---------- ARCHIVE VAULT BUTTONS ---------- */

function setupArchiveVaultButtons() {

    const cards =
        document.querySelectorAll(".card");


    if (cards.length === 0) {
        return;
    }

    cards.forEach((card) => {

        /*
            Don't create another button
            if one already exists.
        */
        if (
            card.querySelector(
                ".vault-save-btn"
            )
        ) {
            return;
        }


        const nameElement =
            card.querySelector("h3");

        const seriesElement =
            card.querySelector("h3 + p");

        const imageElement =
    card.querySelector(
        ".preview img, .emblem-preview img"
    );

const detailsLink =
    card.querySelector(
        'a[href$=".html"]'
    );

const downloadLink =
    card.querySelector(
        ".download-btn"
    );

        const creatorElement =
            Array.from(
                card.querySelectorAll(
                    ".card-meta span"
                )
            ).find(
                element =>
                    element.textContent
                        .trim()
                        .toUpperCase()
                        .startsWith(
                            "CREATOR:"
                        )
            );


        /*
            Ignore anything that isn't
            a complete archive item.
        */
        if (
    !nameElement ||
    !imageElement ||
    (!detailsLink && !downloadLink)
) {
    return;
}


        const name =
            nameElement.textContent.trim();

        const series =
            seriesElement
                ?.textContent
                .trim() || "Other";

        const image =
            imageElement.getAttribute(
                "src"
            );

        const isEmblem =
    !!downloadLink &&
    !detailsLink;

const url =
    detailsLink
        ? detailsLink.getAttribute("href")
        : "emblems.html";

        const creator =
    card.dataset.creator ||
    creatorElement
        ?.textContent
        .replace(
            /CREATOR:/i,
            ""
        )
        .trim() ||
    "Unknown";


        /*
            Use the details page filename
            as the unique ID.

            Example:
            pain.html
            becomes
            pain-calling-card
        */
        let itemID;

if (isEmblem) {

    itemID =
        downloadLink.dataset.download;

} else {

    const pageID =
        url
            .replace(
                /\.html$/i,
                ""
            )
            .toLowerCase();

    itemID =
        `${pageID}-calling-card`;

}


        const button =
            document.createElement(
                "button"
            );

        button.type = "button";

        button.className =
            "vault-save-btn vault-archive-save";


        button.dataset.vaultId =
            itemID;

        button.dataset.vaultName =
            name;

        button.dataset.vaultType =
    isEmblem
        ? "emblem"
        : "calling-card";

        button.dataset.vaultSeries =
            series;

        button.dataset.vaultCreator =
            creator;

        button.dataset.vaultImage =
            image;

        button.dataset.vaultUrl =
            url;


        button.textContent =
            "♡ SAVE";


        card.appendChild(
            button
        );

    });

}


 /* ---------- MY VAULT ---------- */

function setupMyVault() {

    const vaultButtons =
        document.querySelectorAll(".vault-save-btn");

    if (vaultButtons.length === 0) {
        updateVaultCount();
        return;
    }

    let savedItems = getVaultItems();

    vaultButtons.forEach((button) => {

        const itemID =
            button.dataset.vaultId;

        if (!itemID) {
            return;
        }

        updateVaultButton(
            button,
            savedItems.some(
                item => item.id === itemID
            )
        );

        button.addEventListener(
            "click",
            async () => {

                const existingIndex =
                    savedItems.findIndex(
                        item => item.id === itemID
                    );

                if (existingIndex !== -1) {

                    savedItems.splice(
                        existingIndex,
                        1
                    );

                    updateVaultButton(
                        button,
                        false
                    );

                    showVaultNotification(
                        "REMOVED FROM MY VAULT"
                    );

                } else {

                    const item = {
                        id: itemID,
                        name:
                            button.dataset.vaultName ||
                            "Unknown",
                        type:
                            button.dataset.vaultType ||
                            "content",
                        series:
                            button.dataset.vaultSeries ||
                            "",
                        creator:
                            button.dataset.vaultCreator ||
                            "",
                        image:
                            button.dataset.vaultImage ||
                            "",
                        url:
                            button.dataset.vaultUrl ||
                            window.location.href
                    };

                    savedItems.push(item);

                    updateVaultButton(
                        button,
                        true
                    );

                    showVaultNotification(
                        "ADDED TO MY VAULT"
                    );
                }

                localStorage.setItem(
                    "plutoniumVaultSaved",
                    JSON.stringify(savedItems)
                );

               // Sync My Vault with logged-in account
if (supabaseClient) {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (user) {

        if (existingIndex === -1) {

            const { error } =
                await supabaseClient
                    .from("saved_items")
                    .insert({
                        user_id: user.id,
                        item_id: itemID
                    });

            if (
                error &&
                error.code !== "23505"
            ) {
                console.error(
                    "Unable to save item to account:",
                    error
                );
            }

        } else {

            const { error } =
                await supabaseClient
                    .from("saved_items")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("item_id", itemID);

            if (error) {
                console.error(
                    "Unable to remove saved item:",
                    error
                );
            }

        }

    }

} 

                updateVaultCount();
            }
        );

    });

    updateVaultCount();
}


function getVaultItems() {

    try {

        const saved =
            localStorage.getItem(
                "plutoniumVaultSaved"
            );

        return saved
            ? JSON.parse(saved)
            : [];

    } catch (error) {

        console.error(
            "Unable to load My Vault:",
            error
        );

        return [];
    }
}


function updateVaultButton(
    button,
    isSaved
) {

    button.classList.toggle(
        "vault-saved",
        isSaved
    );

    button.textContent =
        isSaved
            ? "♥ SAVED"
            : "♡ ADD TO MY VAULT";
}


function updateVaultCount() {

    const countElements =
        document.querySelectorAll(
            ".my-vault-count"
        );

    if (countElements.length === 0) {
        return;
    }

    const count =
        getVaultItems().length;

    countElements.forEach(
        element => {

            element.textContent =
                count;

        }
    );
}


function showVaultNotification(
    message
) {

    const existing =
        document.querySelector(
            ".vault-notification"
        );

    if (existing) {
        existing.remove();
    }

    const notification =
        document.createElement(
            "div"
        );

    notification.className =
        "vault-notification";

    notification.innerHTML = `
        <span class="vault-notification-label">
            PLUTONIUM VAULT
        </span>

        <strong>${message}</strong>
    `;

    document.body.appendChild(
        notification
    );

    requestAnimationFrame(() => {

        notification.classList.add(
            "vault-notification-visible"
        );

    });

    window.setTimeout(() => {

        notification.classList.remove(
            "vault-notification-visible"
        );

        window.setTimeout(() => {
            notification.remove();
        }, 300);

    }, 2200);
}  

/* ---------- MY VAULT PAGE ---------- */

function renderMyVaultPage() {

    const callingCardGrid =
        document.querySelector("#vault-calling-cards");

    const emblemGrid =
        document.querySelector("#vault-emblems");

    if (!callingCardGrid && !emblemGrid) {
        return;
    }

    const savedItems = getVaultItems();

    const callingCards =
        savedItems.filter(
            item => item.type === "calling-card"
        );

    const emblems =
        savedItems.filter(
            item => item.type === "emblem"
        );

    setVaultPageText(
        "#vault-total-count",
        savedItems.length
    );

    setVaultPageText(
        "#vault-calling-card-count",
        callingCards.length
    );

    setVaultPageText(
        "#vault-emblem-count",
        emblems.length
    );

    setVaultPageText(
        "#vault-calling-card-label",
        formatVaultItemCount(
            callingCards.length
        )
    );

    setVaultPageText(
        "#vault-emblem-label",
        formatVaultItemCount(
            emblems.length
        )
    );

    const emptyState =
        document.querySelector(
            "#vault-empty-state"
        );

    if (emptyState) {
        emptyState.hidden =
            savedItems.length !== 0;
    }

    const callingCardSection =
        document.querySelector(
            "#vault-calling-cards-section"
        );

    if (callingCardSection) {
        callingCardSection.hidden =
            callingCards.length === 0;
    }

    if (callingCardGrid) {
        renderVaultItems(
            callingCardGrid,
            callingCards
        );
    }

    const emblemSection =
        document.querySelector(
            "#vault-emblems-section"
        );

    if (emblemSection) {
        emblemSection.hidden =
            emblems.length === 0;
    }

    if (emblemGrid) {
        renderVaultItems(
            emblemGrid,
            emblems
        );
    }
}

function setupMyVaultControls() {

    const searchInput =
        document.querySelector(
            "#vault-search"
        );

    const filterButtons =
        document.querySelectorAll(
            "[data-vault-filter]"
        );

    const clearButton =
        document.querySelector(
            "#vault-clear-btn"
        );


    if (
        !searchInput &&
        filterButtons.length === 0 &&
        !clearButton
    ) {
        return;
    }


    let activeFilter =
        "all";


    function applyVaultFilters() {

        const searchText =
            searchInput
                ?.value
                .toLowerCase()
                .trim() || "";


        const savedCards =
            document.querySelectorAll(
                ".vault-saved-card"
            );


        savedCards.forEach(card => {

            const name =
                card.querySelector("h3")
                    ?.textContent
                    .toLowerCase() || "";

            const series =
                card.querySelector(
                    ".vault-saved-meta span:nth-child(2)"
                )
                    ?.textContent
                    .toLowerCase() || "";

            const creator =
                card.querySelector(
                    ".vault-saved-content p strong"
                )
                    ?.textContent
                    .toLowerCase() || "";

            const itemID =
                card.dataset.vaultId || "";


            const isCallingCard =
                itemID.endsWith(
                    "-calling-card"
                );


            const itemType =
                isCallingCard
                    ? "calling-card"
                    : "emblem";


            const matchesSearch =
                name.includes(searchText) ||
                series.includes(searchText) ||
                creator.includes(searchText);


            const matchesType =
                activeFilter === "all" ||
                itemType === activeFilter;


            card.style.display =
                matchesSearch &&
                matchesType
                    ? ""
                    : "none";

        });


        updateFilteredVaultSections();

    }


    function updateFilteredVaultSections() {

        const callingCardSection =
            document.querySelector(
                "#vault-calling-cards-section"
            );

        const emblemSection =
            document.querySelector(
                "#vault-emblems-section"
            );


        if (callingCardSection) {

            const visibleCallingCards =
                Array.from(
                    callingCardSection
                        .querySelectorAll(
                            ".vault-saved-card"
                        )
                ).some(
                    card =>
                        card.style.display !==
                        "none"
                );


            callingCardSection.hidden =
                !visibleCallingCards;

        }


        if (emblemSection) {

            const visibleEmblems =
                Array.from(
                    emblemSection
                        .querySelectorAll(
                            ".vault-saved-card"
                        )
                ).some(
                    card =>
                        card.style.display !==
                        "none"
                );


            emblemSection.hidden =
                !visibleEmblems;

        }

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyVaultFilters
        );

    }


    filterButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach(
                    item => {
                        item.classList.remove(
                            "active"
                        );
                    }
                );


                button.classList.add(
                    "active"
                );


                activeFilter =
                    button.dataset
                        .vaultFilter ||
                    "all";


                applyVaultFilters();

            }
        );

    });


    if (clearButton) {

        let confirmClear =
            false;


        clearButton.addEventListener(
            "click",
            () => {

                if (!confirmClear) {

                    confirmClear =
                        true;

                    clearButton.textContent =
                        "CLICK AGAIN TO CONFIRM";

                    window.setTimeout(
                        () => {

                            confirmClear =
                                false;

                            clearButton.textContent =
                                "CLEAR MY VAULT";

                        },
                        3500
                    );

                    return;

                }


                localStorage.removeItem(
                    "plutoniumVaultSaved"
                );


                confirmClear =
                    false;

                clearButton.textContent =
                    "CLEAR MY VAULT";


                showVaultNotification(
                    "MY VAULT CLEARED"
                );


                updateVaultCount();

                renderMyVaultPage();

            }
        );

    }

}


function renderVaultItems(
    container,
    items
) {

    container.innerHTML = "";

    items.forEach((item) => {

        const card =
            document.createElement("article");

        card.className =
            "vault-saved-card";

        card.dataset.vaultId =
            item.id;

        card.innerHTML = `

            <a
                href="${escapeVaultHTML(item.url)}"
                class="vault-saved-preview"
            >
                <img
                    src="${escapeVaultHTML(item.image)}"
                    alt="${escapeVaultHTML(item.name)}"
                >
            </a>

            <div class="vault-saved-content">

                <div class="vault-saved-meta">

                    <span>
                        ${formatVaultType(item.type)}
                    </span>

                    <span>
                        ${escapeVaultHTML(
                            item.series || "OTHER"
                        )}
                    </span>

                </div>

                <h3>
                    ${escapeVaultHTML(item.name)}
                </h3>

                ${
                    item.creator
                        ? `
                            <p>
                                CREATED BY
                                <strong>
                                    ${escapeVaultHTML(
                                        item.creator
                                    )}
                                </strong>
                            </p>
                        `
                        : ""
                }

                <div class="vault-saved-actions">

                    <a
                        href="${escapeVaultHTML(item.url)}"
                        class="card-btn"
                    >
                        VIEW
                    </a>

                    <button
                        type="button"
                        class="vault-remove-btn"
                        data-remove-vault="${escapeVaultHTML(
                            item.id
                        )}"
                    >
                        REMOVE
                    </button>

                </div>

            </div>
        `;

        container.appendChild(card);

    });

    setupVaultRemoveButtons();
}


function setupVaultRemoveButtons() {

    const buttons =
        document.querySelectorAll(
            "[data-remove-vault]"
        );

    buttons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const itemID =
                    button.dataset.removeVault;

                let savedItems =
                    getVaultItems();

                savedItems =
                    savedItems.filter(
                        item =>
                            item.id !== itemID
                    );

                localStorage.setItem(
                    "plutoniumVaultSaved",
                    JSON.stringify(
                        savedItems
                    )
                );

                showVaultNotification(
                    "REMOVED FROM MY VAULT"
                );

                updateVaultCount();

                renderMyVaultPage();

            }
        );

    });
}


function setVaultPageText(
    selector,
    value
) {

    const element =
        document.querySelector(selector);

    if (element) {
        element.textContent = value;
    }
}


function formatVaultItemCount(
    count
) {

    return `${count} ${
        count === 1
            ? "ITEM"
            : "ITEMS"
    }`;
}


function formatVaultType(
    type
) {

    if (type === "calling-card") {
        return "CALLING CARD";
    }

    if (type === "emblem") {
        return "EMBLEM";
    }

    return "CONTENT";
}


function escapeVaultHTML(
    value
) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ---------- BOOT SCREEN ---------- */

window.addEventListener("load", () => {
    const bootScreen =
        document.querySelector(
            "#boot-screen"
        );

    if (!bootScreen) {
        return;
    }

    window.setTimeout(() => {
        bootScreen.classList.add(
            "boot-hidden"
        );
    }, 1900);
});