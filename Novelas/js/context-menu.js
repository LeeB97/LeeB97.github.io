'use strict';
let items = ["Copy","Refresh","Options"]
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
