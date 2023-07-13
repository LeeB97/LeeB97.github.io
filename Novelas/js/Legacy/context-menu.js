'use strict';
// let dialog = document.querySelector("#search")
let dialog = document.createElement("dialog");
let dialogDiv = document.createElement("div");
dialog.id = "search";
let dialogInput = document.createElement("input");
dialogInput.id = "search-text";
dialogInput.type = "text";
let dialogButton = document.createElement("button");
dialogButton.textContent = "Search";
dialogDiv.appendChild(dialogInput)
dialogDiv.appendChild(dialogButton)
dialog.appendChild(dialogDiv)
document.body.appendChild(dialog)
dialogButton.addEventListener('click', function(e) {
    let text = document.getElementById("search-text").value;
    if(text != "") {
        let elements = document.querySelectorAll('P');
        let matches = Array.from(elements).filter(el => { return el.textContent.includes(text) });
        if(matches.length > 0) matches[0].scrollIntoView();
    }
    dialog.close();
});
let items = ["Copy","Search","Refresh","Options"]
let contextMenu = document.createElement('div');
contextMenu.id = "context-menu";
items.forEach(item => {
    let menuItem = document.createElement('div');
    menuItem.classList.add("context-item");
    menuItem.textContent = item;
    menuItem.addEventListener("click",function(e){
        console.log(item);
        contextMenu.style.display = "none";
        switch (item) {
            case 'Copy':
                document.execCommand('copy');
                break;
            case 'Search':
                document.querySelector("#search").showModal();
                break;
            case 'Refresh':
                window.location.reload();
                break;
            case 'Options':
                window.location.href = "options.html"
                break;
            default:
                break;
        }
    });
    
    contextMenu.appendChild(menuItem);
});

document.querySelector('body').appendChild(contextMenu);

//Events for desktop and touch
let events = ["contextmenu"];
//initial declaration
var timeout;
//for double tap
var lastTap = 0;
//refer menu div
// let contextMenu = document.getElementById("context-menu");
//same function for both events
events.forEach((eventType) => {
    document.addEventListener(
    eventType,
    (e) => {
        e.preventDefault();
        //x and y position of mouse or touch
        let mouseX = e.clientX || e.touches[0].clientX;
        let mouseY = e.clientY || e.touches[0].clientY;
        //height and width of menu
        let menuHeight = contextMenu.getBoundingClientRect().height;
        let menuWidth = contextMenu.getBoundingClientRect().width;
        //width and height of screen
        let width = window.innerWidth;
        let height = window.innerHeight;
        //If user clicks/touches near right corner
        if (width - mouseX <= 200) {
        contextMenu.style.left = width - menuWidth + "px";
        contextMenu.style.top = mouseY + "px";
        //right bottom
        if (height - mouseY <= 200) {
            contextMenu.style.top = mouseY - menuHeight + "px";
        }
        }
        //left
        else {
        contextMenu.style.left = mouseX + "px";
        contextMenu.style.top = mouseY + "px";
        //left bottom
        if (height - mouseY <= 200) {
            contextMenu.style.top = mouseY - menuHeight + "px";
        }
        }
        //display the menu
        contextMenu.style.display = "block";
    },
    { passive: false }
    );
});
//click outside the menu to close it (for click devices)
document.addEventListener("click", function (e) {
    if (!contextMenu.contains(e.target)) {
    contextMenu.style.display = "none";
    }
});

// window.addEventListener('click', function(e) {
//     let outside = !dialog.contains(e.target);
//     // if(outside) dialog.close();
// });
