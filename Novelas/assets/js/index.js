const transcript = document.getElementById("transcript");
const synth = window.speechSynthesis;
const SETTINGS_KEY = "novelTtsSettings";
const POSITION_KEY = "novelTtsPosition";

const DEFAULT_SETTINGS = {
    voiceURI: "",
    rate: 1,
    pitch: 1,
    volume: 1,
    // UI preferences
    theme: "default-dark",
    fontFamily: "sans-serif",
    fontSize: 1.45,
    lineHeight: "normal",
    textAlign: "left",
    textBrightness: 100,
    maxWidth: "normal"
};

const share_link = "https://dl.dropboxusercontent.com/s/8ndtu5xb7gr6j2p/index.html?dl=0"

let voices = [];
let chapters = [];
let blocks = [];
let chapterClickTimers = [];
let settings = { ...DEFAULT_SETTINGS };
let currentIndex = 0;
let isPaused = false;
let isStopped = true;
let isCollapsed = false;
let isSettingsOpen = false;
let isChaptersOpen = false;
let shouldContinue = false;
let activeUtterance = null;
let isMobile = false;

let voiceSelect;
let rateInput;
let pitchInput;
let volumeInput;
let statusText;
let progressBar;
let playPauseButton;
let container;
let player;
let chaptersPanel;
let settingsPanel;

// UI preferences elements
let themeSelect;
let fontFamilySelect;
let lineHeightSelect;
let textAlignSelect;
let maxWidthSelect;

function setupApp() {
    if (!transcript || !synth) {
        return;
    }

    transcript.classList.add("chapter-page__content");
    buildChapterSections();
    blocks = [...transcript.querySelectorAll(".chapter-block h1, .chapter-block h2, .chapter-block h3, .chapter-block h4, .chapter-block h5, .chapter-block h6, .chapter-block p")];
    blocks.forEach((block, index) => {
        block.dataset.ttsIndex = String(index);
        block.addEventListener("dblclick", () => jumpToBlock(index, true));
    });

    container = document.createElement("div");
    container.className = "tts-container";

    player = createPlayer();
    chaptersPanel = createChaptersPanel();
    settingsPanel = createSettingsPanel();

    container.append(chaptersPanel);
    container.append(settingsPanel);
    container.append(player);
    document.body.append(container);
    loadSettings();
    loadVoices();
    applySettingsToControls();
    applyUiPreferences();
    updateLabels();
    loadPosition();
    updateProgress();
    updateChapterLabel();
    highlightCurrentBlock(false);
    isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
}

function buildChapterSections() {
    const children = [...transcript.children];
    const fragment = document.createDocumentFragment();
    let activeChapter = null;

    children.forEach((child) => {
        if (
            child.tagName === "H1" ||
            child.tagName === "H2" ||
            child.tagName === "H3" ||
            child.tagName === "H4" ||
            child.tagName === "H5" ||
            child.tagName === "H6"
        ) {
            activeChapter = document.createElement("section");
            activeChapter.className = "chapter-block";
            activeChapter.id = `chapter-${chapters.length + 1}`;
            chapters.push({ title: child.textContent.trim(), element: activeChapter });
            fragment.append(activeChapter);
        }

        if (!activeChapter) {
            activeChapter = document.createElement("section");
            activeChapter.className = "chapter-block";
            activeChapter.id = "chapter-1";
            chapters.push({ title: "Chapter 1", element: activeChapter });
            fragment.append(activeChapter);
        }

        activeChapter.append(child);
    });

    transcript.replaceChildren(fragment);
}

