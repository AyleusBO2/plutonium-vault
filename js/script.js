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
    error: profileError
} = await supabaseClient
    .from("profiles")
    .select("id, username")
    .ilike("username", creatorUsername)
    .limit(1)
    .maybeSingle();

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
    ensureGlobalSearchOverlay();
    setupGlobalVaultSearch();
    setupVaultChangelog();
    setupCommunityCallingCardArchive();
    setupCommunityEmblemArchive();
    setupCreatorProfile();
    setupCreatorDirectory();
    setupGlobalRelatedContent();
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

function ensureGlobalSearchOverlay() {

    // Don't create another one if this page already has it
    if (document.querySelector("#vault-search-overlay")) {
        return;
    }

    const overlay = document.createElement("div");

    overlay.id = "vault-search-overlay";
    overlay.className = "vault-search-overlay";

    overlay.innerHTML = `

    <div class="vault-search-panel">

        <div class="vault-search-header">

            <div>
                <p>◈ GLOBAL VAULT SEARCH</p>
                <h2>SEARCH THE VAULT</h2>
            </div>

            <button
                type="button"
                class="vault-search-close"
                id="vault-search-close"
                aria-label="Close search"
            >
                ×
            </button>

        </div>

        <div class="vault-search-input-wrap">

            <input
                type="search"
                id="vault-global-search-input"
                placeholder="SEARCH CONTENT, SERIES, CREATOR..."
                autocomplete="off"
            >

            <span class="vault-search-key">
                ESC TO CLOSE
            </span>

        </div>

        <div
            class="vault-search-status"
            id="vault-search-status"
        >
            TYPE TO SEARCH THE VAULT
        </div>

        <div
            class="vault-search-results"
            id="vault-search-results"
        >
        </div>

    </div>
`; 

    document.body.appendChild(overlay);
}

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


        /* =====================================================
           APPROVED COMMUNITY SUBMISSIONS
           ===================================================== */

        if (supabaseClient) {

            const {
                data: submissions,
                error: submissionError
            } = await supabaseClient
                .from("submissions")
                .select(`
                    id,
                    user_id,
                    title,
                    description,
                    type,
                    preview_url
                `)
                .eq("status", "approved");

            if (submissionError) {

                console.error(
                    "Unable to index community submissions:",
                    submissionError
                );

            } else if (
                submissions &&
                submissions.length
            ) {

                /*
                 * Get creator usernames
                 */
                const userIds = [
                    ...new Set(
                        submissions
                            .map(
                                item =>
                                    item.user_id
                            )
                            .filter(Boolean)
                    )
                ];

                let creatorMap = {};

                if (userIds.length) {

                    const {
                        data: profiles,
                        error: profileError
                    } = await supabaseClient
                        .from("profiles")
                        .select(
                            "id, username"
                        )
                        .in(
                            "id",
                            userIds
                        );

                    if (
                        !profileError &&
                        profiles
                    ) {

                        creatorMap =
                            Object.fromEntries(
                                profiles.map(
                                    profile => [
                                        profile.id,
                                        profile.username
                                    ]
                                )
                            );
                    }
                }

                /*
                 * Add every approved submission
                 * to global search
                 */
                submissions.forEach(
                    submission => {

                        if (
                            !submission.title ||
                            !submission.preview_url
                        ) {
                            return;
                        }

                        const creator =
                            creatorMap[
                                submission.user_id
                            ] ||
                            "Community";

                        searchItems.push({

                            name:
                                submission.title,

                            series:
                                submission.description ||
                                "Community",

                            creator:
                                creator,

                            image:
                                submission.preview_url,

                            url:
                                `content.html?id=${encodeURIComponent(
                                    submission.id
                                )}`,

                            type:
                                submission.type ===
                                "calling-card"
                                    ? "CALLING CARD"
                                    : "EMBLEM"

                        });
                    }
                );
            }
        }


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

    /*
     * Admin keeps its own navbar.
     */
    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    if (
        currentPage === "admin.html" ||
        currentPage.includes("admin")
    ) {
        return;
    }

    /*
     * Build one identical navbar
     * across the whole public site.
     */
    nav.innerHTML = `

        <a
            href="index.html"
            data-nav-page="index.html"
        >
            Home
        </a>

        <a
            href="callingcards.html"
            data-nav-page="callingcards.html"
        >
            Calling Cards
        </a>

        <a
            href="emblems.html"
            data-nav-page="emblems.html"
        >
            Emblems
        </a>

        <a
            href="creators.html"
            data-nav-page="creators.html"
        >
            Creators
        </a>

        <a
            href="install.html"
            data-nav-page="install.html"
        >
            Install Guide
        </a>

        <a
            href="about.html"
            data-nav-page="about.html"
        >
            About
        </a>

        <button
    type="button"
    id="vault-global-search-btn"
    class="vault-global-search-btn"
>
    SEARCH
</button>

        <a
            href="my-vault.html"
            class="my-vault-nav-link"
            data-nav-page="my-vault.html"
        >
            MY VAULT
            <span class="my-vault-count">
                0
            </span>
        </a>

        <a
            href="https://discord.gg/gS8MHbvuse"
            target="_blank"
            rel="noopener noreferrer"
        >
            Discord
        </a>

        <a
            href="submit.html"
            data-nav-page="submit.html"
        >
            Submit Content
        </a>

        <a
            href="profile.html"
            id="profile-nav-link"
            class="profile-nav-link"
            data-nav-page="profile.html"
        >
            ◉ PROFILE
        </a>

    `;

    /*
     * Highlight current section.
     */
    let activePage =
        currentPage || "index.html";

    /*
     * Creator profile pages count
     * as the Creators section.
     */
    const creatorPages = [
        "ayleus.html",
        "uzi.html",
        "ren.html",
        "k2.html",
        "dre.html",
        "slowder.html"
    ];

    if (
        creatorPages.includes(
            activePage
        )
    ) {
        activePage =
            "creators.html";
    }

    /*
     * Individual original calling-card
     * pages count as Calling Cards.
     *
     * content.html is handled below
     * according to its content type later.
     */
    const pageLink =
        nav.querySelector(
            `[data-nav-page="${activePage}"]`
        );

    if (pageLink) {
        pageLink.classList.add(
            "active"
        );
    }

    /*
     * My Vault badge.
     */
    const vaultLink =
        nav.querySelector(
            'a[href="my-vault.html"]'
        );

    if (vaultLink) {
        ensureVaultCountBadge(
            vaultLink
        );
    }

    /*
     * Update Profile text/login state
     * now that the new link exists.
     */
    setupProfileNav();
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


