const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const pages = new Map($$("[data-page]").map((page) => [page.dataset.page, page]));
const categorySelect = $("#problem-category");
const issueSelect = $("#specific-issue");
const estimateOutput = $("#estimate-output");
const estimateCost = $("#estimate-cost");
const footerYear = $("#footer-year");
const symptomButtons = $$(".symptom-button");

const money = new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
});

const repairs = Object.freeze({
    "Drivetrain": [
        ["Chain Replacement", 18],
        ["Derailleur Indexing", 25],
        ["Cassette Swap", 35]
    ],
    "Braking": [
        ["Pad Replacement", 20],
        ["Brake Bleed", 45],
        ["Cable Adjustment", 15]
    ],
    "Wheels/Tyres": [
        ["Puncture Repair", 15],
        ["Wheel Truing", 30],
        ["Tyre Replacement", 25]
    ],
    "Steering": [
        ["Headset Adjustment", 20],
        ["Bar Tape Replacement", 25],
        ["Stem Swap", 30]
    ],
    "General Service": [
        ["Basic Service", 35],
        ["Full Service", 60],
        ["Safety Check", 20]
    ]
});

footerYear.textContent = new Date().getFullYear();

let currentPage = "home";
let isBannerCompact = false;

const pageFromHash = () => location.hash.replace("#", "") || "home";

const validPage = (pageName) => pages.has(pageName) ? pageName : "home";

const updateBannerSize = () => {
    const shouldCompact = isBannerCompact ? window.scrollY > 56 : window.scrollY > 120;
    isBannerCompact = shouldCompact;
    document.body.classList.toggle("banner-compact", shouldCompact);
};

const syncUrl = (pageName) => {
    const nextHash = `#${pageName}`;

    if (location.hash !== nextHash) {
        history.pushState({ page: pageName }, "", nextHash);
    }
};

const renderPage = (nextPage) => {
    pages.forEach((page, name) => {
        const isActive = name === nextPage;
        page.classList.toggle("is-active", isActive);
        page.hidden = !isActive;
    });

    currentPage = nextPage;
};

const showPage = (pageName, { updateUrl = true, transition = "default" } = {}) => {
    const nextPage = validPage(pageName);
    const isReturningHome = transition === "home" && nextPage === "home" && currentPage !== "home";

    renderPage(nextPage);

    if (updateUrl) {
        syncUrl(nextPage);
    }

    window.scrollTo({ top: 0, behavior: isReturningHome ? "instant" : "smooth" });
    updateBannerSize();

    if (isReturningHome) {
        const homePage = pages.get("home");
        homePage.classList.remove("home-returning");
        requestAnimationFrame(() => {
            homePage.classList.add("home-returning");
        });
    }
};

const resetEstimate = () => {
    estimateOutput.hidden = true;
    estimateCost.textContent = "Estimated Cost: €0";
};

const populateIssues = () => {
    const issues = repairs[categorySelect.value] || [];
    const options = new DocumentFragment();
    const placeholder = new Option("Choose an issue", "");

    options.append(placeholder);

    for (const [label, price] of issues) {
        const option = new Option(`${label} (${money.format(price)})`, String(price));
        options.append(option);
    }

    issueSelect.replaceChildren(options);
    issueSelect.disabled = issues.length === 0;
    resetEstimate();
};

const selectIssue = (category, issueLabel) => {
    categorySelect.value = category;
    populateIssues();

    const issue = repairs[category]?.find(([label]) => label === issueLabel);

    if (!issue) {
        return;
    }

    issueSelect.value = String(issue[1]);
    updateEstimate();
};

const setActiveSymptom = (selectedButton) => {
    symptomButtons.forEach((button) => {
        button.classList.toggle("is-selected", button === selectedButton);
    });
};

const updateEstimate = () => {
    const price = Number(issueSelect.value);

    if (!categorySelect.value || !price) {
        resetEstimate();
        return;
    }

    estimateCost.textContent = `Estimated Cost: ${money.format(price)}`;
    estimateOutput.hidden = false;
};

document.addEventListener("click", (event) => {
    const symptom = event.target.closest("[data-symptom-category]");

    if (symptom) {
        setActiveSymptom(symptom);
        selectIssue(symptom.dataset.symptomCategory, symptom.dataset.symptomIssue);
        return;
    }

    const trigger = event.target.closest("[data-nav]");

    if (!trigger) {
        return;
    }

    event.preventDefault();
    trigger.blur();
    showPage(trigger.dataset.nav, {
        transition: trigger.classList.contains("banner-home") ? "home" : "default"
    });
});

categorySelect.addEventListener("change", () => {
    setActiveSymptom(null);
    populateIssues();
});
issueSelect.addEventListener("change", () => {
    setActiveSymptom(null);
    updateEstimate();
});

window.addEventListener("popstate", () => {
    showPage(pageFromHash(), { updateUrl: false });
});

window.addEventListener("scroll", updateBannerSize, { passive: true });

showPage(pageFromHash(), { updateUrl: false });
updateBannerSize();
