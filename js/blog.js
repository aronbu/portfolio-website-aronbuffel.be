// blog.js — multilingual blog post rendering with Slick + mobile-friendly lightbox

// ---------- URL / lang helpers ----------
function getLangFromURL() {
    const params = new URLSearchParams(window.location.search);
    const lang = (params.get("lang") || "").toLowerCase();
    return ["nl", "en"].includes(lang) ? lang : "nl";
}
function setLangInURL(lang, { replace = false } = {}) {
    const params = new URLSearchParams(window.location.search);
    params.set("lang", lang);
    const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    if (replace) history.replaceState({}, "", newUrl);
    else history.pushState({}, "", newUrl);
}
function updateFlagUI(lang) {
    const nlFlag = document.querySelector("header .headerLanguageSwitch img.flag-nl");
    const enFlag = document.querySelector("header .headerLanguageSwitch img.flag-en");
    if (lang === "en") {
        nlFlag && nlFlag.classList.add("hidden");
        enFlag && enFlag.classList.remove("hidden");
    } else {
        nlFlag && nlFlag.classList.remove("hidden");
        enFlag && enFlag.classList.add("hidden");
    }
}

// ---------- Post ID helper ----------
function getPostId() {
    const url = new URL(window.location.href);
    const idParam = url.searchParams.get("id");
    if (idParam && /^\d+$/.test(idParam)) return parseInt(idParam, 10);

    const segments = window.location.pathname.split("/").filter(Boolean);
    // last non-empty segment (e.g., ".../blog/1" or ".../blog/1/")
    let last = segments[segments.length - 1] || "";
    last = last.replace(/\.(html?|php)$/i, "");
    if (/^\d+$/.test(last)) return parseInt(last, 10);

    // fallback: try previous segment
    const prev = segments[segments.length - 2] || "";
    if (/^\d+$/.test(prev)) return parseInt(prev, 10);

    return NaN;
}

// ---------- Tiny i18n for page-only strings ----------
const UI_TEXT = {
    nl: {
        backHome: "Ga terug naar de Homepage",
        notFound: "404 - Blogpost niet gevonden",
    },
    en: {
        backHome: "Back to the Homepage",
        notFound: "404 - Blog post not found",
    },
};

// ---------- Escape helper ----------
function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ---------- Slick init (after content is injected) ----------
function initCarousels() {
    if (window.jQuery && window.jQuery.fn && window.jQuery.fn.slick) {
        window.jQuery(".carousel").each(function () {
            window.jQuery(this).slick({
                slidesToShow: 1,
                arrows: true,
                dots: true,
                adaptiveHeight: true,
                slidesToScroll: 1,
                autoplay: true,
                autoplaySpeed: 3000,
            });
        });
    }
}

// ---------- URL normalizer (helps matching absolute/relative) ----------
function normalizeSrc(src) {
    try { return new URL(src, document.baseURI).href; }
    catch { return src; }
}

// --- helpers to safely inject limited HTML from JSON ---
function normalizeQuotes(str) {
    return String(str).replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
}

// Convert simple "1. ..." style lines into an ordered list.
// If no numbered pattern is found, keep <br> breaks.
function formatTextWithLists(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const numbered = lines.every(l => /^\d+\.\s+/.test(l));
    if (!numbered) return text.replace(/\n/g, "<br>");
    const items = lines
        .map(l => l.replace(/^\d+\.\s+/, ""))
        .map(li => `<li>${escapeHtml(li)}</li>`)
        .join("");
    return `<ol>${items}</ol>`;
}

// Very small sanitizer: allow a handful of tags/attrs, scrub the rest
function sanitizeHTML(html) {
    const allowedTags = new Set(["A","B","I","EM","STRONG","BR","UL","OL","LI","P","SPAN"]);
    const allowedAttrs = {
        A: ["href","title","target","rel","class"],
        SPAN: ["class"],
        P: ["class"],
        STRONG: [], EM: [], B: [], I: [], BR: [], UL: [], OL: [], LI: []
    };

    const tpl = document.createElement("template");
    tpl.innerHTML = html;

    (function walk(node) {
        [...node.children].forEach(el => {
            if (!allowedTags.has(el.tagName)) {
                el.replaceWith(...el.childNodes);
                walk(node);
                return;
            }
            // strip disallowed attributes
            [...el.attributes].forEach(attr => {
                const ok = allowedAttrs[el.tagName] || [];
                if (!ok.includes(attr.name.toLowerCase())) el.removeAttribute(attr.name);
            });

            // harden links
            if (el.tagName === "A") {
                let href = (el.getAttribute("href") || "").trim();
                href = normalizeQuotes(href);
                const isSafe = /^(https?:|mailto:|tel:)/i.test(href);
                if (!isSafe) {
                    el.removeAttribute("href");
                } else {
                    el.setAttribute("href", href);
                    if (/^https?:/i.test(href)) {
                        el.setAttribute("target", "_blank");
                        el.setAttribute("rel", "noopener noreferrer");
                    }
                }
            }
            walk(el);
        });
    })(tpl.content);

    return tpl.innerHTML;
}

