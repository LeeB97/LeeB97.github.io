'use strict';
let dialog = document.querySelector("#search");
dialog.addEventListener('click', function(e) {
    let text = document.getElementById("search-text").value;
    if(text != "") {
        let elements = document.querySelectorAll('P');
        let matches = Array.from(elements).filter(el => { return el.textContent.includes(text) });
        if(matches.length > 0) matches[0].scrollIntoView();
    }
    dialog.close();
});
