'use strict';
const token = 'sl.BhlP6rUCOvbq0hLTJk5U4IOzK8-cntGccWJZES7qu6UAMU1CW3T3nW5mCPO4KJDULV0LmNCUIgR4hPVrXmQ5tVKsj9Kwhb5FY2ENe3dU3ArYh_BYxSNLZk97PERLsa_P0YIUGhIH';
var dbx = new Dropbox.Dropbox({ accessToken: token });
dbx.sharingGetSharedLinkFile({url: 'https://www.dropbox.com/s/8ndtu5xb7gr6j2p/index.html?dl=0'})
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