function createPlayer() {
    const section = document.createElement("section");
    section.className = "tts-player";
    section.setAttribute("aria-label", "Text to speech player");
    section.innerHTML = `
        <div class="tts-player__main">
            <div class="tts-player__meta">
                <div id="tts-status">
                    <span class="material-symbols-rounded">volume_up</span>
                    <span class="status-message">Ready</span>
                </div>
            </div>

            <div class="tts-controls" aria-label="Playback controls">
                <button class="button button--icon" id="tts-prev" type="button" title="Previous paragraph">
                    <span class="material-symbols-rounded">skip_previous</span>
                </button>
                <button class="button button--primary button--icon" id="tts-play-pause" type="button" aria-label="Play">
                    <span class="material-symbols-rounded">play_arrow</span>
                </button>
                <button class="button button--icon" id="tts-stop" type="button" title="Stop">
                    <span class="material-symbols-rounded">stop</span>
                </button>
                <button class="button button--icon" id="tts-next" type="button" title="Next paragraph">
                    <span class="material-symbols-rounded">skip_next</span>
                </button>
                <button class="button button--icon" id="tts-chapters-toggle" type="button" title="Chapters">
                    <span class="material-symbols-rounded">menu_book</span>
                </button>
                <button class="button button--icon" id="tts-settings-toggle" type="button" title="Settings">
                    <span class="material-symbols-rounded">settings</span>
                </button>
                <button class="button button--icon" id="tts-hide" type="button" title="Hide player">
                    <span class="material-symbols-rounded">expand_more</span>
                </button>
            </div>
        </div>

        <div class="progress" aria-label="Reading progress">
            <div class="progress__bar" id="tts-progress"></div>
        </div>
    `;

    statusText = section.querySelector("#tts-status .status-message");
    progressBar = section.querySelector("#tts-progress");
    playPauseButton = section.querySelector("#tts-play-pause");

    playPauseButton.addEventListener("click", togglePlayPause);
    section.querySelector("#tts-stop").addEventListener("click", stop);
    section.querySelector("#tts-prev").addEventListener("click", () => moveBy(-1));
    section.querySelector("#tts-next").addEventListener("click", () => moveBy(1));
    section.querySelector("#tts-chapters-toggle").addEventListener("click", toggleChapters);
    section.querySelector("#tts-settings-toggle").addEventListener("click", toggleSettings);
    section.querySelector("#tts-hide").addEventListener("click", togglePlayer);

    return section;
}

function createChaptersPanel() {
    const panel = document.createElement("aside");
    panel.className = "chapters-panel";
    panel.setAttribute("aria-label", "Chapter navigation");
    panel.innerHTML = `
        <div class="panel-header">
            <h2>Chapters</h2>
            <button class="button panel-header-button button--compact button--icon-only" id="tts-chapters-close" type="button" title="Close">
                <span class="material-symbols-rounded">close</span>
            </button>
        </div>
        <div class="chapters-list"></div>
    `;

    const list = panel.querySelector(".chapters-list");

    chapters.forEach((chapter, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = chapter.title;
        button.title = chapter.title;
        button.addEventListener("click", () => {
            chapterClickTimers[index] = window.setTimeout(() => scrollToChapter(index), 220);
        });
        button.addEventListener("dblclick", () => {
            window.clearTimeout(chapterClickTimers[index]);
            jumpToChapter(index, true);
        });
        list.append(button);
    });

    panel.querySelector("#tts-chapters-close").addEventListener("click", toggleChapters);
    chaptersPanel = panel;
    return panel;
}

