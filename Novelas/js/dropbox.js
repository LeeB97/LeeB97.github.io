'use strict';
const token = 'sl.BhmCGwxs1qf0jSYacEjZ7t3cczlLMxHc7wPR_EYseXxJBZdljXSwX3gENTVBS5KzBRzgO60H177wahCCg59dX4YmJbkhY6zsYLHsBxjUMpkY-ol-ILifBYWppoYqJCKGxLJTEIA6qdVM';
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
