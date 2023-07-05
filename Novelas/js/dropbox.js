'use strict';
fetch('env.json')
.then((response) => response.json())
.then((env) => {
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
});
