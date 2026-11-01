// ================================================
// SMARTCV BUILDER 2.0
// Complete application JavaScript
// ================================================

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const STORAGE_KEY = "smartCVBuilder2Data";
    const TEMPLATE_KEY = "smartCVBuilder2Template";

    const form = document.getElementById("cvForm");
    const cvPreview = document.getElementById("cvPreview");
    const templateSelect = document.getElementById("templateSelect");
    const saveButton = document.getElementById("saveButton");
    const clearButton = document.getElementById("clearButton");
    const downloadButton = document.getElementById("downloadButton");
    const formStatus = document.getElementById("formStatus");

    const repeatableSections = {
        education: {
            list: "educationList",
            button: "addEducationButton",
            title: "Qualification",
            fields: [
                ["Qualification", "educationQualification", "text", "e.g. Bachelor of Education"],
                ["Institution", "educationInstitution", "text", "University or college"],
                ["Start Year", "educationStart", "text", "e.g. 2022"],
                ["End Year", "educationEnd", "text", "e.g. 2026 or Present"],
                ["Relevant Details", "educationDetails", "textarea", "Relevant coursework, grades, achievements..."]
            ]
        },

        experience: {
            list: "experienceList",
            button: "addExperienceButton",
            title: "Experience",
            fields: [
                ["Job Title", "experienceTitle", "text", "e.g. Assistant Teacher"],
                ["Employer", "experienceEmployer", "text", "Company or organisation"],
                ["Start Date", "experienceStart", "text", "e.g. Jan 2024"],
                ["End Date", "experienceEnd", "text", "e.g. Present or Dec 2025"],
                ["Responsibilities and Achievements", "experienceDetails", "textarea", "Describe responsibilities and achievements. Use a new line for each point."]
            ]
        },

        certification: {
            list: "certificationList",
            button: "addCertificationButton",
            title: "Certification",
            fields: [
                ["Certificate or Licence", "certificationName", "text", "Certificate name"],
                ["Issuing Organisation", "certificationIssuer", "text", "Issuing organisation"],
                ["Date or Year", "certificationDate", "text", "e.g. 2025"],
                ["Additional Details", "certificationDetails", "textarea", "Optional details or credential information"]
            ]
        },

        project: {
            list: "projectList",
            button: "addProjectButton",
            title: "Project",
            fields: [
                ["Project Name", "projectName", "text", "e.g. Student Management System"],
                ["Role or Technologies", "projectRole", "text", "e.g. Developer | HTML, CSS, JavaScript"],
                ["Project Link", "projectLink", "url", "https://example.com"],
                ["Description and Results", "projectDetails", "textarea", "Describe what you built and the result."]
            ]
        }
    };

    const simpleFields = [
        "fullName",
        "professionalTitle",
        "email",
        "phone",
        "location",
        "linkedin",
        "portfolio",
        "profileType",
        "summary",
        "skills",
        "achievements",
        "volunteerExperience",
        "languages",
        "references"
    ];

    let entryCounter = 0;
    let saveTimer = null;

    // ================================================
    // GENERAL HELPERS
    // ================================================

    function getValue(id) {
        const element = document.getElementById(id);
        return element ? element.value.trim() : "";
    }

    function setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value || "";
        }
    }

    function setStatus(message, isError = false) {
        if (!formStatus) return;

        formStatus.textContent = message;
        formStatus.style.color = isError ? "#d9364f" : "#13865c";
    }

    function createElement(tag, className, text = "") {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== "") {
            element.textContent = text;
        }

        return element;
    }

    function setSectionVisible(id, visible) {
        const section = document.getElementById(id);

        if (section) {
            section.hidden = !visible;
        }
    }

    function splitLines(value) {
        return value
            .split(/\n/)
            .map(item => item.trim())
            .filter(Boolean);
    }

    function splitSkills(value) {
        return value
            .split(/[\n,;]+/)
            .map(skill => skill.trim())
            .filter(Boolean);
    }

    // ================================================
    // CREATE REPEATABLE FORM ENTRIES
    // ================================================

    function addEntry(type, values = {}) {
        const config = repeatableSections[type];

        if (!config) return;

        const list = document.getElementById(config.list);

        if (!list) return;

        entryCounter++;

        const card = createElement("div", "repeat-card");
        card.dataset.entry = type;
        card.dataset.entryId = String(entryCounter);

        const heading = createElement("div", "repeat-card-heading");
        const title = createElement("h4", "", `${config.title} ${list.children.length + 1}`);

        const removeButton = createElement("button", "remove-entry", "Remove");
        removeButton.type = "button";
        removeButton.dataset.remove = "";
        removeButton.setAttribute("aria-label", `Remove ${config.title.toLowerCase()}`);

        heading.append(title, removeButton);

        const grid = createElement("div", "form-grid");

        config.fields.forEach(([labelText, name, inputType, placeholder]) => {
            const group = createElement("div", "form-group");

            if (inputType === "textarea") {
                group.classList.add("full-width");
            }

            const id = `${name}_${entryCounter}`;

            const label = createElement("label", "", labelText);
            label.htmlFor = id;

            let input;

            if (inputType === "textarea") {
                input = document.createElement("textarea");
                input.rows = 3;
            } else {
                input = document.createElement("input");
                input.type = inputType;
            }

            input.id = id;
            input.name = name;
            input.placeholder = placeholder;
            input.value = typeof values[name] === "string" ? values[name] : "";

            group.append(label, input);
            grid.appendChild(group);
        });

        card.append(heading, grid);
        list.appendChild(card);

        updateEntryTitles(type);
        return card;
    }

    function updateEntryTitles(type) {
        const config = repeatableSections[type];
        const list = document.getElementById(config.list);

        if (!list) return;

        Array.from(list.children).forEach((card, index) => {
            const heading = card.querySelector(".repeat-card-heading h4");

            if (heading) {
                heading.textContent = `${config.title} ${index + 1}`;
            }

            const removeButton = card.querySelector("[data-remove]");

            if (removeButton) {
                removeButton.setAttribute(
                    "aria-label",
                    `Remove ${config.title.toLowerCase()} ${index + 1}`
                );
            }
        });
    }

    Object.entries(repeatableSections).forEach(([type, config]) => {
        const button = document.getElementById(config.button);

        if (button) {
            button.addEventListener("click", () => {
                addEntry(type);
                updatePreview();
                scheduleAutosave();
            });
        }
    });

    // ================================================
    // COLLECT REPEATABLE ENTRIES
    // ================================================

    function collectEntries(type) {
        const config = repeatableSections[type];
        const list = document.getElementById(config.list);

        if (!list) return [];

        return Array.from(list.querySelectorAll(".repeat-card")).map(card => {
            const entry = {};

            config.fields.forEach(([, name]) => {
                const field = card.querySelector(`[name="${name}"]`);
                entry[name] = field ? field.value : "";
            });

            return entry;
        });
    }

    // ================================================
    // COLLECT ALL FORM DATA
    // ================================================

    function collectFormData() {
        const data = {};

        simpleFields.forEach(id => {
            const field = document.getElementById(id);

            if (field) {
                data[id] = field.value;
            }
        });

        Object.keys(repeatableSections).forEach(type => {
            data[type] = collectEntries(type);
        });

        data.template = templateSelect ? templateSelect.value : "classic";

        return data;
    }

    // ================================================
    // RESTORE SAVED DATA
    // ================================================

    function restoreFormData(data) {
        simpleFields.forEach(id => {
            const field = document.getElementById(id);

            if (field && typeof data[id] === "string") {
                field.value = data[id];
            }
        });

        Object.entries(repeatableSections).forEach(([type, config]) => {
            const list = document.getElementById(config.list);

            if (!list) return;

            list.replaceChildren();

            const entries = Array.isArray(data[type]) ? data[type] : [];

            entries.forEach(entry => addEntry(type, entry));

            if (entries.length === 0 && (type === "education" || type === "experience")) {
                addEntry(type);
            }
        });

        if (templateSelect && typeof data.template === "string") {
            const optionExists = Array.from(templateSelect.options).some(
                option => option.value === data.template
            );

            if (optionExists) {
                templateSelect.value = data.template;
            }
        }
    }

    // ================================================
    // UPDATE PERSONAL DETAILS
    // ================================================

    function updatePersonalDetails() {
        setText("previewName", getValue("fullName") || "Your Name");
        setText(
            "previewTitle",
            getValue("professionalTitle") || "Your Professional Title"
        );

        const contact = [
            getValue("email"),
            getValue("phone"),
            getValue("location")
        ].filter(Boolean);

        setText("previewContact", contact.join(" | "));

        const links = document.getElementById("previewLinks");

        if (links) {
            links.replaceChildren();

            const linkItems = [
                ["linkedin", getValue("linkedin")],
                ["portfolio", getValue("portfolio")]
            ];

            linkItems.forEach(([type, value]) => {
                if (!value) return;

                try {
                    const url = new URL(value);

                    if (!["http:", "https:"].includes(url.protocol)) return;

                    const link = createElement(
                        "a",
                        "",
                        type === "linkedin" ? "LinkedIn" : "Portfolio"
                    );

                    link.href = url.href;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";

                    if (links.childNodes.length) {
                        links.appendChild(document.createTextNode(" | "));
                    }

                    links.appendChild(link);
                } catch {
                    // Ignore invalid optional URLs.
                }
            });
        }
    }

    // ================================================
    // PROFILE / CAREER OBJECTIVE
    // ================================================

    function updateProfile() {
        const type = getValue("profileType");
        const content = getValue("summary");

        const label = document.getElementById("summaryLabel");
        const heading = document.getElementById("previewProfileHeading");
        const preview = document.getElementById("previewSummary");

        const isObjective = type === "objective";

        if (label) {
            label.textContent = isObjective ? "Career Objective" : "Professional Summary";
        }

        if (heading) {
            heading.textContent = isObjective ? "Career Objective" : "Professional Summary";
        }

        if (preview) {
            preview.textContent = content;
        }

        setSectionVisible("summarySection", Boolean(content));
    }

    // ================================================
    // RENDER MULTIPLE ENTRIES
    // ================================================

    function renderEntries(type, previewId, getHeading, getSubtitle, getDate, getDetails) {
        const target = document.getElementById(previewId);

        if (!target) return;

        target.replaceChildren();

        const entries = collectEntries(type).filter(entry => {
            return Object.values(entry).some(value => String(value || "").trim());
        });

        entries.forEach(entry => {
            const headingText = getHeading(entry);
            const subtitleText = getSubtitle(entry);
            const dateText = getDate(entry);
            const detailsText = getDetails(entry);

            const article = createElement("div", "cv-entry");

            if (headingText || dateText) {
                const heading = createElement("div", "cv-entry-heading");

                if (headingText) {
                    heading.appendChild(createElement("h3", "", headingText));
                }

                if (dateText) {
                    heading.appendChild(createElement("span", "cv-entry-date", dateText));
                }

                article.appendChild(heading);
            }

            if (subtitleText) {
                article.appendChild(
                    createElement("div", "cv-entry-subtitle", subtitleText)
                );
            }

            if (detailsText) {
                article.appendChild(
                    createElement("p", "cv-entry-details", detailsText)
                );
            }

            target.appendChild(article);
        });

        return entries.length;
    }

    function updateEducation() {
        const count = renderEntries(
            "education",
            "previewEducationList",
            entry => entry.educationQualification,
            entry => entry.educationInstitution,
            entry => [entry.educationStart, entry.educationEnd].filter(Boolean).join(" – "),
            entry => entry.educationDetails
        );

        setSectionVisible("educationSection", Boolean(count));
    }

    function updateExperience() {
        const count = renderEntries(
            "experience",
            "previewExperienceList",
            entry => entry.experienceTitle,
            entry => entry.experienceEmployer,
            entry => [entry.experienceStart, entry.experienceEnd].filter(Boolean).join(" – "),
            entry => entry.experienceDetails
        );

        setSectionVisible("experienceSection", Boolean(count));
    }

    function updateCertifications() {
        const count = renderEntries(
            "certification",
            "previewCertificationList",
            entry => entry.certificationName,
            entry => entry.certificationIssuer,
            entry => entry.certificationDate,
            entry => entry.certificationDetails
        );

        setSectionVisible("certificationsSection", Boolean(count));
    }

    function updateProjects() {
        const target = document.getElementById("previewProjectList");

        if (!target) return;

        target.replaceChildren();

        const entries = collectEntries("project").filter(entry =>
            Object.values(entry).some(value => String(value || "").trim())
        );

        entries.forEach(entry => {
            const article = createElement("div", "cv-entry");

            if (entry.projectName) {
                article.appendChild(
                    createElement("div", "cv-entry-heading")
                );

                const heading = article.lastChild;
                heading.appendChild(
                    createElement("h3", "", entry.projectName)
                );
            }

            if (entry.projectRole) {
                article.appendChild(
                    createElement("div", "cv-entry-subtitle", entry.projectRole)
                );
            }

            if (entry.projectDetails) {
                article.appendChild(
                    createElement("p", "cv-entry-details", entry.projectDetails)
                );
            }

            if (entry.projectLink) {
                try {
                    const url = new URL(entry.projectLink);

                    if (["http:", "https:"].includes(url.protocol)) {
                        const link = createElement("a", "", "View Project");
                        link.href = url.href;
                        link.target = "_blank";
                        link.rel = "noopener noreferrer";
                        link.style.fontSize = "11px";

                        article.appendChild(link);
                    }
                } catch {
                    // Ignore invalid optional project links.
                }
            }

            target.appendChild(article);
        });

        setSectionVisible("projectsSection", Boolean(entries.length));
    }

    // ================================================
    // UPDATE SKILLS
    // ================================================

    function updateSkills() {
        const target = document.getElementById("previewSkills");

        if (!target) return;

        target.replaceChildren();

        const skills = splitSkills(getValue("skills"));

        skills.forEach(skill => {
            target.appendChild(createElement("span", "cv-skill", skill));
        });

        target.classList.toggle("cv-skills-list", skills.length > 0);

        setSectionVisible("skillsSection", Boolean(skills.length));
    }

    // ================================================
    // UPDATE SIMPLE TEXT SECTIONS
    // ================================================

    function updateTextSection(fieldId, previewId, sectionId, asList = false) {
        const target = document.getElementById(previewId);

        if (!target) return;

        target.replaceChildren();

        const value = getValue(fieldId);

        if (asList) {
            splitLines(value).forEach(line => {
                target.appendChild(createElement("p", "", line));
            });
        } else if (value) {
            target.appendChild(createElement("p", "", value));
        }

        setSectionVisible(sectionId, Boolean(value));
    }

    // ================================================
    // UPDATE ENTIRE CV PREVIEW
    // ================================================

    function updatePreview() {
        updatePersonalDetails();
        updateProfile();
        updateEducation();
        updateExperience();
        updateCertifications();
        updateProjects();
        updateSkills();

        updateTextSection(
            "achievements",
            "previewAchievements",
            "achievementsSection",
            true
        );

        updateTextSection(
            "volunteerExperience",
            "previewVolunteer",
            "volunteerSection"
        );

        updateTextSection(
            "languages",
            "previewLanguages",
            "languagesSection",
            true
        );

        updateTextSection(
            "references",
            "previewReferences",
            "referencesSection"
        );
    }

    // ================================================
    // TEMPLATE SELECTION
    // ================================================

    function changeTemplate(save = true) {
        if (!cvPreview || !templateSelect) return;

        const selected = ["classic", "modern"].includes(templateSelect.value)
            ? templateSelect.value
            : "classic";

        cvPreview.classList.remove("classic", "modern");
        cvPreview.classList.add(selected);

        if (save) {
            try {
                localStorage.setItem(TEMPLATE_KEY, selected);
            } catch (error) {
                console.warn("Unable to save template preference.", error);
            }

            scheduleAutosave();
        }
    }

    // ================================================
    // SAVE DRAFT
    // ================================================

    function saveCV(showMessage = true) {
        try {
            const data = collectFormData();

            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

            setStatus("Draft saved");

            if (showMessage) {
                alert("Your CV draft has been saved successfully on this device.");
            }

            return true;
        } catch (error) {
            console.error("Unable to save CV:", error);

            setStatus("Save failed", true);

            if (showMessage) {
                alert(
                    "Unable to save your CV. Check your browser storage settings or available storage."
                );
            }

            return false;
        }
    }

    function scheduleAutosave() {
        if (saveTimer) {
            clearTimeout(saveTimer);
        }

        setStatus("Unsaved changes");

        saveTimer = setTimeout(() => {
            saveCV(false);
        }, 700);
    }

    function loadCV() {
        let data = null;

        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved) {
                data = JSON.parse(saved);
            }
        } catch (error) {
            console.error("Unable to load saved CV:", error);
        }

        if (data && typeof data === "object") {
            restoreFormData(data);
        } else {
            Object.keys(repeatableSections).forEach(type => {
                if (type === "education" || type === "experience") {
                    addEntry(type);
                }
            });
        }

        try {
            const savedTemplate = localStorage.getItem(TEMPLATE_KEY);

            if (
                templateSelect &&
                savedTemplate &&
                ["classic", "modern"].includes(savedTemplate)
            ) {
                templateSelect.value = savedTemplate;
            }
        } catch (error) {
            console.warn("Unable to load template preference.", error);
        }

        changeTemplate(false);
        updatePreview();
        setStatus(data ? "Draft restored" : "Ready");
    }

    // ================================================
    // CLEAR FORM AND SAVED DATA
    // ================================================

    function clearCV() {
        const confirmed = confirm(
            "Clear your CV and delete its saved draft from this browser?"
        );

        if (!confirmed) return;

        if (form) {
            form.reset();
        }

        Object.entries(repeatableSections).forEach(([type, config]) => {
            const list = document.getElementById(config.list);

            if (list) {
                list.replaceChildren();
            }

            if (type === "education" || type === "experience") {
                addEntry(type);
            }
        });

        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(TEMPLATE_KEY);
        } catch (error) {
            console.warn("Unable to clear browser storage.", error);
        }

        if (templateSelect) {
            templateSelect.value = "classic";
        }

        changeTemplate(false);
        updatePreview();
        setStatus("Cleared");

        alert("Your CV form and saved draft have been cleared.");
    }

    // ================================================
    // PDF EXPORT
    // ================================================

    function downloadCV() {
        updatePreview();

        if (!getValue("fullName")) {
            alert("Please enter your full name before exporting your CV.");
            document.getElementById("fullName")?.focus();
            return;
        }

        if (form && !form.reportValidity()) {
            return;
        }

        saveCV(false);

        // The browser print dialog allows the user to save the CV as PDF.
        window.print();
    }

    // ================================================
    // EVENT LISTENERS
    // ================================================

    if (form) {
        form.addEventListener("input", event => {
            if (event.target.matches("input, textarea, select")) {
                updatePreview();
                scheduleAutosave();
            }
        });

        form.addEventListener("change", event => {
            if (event.target.matches("input, textarea, select")) {
                updatePreview();
                scheduleAutosave();
            }
        });

        // Event delegation for dynamically added Remove buttons.
        form.addEventListener("click", event => {
            const button = event.target.closest("[data-remove]");

            if (!button) return;

            const card = button.closest(".repeat-card");

            if (!card) return;

            const type = card.dataset.entry;

            card.remove();

            if (
                (type === "education" || type === "experience") &&
                document.getElementById(repeatableSections[type].list)?.children.length === 0
            ) {
                addEntry(type);
            }

            if (repeatableSections[type]) {
                updateEntryTitles(type);
            }

            updatePreview();
            scheduleAutosave();
        });
    }

    if (templateSelect) {
        templateSelect.addEventListener("change", () => {
            changeTemplate();
            updatePreview();
        });
    }

    if (saveButton) {
        saveButton.addEventListener("click", () => saveCV(true));
    }

    if (clearButton) {
        clearButton.addEventListener("click", clearCV);
    }

    if (downloadButton) {
        downloadButton.addEventListener("click", downloadCV);
    }

    // ================================================
    // FOOTER YEAR
    // ================================================

    setText("currentYear", String(new Date().getFullYear()));

    // ================================================
    // START APPLICATION
    // ================================================

    loadCV();
});
// =====================================
// PROFILE PHOTO SUPPORT
// =====================================

