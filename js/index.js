// index.js (uses ?lang=... from the URL)

// Helpers for language in URL
function getLangFromURL() {
    const params = new URLSearchParams(window.location.search);
    const lang = (params.get("lang") || "").toLowerCase();
    return ["nl", "en"].includes(lang) ? lang : "nl";
}
function setLangInURL(lang, { replace = false } = {}) {
    const params = new URLSearchParams(window.location.search);
    params.set("lang", lang);
    const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    if (replace) {
        history.replaceState({}, "", newUrl);
    } else {
        history.pushState({}, "", newUrl);
    }
}
function updateFlagUI(lang) {
    const nlFlag = document.querySelector(
        "header .headerLanguageSwitch img.flag-nl"
    );
    const enFlag = document.querySelector(
        "header .headerLanguageSwitch img.flag-en"
    );
    if (lang === "en") {
        nlFlag && nlFlag.classList.add("hidden");
        enFlag && enFlag.classList.remove("hidden");
    } else {
        nlFlag && nlFlag.classList.remove("hidden");
        enFlag && enFlag.classList.add("hidden");
    }
}

// Immediately run after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // Language from URL (default to nl)
    let currentLanguage = getLangFromURL();
    let currentLight = "dark";

    // 1) Load the language based on URL param on page load
    loadLanguage(currentLanguage);
    updateFlagUI(currentLanguage);

    // 2) Listen for clicks on the language switch
    const langSwitch = document.querySelector(".headerLanguageSwitch");
    if (langSwitch) {
        langSwitch.addEventListener("click", () => {
            // Toggle language
            currentLanguage = currentLanguage === "nl" ? "en" : "nl";
            updateFlagUI(currentLanguage);

            // Persist new lang in the URL and refresh content
            setLangInURL(currentLanguage); // pushState so Back button works
            loadLanguage(currentLanguage);
        });
    }

    // Also handle back/forward navigation if ?lang changes
    window.addEventListener("popstate", () => {
        currentLanguage = getLangFromURL();
        updateFlagUI(currentLanguage);
        loadLanguage(currentLanguage);
    });

    // Light/Dark toggle
    const lightSwitch = document.querySelector(".headerLightModeSwitch");
    if (lightSwitch) {
        lightSwitch.addEventListener("click", () => {
            currentLight = currentLight === "dark" ? "light" : "dark";
            loadLight(currentLight);
        });
    }
});

/**
 * Fetch language JSON based on 'lang' param
 * and call updateTexts() to update DOM.
 */
function loadLanguage(lang) {
    fetch(`content-${lang}.json`)
        .then((response) => response.json())
        .then((data) => {
            updateTexts(data,lang);
        })
        .catch((error) => {
            console.error("Error loading language file:", error);
        });
}

function loadLight(mode) {
    if (mode === "dark") {
        document.querySelector("body")?.classList.remove("light");
        document
            .querySelector("header .headerLightModeSwitch .day")
            ?.classList.add("hidden");
        document
            .querySelector("header .headerLightModeSwitch .night")
            ?.classList.remove("hidden");
    } else {
        document.querySelector("body")?.classList.add("light");
        document
            .querySelector("header .headerLightModeSwitch .day")
            ?.classList.remove("hidden");
        document
            .querySelector("header .headerLightModeSwitch .night")
            ?.classList.add("hidden");
    }
}

/**
 * Update the DOM elements with the fetched JSON data.
 */
