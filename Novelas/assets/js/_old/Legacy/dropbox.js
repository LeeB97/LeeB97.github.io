'use strict';
const env = {
  "dropbox_token": "",
  "dropbox_link": "https://dl.dropboxusercontent.com/s/8ndtu5xb7gr6j2p/index.html?dl=0",
}
if(sessionStorage.getItem("dropbox_link")) env.dropbox_link = sessionStorage.getItem("dropbox_link");
fetch(env.dropbox_link)
.then(response => response.blob())
.then(blob => {
  const reader = new FileReader();
  reader.onload = () => {
    const fileContent = reader.result;
    const doc = new DOMParser().parseFromString(fileContent, "text/html");
    const text = doc.querySelector('#cuerpo');
    if(text) {
      sessionStorage.setItem("text",doc.querySelector('#cuerpo').innerHTML);
    } else {
      sessionStorage.setItem("text","<p>" + doc.body.textContent.split('\n').map(el => el.trim()).filter(el => el != '').join('</p>\n<p>') + "</p>");
    }
  }
  reader.readAsText(blob);
})
.catch(error => {
  console.log('Error reading the file:', error);
});


// var dbx = new Dropbox.Dropbox({ accessToken: env.dropbox_token });
// dbx.sharingGetSharedLinkFile({ url: env.dropbox_link })
//   .then(function(data){
//     const reader = new FileReader();
//     reader.onload = function() {
//       var htmlString = reader.result;
//       var doc = new DOMParser().parseFromString(htmlString, "text/html");
//       document.querySelector('#cuerpo').innerHTML = doc.querySelector('#cuerpo').innerHTML;
//     }
//     reader.readAsText(data.fileBlob)
//   }
// )