const profilePhotoInput = document.getElementById("profilePhoto");
const photoPreview = document.getElementById("photoPreview");
const cvPhoto = document.getElementById("cvPhoto");
const cvPhotoContainer = document.getElementById("cvPhotoContainer");
const removePhotoButton = document.getElementById("removePhotoButton");

let profilePhotoData = "";

function displayProfilePhoto(photoData) {
    profilePhotoData = photoData || "";

    if (profilePhotoData) {
        photoPreview.src = profilePhotoData;
        photoPreview.style.display = "block";

        cvPhoto.src = profilePhotoData;
        cvPhotoContainer.style.display = "block";

        removePhotoButton.style.display = "inline-block";
    } else {
        photoPreview.removeAttribute("src");
        photoPreview.style.display = "none";

        cvPhoto.removeAttribute("src");
        cvPhotoContainer.style.display = "none";

        removePhotoButton.style.display = "none";
    }
}

profilePhotoInput.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select a valid image.");
        this.value = "";
        return;
    }

    // Limit photos to 2 MB.
    if (file.size > 2 * 1024 * 1024) {
        alert("Please select a photo smaller than 2 MB.");
        this.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        displayProfilePhoto(event.target.result);

        try {
            localStorage.setItem("smartCVProfilePhoto", profilePhotoData);
        } catch (error) {
            alert("The photo could not be saved. Try a smaller image.");
        }
    };

    reader.readAsDataURL(file);
});