// ---------- Render post blocks ----------
function renderContentBlocks(container, contentBlocks = []) {
    container.innerHTML = "";
    contentBlocks.forEach((block, idx) => {
        const wrapper = document.createElement("div");
        wrapper.className = "contentBlock" + (idx % 2 === 1 ? " rightText" : "");

        // Text column
        const textDiv = document.createElement("div");
        textDiv.className = "text";
        const h3 = document.createElement("h3");
        h3.textContent = block.titleBlock || "";
        textDiv.appendChild(h3);

        (block.texts || []).forEach((t) => {
            const p = document.createElement("p");
            const normalized = normalizeQuotes(t);
            const formatted = formatTextWithLists(normalized);
            p.innerHTML = sanitizeHTML(formatted);
            textDiv.appendChild(p);
        });

        // Image/video carousel column
        const imgDiv = document.createElement("div");
        imgDiv.className = "image carousel";

        (block.images || []).forEach((src) => {
            const item = document.createElement("div");
            item.className = "ab-thumb";

            // Normalize & detect by extension
            const url = String(src).split("?")[0].toLowerCase();
            const isVideo = /\.(mp4|webm|ogv|ogg|mov)$/i.test(url);

            if (isVideo) {
                const ext = url.match(/\.(mp4|webm|ogv|ogg|mov)$/i)[1];
                const mime =
                    ext === "mp4"  ? "video/mp4" :
                        ext === "webm" ? "video/webm" :
                            ext === "mov"  ? "video/quicktime" : "video/ogg";

                const video = document.createElement("video");
                video.className = "blogVideo";
                video.setAttribute("playsinline", "");
                video.setAttribute("preload", "metadata");
                // No controls in carousel to avoid native fullscreen interception
                video.muted = true;

                const source = document.createElement("source");
                source.src = src;
                source.type = mime;
                video.appendChild(source);

                const overlay = document.createElement("span");
                overlay.className = "ab-play-overlay";
                overlay.setAttribute("aria-hidden", "true");
                overlay.innerHTML = "&#9654;";

                item.classList.add("ab-thumb-video");
                item.appendChild(video);
                item.appendChild(overlay);
            } else {
                const img = document.createElement("img");
                img.src = src;
                img.alt = "blog photo";
                item.appendChild(img);
            }

            imgDiv.appendChild(item);
        });

        wrapper.appendChild(textDiv);
        wrapper.appendChild(imgDiv);
        container.appendChild(wrapper);
    });
}

// ---------- Load and render blog ----------
async function loadBlog(lang) {
    const contentPath = `../content-${lang}.json`;
    try {
        const res = await fetch(contentPath);
        const data = await res.json();

        // Set switch button label
        const langBtnText = document.querySelector(".headerLanguageSwitch p");
        if (langBtnText && data.headerButtonText) {
            langBtnText.textContent = data.headerButtonText;
        }

        // Get post id & find post
        const postId = getPostId();
        const post = (data.blog && Array.isArray(data.blog.blogPosts))
            ? data.blog.blogPosts.find((p) => Number(p.id) === Number(postId))
            : null;

        if (!post) {
            document.body.innerHTML = `<h1 style="text-align:center;margin:3rem 0;">${UI_TEXT[lang].notFound}</h1>`;
            return;
        }

        // Title, category/date
        const h1 = document.querySelector(".blogContent h1");
        if (h1) h1.textContent = post.title || "";

        const catH2 = document.querySelector(".blogCategory h2");
        if (catH2) {
            const cat = post.category ? escapeHtml(post.category) : "";
            const date = post.date ? escapeHtml(post.date) : "";
            catH2.innerHTML = `${cat}${cat && date ? " — " : ""}${date}`;
        }

        // Content blocks
        const blocksContainer = document.querySelector(".contentBlocks");
        if (blocksContainer) {
            renderContentBlocks(blocksContainer, post.contentBlocks || []);
            initCarousels();
            attachLightboxHandlers();
        }
    } catch (e) {
        console.error("Failed to load blog content:", e);
        document.body.innerHTML = `<h1 style="text-align:center;margin:3rem 0;">${UI_TEXT[lang].notFound}</h1>`;
    }
}

