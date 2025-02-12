// Immediately run after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // Default language can be 'nl'
    let currentLanguage = 'nl';
    let currentLight = 'dark';
    // Grab the language switch button (or the entire div)
    const langSwitch = document.querySelector('.headerLanguageSwitch');

    // 1) Load the default language on page load
    loadLanguage(currentLanguage);

    // 2) Listen for clicks on the language switch
    langSwitch.addEventListener('click', () => {
        // Toggle language
        currentLanguage = (currentLanguage === 'nl') ? 'en' : 'nl';
        if(currentLanguage==="en"){

            document.querySelector('header .headerLanguageSwitch img.flag-nl').classList.add("hidden");
            document.querySelector('header .headerLanguageSwitch img.flag-en').classList.remove("hidden");
        }
        else {

            document.querySelector('header .headerLanguageSwitch img.flag-nl').classList.remove("hidden");
            document.querySelector('header .headerLanguageSwitch img.flag-en').classList.add("hidden");
        }
        loadLanguage(currentLanguage);
    });

    const lightSwitch = document.querySelector('.headerLightModeSwitch');

    lightSwitch.addEventListener('click', () => {
        // Toggle language
        currentLight = (currentLight === 'dark') ? 'light' : 'dark';
        loadLight(currentLight);
    });
});

/**
 * Fetch language JSON based on 'lang' param
 * and call updateTexts() to update DOM.
 */
function loadLanguage(lang) {
    fetch(`content-${lang}.json`)
        .then(response => response.json())
        .then(data => {
            updateTexts(data);
        })
        .catch(error => {
            console.error('Error loading language file:', error);
        });
}

function loadLight(mode) {
    if(mode==="dark"){
        document.querySelector('body').classList.remove("light");
        document.querySelector('header .headerLightModeSwitch .day').classList.add("hidden");
        document.querySelector('header .headerLightModeSwitch .night').classList.remove("hidden");
    }
    else {
        document.querySelector('body').classList.add("light");
        document.querySelector('header .headerLightModeSwitch .day').classList.remove("hidden");
        document.querySelector('header .headerLightModeSwitch .night').classList.add("hidden");
    }
}


/**
 * Update the DOM elements with the fetched JSON data.
 */
