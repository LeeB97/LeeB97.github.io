'use strict';
var dbx = new Dropbox.Dropbox({ accessToken: 'sl.BhmDlXlf4LzztU_IPTaarxew_dWGprST_KkO01BhdmQl-m3P5K_KIAVD5pA6CV7JEet7pwdv-iS23nC8rDFifYyiFLvKlygeVKoofa5-ToF85P-PQXiwrfW9R3I4mBluIEaI_MP-' });

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