function updateTexts(data,lang) {
    // =========================
    // HEADER
    // =========================
    const langBtnText = document.querySelector(".headerLanguageSwitch p");
    if (langBtnText) {
        langBtnText.textContent = data.headerButtonText;
    }

    // =========================
    // WELCOME SECTION
    // =========================
    const welcomeIntro = document.querySelector(".welcome p");
    if (welcomeIntro) {
        welcomeIntro.textContent = data.welcome.introText;
    }

    const welcomeName = document.querySelector(".welcome h1");
    if (welcomeName) {
        welcomeName.textContent = data.welcome.name;
    }

    const welcomeSubtitle = document.querySelector(".welcome h2");
    if (welcomeSubtitle) {
        welcomeSubtitle.textContent = data.welcome.subtitle;
    }

    const downloadCVBtn = document.querySelector(".welcome .buttons .downloadCV");
    if (downloadCVBtn) {
        downloadCVBtn.textContent = data.welcome.buttons.downloadCV.title;
        downloadCVBtn.setAttribute("href", data.welcome.buttons.downloadCV.link);
    }

    const contactMeBtn = document.querySelector(".welcome .buttons .contactMe");
    if (contactMeBtn) {
        contactMeBtn.textContent = data.welcome.buttons.contactMe.title;
        contactMeBtn.setAttribute("href", data.welcome.buttons.contactMe.link);
    }

    // =========================
    // ABOUT SECTION
    // =========================
    const aboutIntro = document.querySelector(".about p");
    if (aboutIntro) {
        aboutIntro.textContent = data.about.sectionIntro;
    }

    const aboutTitle = document.querySelector(".about h3");
    if (aboutTitle) {
        aboutTitle.textContent = data.about.title;
    }

    // Cards
    const aboutCardTitles = document.querySelectorAll(".aboutContentCard h4");
    const aboutCardTexts = document.querySelectorAll(".aboutContentCard h5");
    if (aboutCardTitles && aboutCardTexts) {
        data.about.cards.forEach((card, i) => {
            if (aboutCardTitles[i]) aboutCardTitles[i].textContent = card.cardTitle;
            if (aboutCardTexts[i]) aboutCardTexts[i].textContent = card.cardText;
        });
    }

    // Paragraphs
    const paragraphsContainer = document.querySelector(
        ".aboutContent .paragraphs"
    );
    if (paragraphsContainer) {
        paragraphsContainer.innerHTML = "";
        data.about.paragraphs.forEach((paragraphText) => {
            const p = document.createElement("p");
            p.textContent = paragraphText;
            paragraphsContainer.appendChild(p);
        });
    }

    // "Contacteer mij" link
    const aboutContactLink = document.querySelector(
        '.aboutContent a[href="#contact"]'
    );
    if (aboutContactLink) {
        aboutContactLink.textContent = data.about.contactLink.title;
        aboutContactLink.setAttribute("href", data.about.contactLink.link);
    }

    // =========================
    // SKILLS SECTION
    // =========================
    const skillsIntro = document.querySelector(".skills p");
    if (skillsIntro) {
        skillsIntro.textContent = data.skills.sectionIntro;
    }
    const skillsTitle = document.querySelector(".skills h3");
    if (skillsTitle) {
        skillsTitle.textContent = data.skills.title;
    }

    const skillsContainer = document.querySelector(".skillsContainer");
    if (skillsContainer) {
        // Clear old
        skillsContainer.innerHTML = "";

        data.skills.skillsList.forEach((skillObj) => {
            const skillItem = document.createElement("div");
            skillItem.classList.add("skillsItem");

            const starsHtml = generateStars(skillObj.stars);
            skillItem.innerHTML = `
        ${skillObj.svg}
        <h4>${skillObj.skill}</h4>
        <div class="stars">${starsHtml}</div>
      `;
            skillsContainer.appendChild(skillItem);
        });
    }

    function generateStars(starCount) {
        let html = "";
        for (let i = 0; i < 5; i++) {
            const starClass = i < starCount ? "star full" : "star";
            html += `<div class="${starClass}"></div>`;
        }
        return html;
    }

    // =========================
    // BLOG SECTION
    // =========================
    const blogIntro = document.querySelector(".blog p");
    if (blogIntro) {
        blogIntro.textContent = data.blog.sectionIntro;
    }
    const blogTitle = document.querySelector(".blog h3");
    if (blogTitle) {
        blogTitle.textContent = data.blog.title;
    }

    const blogList =
        document.querySelector(".blog .blogPosts") ||
        document.querySelector(".blogPosts");

    if (blogList) {
        blogList.innerHTML = "";

        const postsRaw = Array.isArray(data.blog?.blogPosts)
            ? data.blog.blogPosts
            : Array.isArray(data.blogPosts)
                ? data.blogPosts
                : [];

        // Sort: highest id -> lowest id
        const posts = [...postsRaw].sort(
            (a, b) => Number(b?.id ?? 0) - Number(a?.id ?? 0)
        );

        // Keep current lang in the blog links
        const currentLang = getLangFromURL?.() || "";
        const langQS = currentLang ? `?lang=${currentLang}` : "";

        posts.forEach((post) => {
            const bannerSrc =
                post.banner || `assets/images/blog/blogpost${post.id}/banner.jpg`;

            const article = document.createElement("article");
            article.className = "blogPost";
            article.innerHTML = `
      <div class="blogPostImage">
        <img src="${bannerSrc}" alt="banner blog post ${escapeHtml(post.title || "")}">
      </div>
      <div class="blogPostDescription">
        <p class="blogCategory">${escapeHtml(post.category || "")}</p>
        <h4>${escapeHtml(post.title || "")}</h4>
        <p class="blogDate">${escapeHtml(post.date || "")}</p>
        <a href="/blog/${post.id}${langQS}" class="btn">
          ${escapeHtml((data.blog && data.blog.blogPostButtonText) || "Lees meer")}
        </a>
      </div>
    `;
            blogList.appendChild(article);
        });
    }


    // =========================
    // CONTACT SECTION
    // =========================
    const contactIntro = document.querySelector(".contact p");
    if (contactIntro) {
        contactIntro.textContent = data.contact.sectionIntro;
    }
    const contactTitle = document.querySelector(".contact h3");
    if (contactTitle) {
        contactTitle.textContent = data.contact.title;
    }

    const contactLinkEmail = document.querySelector(
        ".contact .contactLink.email"
    );
    if (contactLinkEmail) {
        const pTitle = contactLinkEmail.querySelector("p.title");
        if (pTitle) pTitle.textContent = data.contact.email.name;
        contactLinkEmail.setAttribute("href", data.contact.email.link);
        const pText = contactLinkEmail.querySelector("p.text");
        if (pText) pText.textContent = data.contact.email.text;
    }

    const contactLinkPhone = document.querySelector(
        ".contact .contactLink.phone"
    );
    if (contactLinkPhone) {
        const pTitle = contactLinkPhone.querySelector("p.title");
        if (pTitle) pTitle.textContent = data.contact.phone.name;
        contactLinkPhone.setAttribute("href", data.contact.phone.link);
        const pText = contactLinkPhone.querySelector("p.text");
        if (pText) pText.textContent = data.contact.phone.text;
    }

    // FIX: use '.linkedin' (not '.email')
    const contactLinkLinkedin = document.querySelector(
        ".contact .contactLink.linkedin"
    );
    if (contactLinkLinkedin) {
        const pTitle = contactLinkLinkedin.querySelector("p.title");
        if (pTitle) pTitle.textContent = data.contact.linkedin.name;
        contactLinkLinkedin.setAttribute("href", data.contact.linkedin.link);
        const pText = contactLinkLinkedin.querySelector("p.text");
        if (pText) pText.textContent = data.contact.linkedin.text;
    }

    // =========================
    // FOOTER
    // =========================
    const footerLinks = document.querySelectorAll("footer .permalinks a");
    if (footerLinks && data.footer && Array.isArray(data.footer.permalinks)) {
        data.footer.permalinks.forEach((linkData, i) => {
            if (footerLinks[i]) {
                footerLinks[i].textContent = linkData.title;
                footerLinks[i].setAttribute("href", linkData.link);
            }
        });
    }
}

/** Simple HTML escape for injected strings */
function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
