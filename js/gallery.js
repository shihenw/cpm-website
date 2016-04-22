function addImgs(filelist) {
  var $gallery_cols = [$("#gallery-c1"), $("#gallery-c2"), $("#gallery-c3"), $("#gallery-c4")];
  for (var i = 0; i < filelist.length; i++) {
    $gallery_cols[i % 4].append($('<img class="gallery-img" src="img/gallery/' + filelist[i] + '"/>'));
  }
}

function init() {
  var filelist = [];
  $.ajax({
    url: "img/gallery/",
    success: function(data) {
      $(data).find("a").each(function() {
        var filename = $(this).attr("href");
        if(filename.indexOf('/') == -1) {
          filelist.push($(this).attr("href"));
        }
      });
      addImgs(filelist);
    }
  });
}

$(init);