function createSettingsPanel() {
    const panel = document.createElement("aside");
    panel.className = "settings-panel";
    panel.setAttribute("aria-label", "TTS and UI preferences");
    panel.innerHTML = `
        <div class="panel-header">
            <h2>Settings</h2>
            <button class="button panel-header-button button--compact button--icon-only" id="tts-settings-close" type="button" title="Close">
                <span class="material-symbols-rounded">close</span>
            </button>
        </div>
        <div class="settings-sections">
            <div class="settings-section">
                <h3 class="settings-section-title">TTS Preferences</h3>
                <div class="settings-grid settings-grid--tts">
                    <div class="field">
                        <span>Voice</span>
                        <select id="tts-voice"></select>
                    </div>
                    <div class="field">
                        <span>Rate <strong id="rate-value">1.00x</strong></span>
                        <input id="tts-rate" type="range" min="0.5" max="2" step="0.005" value="1">
                    </div>
                    <div class="field">
                        <span>Pitch <strong id="pitch-value">1.00</strong></span>
                        <input id="tts-pitch" type="range" min="0" max="2" step="0.05" value="1">
                    </div>
                    <div class="field">
                        <span>Volume <strong id="volume-value">100%</strong></span>
                        <input id="tts-volume" type="range" min="0" max="1" step="0.05" value="1">
                    </div>
                </div>
            </div>

            <div class="settings-section">
                <h3 class="settings-section-title">UI Preferences</h3>
                <div class="settings-grid settings-grid--ui">
                    <div class="field">
                        <span>Theme</span>
                        <select id="ui-theme">
                            <option value="default-dark">Default Dark</option>
                            <option value="light-warm">Warm Paper</option>
                            <option value="midnight-dark">Midnight Dark</option>
                            <option value="solarized-dark">Solarized Dark</option>
                            <option value="high-contrast">High Contrast</option>
                        </select>
                    </div>
                    <div class="field">
                        <span>Font Family</span>
                        <select id="ui-font-family">
                            <option value="sans-serif">Sans-Serif</option>
                            <option value="serif">Serif (Warm Book)</option>
                            <option value="monospace">Monospace</option>
                            <option value="dyslexic">Dyslexic Friendly</option>
                        </select>
                    </div>
                    <div class="field">
                        <span>Font Size <strong id="font-size-value">1.45rem</strong></span>
                        <div class="font-size-controls">
                            <button class="button button--compact font-size-btn" id="font-size-dec" type="button" title="Make text smaller">
                                <span class="material-symbols-rounded">text_decrease</span>
                            </button>
                            <button class="button button--compact font-size-btn" id="font-size-inc" type="button" title="Make text bigger">
                                <span class="material-symbols-rounded">text_increase</span>
                            </button>
                        </div>
                    </div>
                    <div class="field">
                        <span>Line Spacing</span>
                        <select id="ui-line-height">
                            <option value="tight">Tight</option>
                            <option value="normal">Normal</option>
                            <option value="loose">Loose</option>
                        </select>
                    </div>
                    <div class="field">
                        <span>Alignment</span>
                        <select id="ui-text-align">
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                            <option value="justify">Justified</option>
                        </select>
                    </div>
                    <div class="field">
                        <span>Reading Width</span>
                        <select id="ui-max-width">
                            <option value="narrow">Narrow</option>
                            <option value="normal">Normal</option>
                            <option value="wide">Wide</option>
                        </select>
                    </div>
                    <div class="field">
                        <span>Text Brightness <strong id="brightness-value">100%</strong></span>
                        <input id="ui-text-brightness" type="range" min="0" max="200" step="1" value="100">
                    </div>
                </div>
            </div>
        </div>
    `;

    voiceSelect = panel.querySelector("#tts-voice");
    rateInput = panel.querySelector("#tts-rate");
    pitchInput = panel.querySelector("#tts-pitch");
    volumeInput = panel.querySelector("#tts-volume");
    
    // UI preferences selectors
    themeSelect = panel.querySelector("#ui-theme");
    fontFamilySelect = panel.querySelector("#ui-font-family");
    lineHeightSelect = panel.querySelector("#ui-line-height");
    textAlignSelect = panel.querySelector("#ui-text-align");
    maxWidthSelect = panel.querySelector("#ui-max-width");
    textBrightness = panel.querySelector("#ui-text-brightness");

    panel.querySelector("#tts-settings-close").addEventListener("click", toggleSettings);

    voiceSelect.addEventListener("change", () => {
        settings.voiceURI = getSelectedVoice()?.voiceURI || "";
        saveSettings();
    });

    [rateInput, pitchInput, volumeInput, textBrightness].forEach((input) => {
        input.addEventListener("input", () => {
            settings.rate = Number(rateInput.value);
            settings.pitch = Number(pitchInput.value);
            settings.volume = Number(volumeInput.value);
            settings.textBrightness = Number(textBrightness.value);
            updateLabels();
            if(input.id == "ui-text-brightness") applyUiPreferences();
            saveSettings();
        });
    });

    // Event listeners for UI preference selections
    themeSelect.addEventListener("change", () => {
        settings.theme = themeSelect.value;
        applyUiPreferences();
        saveSettings();
    });

    fontFamilySelect.addEventListener("change", () => {
        settings.fontFamily = fontFamilySelect.value;
        applyUiPreferences();
        saveSettings();
    });

    // Event listeners for Font Size buttons
    const fontSizeDecBtn = panel.querySelector("#font-size-dec");
    const fontSizeIncBtn = panel.querySelector("#font-size-inc");

    fontSizeDecBtn.addEventListener("click", () => {
        settings.fontSize = Math.max(0.5, settings.fontSize - 0.05);
        applyUiPreferences();
        updateFontSizeLabel();
        saveSettings();
    });

    fontSizeIncBtn.addEventListener("click", () => {
        settings.fontSize = settings.fontSize + 0.05;
        applyUiPreferences();
        updateFontSizeLabel();
        saveSettings();
    });

    lineHeightSelect.addEventListener("change", () => {
        settings.lineHeight = lineHeightSelect.value;
        applyUiPreferences();
        saveSettings();
    });

    textAlignSelect.addEventListener("change", () => {
        settings.textAlign = textAlignSelect.value;
        applyUiPreferences();
        saveSettings();
    });

    maxWidthSelect.addEventListener("change", () => {
        settings.maxWidth = maxWidthSelect.value;
        applyUiPreferences();
        saveSettings();
    });

    settingsPanel = panel;
    return panel;
}

