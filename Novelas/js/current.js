'use strict';
const synth = window.speechSynthesis,
volume = sessionStorage.getItem("voice-volume") ?? 1,
rate = sessionStorage.getItem("voice-rate") ?? 1, //1.1161,
pitch = sessionStorage.getItem("voice-pitch") ?? 1,
share_link = "https://dl.dropboxusercontent.com/s/8ndtu5xb7gr6j2p/index.html?dl=0",
textToSkip = [
    "…",
    "...",
    "——————–",
    "***",
    "**",
    "“…”"
];

setTimeout(() => {
    if(sessionStorage.getItem("local-text")) document.getElementById('cuerpo').innerHTML = sessionStorage.getItem("local-text");
    else if(sessionStorage.getItem("share_link")) loadCloudFile(sessionStorage.getItem("share_link"));
    else loadCloudFile(share_link);
}, 2000);

let skip = false, firefox = false, voice, utterance;

if(navigator.userAgent.includes("Firefox") && navigator.userAgent.includes("Win64")) firefox = true;

// get voice stuff
function populateVoice() {
    console.log('populateVoice',synth.getVoices());
    if(sessionStorage.getItem("voice-selected")) {
        voice = synth.getVoices().filter(el => { return el.name == sessionStorage.getItem("voice-selected") }).pop();
    } else {
        voice = synth.getVoices().filter(el => { return el.name.includes('Zira') }).pop();
    }
    if(!voice) voice = synth.getVoices().filter(el => { return el.lang == 'en-US'}).pop();
    if(voice) console.log(voice.name);
}

// in Browser the voices are not ready on page load
if ('onvoiceschanged' in synth) synth.onvoiceschanged = populateVoice;

populateVoice();

document.getElementById('cuerpo').addEventListener('dblclick', e => {
    let element = e.target;
    if(element.id == 'cuerpo') return;

    while(element.parentElement.id != 'cuerpo') {
        element = element.parentElement;
    }
    
    utterance?.element.classList.remove('tts-highlight');
    skip = true;
    synth.cancel(utterance);
    // console.log(element.textContent);
    utterance = createUtterance(element);
    synth.speak(utterance);
});

function createUtterance(element) {
    let text = element?.textContent || "";
    if(textToSkip.includes(text)) {
        return createUtterance(element.nextElementSibling)
    } else {
        let s = new SpeechSynthesisUtterance;
        s.lang = 'en-US';
        s.text = text;
        s.voice = voice;
        s.volume = volume;
        s.rate = rate;
        s.pitch = pitch;
        s.onstart = onstart;
        s.onend = onend;
        s.onresume = onresume;
        s.element = element;
        
        return s;
    }
}

window.addEventListener('keydown', function(e) {
    if(e.key == 'MediaPlayPause') {
        if (synth.paused) synth.resume(utterance);
        else if (synth.speaking) {
            buttonState('pause');
            synth.pause(utterance);
        }
    }
})

function onClickPlay() {
    if(!utterance) utterance = createUtterance(document.querySelector('#cuerpo').firstElementChild);
    if (synth.paused) synth.resume(utterance);
    else if (synth.speaking) return;
    else synth.speak(utterance);
    // console.log(utterance);
}

function onClickPause() {
    if (synth.speaking) {
        buttonState('pause');
        skip = true;
        synth.cancel(utterance);
    }
}

function onClickStop() {
    buttonState('stop');
    utterance.element.classList.remove('tts-highlight');
    skip = true;
    synth.cancel(utterance);
    utterance = createUtterance(document.querySelector('#cuerpo').firstElementChild);
}

function moveParagraph(bol = true) {
    if(utterance.text == document.querySelector('#cuerpo').firstElementChild.textContent && !synth.speaking) {
        onClickPlay();
        return;
    }
    utterance.element.classList.remove('tts-highlight');
    let element = utterance.element;
    skip = true;
    synth.cancel(utterance);
    element = bol ? element.nextElementSibling : element.previousElementSibling;
    while (textToSkip.includes(element?.textContent)) {
        element = bol ? element.nextElementSibling : element.previousElementSibling;
        if (!element) break;
    }
    if(element) {
        utterance = createUtterance(element);
        synth.speak(utterance);
    } else {
        onClickStop();
    }
}

function onstart(e) {
    if(skip) skip = false;
    let element = e.target.element;
    element.classList.add('tts-highlight');
    element.scrollIntoView({ behavior: 'smooth' }); //, block: 'center'
    buttonState('play');
}

function onend(e) {
    if(skip) return;
    let element = e.target.element;
    element.classList.remove('tts-highlight');
    if(element.nextElementSibling) {
        utterance = createUtterance(element.nextElementSibling);
        synth.speak(utterance);
    } else {
        onClickStop();
    }
}

function onresume(e) {
    buttonState('play');
    e.target.element.scrollIntoView({ behavior: 'smooth' });
}

function buttonState(state) {
    let play = document.querySelector('#play');
    play.classList.remove('played');
    play.nextElementSibling.classList.remove('paused');
    play.nextElementSibling.nextElementSibling.classList.remove('stopped');
    switch (state) {
        case 'play':
            play.classList.add('played');
            break;
        case 'pause':
            play.nextElementSibling.classList.add('paused');
            break;
        case 'stop':
            play.nextElementSibling.nextElementSibling.classList.add('stopped');
            break;
        default:
            break;
    }
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
        const text = doc.querySelector('#cuerpo');
        if(text) {
            localStorage.setItem("text",doc.querySelector('#cuerpo').innerHTML);
            document.getElementById('cuerpo').innerHTML = localStorage.getItem("text");
        } else {
            localStorage.setItem("text","<p>" + doc.body.textContent.split('\n').map(el => el.trim()).filter(el => el != '').join('</p>\n<p>') + "</p>");
            document.getElementById('cuerpo').innerHTML = localStorage.getItem("text");
        }
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
