"use strict";
// settings
const ZiraIndex = 11,
rate = 1.1161, //.2589 .115
skip = [
    "…",
    "...",
    "——————–",
    "***",
    "**",
    "“…”"
]
let voice = speechSynthesis.getVoices()[ZiraIndex]
if (speechSynthesis.onvoiceschanged !== undefined) { speechSynthesis.onvoiceschanged = setVoice }
function setVoice() { voice = speechSynthesis.getVoices()[ZiraIndex] }


const playEle = document.querySelector('#play'),
pauseEle = document.querySelector('#pause'),
stopEle = document.querySelector('#stop'),
previousEle = document.querySelector('#previous'),
nextEle = document.querySelector('#next'),
data = document.querySelector('#data')

playEle.addEventListener('click', onClickPlay)
pauseEle.addEventListener('click', onClickPause)
stopEle.addEventListener('click', onClickStop)
previousEle.addEventListener('click', previousParagraph)
nextEle.addEventListener('click', nextParagraph)

let utterances = [],
currentUtterance = null,
content = document.querySelector(".cuerpo"),
nodes = Array.from(content.children),
stop = false,
backToStart = false

// load utterances
for (let index = 0; index < nodes.length; index++) {
    const element = nodes[index]
    let s = new SpeechSynthesisUtterance
    s.lang = 'en-US'
    s.text = element.textContent
    s.nodeindex = index
    s.rate = rate
    s.voice = voice
    s.onstart = onstart
    s.onend = onend
    utterances.push(s)
    // jump to index
    element.addEventListener('dblclick', function(e) {
        if(!speechSynthesis.speaking && !speechSynthesis.paused) {
            buttonState("play")
            currentUtterance = utterances[index]
            speechSynthesis.speak(currentUtterance)
            return
        }
        if(index < 1) {
            backToStart = true
        } else {
            currentUtterance = utterances[index - 1]
        }
        speechSynthesis.cancel(currentUtterance)
    });
}

// init
currentUtterance = utterances[0]

function onClickPlay() {
    stop = false
    buttonState("play")
    if (speechSynthesis.paused) {
        speechSynthesis.resume()
        return
    }
    speechSynthesis.speak(currentUtterance)

    
    console.log(currentUtterance);
    
}

function onClickPause() {
    if (speechSynthesis.speaking) {
        buttonState("pause")
        speechSynthesis.pause(currentUtterance)
    }
    
    console.log(currentUtterance);
}

function onClickStop() {
    stop = true
    buttonState("stop")
    speechSynthesis.cancel()
    
    console.log(currentUtterance);
}

function nextParagraph() {
    speechSynthesis.cancel(currentUtterance)
    if(!speechSynthesis.speaking && !speechSynthesis.paused) {
        buttonState("play")
        speechSynthesis.speak(currentUtterance)
        return
    }
}

function previousParagraph() {
    if(!speechSynthesis.speaking && !speechSynthesis.paused) {
        buttonState("play")
        speechSynthesis.speak(currentUtterance)
        return
    }
    if(currentUtterance.nodeindex < 2) backToStart = true
    else currentUtterance = utterances[currentUtterance.nodeindex - 2]
    // if currentUtterance.text is ... back one more
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
    speechSynthesis.cancel(currentUtterance)
}

function onstart() {
    // console.log(currentUtterance);
    nodes[currentUtterance.nodeindex].classList.add("tts-highlight")
    nodes[currentUtterance.nodeindex].scrollIntoView({
        behavior: "smooth"//, block: "center"
    })
}

function onend(e) {
    nodes[e.target.nodeindex].classList.remove("tts-highlight")
    if(!stop) {
        if(!playEle.classList.length) buttonState("play")
        if(backToStart) {
            currentUtterance = utterances[0]
            backToStart = false
        } else {
            currentUtterance = utterances[currentUtterance.nodeindex + 1]
            if(skip.includes(currentUtterance.text)) currentUtterance = utterances[currentUtterance.nodeindex + 1]
            if(skip.includes(currentUtterance.text)) currentUtterance = utterances[currentUtterance.nodeindex + 1]
        }
        speechSynthesis.speak(currentUtterance)
    } else {
        currentUtterance = utterances[0]
        stop = false
    }
}

function buttonState(state) {
    playEle.classList.remove('played')
    pauseEle.classList.remove('paused')
    stopEle.classList.remove('stopped')
    switch (state) {
        case "play":
            playEle.classList.add('played')
            break;
        case "pause":
            pauseEle.classList.add('paused')
            break;
        case "stop":
            stopEle.classList.add('stopped')
            break;
        default:
            break;
    }
}


