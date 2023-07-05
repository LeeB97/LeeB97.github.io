'use strict';
const token = 'sl.Bhmq7P7O6WTq4OZ8s6IWWZj83zfngq2FPzWOJnVRJ_i5iEmny9NEFfBUj5pzOil9bacNyn17liBVV08ds6pZQPV6P5DmlwLpamudWIseBNjj99UWlnwwv7Dy5uuB_NqeRnBMGZlVIYoA';
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