function loadVoices() {
    voices = synth.getVoices();
    voiceSelect.innerHTML = "";

    if (voices.length === 0) {
        voiceSelect.append(new Option("Default browser voice", ""));
        return;
    }

    const sortedVoices = [...voices].sort((a, b) =>
        a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name)
    );

    let currentLang = "";
    let group;

    sortedVoices.forEach((voice, index) => {
        if (voice.lang !== currentLang) {
            currentLang = voice.lang;
            group = document.createElement("optgroup");
            group.label = currentLang;
            voiceSelect.appendChild(group);
        }

        group.appendChild(
            new Option(
                voice.name,
                voice.voiceURI || String(index)
            )
        );
    });

    applySettingsToControls();
}

function cancelSpeech() {
    if (activeUtterance) {
        activeUtterance.onstart = null;
        activeUtterance.onend = null;
        activeUtterance.onerror = null;
        activeUtterance = null;
    }
    synth.cancel();
}

function createUtterance(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = getSelectedVoice();

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    utterance.onstart = () => {
        isStopped = false;
        setStatus("Reading");
        updatePlayPauseButton();
        highlightCurrentBlock(true);
    };
    utterance.onend = () => {
        if (isStopped || !shouldContinue) {
            return;
        }

        currentIndex += 1;
        savePosition();

        if (currentIndex < blocks.length) {
            speakCurrentBlock();
            return;
        }

        shouldContinue = false;
        setStatus("Finished");
        updateProgress(100);
        updatePlayPauseButton();
    };
    utterance.onerror = () => {
        setStatus("Speech error");
        isStopped = true;
        shouldContinue = false;
        updatePlayPauseButton();
    };

    return utterance;
}

function togglePlayPause() {
    if (synth.speaking && !synth.paused) {
        pause();
        return;
    }

    play();
}

function play() {
    if (synth.paused) {
        synth.resume();
        shouldContinue = true;
        setStatus("Reading");
        updatePlayPauseButton();
        return;
    }

    if (blocks.length === 0) {
        setStatus("No transcript");
        return;
    }

    cancelSpeech();
    isStopped = false;
    shouldContinue = true;
    currentIndex = Math.min(currentIndex, blocks.length - 1);
    speakCurrentBlock();
}

function speakCurrentBlock() {
    const block = blocks[currentIndex];

    if (!block) {
        setStatus("Ready");
        return;
    }

    updateProgress();
    updateChapterLabel();
    highlightCurrentBlock(true);
    activeUtterance = createUtterance(block.textContent.trim());
    synth.speak(activeUtterance);
}

function pause() {
    if (synth.speaking) {
        if (isMobile) {
            cancelSpeech();
        } else {
            synth.pause();
        }
        setStatus("Paused");
        updatePlayPauseButton();
    }
}

function stop() {
    isStopped = true;
    shouldContinue = false;
    cancelSpeech();
    setStatus("Stopped");
    updateProgress();
    highlightCurrentBlock(false);
    updateChapterLabel();
    updatePlayPauseButton();
}