function updateTexts(data) {
    const langBtnText = document.querySelector('.headerLanguageSwitch p');
    if (langBtnText) {
        langBtnText.textContent = data.headerButtonText;
    }

    const welcomeIntro = document.querySelector('.welcome p');
    if (welcomeIntro) {
        welcomeIntro.textContent = data.welcome.introText;
    }

    const welcomeName = document.querySelector('.welcome h1');
    if (welcomeName) {
        welcomeName.textContent = data.welcome.name;
    }

    const welcomeSubtitle = document.querySelector('.welcome h2');
    if (welcomeSubtitle) {
        welcomeSubtitle.textContent = data.welcome.subtitle;
    }

    const downloadCVBtn = document.querySelector('.welcome .buttons .downloadCV');
    if (downloadCVBtn) {
        downloadCVBtn.textContent = data.welcome.buttons.downloadCV.title;

        // downloadCVBtn.setAttribute('href', data.welcome.buttons.downloadCV.link);
    }

    const contactMeBtn = document.querySelector('.welcome .buttons .contactMe');
    if (contactMeBtn) {
        contactMeBtn.textContent = data.welcome.buttons.contactMe.title;
        // contactMeBtn.setAttribute('href', data.welcome.buttons.contactMe.link);
    }


    const aboutIntro = document.querySelector('.about p');
    if (aboutIntro) {
        aboutIntro.textContent = data.about.sectionIntro;
    }

    const aboutTitle = document.querySelector('.about h3');
    if (aboutTitle) {
        aboutTitle.textContent = data.about.title;
    }

    // Example for multiple cards:
    const aboutCardTitles = document.querySelectorAll('.aboutContentCard h4');
    const aboutCardTexts = document.querySelectorAll('.aboutContentCard h5');
    if (aboutCardTitles && aboutCardTexts) {
        data.about.cards.forEach((card, i) => {
            if (aboutCardTitles[i]) aboutCardTitles[i].textContent = card.cardTitle;
            if (aboutCardTexts[i]) aboutCardTexts[i].textContent = card.cardText;
        });
    }

    // Paragraphs
    const paragraphsContainer = document.querySelector('.aboutContent .paragraphs');

    paragraphsContainer.innerHTML = '';

    data.about.paragraphs.forEach((paragraphText) => {
        // Create a <p> element
        const p = document.createElement('p');
        p.textContent = paragraphText;

        // Append to the container
        paragraphsContainer.appendChild(p);
    });

    // "Contacteer mij" link
    const aboutContactLink = document.querySelector('.aboutContent a[href="#contact"]');
    if (aboutContactLink) {
        aboutContactLink.textContent = data.about.contactLink.title;
        aboutContactLink.setAttribute('href', data.about.contactLink.link);
    }

    // =========================
    // SKILLS SECTION
    // =========================
    const skillsIntro = document.querySelector('.skills p');
    if (skillsIntro) {
        skillsIntro.textContent = data.skills.sectionIntro;
    }
    const skillsTitle = document.querySelector('.skills h3');
    if (skillsTitle) {
        skillsTitle.textContent = data.skills.title;
    }

    // 1) Grab the container
    const skillsContainer = document.querySelector('.skillsContainer');

// 2) Clear old skills
    skillsContainer.innerHTML = '';

// 3) Loop through each skill from the JSON data
    data.skills.skillsList.forEach(skillObj => {
        // Create a wrapper element for this skill
        const skillItem = document.createElement('div');
        skillItem.classList.add('skillsItem');

        // Build the star divs based on skillObj.stars
        const starsHtml = generateStars(skillObj.stars);

        // Insert the entire block of HTML using string concatenation
        // or a template literal. We’ll include the skillObj.svg directly.
        skillItem.innerHTML = `
    ${skillObj.svg}             <!-- The entire <svg> from JSON -->
    <h4>${skillObj.skill}</h4>  <!-- Skill name -->
    <div class="stars">
      ${starsHtml}              <!-- star divs -->
    </div>
  `;

        // Finally, append this skill to our .skillsContainer
        skillsContainer.appendChild(skillItem);
    });

    /**
     * Helper function that returns the HTML for the star divs,
     * e.g. 3 full, 2 empty, or 5 full, etc.
     */
    function generateStars(starCount) {
        let html = '';
        // starCount is from 0..5 presumably
        for (let i = 0; i < 5; i++) {
            // If i < starCount => "full" star, else => empty star
            const starClass = (i < starCount) ? 'star full' : 'star';
            html += `<div class="${starClass}"></div>`;
        }
        return html;
    }

    // =========================
    // CONTACT SECTION
    // =========================
    // e.g.:
    const contactIntro = document.querySelector('.contact p');
    if (contactIntro) {
        contactIntro.textContent = data.contact.sectionIntro;
    }
    const contactTitle = document.querySelector('.contact h3');
    if (contactTitle) {
        contactTitle.textContent = data.contact.title;
    }

    const contactLinkEmail = document.querySelector('.contact .contactLink.email');

    if (contactLinkEmail) {
        const pTitle = contactLinkEmail.querySelector('p.title');
        if (pTitle) {
            pTitle.textContent = data.contact.email.name;
        }

        contactLinkEmail.setAttribute('href', data.contact.email.link);
    }


    const contactLinkPhone = document.querySelector('.contact .contactLink.phone');

    if (contactLinkPhone) {
        const pTitle = contactLinkPhone.querySelector('p.title');
        if (pTitle) {
            pTitle.textContent = data.contact.phone.name;
        }

        contactLinkPhone.setAttribute('href', data.contact.phone.link);
    }

    const contactLinkLinkedin = document.querySelector('.contact .contactLink.email');

    if (contactLinkLinkedin) {
        const pTitle = contactLinkLinkedin.querySelector('p.title');
        if (pTitle) {
            pTitle.textContent = data.contact.linkedin.name;
        }

        contactLinkLinkedin.setAttribute('href', data.contact.linkedin.link);
    }

    // Then update the email, phone, etc. if you want to change text in the anchor or labels

    // =========================
    // FOOTER
    // =========================
    // Example of permalinks or social links
    const footerLinks = document.querySelectorAll('footer .permalinks a');
    if (footerLinks) {
        data.footer.permalinks.forEach((linkData, i) => {
            if (footerLinks[i]) {
                footerLinks[i].textContent = linkData.title;
                footerLinks[i].setAttribute('href', linkData.link);
            }
        });
    }

    // Done updating!
}