function loadNavbarLinks(lang) {
    // Update back link & nav links with lang
    const backLink = document.querySelector("header a.backToHome");
    if (backLink) backLink.setAttribute("href", `../index.html?lang=${lang}#blog`);
    const backLinkText = document.querySelector("header a.backToHome")?.lastChild;
    if (backLinkText && backLinkText.nodeType === Node.TEXT_NODE) {
        backLinkText.textContent = ` ${UI_TEXT[lang].backHome}`;
    }

    // Ensure top nav keeps lang param
    document.querySelectorAll("nav a[href^='../#']").forEach((a) => {
        const hash = a.getAttribute("href").split("#")[1] || "";
        a.setAttribute("href", `../index.html?lang=${lang}#${hash}`);
    });
}

async function loadFooter(lang) {
    const contentPath = `../content-${lang}.json`;
    try {
        const res = await fetch(contentPath);
        const data = await res.json();
        const footerLinks = document.querySelectorAll("footer .permalinks a");
        if (footerLinks && data.footer && Array.isArray(data.footer.permalinks)) {
            data.footer.permalinks.forEach((linkData, i) => {
                if (footerLinks[i]) {
                    footerLinks[i].textContent = linkData.title;
                    footerLinks[i].setAttribute("href", `../index.html?lang=${lang}${linkData.link}`);
                }
            });
        }
    } catch (e) {
        console.error("Failed to load footer content:", e);
    }
}

// ---------- Boot ----------
document.addEventListener("DOMContentLoaded", () => {
    let currentLanguage = getLangFromURL();

    updateFlagUI(currentLanguage);
    loadBlog(currentLanguage);
    loadNavbarLinks(currentLanguage);
    loadFooter(currentLanguage);

    // Toggle language and persist in URL
    const langSwitch = document.querySelector(".headerLanguageSwitch");
    if (langSwitch) {
        langSwitch.addEventListener("click", () => {
            currentLanguage = currentLanguage === "nl" ? "en" : "nl";
            updateFlagUI(currentLanguage);
            setLangInURL(currentLanguage);
            loadBlog(currentLanguage);
            loadNavbarLinks(currentLanguage);
            loadFooter(currentLanguage);
        });
    }

    // Back/forward support if ?lang changes
    window.addEventListener("popstate", () => {
        currentLanguage = getLangFromURL();
        updateFlagUI(currentLanguage);
        loadBlog(currentLanguage);
        loadNavbarLinks(currentLanguage);
        loadFooter(currentLanguage);
    });
});

/* ===========================
   LIGHTBOX (zoom on click)
   =========================== */
