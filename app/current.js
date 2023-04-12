"use strict";
// settings
const ZiraIndex = 1,
rate = 1, //.2589 .115
skip = [
    "…",
    "...",
    "——————–",
    "***",
    "**",
    "“…”"
];

const playEle = document.querySelector('#play'),
pauseEle = document.querySelector('#pause'),
stopEle = document.querySelector('#stop'),
previousEle = document.querySelector('#previous'),
nextEle = document.querySelector('#next');

playEle.addEventListener('click', onClickPlay);
pauseEle.addEventListener('click', onClickPause);
stopEle.addEventListener('click', onClickStop);
previousEle.addEventListener('click', previousParagraph);
nextEle.addEventListener('click', nextParagraph);


let voice = speechSynthesis.getVoices().filter(e => {e.lang == "en-US"})[ZiraIndex],
content,
nodes,
utterances = [],
currentUtterance,
backToStart = false,
isButton = false;

function populateVoice() {
    if (typeof speechSynthesis === "undefined") return;
    voice = speechSynthesis.getVoices().filter(e => {e.lang == "en-US"})[ZiraIndex];
}

if (typeof speechSynthesis !== "undefined" && speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoice;
}

function initLoad() {
    console.log(voice);
    content = document.querySelector(".cuerpo");
    nodes = Array.from(content.children);
    // load utterances
    for (let index = 0; index < nodes.length; index++) {
        const element = nodes[index];
        let s = new SpeechSynthesisUtterance;
        s.lang = 'en-US';
        s.text = element.textContent;
        s.nodeindex = index;
        s.rate = rate;
        s.voice = voice;
        s.onstart = onstart;
        s.onend = onend;
        s.element = element;
        utterances.push(s);
        // jump to index
        element.addEventListener('dblclick', function(e) {
            if(currentUtterance.nodeindex != 0) {
                currentUtterance.element.classList.remove("tts-highlight");
                isButton = true;
                speechSynthesis.cancel(currentUtterance);
            }
            buttonState("play");
            currentUtterance = utterances[index];
            speechSynthesis.speak(currentUtterance);
        })
    }

    // init
    nodes = null;
    currentUtterance = utterances[0];
}

populateVoice();
initLoad();

function onClickPlay() {
    buttonState("play");
    if (speechSynthesis.speaking) return;
    speechSynthesis.speak(currentUtterance);
}

function onClickPause() {
    if (speechSynthesis.speaking) {
        buttonState("pause");
        isButton = true;
        speechSynthesis.cancel(currentUtterance);
    }
}

function onClickStop() {
    currentUtterance.element.classList.remove("tts-highlight");
    isButton = true;
    speechSynthesis.cancel(currentUtterance);
    currentUtterance = utterances[0];
    buttonState("stop");
}

function nextParagraph() {
    buttonState("play");
    if(currentUtterance.nodeindex == 0) { speechSynthesis.speak(currentUtterance); return; }
    currentUtterance.element.classList.remove("tts-highlight");
    isButton = true;
    speechSynthesis.cancel(currentUtterance);
    currentUtterance = utterances[currentUtterance.nodeindex + 1];
    speechSynthesis.speak(currentUtterance);
}

function previousParagraph() {
    if(currentUtterance.nodeindex == 0) { speechSynthesis.speak(currentUtterance); return; }
    currentUtterance.element.classList.remove("tts-highlight");

    isButton = true;
    speechSynthesis.cancel(currentUtterance);

    if(currentUtterance.nodeindex < 2) currentUtterance = utterances[0];
    else currentUtterance = utterances[currentUtterance.nodeindex - 1];

    speechSynthesis.speak(currentUtterance);
}

function onstart(e) {
    currentUtterance.element.classList.add("tts-highlight");
    currentUtterance.element.scrollIntoView({ behavior: "smooth" }); //, block: "center"
}

function onend(e) {
    if(isButton) { isButton = false; return; }
    currentUtterance.element.classList.remove("tts-highlight");
    if(!playEle.classList.length) buttonState("play");
    
    currentUtterance = utterances[currentUtterance.nodeindex + 1];
    if(skip.includes(currentUtterance.text)) currentUtterance = utterances[currentUtterance.nodeindex + 1];
    if(skip.includes(currentUtterance.text)) currentUtterance = utterances[currentUtterance.nodeindex + 1];

    speechSynthesis.speak(currentUtterance);
}

function buttonState(state) {
    playEle.classList.remove('played');
    pauseEle.classList.remove('paused');
    stopEle.classList.remove('stopped');
    switch (state) {
        case "play":
            playEle.classList.add('played');
            break;
        case "pause":
            pauseEle.classList.add('paused');
            break;
        case "stop":
            stopEle.classList.add('stopped');
            break;
        default:
            break;
    }
}