function moveBy(offset) {
    const isPlaying = synth.speaking && !synth.paused && !isStopped;
    jumpToBlock(Math.max(0, Math.min(blocks.length - 1, currentIndex + offset)), isPlaying);
}

function jumpToBlock(index, startReading) {
    isStopped = true;
    shouldContinue = false;
    cancelSpeech();
    currentIndex = Math.max(0, Math.min(blocks.length - 1, index));
    savePosition();
    updateProgress();
    updateChapterLabel();
    highlightCurrentBlock(true);
    setStatus(startReading ? "Reading" : "Ready");
    updatePlayPauseButton();

    if (startReading) {
        isStopped = false;
        shouldContinue = true;
        speakCurrentBlock();
    }
}

function jumpToChapter(chapterIndex, startReading) {
    const chapter = chapters[chapterIndex];
    const firstBlock = chapter?.element.querySelector("h1, h2, h3, h4, h5, h6, p"); //"h4, p"

    if (!firstBlock) {
        return;
    }

    jumpToBlock(Number(firstBlock.dataset.ttsIndex), startReading);
}

function scrollToChapter(chapterIndex) {
    chapters[chapterIndex]?.element.scrollIntoView({ behavior: "smooth", block: "start" });
}

function highlightCurrentBlock(shouldScroll) {
    blocks.forEach((block, index) => {
        block.classList.toggle("active-transcript", index === currentIndex);
        block.classList.toggle("tts-highlight", index === currentIndex);
    });

    if (shouldScroll) {
        const elementPosition = blocks[currentIndex]?.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - 150;

        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
        });
        // blocks[currentIndex]?.scrollIntoView({ behavior: "smooth" });
    }
}

// Helper to determine the chapter of the current block
function getCurrentChapterIndex() {
    const currentBlock = blocks[currentIndex];
    const chapterElement = currentBlock?.closest(".chapter-block");
    return Math.max(0, chapters.findIndex((chapter) => chapter.element === chapterElement));
}

function updateChapterLabel() {
    const chapterIndex = getCurrentChapterIndex();
    chaptersPanel?.querySelectorAll(".chapters-list button").forEach((button, index) => {
        button.classList.toggle("is-active", index === chapterIndex);
    });
}

function updateProgress(forcedValue) {
    const progress = forcedValue ?? getChapterProgress();
    progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
}

function getChapterProgress() {
    const chapterIndex = getCurrentChapterIndex();
    const chapterBlocks = [...chapters[chapterIndex]?.element.querySelectorAll("*") || []];
    const localIndex = chapterBlocks.findIndex((block) => Number(block.dataset.ttsIndex) === currentIndex);

    if (chapterBlocks.length <= 1 || localIndex < 0) {
        return 0;
    }

    return localIndex / (chapterBlocks.length - 1) * 100;
}

function updateLabels() {
    document.getElementById("rate-value").textContent = `${settings.rate.toFixed(3)}x`;
    document.getElementById("pitch-value").textContent = settings.pitch.toFixed(2);
    document.getElementById("volume-value").textContent = `${Math.round(settings.volume * 100)}%`;
    document.getElementById("brightness-value").textContent = `${settings.textBrightness}%`;
}

function setStatus(message) {
    statusText.textContent = message;
    isPaused = false;
    const icon = document.querySelector("#tts-status .material-symbols-rounded");
    icon.classList.remove("animate");
    if (icon) {
        if (message === "Reading") {
            icon.classList.add("animate");
            icon.textContent = "graphic_eq";
        } else if (message === "Paused") {
            isPaused = true;
            icon.textContent = "pause";
        } else if (message === "Stopped" || message === "Ready") {
            icon.textContent = "volume_up";
        } else if (message === "Finished") {
            icon.textContent = "check_circle";
        } else if (message === "Speech error") {
            icon.textContent = "error";
        }
    }
}

function getSelectedVoice() {
    return voices.find((voice) => voice.voiceURI === voiceSelect.value) || voices[0];
}