async function setupRecentReleases() {

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

    let approvedContent = [];

    /*
     * GET NEW APPROVED COMMUNITY CONTENT
     */
    if (supabaseClient) {

        const {
            data: submissions,
            error
        } = await supabaseClient
            .from("submissions")
            .select(`
                id,
                user_id,
                title,
                type,
                description,
                preview_url,
                created_at
            `)
            .eq("status", "approved")
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(6);

        if (error) {

            console.error(
                "Unable to load latest approved content:",
                error
            );

        } else if (
            submissions &&
            submissions.length
        ) {

            /*
             * GET CREATOR USERNAMES
             */
            const userIds = [
                ...new Set(
                    submissions
                        .map(
                            item =>
                                item.user_id
                        )
                        .filter(Boolean)
                )
            ];

            let creatorMap = {};

            if (userIds.length) {

                const {
                    data: profiles,
                    error: profileError
                } = await supabaseClient
                    .from("profiles")
                    .select(
                        "id, username"
                    )
                    .in(
                        "id",
                        userIds
                    );

                if (
                    !profileError &&
                    profiles
                ) {

                    creatorMap =
                        Object.fromEntries(
                            profiles.map(
                                profile => [
                                    profile.id,
                                    profile.username
                                ]
                            )
                        );
                }
            }

            approvedContent =
                submissions.map(
                    submission => ({

                        name:
                            submission.title ||
                            "Untitled",

                        series:
                            "Community",

                        type:
                            submission.type,

                        creator:
                            creatorMap[
                                submission.user_id
                            ] ||
                            "Community",

                        image:
                            submission.preview_url ||
                            "",

                        url:
                            `content.html?id=${encodeURIComponent(
                                submission.id
                            )}`,

                        isCommunity: true
                    })
                );
        }
    }

    /*
     * APPROVED CONTENT FIRST,
     * THEN FILL EMPTY SLOTS WITH
     * EXISTING RECENT CONTENT
     */
    const usedNames =
        new Set(
            approvedContent.map(
                item =>
                    `${item.type}:${item.name}`
                        .toLowerCase()
            )
        );

    const fallbackContent =
        RECENT_CONTENT.filter(
            item =>
                !usedNames.has(
                    `${item.type}:${item.name}`
                        .toLowerCase()
                )
        );

    const recentContent = [
        ...approvedContent,
        ...fallbackContent
    ].slice(0, 6);

    /*
     * UPDATE TOP "LATEST DROP"
     */
    if (
        latestDropElement &&
        recentContent.length
    ) {

        latestDropElement.textContent =
            recentContent[0]
                .name
                .toUpperCase();
    }

    grid.innerHTML = "";

    recentContent.forEach(item => {

        const card =
            document.createElement(
                "article"
            );

        card.className =
            `recent-release-card recent-${item.type}`;

        const typeLabel =
            item.type ===
            "calling-card"
                ? "CALLING CARD"
                : "EMBLEM";

        card.innerHTML = `

            <span class="recent-new-badge">
                NEW
            </span>

            <a
                href="${escapeVaultHTML(
                    item.url
                )}"
                class="recent-release-preview"
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

            <div class="recent-release-content">

                <div class="recent-release-meta">

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

                <p>
                    CREATED BY
                    <strong>
                        ${escapeVaultHTML(
                            item.creator
                        )}
                    </strong>
                </p>

                <a
                    href="${escapeVaultHTML(
                        item.url
                    )}"
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
        document.querySelector("#stat-total-content");

    const callingCardsElement =
        document.querySelector("#stat-calling-cards");

    const emblemsElement =
        document.querySelector("#stat-emblems");

    const downloadsElement =
        document.querySelector("#stat-total-downloads");

    const statusTotalElement =
        document.querySelector("#status-total-content");

    const statusDownloadsElement =
        document.querySelector("#status-total-downloads");

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

        element?.classList.add(
            "vault-stat-loading"
        );

    });

    try {

        /*
         * LOAD ORIGINAL STATIC ARCHIVES
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

        /*
         * ORIGINAL CONTENT COUNTS
         */
        const originalCallingCards =
            callingCardCards.length;

        const originalEmblems =
            emblemCards.length;

        /*
         * LOAD APPROVED COMMUNITY CONTENT
         */
        let approvedSubmissions = [];

        if (supabaseClient) {

            const {
                data,
                error
            } = await supabaseClient
                .from("submissions")
                .select("id, type")
                .eq("status", "approved");

            if (error) {
                throw error;
            }

            approvedSubmissions =
                data || [];
        }

        const communityCallingCards =
            approvedSubmissions.filter(
                item =>
                    item.type ===
                    "calling-card"
            ).length;

        const communityEmblems =
            approvedSubmissions.filter(
                item =>
                    item.type ===
                    "emblem"
            ).length;

        const callingCardCount =
            originalCallingCards +
            communityCallingCards;

        const emblemCount =
            originalEmblems +
            communityEmblems;

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

        /*
         * BUILD ALL DOWNLOAD IDS
         */
        const contentIDs =
            new Set();

        /*
         * ORIGINAL CALLING CARDS
         */
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

        /*
         * ORIGINAL EMBLEMS
         */
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

        /*
         * COMMUNITY CONTENT
         */
        approvedSubmissions.forEach(
            submission => {

                if (
                    submission.type ===
                    "calling-card"
                ) {

                    contentIDs.add(
                        `submission-${submission.id}`
                    );

                } else if (
                    submission.type ===
                    "emblem"
                ) {

                    contentIDs.add(
                        `community-${submission.id}`
                    );
                }
            }
        );

        /*
         * TOTAL DOWNLOADS
         */
        let totalDownloads = 0;

        if (supabaseClient) {

            const {
                data,
                error
            } = await supabaseClient
                .from("downloads")
                .select("id, count");

            if (error) {
                throw error;
            }

            totalDownloads =
                (data || []).reduce(
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
        }

        downloadsElement.textContent =
            totalDownloads;

        if (statusDownloadsElement) {
            statusDownloadsElement.textContent =
                totalDownloads;
        }

    } catch (error) {

        console.error(
            "Unable to load live Vault statistics:",
            error
        );

    } finally {

        [
            totalElement,
            callingCardsElement,
            emblemsElement,
            downloadsElement
        ].forEach(element => {

            element?.classList.remove(
                "vault-stat-loading"
            );

        });
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

    if (button.dataset.downloadCounterBound === "true") {
        return;
    }

    button.dataset.downloadCounterBound = "true";

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
    "♡ ADD TO MY VAULT";


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

// =========================================================
// COMMUNITY CALLING CARDS - MAIN CALLING CARD ARCHIVE
// =========================================================

async function setupCommunityCallingCardArchive() {

    const communityGrid =
        document.getElementById(
            "approved-calling-cards"
        );

    if (!communityGrid || !supabaseClient) {
        return;
    }

    const {
        data: submissions,
        error: submissionError
    } = await supabaseClient
        .from("submissions")
        .select(`
            id,
            user_id,
            title,
            description,
            preview_url,
            download_url,
            created_at
        `)
        .eq("status", "approved")
        .eq("type", "calling-card")
        .order("created_at", {
            ascending: false
        });

    if (submissionError) {

        console.error(
            "Unable to load community calling cards:",
            submissionError
        );

        return;
    }

    if (
        !submissions ||
        submissions.length === 0
    ) {
        return;
    }

    const userIds = [
        ...new Set(
            submissions
                .map(item => item.user_id)
                .filter(Boolean)
        )
    ];

    let creatorMap = {};

    if (userIds.length > 0) {

        const {
            data: profiles,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select("id, username")
            .in("id", userIds);

        if (!profileError && profiles) {

            creatorMap =
                Object.fromEntries(
                    profiles.map(profile => [
                        profile.id,
                        profile.username
                    ])
                );
        }
    }

    submissions.forEach(submission => {

        if (
            communityGrid.querySelector(
                `[data-community-id="${submission.id}"]`
            )
        ) {
            return;
        }

        const creator =
            creatorMap[submission.user_id] ||
            "COMMUNITY";

        const card =
            document.createElement("div");

        card.className = "card";

        /*
         * We don't currently store a proper
         * archive category on community submissions,
         * so keep it marked READY + COMMUNITY.
         */
        card.dataset.category =
            "community ready";

        card.dataset.creator =
            creator;

        card.dataset.communityId =
            submission.id;

        const detailURL =
            `content.html?id=${encodeURIComponent(
                submission.id
            )}`;

        card.innerHTML = `

            <div class="preview">

                <img
                    src="${escapeVaultHTML(
                        submission.preview_url || ""
                    )}"
                    alt="${escapeVaultHTML(
                        submission.title ||
                        "Community Calling Card"
                    )} Calling Card"
                >

            </div>

            <h3>
                ${escapeVaultHTML(
                    submission.title ||
                    "Untitled"
                )}
            </h3>

            <p>
                ${escapeVaultHTML(
                    submission.description ||
                    "Community Calling Card"
                )}
            </p>

            <p class="card-status ready">
                READY
            </p>

            <div class="card-meta">

                <span>
                    CREATOR:
                    ${escapeVaultHTML(
                        creator
                    )}
                </span>

                <span>
                    256 × 64
                </span>

            </div>

            <a
                href="${detailURL}"
                class="card-btn"
            >
                VIEW DETAILS
            </a>

        `;

        communityGrid.append(card);
    });

    setupArchiveVaultButtons();
    setupMyVault();
}

// =========================================================
// COMMUNITY CALLING CARDS - MAIN CALLING CARD ARCHIVE
// =========================================================

async function setupCommunityCallingCardArchive() {

    const communityGrid =
        document.getElementById(
            "approved-calling-cards"
        );

    if (!communityGrid || !supabaseClient) {
        return;
    }

    const {
        data: submissions,
        error: submissionError
    } = await supabaseClient
        .from("submissions")
        .select(`
            id,
            user_id,
            title,
            description,
            preview_url,
            download_url,
            created_at
        `)
        .eq("status", "approved")
        .eq("type", "calling-card")
        .order("created_at", {
            ascending: false
        });

    if (submissionError) {

        console.error(
            "Unable to load community calling cards:",
            submissionError
        );

        return;
    }

    if (
        !submissions ||
        submissions.length === 0
    ) {
        return;
    }

    const userIds = [
        ...new Set(
            submissions
                .map(item => item.user_id)
                .filter(Boolean)
        )
    ];

    let creatorMap = {};

    if (userIds.length > 0) {

        const {
            data: profiles,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select("id, username")
            .in("id", userIds);

        if (!profileError && profiles) {

            creatorMap =
                Object.fromEntries(
                    profiles.map(profile => [
                        profile.id,
                        profile.username
                    ])
                );
        }
    }

    submissions.forEach(submission => {

        if (
            communityGrid.querySelector(
                `[data-community-id="${submission.id}"]`
            )
        ) {
            return;
        }

        const creator =
            creatorMap[submission.user_id] ||
            "COMMUNITY";

        const card =
            document.createElement("div");

        card.className = "card";

        card.dataset.category =
            "community ready";

        card.dataset.creator =
            creator;

        card.dataset.communityId =
            submission.id;

        const detailURL =
            `content.html?id=${encodeURIComponent(
                submission.id
            )}`;

        card.innerHTML = `

            <div class="preview">

                <img
                    src="${escapeVaultHTML(
                        submission.preview_url || ""
                    )}"
                    alt="${escapeVaultHTML(
                        submission.title ||
                        "Community Calling Card"
                    )} Calling Card"
                >

            </div>

            <h3>
                ${escapeVaultHTML(
                    submission.title ||
                    "Untitled"
                )}
            </h3>

            <p>
                ${escapeVaultHTML(
                    submission.description ||
                    "Community Calling Card"
                )}
            </p>

            <p class="card-status ready">
                READY
            </p>

            <div class="card-meta">

                <span>
                    CREATOR:
                    ${escapeVaultHTML(
                        creator
                    )}
                </span>

                <span>
                    256 × 64
                </span>

            </div>

            <a
    href="${detailURL}"
    class="card-btn"