removePhotoButton.addEventListener("click", function () {
    displayProfilePhoto("");

    profilePhotoInput.value = "";

    localStorage.removeItem("smartCVProfilePhoto");
});


// Restore the saved photo when the page opens.
try {
    const savedPhoto = localStorage.getItem("smartCVProfilePhoto");

    if (savedPhoto) {
        displayProfilePhoto(savedPhoto);
    }
} catch (error) {
    console.warn("Could not restore the saved profile photo.");
}
// ============================================
// SMARTCV BUILDER - CV IMPROVEMENT ASSISTANT
// ============================================

const analyzeCVButton = document.getElementById("analyzeCVButton");
const cvScoreElement = document.getElementById("cvScore");
const cvScoreTitle = document.getElementById("cvScoreTitle");
const cvScoreDescription = document.getElementById("cvScoreDescription");
const cvSuggestions = document.getElementById("cvSuggestions");

if (analyzeCVButton) {
    analyzeCVButton.addEventListener("click", analyzeCV);
}

function analyzeCV() {
    let score = 0;
    const suggestions = [];

    // Helper: get the text entered into a field.
    function getValue(id) {
        const element = document.getElementById(id);
        return element ? element.value.trim() : "";
    }

    // Helper: check whether a dynamic section has content.
    function hasEntryContent(containerId, fieldSelectors) {
        const container = document.getElementById(containerId);

        if (!container) return false;

        const entries = container.children;

        for (const entry of entries) {
            for (const selector of fieldSelectors) {
                const fields = entry.querySelectorAll(selector);

                for (const field of fields) {
                    if (field.value && field.value.trim()) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // 1. Personal information: 20 points
    const fullName = getValue("fullName");
    const professionalTitle = getValue("professionalTitle");
    const email = getValue("email");
    const phone = getValue("phone");
    const location = getValue("location");

    if (fullName) {
        score += 5;
    } else {
        suggestions.push({
            title: "Add your full name",
            text: "Enter your full name so employers can identify you."
        });
    }

    if (professionalTitle) {
        score += 5;
    } else {
        suggestions.push({
            title: "Add a professional title",
            text: "Examples include Graduate Teacher, Software Developer, or Marketing Assistant."
        });
    }

    if (email) {
        score += 4;

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            suggestions.push({
                title: "Check your email address",
                text: "Make sure your email address is written correctly."
            });
        }
    } else {
        suggestions.push({
            title: "Add your email address",
            text: "Provide a professional email address employers can use to contact you."
        });
    }

    if (phone) {
        score += 3;
    } else {
        suggestions.push({
            title: "Add your phone number",
            text: "Include a reliable phone number for interview invitations."
        });
    }

    if (location) {
        score += 3;
    } else {
        suggestions.push({
            title: "Add your location",
            text: "Include your town or city. You do not need to provide your full home address."
        });
    }

    // 2. Professional summary or objective: 15 points
    const summary = getValue("summary");

    if (summary.length >= 100) {
        score += 15;
    } else if (summary.length >= 40) {
        score += 10;

        suggestions.push({
            title: "Strengthen your professional summary",
            text: "Add more detail about your qualifications, relevant skills, and the value you can bring to an employer."
        });
    } else if (summary.length > 0) {
        score += 5;

        suggestions.push({
            title: "Expand your professional summary",
            text: "Write a more informative summary describing your background, strengths, and career goals."
        });
    } else {
        suggestions.push({
            title: "Write a professional summary",
            text: "Add a short introduction highlighting your qualifications, strongest skills, and career objective."
        });
    }

    // 3. Education: 15 points
    const hasEducation = hasEntryContent("educationList", [
        "input",
        "textarea",
        "select"
    ]);

    if (hasEducation) {
        score += 15;
    } else {
        suggestions.push({
            title: "Add your education",
            text: "Include your qualification, institution, dates, and relevant academic achievements."
        });
    }

    // 4. Work experience: 15 points
    const hasExperience = hasEntryContent("experienceList", [
        "input",
        "textarea",
        "select"
    ]);

    if (hasExperience) {
        score += 15;
    } else {
        suggestions.push({
            title: "Consider adding experience",
            text: "Include relevant employment, internships, teaching practice, volunteering, or practical experience. If you have no work experience, highlight projects and transferable skills instead."
        });
    }

    // 5. Skills: 15 points
    const skills = getValue("skills");
    const skillItems = skills
        .split(/[,;\n]/)
        .map(skill => skill.trim())
        .filter(Boolean);

    if (skillItems.length >= 5) {
        score += 15;
    } else if (skillItems.length >= 3) {
        score += 10;

        suggestions.push({
            title: "Add more relevant skills",
            text: "Consider including at least five relevant skills, provided you genuinely possess them."
        });
    } else if (skillItems.length > 0) {
        score += 5;

        suggestions.push({
            title: "Expand your skills section",
            text: "Add more relevant technical, communication, organizational, or role-specific skills."
        });
    } else {
        suggestions.push({
            title: "Add your skills",
            text: "List the skills most relevant to the position you want."
        });
    }

    // 6. Certifications: 5 points
    const hasCertifications = hasEntryContent("certificationList", [
        "input",
        "textarea"
    ]);

    if (hasCertifications) {
        score += 5;
    } else {
        suggestions.push({
            title: "Consider adding certifications",
            text: "Include relevant certificates or professional training if you have any. This section is optional if you have none."
        });
    }

    // 7. Projects: 5 points
    const hasProjects = hasEntryContent("projectList", [
        "input",
        "textarea"
    ]);

    if (hasProjects) {
        score += 5;
    } else {
        suggestions.push({
            title: "Showcase relevant projects",
            text: "Consider adding academic, personal, technical, or community projects that demonstrate your abilities."
        });
    }

    // 8. Achievements: 5 points
    const achievements = getValue("achievements");

    if (achievements) {
        score += 5;
    } else {
        suggestions.push({
            title: "Highlight your achievements",
            text: "Add relevant awards, academic accomplishments, leadership roles, or measurable results if you have them."
        });
    }

    // Keep the score within 0–100.
    score = Math.min(100, Math.max(0, score));

    // Display the score.
    cvScoreElement.textContent = score;

    if (score >= 85) {
        cvScoreTitle.textContent = "Excellent progress! 🌟";
        cvScoreDescription.textContent =
            "Your CV covers many important areas. Review the suggestions below for final improvements.";
    } else if (score >= 65) {
        cvScoreTitle.textContent = "Good progress! 👍";
        cvScoreDescription.textContent =
            "Your CV has a good foundation. Address the suggestions below to strengthen it.";
    } else if (score >= 40) {
        cvScoreTitle.textContent = "Your CV needs improvement";
        cvScoreDescription.textContent =
            "You have started well. Complete the missing sections to make your CV more informative.";
    } else {
        cvScoreTitle.textContent = "Let's build a stronger CV";
        cvScoreDescription.textContent =
            "Several important details are missing. Follow the suggestions below to improve your CV.";
    }

    // Display suggestions safely.
    cvSuggestions.replaceChildren();

    if (suggestions.length === 0) {
        const successMessage = document.createElement("p");
        successMessage.textContent =
            "Excellent! Your CV includes the main sections checked by this analyzer. Review the content for accuracy and tailor it to each job application.";
        cvSuggestions.appendChild(successMessage);
    } else {
        const heading = document.createElement("h3");
        heading.textContent = "Recommended Improvements";
        cvSuggestions.appendChild(heading);

        const list = document.createElement("ul");

        suggestions.forEach(suggestion => {
            const item = document.createElement("li");

            const title = document.createElement("strong");
            title.textContent = suggestion.title;

            const description = document.createElement("p");
            description.textContent = suggestion.text;

            item.appendChild(title);
            item.appendChild(description);
            list.appendChild(item);
        });

        cvSuggestions.appendChild(list);
    }

    // Scroll to the results.
    document.getElementById("cvAssistant").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