(function () {
    let overlay, inner, mediaWrap, prevBtn, nextBtn, closeBtn;
    let currentGroup = [];
    let currentIndex = 0;

    function ensureLightboxStyles() {
        if (document.getElementById("ab-lightbox-styles")) return;
        const css = `
    /* ---- Lightbox mobile-friendly styles ---- */
    :root{
      --ab-pad-x: clamp(12px, 4vw, 32px);
      --ab-pad-y: clamp(12px, 4vh, 32px);
      --ab-btn: 44px;
      --ab-btn-bg: rgba(255,255,255,.14);
      --ab-btn-fg: #fff;
    }

    body.ab-no-scroll{overflow:hidden; touch-action:none;}

    .ab-lightbox{
      position:fixed; inset:0; z-index:9999; display:none;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }
    .ab-lightbox.show{display:block}
    .ab-lightbox .ab-backdrop{position:absolute; inset:0; background:rgba(0,0,0,.88)}
    .ab-lightbox .ab-inner{
      position:absolute; inset:0;
      display:flex; align-items:center; justify-content:center;
      padding: var(--ab-pad-y) var(--ab-pad-x);
    }
    .ab-lightbox .ab-media{
      position:relative; display:flex; align-items:center; justify-content:center;
      max-width:90vw; max-height:90vh;
    }
    .ab-lightbox .ab-media img,
    .ab-lightbox .ab-media video{
      max-width: min(100vw - 2*var(--ab-pad-x), 90vw);
      max-height: min(100dvh - 2*var(--ab-pad-y), 90vh);
      width:auto; height:auto; object-fit:contain;
      border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,.5);
      background:#000;
    }

    .ab-lightbox .ab-close,
    .ab-lightbox .ab-prev,
    .ab-lightbox .ab-next{
      position:absolute; top:50%; transform:translateY(-50%);
      background:var(--ab-btn-bg);
      backdrop-filter:saturate(120%) blur(4px);
      border:none; border-radius:999px; color:var(--ab-btn-fg);
      width:var(--ab-btn); height:var(--ab-btn); cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      font-size:24px; line-height:1; user-select:none;
      -webkit-tap-highlight-color: transparent;
      z-index: 99999;
    }
    .ab-lightbox .ab-close{ top:24px; right:24px; transform:none }
    .ab-lightbox .ab-prev{ left:24px }
    .ab-lightbox .ab-next{ right:24px }
    .ab-lightbox .ab-prev[disabled], .ab-lightbox .ab-next[disabled]{ opacity:.35; cursor:default }

    /* Make disabled arrows completely disappear on very small screens */
    @media (max-width: 480px){
      .ab-lightbox .ab-prev[disabled], .ab-lightbox .ab-next[disabled]{ display:none; }
    }

    /* Respect notches & dynamic viewport on mobile */
    @media (max-width: 768px){
      :root{ --ab-btn: 52px; }

      .ab-lightbox .ab-inner{
        padding:
          calc(var(--ab-pad-y) + env(safe-area-inset-top))
          calc(var(--ab-pad-x) + env(safe-area-inset-right))
          calc(var(--ab-pad-y) + env(safe-area-inset-bottom))
          calc(var(--ab-pad-x) + env(safe-area-inset-left));
      }

      .ab-lightbox .ab-media{
        max-width:100vw;
        max-height:calc(100dvh - (var(--ab-pad-y) + env(safe-area-inset-top) + var(--ab-pad-y) + env(safe-area-inset-bottom)));
      }
      .ab-lightbox .ab-media img,
      .ab-lightbox .ab-media video{
        max-width:100vw;
        max-height:calc(100dvh - (var(--ab-pad-y) + env(safe-area-inset-top) + var(--ab-pad-y) + env(safe-area-inset-bottom)));
        border-radius:10px;
      }

      .ab-lightbox .ab-prev{ left: calc(10px + env(safe-area-inset-left)); }
      .ab-lightbox .ab-next{ right: calc(10px + env(safe-area-inset-right)); }
      .ab-lightbox .ab-close{
        top: calc(12px + env(safe-area-inset-top));
        right: calc(12px + env(safe-area-inset-right));
      }
    }

    /* Thumbs look tappable; prevent native video interactions in carousel */
    .carousel img, .carousel video{ cursor: zoom-in; }
    .ab-thumb{ position: relative; }
    .ab-thumb-video video{ pointer-events: none; }
    .ab-thumb .ab-play-overlay{
      position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
      width:64px; height:64px; border-radius:999px;
      background:rgba(0,0,0,.5);
      color:#fff; display:flex; align-items:center; justify-content:center;
      font-size:28px; line-height:1; pointer-events:none;
      box-shadow:0 6px 24px rgba(0,0,0,.35);
    }
    @media (max-width:480px){
      .ab-thumb .ab-play-overlay{ width:56px; height:56px; font-size:24px; }
    }
    `;
        const style = document.createElement("style");
        style.id = "ab-lightbox-styles";
        style.textContent = css;
        document.head.appendChild(style);
    }

    function createLightbox() {
        if (document.getElementById("ab-lightbox")) return;
        overlay = document.createElement("div");
        overlay.id = "ab-lightbox";
        overlay.className = "ab-lightbox";
        overlay.setAttribute("aria-hidden", "true");

        const backdrop = document.createElement("div");
        backdrop.className = "ab-backdrop";

        inner = document.createElement("div");
        inner.className = "ab-inner";
        inner.setAttribute("role", "dialog");
        inner.setAttribute("aria-modal", "true");

        closeBtn = document.createElement("button");
        closeBtn.className = "ab-close";
        closeBtn.setAttribute("aria-label", "Close");
        closeBtn.textContent = "×";

        prevBtn = document.createElement("button");
        prevBtn.className = "ab-prev";
        prevBtn.setAttribute("aria-label", "Previous");
        prevBtn.textContent = "‹";

        nextBtn = document.createElement("button");
        nextBtn.className = "ab-next";
        nextBtn.setAttribute("aria-label", "Next");
        nextBtn.textContent = "›";

        mediaWrap = document.createElement("div");
        mediaWrap.className = "ab-media";

        inner.appendChild(closeBtn);
        inner.appendChild(prevBtn);
        inner.appendChild(nextBtn);
        inner.appendChild(mediaWrap);

        overlay.appendChild(backdrop);
        overlay.appendChild(inner);
        document.body.appendChild(overlay);

        // Close on backdrop or X
        backdrop.addEventListener("click", closeLightbox);
        closeBtn.addEventListener("click", closeLightbox);

        // Prev/Next
        prevBtn.addEventListener("click", () => go(-1));
        nextBtn.addEventListener("click", () => go(1));

        // Keyboard
        document.addEventListener("keydown", (e) => {
            if (!overlay.classList.contains("show")) return;
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowLeft") go(-1);
            if (e.key === "ArrowRight") go(1);
        });
    }

    function pauseAnyVideo() {
        const v = mediaWrap.querySelector("video");
        if (v) {
            v.pause();
            v.removeAttribute("src");
            const src = v.querySelector("source");
            if (src) src.remove();
        }
    }

    function closeLightbox() {
        pauseAnyVideo();
        overlay.classList.remove("show");
        overlay.setAttribute("aria-hidden", "true");
        document.body.classList.remove("ab-no-scroll");
        mediaWrap.innerHTML = "";
        currentGroup = [];
        currentIndex = 0;
    }

    function renderMedia(item) {
        mediaWrap.innerHTML = "";
        pauseAnyVideo();

        if (item.type === "video") {
            const video = document.createElement("video");
            video.setAttribute("playsinline", "");
            video.setAttribute("preload", "metadata");
            video.setAttribute("controls", "");
            video.autoplay = true;

            const source = document.createElement("source");
            source.src = item.src;
            source.type = item.mime || "video/mp4";
            video.appendChild(source);
            video.appendChild(document.createTextNode("Your browser does not support the video tag."));
            mediaWrap.appendChild(video);
            video.play().catch(() => {});
        } else {
            const img = document.createElement("img");
            img.src = item.src;
            img.alt = "zoomed media";
            mediaWrap.appendChild(img);
        }

        prevBtn.disabled = currentGroup.length <= 1;
        nextBtn.disabled = currentGroup.length <= 1;
    }

    function go(delta) {
        if (!currentGroup.length) return;
        currentIndex = (currentIndex + delta + currentGroup.length) % currentGroup.length;
        renderMedia(currentGroup[currentIndex]);
    }

    function getMediaListFromCarousel(carouselEl) {
        const els = Array.from(carouselEl.querySelectorAll("img, video"));
        const items = [];
        const seen = new Set();

        els.forEach((el) => {
            let type = "image";
            let raw = "";
            let mime = "";

            if (el.tagName === "IMG") {
                raw = el.getAttribute("src") || "";
                type = "image";
            } else {
                type = "video";
                const s = el.querySelector("source");
                raw = el.currentSrc || (s ? s.src : (el.getAttribute("src") || ""));
                mime = s ? s.type : "";
            }
            if (!raw) return;

            const normalized = normalizeSrc(raw).split("#")[0];
            if (seen.has(normalized)) return;
            seen.add(normalized);
            items.push({ type, src: normalized, mime });
        });

        return items;
    }

    function openLightbox(carouselEl, clickedSrc) {
        ensureLightboxStyles();
        createLightbox();

        currentGroup = getMediaListFromCarousel(carouselEl);
        const normClicked = normalizeSrc(clickedSrc).split("#")[0];
        const idx = currentGroup.findIndex((it) => it.src === normClicked);
        currentIndex = Math.max(0, idx);

        renderMedia(currentGroup[currentIndex]);
        overlay.classList.add("show");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("ab-no-scroll");
    }

    // Public attach function (idempotent)
    window.attachLightboxHandlers = function attachLightboxHandlers() {
        ensureLightboxStyles();
        createLightbox();

        const root = document.querySelector(".contentBlocks");
        if (!root) return;
        if (root.__abLightboxBound) return;
        root.__abLightboxBound = true;

        root.addEventListener("click", (e) => {
            const carousel = e.target.closest(".carousel");
            if (!carousel) return;

            // Find a clicked IMG or VIDEO (or an overlay sitting on top of a video)
            let img = e.target.closest("img");
            let vid = e.target.closest("video");

            if (!img && !vid) {
                const thumb = e.target.closest(".ab-thumb");
                if (thumb) {
                    img = thumb.querySelector("img");
                    vid = thumb.querySelector("video");
                }
            }

            if (!img && !vid) return;

            // Resolve the clicked src
            let clickedSrc = "";
            if (img) {
                clickedSrc = img.getAttribute("src") || "";
            } else if (vid) {
                clickedSrc =
                    vid.currentSrc ||
                    vid.querySelector("source")?.src ||
                    vid.getAttribute("src") ||
                    "";
            }
            if (!clickedSrc) return;

            e.preventDefault();
            openLightbox(carousel, normalizeSrc(clickedSrc));
        });
    };
})();
