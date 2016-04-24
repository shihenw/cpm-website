function init() {
  $("#testBtn").button().on("click", function() {
    ajaxFunction();
  });

  //some examination of file when you choose a new one
  $(':file').change(function() {
    var file = this.files[0];
    var name = file.name;
    var size = file.size;
    var type = file.type;
    console.log(name);
  });

  $(':button').click(function() {
    var formData = new FormData($('form')[0]);
    $.ajax({
      url: 'http://pearl.vasc.ri.cmu.edu/cgi-bin/upload.py',  //Server script to process data
      type: 'POST',
      //Ajax events
      //beforeSend: beforeSendHandler,
      success: function(data) {
        console.log("Success! Data: " + data);
        var img_tag = "<img src=\"" + data + "\" height=\"300\">";
        console.log(img_tag);
        $("#div-image").html(img_tag);
        for (var i = 1; i <= 14; i++) {
          try {
            img_tag = "<img src=\"" + "testing/results/" + data.split('/')[1].split(".")[0] + "_heatmap" + i + ".png" + "\" height=\"300\">";
            $("#div-image").append(img_tag);
          }
          catch(err) {
            console.log("upper body!");
          }
        }
        img_tag = "<img src=\"" + "testing/results/" + data.split('/')[1].split(".")[0] + "_stickman.png" + "\" height=\"300\">";
        $("#div-image").append(img_tag);
      },
      //error: errorHandler,
      // Form data
      data: formData,
      //Options to tell jQuery not to process data or worry about content-type.
      cache: false,
      contentType: false,
      processData: false
    });
  });
}
function ajaxFunction() {
  $.get("http://pearl.vasc.ri.cmu.edu/cgi-bin/time.py").done(function(data) {
    document.myForm.time.value = data;
  });
}

function display(filelist) {
  // new an empty array
  var part_stage_filelist = [];
  for (var i = 0; i < 14; i++) {
    var part = []
    for (var j = 0; j < 6; j++) {
      part.push('');
    }
    part_stage_filelist.push(part);
  }
  // fill in part and stage
  for (var i = 0; i < filelist.length; i++) {
    var res1 = filelist[i].split("_");
    var res2 = res1[res1.length - 1].split(".");
    var part_num = findEndNumInStr(res1[res1.length - 2]);
    var stage_num = findEndNumInStr(res2[res2.length - 2]);
    part_stage_filelist[part_num - 1][stage_num - 1] = filelist[i];
  }
  // add events
  $("#body-part-names").find("a").on("click", function() {
    var part_num = $(this).data("value");
    var path = "img/demo/";
    for (var i = 0; i < 6; i++) {
      var $img_container = $("#stage-" + (i + 1));
      $img_container.children().remove();
      $img_container.append($('<img class="stage-img" src="' + path + part_stage_filelist[part_num - 1][i] + '"/>'));
    }
  });
  $("#b1").click();
}

function findEndNumInStr(str) {
  return parseInt(str.match(/\d+$/)[0]);
}

function initTemp() {
  var filelist = [];
  $.ajax({
    url: "img/demo/",
    success: function(data) {
      $(data).find("a").each(function() {
        var filename = $(this).attr("href");
        if (filename.indexOf('.png') > -1) {
          filelist.push($(this).attr("href"));
        }
      });
      display(filelist);
    }
  });
}

$(initTemp);