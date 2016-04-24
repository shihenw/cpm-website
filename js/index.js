var video_name = ["CVPR/solodance_heatmap_CVPR.mp4",
  "CVPR/dancingcop_CVPR.mp4",
  "CVPR/rogerrafa_heatmap_CVPR.mp4",
  "CVPR/oculus_CVPR.mp4",
  "CVPR/ronaldinho_CVPR.mp4"];
//var video_explanation = ["Model trained on LEEDS Sport Dataset with observer centric annotation", 
//						 "Model trained on MPII dataset with person centric annotation"];

var video_current = 1;
var video_last = 1;

$(document).ready(function() {
  $("#s1").addClass("menu-bold");
  for (var i = 1; i <= 5; i++) {
    span = "#s" + i;
    $(span).on("click", function() {
      var value = $(this).data("value");
      changeVideo(value);
    });
  }
});

function changeVideo(i) {
  // console.log(video_name);
  // console.log(i);
  // console.log(video_name[i-1]);
  if (i != video_current) {
    sb = "<video class='vinstance' controls='controls' src='video/" + video_name[i - 1] + "' width='860'></video>";

    $("#video-container").html(sb);

    //if(i==1){
    //	console.log(video_explanation[0]);
    //	$("#video-explanation").html(video_explanation[0]);
    //}
    //else{
    //	$("#video-explanation").html(video_explanation[1]);
    //}

    var item = "#s" + i;
    $(item).addClass("menu-bold");
    item = "#s" + video_current;
    $(item).removeClass("menu-bold");

    video_last = video_current;
    video_current = i;
  }
}