function loadSettings() {
    try {
        settings = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
    } catch {
        settings = { ...DEFAULT_SETTINGS };
    }

    settings.rate = clampNumber(settings.rate, 0.5, 2, DEFAULT_SETTINGS.rate);
    settings.pitch = clampNumber(settings.pitch, 0, 2, DEFAULT_SETTINGS.pitch);
    settings.volume = clampNumber(settings.volume, 0, 1, DEFAULT_SETTINGS.volume);

    // Fallbacks for UI preferences
    settings.theme = settings.theme || DEFAULT_SETTINGS.theme;
    settings.fontFamily = settings.fontFamily || DEFAULT_SETTINGS.fontFamily;
    
    if (typeof settings.fontSize === "string") {
        const mapping = {
            "small": 1.15,
            "medium": 1.45,
            "large": 1.85,
            "xlarge": 2.3
        };
        settings.fontSize = mapping[settings.fontSize] || 1.45;
    } else if (typeof settings.fontSize !== "number") {
        settings.fontSize = DEFAULT_SETTINGS.fontSize;
    }

    settings.lineHeight = settings.lineHeight || DEFAULT_SETTINGS.lineHeight;
    settings.textAlign = settings.textAlign || DEFAULT_SETTINGS.textAlign;
    settings.maxWidth = settings.maxWidth || DEFAULT_SETTINGS.maxWidth;
}

function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applySettingsToControls() {
    if (!voiceSelect || !rateInput || !pitchInput || !volumeInput) {
        return;
    }

    const hasSavedVoice = [...voiceSelect.options].some((option) => option.value === settings.voiceURI);
    if (settings.voiceURI && hasSavedVoice) {
        voiceSelect.value = settings.voiceURI;
    } else if (voiceSelect.options.length > 0) {
        voiceSelect.selectedIndex = 0;
        settings.voiceURI = getSelectedVoice()?.voiceURI || "";
        saveSettings();
    }

    rateInput.value = settings.rate;
    pitchInput.value = settings.pitch;
    volumeInput.value = settings.volume;

    // Apply saved UI settings to control values
    if (themeSelect) themeSelect.value = settings.theme;
    if (fontFamilySelect) fontFamilySelect.value = settings.fontFamily;
    if (lineHeightSelect) lineHeightSelect.value = settings.lineHeight;
    if (textAlignSelect) textAlignSelect.value = settings.textAlign;
    if (maxWidthSelect) maxWidthSelect.value = settings.maxWidth;
    updateFontSizeLabel();
}

function updateFontSizeLabel() {
    const label = document.getElementById("font-size-value");
    if (label) {
        label.textContent = `${settings.fontSize.toFixed(2)}rem`;
    }
}

function applyUiPreferences() {
    document.documentElement.setAttribute("data-theme", settings.theme || "default-dark");
    document.documentElement.setAttribute("data-font-family", settings.fontFamily || "sans-serif");
    document.documentElement.setAttribute("data-line-height", settings.lineHeight || "normal");
    document.documentElement.setAttribute("data-text-align", settings.textAlign || "left");
    document.documentElement.setAttribute("data-max-width", settings.maxWidth || "normal");
    
    let size = settings.fontSize;
    if (typeof size === "string") {
        const mapping = {
            "small": 1.15,
            "medium": 1.45,
            "large": 1.85,
            "xlarge": 2.3
        };
        size = mapping[size] || 1.45;
        settings.fontSize = size;
    }
    document.documentElement.style.setProperty("--user-font-size", `${size}rem`);
    document.documentElement.style.setProperty("--user-text-brightness", `${settings.textBrightness}%`);
}

function savePosition() {
    if (blocks.length === 0) return;
    const currentBlock = blocks[currentIndex];
    const chapterElement = currentBlock?.closest(".chapter-block");
    const chapterTitle = chapterElement?.querySelector("h1, h2, h3, h4, h5, h6, p")?.textContent.trim() || "";
    localStorage.setItem(POSITION_KEY, JSON.stringify({
        currentIndex: currentIndex,
        chapterTitle: chapterTitle
    }));
}

