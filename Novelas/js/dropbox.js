'use strict';
var dbx = new Dropbox.Dropbox({ accessToken: 'sl.Bhm5LBmGi5BmJ_z2viNyKQbtKi2t7Lt4rZRs5UJlMtNSC1a3c9tlpuXeEpRzbGZ9A7sPSOmsBQnSbZFyV8qX_TDVfgLZC50Y5n9wBvAfYZd3UTYn5pNTuQNPWjdBhoG1bOLlRCjb' });

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