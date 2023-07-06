'use strict';
const env = {
  "dropbox_token": "sl.BhmERHs43wn0au60jqFQ6A0h_kSFZX4nVx3ZOhnjq8Cx6tKxrAzEm--flbZ_7ftcC9f-tWHLJaLxdWWeTZNlBQFS2HPKIh1u2BE45kkRwyWG_8Dyci8pOBRN_ovuq-Fv4zoU8ykX",
  "dropbox_link": "https://www.dropbox.com/s/8ndtu5xb7gr6j2p/index.html?dl=0",
}
var dbx = new Dropbox.Dropbox({ accessToken: env.dropbox_token });
dbx.sharingGetSharedLinkFile({ url: env.dropbox_link })
  .then(function(data){
    const reader = new FileReader();
    reader.onload = function() {
      var htmlString = reader.result;
      var doc = new DOMParser().parseFromString(htmlString, "text/html");
      document.querySelector('#cuerpo').innerHTML = doc.querySelector('#cuerpo').innerHTML;
    }
    reader.readAsText(data.fileBlob)
  }
)