>
    VIEW DETAILS
</a>

<button
    type="button"
    class="vault-save-btn"
    data-vault-id="community-calling-card-${submission.id}"
    data-vault-type="calling-card"
    data-vault-title="${escapeVaultHTML(
        submission.title || "Untitled"
    )}"
    data-vault-image="${escapeVaultHTML(
        submission.preview_url || ""
    )}"
    data-vault-url="${detailURL}"
>
    ♡ ADD TO MY VAULT
</button>

        `;

        communityGrid.append(card);
    });

    setupArchiveVaultButtons();
    setupMyVault();
}

// =========================================================
// COMMUNITY EMBLEMS - MAIN EMBLEM ARCHIVE
// =========================================================

async function setupCommunityEmblemArchive() {

    const emblemGrid =
        document.querySelector(
            ".card-grid.emblem-grid"
        );

    if (!emblemGrid || !supabaseClient) {
        return;
    }

    const {
        data: submissions,
        error: submissionError
    } = await supabaseClient
        .from("submissions")
        .select(`
    id,
    user_id,
    title,
    description,
    preview_url,
    download_url,
    created_at
`)
        .eq("status", "approved")
        .eq("type", "emblem")
        .order("created_at", {
            ascending: false
        });

    if (submissionError) {

        console.error(
            "Unable to load community emblems:",
            submissionError
        );

        return;
    }

    if (!submissions || submissions.length === 0) {
        return;
    }

    const userIds = [
        ...new Set(
            submissions
                .map(item => item.user_id)
                .filter(Boolean)
        )
    ];

    let creatorMap = {};

    if (userIds.length > 0) {

        const {
            data: profiles,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select("id, username")
            .in("id", userIds);

        if (!profileError && profiles) {

            creatorMap =
                Object.fromEntries(
                    profiles.map(profile => [
                        profile.id,
                        profile.username
                    ])
                );
        }
    }

    submissions.forEach(submission => {

        /*
         * Prevent the same community item
         * being added twice.
         */
        if (
            emblemGrid.querySelector(
                `[data-community-id="${submission.id}"]`
            )
        ) {
            return;
        }

        const creator =
            creatorMap[submission.user_id] ||
            "COMMUNITY";

        const card =
            document.createElement("div");

        card.className = "card";

        card.dataset.category = "community";
        card.dataset.creator = creator;
        card.dataset.communityId =
            submission.id;

        card.innerHTML = `

    <div class="emblem-preview">

        <img
            src="${escapeVaultHTML(
                submission.preview_url || ""
            )}"
            alt="${escapeVaultHTML(
                submission.title || "Community Emblem"
            )}"
        >

    </div>

    <h3>
        ${escapeVaultHTML(
            submission.title || "Untitled"
        )}
    </h3>

    <p>
        ${escapeVaultHTML(
            submission.description ||
            "Community Emblem"
        )}
    </p>

    <a
        href="${escapeVaultHTML(
            submission.download_url || "#"
        )}"
        class="card-btn download-btn"
        data-download="community-${escapeVaultHTML(
            submission.id
        )}"
        download
    >
        DOWNLOAD
    </a>

    <p
        class="download-count"
        data-count-id="community-${escapeVaultHTML(
            submission.id
        )}"
    >
        0 DOWNLOADS
    </p>

