// i18n.js - Internationalization script for FocusHue

const translations = {};
let currentLanguage = 'pt'; // Default language

/**
 * Fetches the translation file for a given language.
 * @param {string} lang - The language code (e.g., 'en', 'es', 'pt').
 * @returns {Promise<void>}
 */
async function fetchTranslations(lang) {
    if (translations[lang]) {
        return; // Already loaded
    }
    try {
        const response = await fetch(`translations/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Could not load ${lang}.json`);
        }
        translations[lang] = await response.json();
    } catch (error) {
        console.error("Error fetching translation file:", error);
        // Fallback to Portuguese if the requested language fails
        if (lang !== 'pt') {
            await fetchTranslations('pt');
        }
    }
}

/**
 * Translates the page content based on the currently loaded language.
 */
function translatePage() {
    const lang = currentLanguage;
    if (!translations[lang]) {
        console.warn(`Translations for '${lang}' not loaded.`);
        return;
    }

    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang][key]) {
            // Handle different types of elements
            if (element.placeholder !== undefined) {
                element.placeholder = translations[lang][key];
            } else if (element.tagName === 'BUTTON' || element.tagName === 'A' || element.tagName === 'SPAN' || element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'P' || element.tagName === 'LI' || element.tagName === 'LABEL' || element.tagName === 'DIV' || element.tagName === 'TITLE') {
                element.textContent = translations[lang][key];
            } else {
                element.innerHTML = translations[lang][key];
            }
        } else {
            console.warn(`Translation key '${key}' not found for language '${lang}'.`);
        }
    });

    // Set the lang attribute of the html tag
    document.documentElement.lang = lang;
}

/**
 * Saves the user's language preference to Firestore.
 * @param {string} lang - The selected language.
 */
async function saveLanguagePreference(lang) {
    const user = firebase.auth().currentUser;
    if (user && db) {
        try {
            const configRef = db.collection("users").doc(user.uid).collection("config").doc("preferencias");
            await configRef.set({ idioma: lang }, { merge: true });
            console.log(`Language preference '${lang}' saved to Firestore.`);
        } catch (error) {
            console.error("Error saving language preference:", error);
        }
    }
}

/**
 * Sets the application language, fetches translations, and updates the page.
 * @param {string} lang - The language to set.
 */
async function setLanguage(lang) {
    if (!['pt', 'en', 'es'].includes(lang)) {
        console.warn(`Unsupported language '${lang}'. Defaulting to 'pt'.`);
        lang = 'pt';
    }

    currentLanguage = lang;
    localStorage.setItem('language', lang);
    await saveLanguagePreference(lang);

    await fetchTranslations(lang);
    translatePage();
}

/**
 * Initializes the internationalization, determining which language to use.
 */
async function initI18n() {
    // Priority: Firestore (for logged-in users) > localStorage > browser default

    firebase.auth().onAuthStateChanged(async (user) => {
        let preferredLanguage = 'pt'; // Default

        if (user && db) {
            try {
                const configRef = db.collection("users").doc(user.uid).collection("config").doc("preferencias");
                const doc = await configRef.get();
                if (doc.exists && doc.data().idioma) {
                    preferredLanguage = doc.data().idioma;
                    console.log(`Language loaded from Firestore: ${preferredLanguage}`);
                } else {
                    // Fallback to localStorage or browser language if not in Firestore
                    const savedLang = localStorage.getItem('language');
                    const browserLang = navigator.language.split('-')[0];
                    preferredLanguage = savedLang || (['en', 'es'].includes(browserLang) ? browserLang : 'pt');
                }
            } catch (error) {
                console.error("Error loading language from Firestore, falling back.", error);
                const savedLang = localStorage.getItem('language');
                const browserLang = navigator.language.split('-')[0];
                preferredLanguage = savedLang || (['en', 'es'].includes(browserLang) ? browserLang : 'pt');
            }
        } else {
            // User is not logged in, use localStorage or browser language
            const savedLang = localStorage.getItem('language');
            const browserLang = navigator.language.split('-')[0];
            preferredLanguage = savedLang || (['en', 'es'].includes(browserLang) ? browserLang : 'pt');
        }

        await setLanguage(preferredLanguage);
    });
}

// Initialize the script
initI18n();