function loadPosition() {
    try {
        const saved = JSON.parse(localStorage.getItem(POSITION_KEY) || "null");
        if (saved && typeof saved.currentIndex === "number") {
            const index = saved.currentIndex;
            if (index >= 0 && index < blocks.length) {
                const block = blocks[index];
                const chapterElement = block?.closest(".chapter-block");
                const currentChapterTitle = chapterElement?.querySelector("h1, h2, h3, h4, h5, h6, p")?.textContent.trim() || "";
                if (currentChapterTitle === saved.chapterTitle) {
                    currentIndex = index;
                    return;
                }
            }
        }
    } catch (e) {
        console.error("Error loading position:", e);
    }
    currentIndex = 0;
}

function toggleSettings() {
    isSettingsOpen = !isSettingsOpen;
    settingsPanel.classList.toggle("is-open", isSettingsOpen);

    if (isSettingsOpen && isChaptersOpen) {
        toggleChapters();
    }
}

function toggleChapters() {
    isChaptersOpen = !isChaptersOpen;
    chaptersPanel.classList.toggle("is-open", isChaptersOpen);

    if (isChaptersOpen && isSettingsOpen) {
        toggleSettings();
    }
}

function togglePlayer() {
    isCollapsed = !isCollapsed;
    container.classList.toggle("is-collapsed", isCollapsed);
    player.classList.toggle("is-collapsed", isCollapsed);

    if (isCollapsed) {
        if (isSettingsOpen) {
            toggleSettings();
        }

        if (isChaptersOpen) {
            toggleChapters();
        }

        showMiniPlayerToggle();
    } else {
        hideMiniPlayerToggle();
    }
}

function showMiniPlayerToggle() {
    let button = document.getElementById("tts-mini-toggle");

    if (!button) {
        button = document.createElement("button");
        button.id = "tts-mini-toggle";
        button.className = "mini-player-toggle";
        button.type = "button";
        button.title = "Expand player";
        button.innerHTML = `<span class="material-symbols-rounded">volume_up</span>`;
        button.addEventListener("click", togglePlayer);
        document.body.append(button);
    }

    button.classList.add("is-visible");
}

function hideMiniPlayerToggle() {
    document.getElementById("tts-mini-toggle")?.classList.remove("is-visible");
}

function updatePlayPauseButton() {
    // let isPlaying = statusText.textContent != "Paused";
    // isPlaying = synth.speaking && !synth.paused && !isStopped;
    // if(isMobile) isPlaying = statusText.textContent != "Paused";
    const iconSpan = playPauseButton.querySelector(".material-symbols-rounded");
    if (iconSpan) {
        iconSpan.textContent = isPaused ? "pause" : "play_arrow";
    }
    playPauseButton.setAttribute("aria-label", isPaused ? "Pause" : "Play");
    playPauseButton.classList.toggle("is-playing", isPaused);
}

function clampNumber(value, min, max, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return fallback;
    }

    return Math.max(min, Math.min(max, number));
}

function loadCloudFile(link) {
    console.log("loadCloudFile",link)
    fetch(link)
    .then(response => response.blob())
    .then(blob => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileContent = reader.result;
        const doc = new DOMParser().parseFromString(fileContent, "text/html");
        const text = doc.querySelector('#transcript');
        if(text) {
            localStorage.setItem("text",doc.querySelector('#transcript').innerHTML);
            document.getElementById('transcript').innerHTML = localStorage.getItem("text");
        } else {
            localStorage.setItem("text","<p>" + doc.body.textContent.split('\n').map(el => el.trim()).filter(el => el != '').join('</p>\n<p>') + "</p>");
            document.getElementById('transcript').innerHTML = localStorage.getItem("text");
        }

        setupApp();
      }
      reader.onerror = (e) => {
          console.error(e)
          document.getElementById('cuerpo').innerHTML = localStorage.getItem("text");
      }
      reader.readAsText(blob);
    })
    .catch(error => {
        console.log('Error reading the file:', error);
        document.getElementById('cuerpo').innerHTML = localStorage.getItem("text");
    });
}

window.addEventListener("beforeunload", () => cancelSpeech());
synth.addEventListener("voiceschanged", loadVoices);
loadCloudFile(share_link);