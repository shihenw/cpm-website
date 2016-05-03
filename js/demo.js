var current_uuid;
var dir = "../cpm-backend/public/uploads/"

function display(filelist, path) {
  // new an empty array
  var part_filelist = [];
  var pose_filelist = ['', ''];
  for (var i = 0; i < 15; i++) {
    part_filelist.push('');
  }
  // fill in part
  for (var i = 0; i < filelist.length; i++) {
    var res1 = filelist[i].split("_");
    if (res1[res1.length - 1].indexOf('part') == -1) {
      if (res1[res1.length - 1].indexOf('pose') == -1) {
        pose_filelist[0] = filelist[i];
      } else {
        pose_filelist[1] = filelist[i];
      }
      continue;
    }
    var res2 = res1[res1.length - 1].split(".");
    var part_num = findEndNumInStr(res2[res2.length - 2]);
    part_filelist[part_num - 1] = filelist[i];
  }
  // add pose and original images
  for (var i = 0; i < pose_filelist.length; i++) {
    var $pose = $("#pose-" + (i + 1));
    var image_path = path + pose_filelist[i];
    $pose.children().remove();
    $pose.append($('<a href="' + image_path + '" target="_blank"><img class="pose-img" src="' + image_path + '"/></a>'));
  }
  // add part images
  for (var i = 0; i < part_filelist.length; i++) {
    var $part = $("#part-" + (i + 1));
    var image_path = path + part_filelist[i];
    $part.children().remove();
    $part.append($('<a href="' + image_path + '" target="_blank"><img class="part-img" src="' + image_path + '"/></a>'));
  }
  // show result
  hideIsProcessingUI();
  showImgUI();
}

function findEndNumInStr(str) {
  return parseInt(str.match(/\d+$/)[0]);
}

function getFilelist(path) {
  var filelist = [];
  $.ajax({
    url: path,
    success: function(data) {
      console.log("server getFilelist success");
      var all_anchor_tags = data.match(/<a[\s]+([^>]+)>((?:.(?!\<\/a\>))*.)<\/a>/g);
      var is_server_processing_complete = false;
      for (var i = 0; i < all_anchor_tags.length; i++) {
        var filename = $(all_anchor_tags[i]).attr("href");
        if (filename.indexOf('.png') > -1 || filename.indexOf('.jpg') > -1) {
          filelist.push(filename);
        }
        if (filename == "COMPLETE") {
          is_server_processing_complete = true;
        }
      }
      // check if the server complete the GPU processing
      if (is_server_processing_complete) {
        checkPoseMachineMessage(filelist, path);
      } else {
        setTimeout(function() {
          getFilelist(path);
        }, 2000);
      }
    },
    error: function(response) {
      console.log("server getFilelist error:", response);
      hideIsProcessingUI();
      showServerErrorMsg("Server error. Please try again later.");
    }
  });
}

function checkPoseMachineMessage(filelist, path) {
  $.ajax({
    url: path + "/message",
    success: function(data) {
      console.log("server checkPoseMachineMessage success");
      var line_message = data.split("\n");
      if (line_message[0] == "success") {
        display(filelist, path);
      } else {
        hideIsProcessingUI();
        showServerErrorMsg(line_message[1]);
      }
    },
    error: function(response) {
      console.log("server checkPoseMachineMessage error:", response);
      hideIsProcessingUI();
      showServerErrorMsg("Server error. Please try again later.");
    }
  });
}

function submitFile(formData) {
  $.ajax({
    url: 'http://pearl.vasc.ri.cmu.edu:8080/cpm-backend/process_image',
    type: 'post',
    data: formData,
    cache: false,
    processData: false,
    contentType: false,
    success: function(response) {
      console.log("server submitFile success:", response);
      if (response == "") {
        hideIsProcessingUI();
        showServerErrorMsg("The server is busy. Please try again later.");
      } else {
        current_uuid = response.uuid;
        var path = dir + response.uuid + "/";
        getFilelist(path);
      }
    },
    error: function(response) {
      console.log("server submitFile error:", response);
      hideIsProcessingUI();
      showServerErrorMsg("Server error. Please try again later.");
    }
  });
}

function saveImgOnServer(formData) {
  $.ajax({
    url: 'http://pearl.vasc.ri.cmu.edu:8080/cpm-backend/save_image',
    type: 'post',
    data: formData,
    cache: false,
    processData: false,
    contentType: false,
    success: function(response) {
      console.log("server saveImgOnServer success:", response);
      showIsImgSavedUI();
    },
    error: function(response) {
      console.log("server saveImgOnServer error:", response);
    }
  });
}

function showServerErrorMsg(txt) {
  $("#server-error-msg").text(txt).show();
}

function hideIsServerBusyUI() {
  $("#server-error-msg").hide();
}

function showIsProcessingUI() {
  $("#is-processing").show();
}

function hideIsProcessingUI() {
  $("#is-processing").hide();
}

function hideImgUI() {
  $("#large-image-container").hide();
  $("#small-image-container").hide();
  $("#save-image").hide();
}

function showImgUI() {
  $("#large-image-container").show();
  $("#small-image-container").show();
  $("#save-image").show();
}

function showIsImgSavedUI() {
  $("#is-image-saved").show();
}

function hideIsImgSavedUI() {
  $("#is-image-saved").hide();
}

function createSaveImageButton() {
  $("#save-image").button().on("click", function() {
    var formData = new FormData();
    formData.append("image_uuid", current_uuid);
    saveImgOnServer(formData);
  });
}

function init() {
  createSaveImageButton();
  $("#file").on("change", function() {
    hideImgUI();
    hideIsImgSavedUI();
    hideIsServerBusyUI();
    showIsProcessingUI();
    var formData = new FormData();
    formData.append('file', $("#file").get(0).files[0]);
    //submitFile(formData);
    current_uuid = "e50a3580-2ee2-4a20-9fad-79db127c1f14";
    var path = dir + current_uuid + "/";
    getFilelist(path);
  });
}

$(init);
