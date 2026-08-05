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


/* ---------- PAGE SETUP ---------- */

document.addEventListener("DOMContentLoaded", () => {
    setupSearchAndFilters();
    setupFeaturedShowcase();
    setupDownloadCounters();
});


/* ---------- SEARCH AND FILTERS ---------- */

function setupSearchAndFilters() {
    const searchInputs = document.querySelectorAll(
        "#card-search, #emblem-search"
    );

    const filterButtons =
        document.querySelectorAll(".filter-btn");

    const cards =
        document.querySelectorAll(".card");

    if (cards.length === 0) {
        return;
    }

    let activeCategory = "all";

    function filterContent() {
        let searchText = "";

        searchInputs.forEach((input) => {
            searchText =
                input.value.toLowerCase().trim();
        });

        let visibleCards = 0;

        cards.forEach((card) => {
            const name =
                card
                    .querySelector("h3")
                    ?.textContent
                    .toLowerCase() || "";

            const series =
                card
                    .querySelector("p")
                    ?.textContent
                    .toLowerCase() || "";

            const category =
                card.dataset.category
                    ?.toLowerCase() || "other";

            const categoryList =
                category.split(" ");

            const matchesSearch =
                name.includes(searchText) ||
                series.includes(searchText) ||
                category.includes(searchText);

            const matchesCategory =
                activeCategory === "all" ||
                categoryList.includes(activeCategory);

            const shouldShow =
                matchesSearch && matchesCategory;

            card.style.display =
                shouldShow ? "" : "none";

            if (shouldShow) {
                card.classList.add("card-visible");
                visibleCards++;
            } else {
                card.classList.remove("card-visible");
            }
        });

        showNoResultsMessage(visibleCards);
    }

    function showNoResultsMessage(visibleCards) {
        const cardGrid =
            document.querySelector(".card-grid");

        if (!cardGrid) {
            return;
        }

        let message =
            document.querySelector(".no-results");

        if (visibleCards === 0) {
            if (!message) {
                message =
                    document.createElement("p");

                message.className = "no-results";
                message.textContent =
                    "NO CONTENT FOUND";

                cardGrid.after(message);
            }
        } else if (message) {
            message.remove();
        }
    }

    searchInputs.forEach((input) => {
        input.addEventListener(
            "input",
            filterContent
        );
    });

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            filterButtons.forEach((item) => {
                item.classList.remove(
                    "active-filter"
                );
            });

            button.classList.add(
                "active-filter"
            );

            activeCategory =
                button.dataset.filter
                    ?.toLowerCase() || "all";

            filterContent();
        });
    });

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