`;

        /*
         * Put newest community submissions first.
         */
        emblemGrid.append(card);
    });

setupArchiveVaultButtons();
setupMyVault();
await setupDownloadCounters();
}

// =========================================================
// CREATOR PROFILE - APPROVED SUBMISSIONS
// =========================================================

async function setupCreatorProfile() {

    const creatorProfile =
        document.querySelector("#creator-profile");

    if (!creatorProfile) {
        return;
    }

    const creatorUsername =
        creatorProfile.dataset.creator;

    if (!creatorUsername) {
        return;
    }

    // Find the creator's Supabase profile
    const {
        data: profile,
        error: profileError
    } = await supabaseClient
    .from("profiles")
        .select("id, username")
        .ilike("username", creatorUsername)
        .single();

    if (profileError || !profile) {
        console.error(
            "Creator profile error:",
            profileError
        );
        return;
    }

    // Get approved submissions from this creator
    const {
        data: submissions,
        error: submissionsError
    } = await supabaseClient
    .from("submissions")
    .select(`
    id,
    title,
    type,
    description,
    preview_url,
    created_at
`)  
        .eq("user_id", profile.id)
        .eq("status", "approved")
        .order("created_at", {
            ascending: false
        });

    if (submissionsError) {
        console.error(
            "Creator submissions error:",
            submissionsError
        );
        return;
    }

    if (!submissions || submissions.length === 0) {
        return;
    }

    const callingCardGrid =
        creatorProfile.querySelector(
            ".creator-calling-card-grid"
        );

    const emblemGrid =
        creatorProfile.querySelector(
            ".creator-emblem-grid"
        );

    let callingCardCount = 0;
    let emblemCount = 0;

    submissions.forEach((submission) => {

        const item =
            document.createElement("a");

        item.className =
            "creator-work-item";

        item.href =
    `content.html?id=${encodeURIComponent(
        submission.id
    )}`;

    

        const image =
            document.createElement("img");

        image.src =
            submission.preview_url;

        image.alt =
            submission.title;

        const content =
            document.createElement("div");

        const title =
            document.createElement("h3");

        title.textContent =
            submission.title;

        const description =
            document.createElement("p");

        description.textContent =
            submission.description || "";

        const view =
            document.createElement("span");

        view.textContent =
    "VIEW DETAILS →";

        content.appendChild(title);
        content.appendChild(description);
        content.appendChild(view);

        item.appendChild(image);
        item.appendChild(content);

        if (
            submission.type ===
            "calling-card"
        ) {

            if (callingCardGrid) {
                callingCardGrid.appendChild(item);
            }

            callingCardCount++;

        } else if (
            submission.type ===
            "emblem"
        ) {

            if (emblemGrid) {
                item.classList.add(
                    "emblem-work"
                );

                emblemGrid.appendChild(item);
            }

            emblemCount++;
        }

    });

    // Update creator statistics
    const statNumbers =
        creatorProfile.querySelectorAll(
            ".creator-profile-stats strong"
        );

    if (statNumbers.length >= 3) {

        const currentCallingCards =
            parseInt(
                statNumbers[0].textContent
            ) || 0;

        const currentEmblems =
            parseInt(
                statNumbers[1].textContent
            ) || 0;

        statNumbers[0].textContent =
            currentCallingCards +
            callingCardCount;

        statNumbers[1].textContent =
            currentEmblems +
            emblemCount;

        statNumbers[2].textContent =
            (
                currentCallingCards +
                currentEmblems +
                callingCardCount +
                emblemCount
            );
    }

}

// =========================================================
// CREATOR DIRECTORY - LIVE STATS
// =========================================================

async function setupCreatorDirectory() {

    const creatorCards =
        document.querySelectorAll(
            ".creator-directory-card"
        );

    if (!creatorCards.length || !supabaseClient) {
        return;
    }

    const creatorNames = [
        "ayleus",
        "uzi",
        "ren",
        "k2",
        "dre",
        "slowder"
    ];

    const {
    data: allProfiles,
    error: profileError
} = await supabaseClient
    .from("profiles")
    .select("id, username");

const profiles =
    (allProfiles || []).filter(profile =>
        creatorNames.includes(
            (profile.username || "")
                .trim()
                .toLowerCase()
        )
    );

    if (profileError || !profiles) {
        console.error(
            "Creator directory profile error:",
            profileError
        );
        return;
    }

    const profileMap = {};

    profiles.forEach(profile => {

        profileMap[
            profile.username
                .trim()
                .toLowerCase()
        ] = profile.id;

    });

    const creatorIds =
        profiles.map(profile => profile.id);

    if (!creatorIds.length) {
        return;
    }

    const {
        data: submissions,
        error: submissionError
    } = await supabaseClient
        .from("submissions")
        .select("user_id, type")
        .eq("status", "approved")
        .in("user_id", creatorIds);

    if (submissionError) {
        console.error(
            "Creator directory submission error:",
            submissionError
        );
        return;
    }

    creatorCards.forEach(card => {

        const heading =
            card.querySelector(
                ".creator-directory-info h2"
            );

        if (!heading) {
            return;
        }

        const username =
            heading.textContent
                .trim()
                .toLowerCase();

        if (!creatorNames.includes(username)) {
            return;
        }

        const userId =
            profileMap[username];

        if (!userId) {
            return;
        }

        const creatorSubmissions =
            submissions.filter(
                submission =>
                    submission.user_id === userId
            );

        const submittedCallingCards =
            creatorSubmissions.filter(
                submission =>
                    submission.type ===
                    "calling-card"
            ).length;

        const submittedEmblems =
            creatorSubmissions.filter(
                submission =>
                    submission.type ===
                    "emblem"
            ).length;

        /*
         * READ THE EXISTING DIRECTORY NUMBERS
         * AND ADD APPROVED SUBMISSIONS TO THEM.
         */

        const numbers =
            card.querySelectorAll(
                ".creator-directory-stats strong"
            );

        if (numbers.length >= 3) {

            const existingCallingCards =
                Number(numbers[0].textContent) || 0;

            const existingEmblems =
                Number(numbers[1].textContent) || 0;

            const existingTotal =
                Number(numbers[2].textContent) || 0;

            const newCallingCards =
                existingCallingCards +
                submittedCallingCards;

            const newEmblems =
                existingEmblems +
                submittedEmblems;

            const newTotal =
                existingTotal +
                submittedCallingCards +
                submittedEmblems;

            numbers[0].textContent =
                newCallingCards;

            numbers[1].textContent =
                newEmblems;

            numbers[2].textContent =
                newTotal;
        }

    });

}

/* =========================================================
   GLOBAL RELATED CONTENT
   Updates existing calling-card / emblem pages
   ========================================================= */

function escapeVaultHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


async function setupGlobalRelatedContent() {

    const container =
        document.querySelector(".related-grid");

    if (!container) {
        return;
    }

    /* Don't interfere with dynamic community content.html */
    if (
        window.location.pathname
            .toLowerCase()
            .endsWith("content.html")
    ) {
        return;
    }

    if (!supabaseClient) {
        return;
    }

    /* Current page */
    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    /* Work out whether this is a calling card or emblem page */
    const isEmblemPage =
        document.querySelector(
            ".emblem-preview"
        ) !== null;

    const contentType =
        isEmblemPage
            ? "emblem"
            : "calling-card";

    try {

        /* Get newest approved community uploads */
        const {
            data: submissions,
            error
        } = await supabaseClient
            .from("submissions")
            .select(`
                id,
                title,
                type,
                preview_url,
                created_at
            `)
            .eq("status", "approved")
            .eq("type", contentType)
            .order("created_at", {
                ascending: false
            })
            .limit(10);

        if (error) {
            console.error(
                "Global related content error:",
                error
            );
            return;
        }

        /*
         * Convert community submissions
         * into the same card format.
         */
        const communityCards =
            (submissions || [])
                .filter(submission => {

                    /*
                     * Don't show the current page
                     * if this page is a community item.
                     */
                    return true;

                })
                .map(submission => ({
                    url:
                        `content.html?id=${encodeURIComponent(
                            submission.id
                        )}`,

                    image:
                        submission.preview_url,

                    title:
                        submission.title,

                    series:
    "Community"
    }));


        /*
         * Existing Vault content.
         * These are used after community uploads.
         */
        const existingCallingCards = [
            {
                url: "rias-gremory.html",
                image: "images/callingcards/Rias Gremory.gif",
                title: "Rias Gremory",
                series: "High School DxD"
            },
            {
                url: "gojo.html",
                image: "images/callingcards/gojo.gif",
                title: "Gojo",
                series: "Jujutsu Kaisen"
            },
            {
                url: "itachi.html",
                image: "images/callingcards/itachi.gif",
                title: "Itachi",
                series: "Naruto"
            },
            {
                url: "madara.html",
                image: "images/callingcards/madara.gif",
                title: "Madara",
                series: "Naruto"
            },
            {
                url: "makima.html",
                image: "images/callingcards/Makima.gif",
                title: "Makima",
                series: "Chainsaw Man"
            },
            {
                url: "touka.html",
                image: "images/callingcards/touka.gif",
                title: "Touka Kirishima",
                series: "Tokyo Ghoul"
            }
        ];


        const existingEmblems = [];


        const existingContent =
            contentType === "calling-card"
                ? existingCallingCards
                : existingEmblems;


        /*
         * Remove the current page from
         * the existing Vault recommendations.
         */
        const filteredExisting =
            existingContent.filter(item =>
                item.url.toLowerCase() !== currentPage
            );


        /*
         * Community uploads FIRST.
         * Existing Vault content fills the rest.
         */
        const related = [
            ...communityCards,
            ...filteredExisting
        ].slice(0, 3);


        if (related.length === 0) {
            return;
        }


        /*
         * Render exactly the same
         * related-item layout.
         */
        container.innerHTML =
            related.map(item => `
                <a
                    href="${escapeVaultHTML(item.url)}"
                    class="related-item"
                >
                    <img
                        src="${escapeVaultHTML(item.image)}"
                        alt="${escapeVaultHTML(item.title)}"
                    >

                    <div>
                        <h3>
                            ${escapeVaultHTML(item.title)}
                        </h3>

                        <p>
                            ${escapeVaultHTML(item.series)}
                        </p>
                    </div>
                </a>
            `).join("");

    } catch (error) {

        console.error(
            "Global related content error:",
            error
        );

    }

}