function init() {
	$("#testBtn").button().on("click", function() {
		ajaxFunction();
	});	

	//some examination of file when you choose a new one
	$(':file').change(function(){
	    var file = this.files[0];
	    var name = file.name;
	    var size = file.size;
	    var type = file.type;
	    console.log(name);
	});

	$(':button').click(function(){
		var formData = new FormData($('form')[0]);
	    $.ajax({
	        url: 'http://pearl.vasc.ri.cmu.edu/cgi-bin/upload.py',  //Server script to process data
	        type: 'POST',
	        //Ajax events
	        //beforeSend: beforeSendHandler,
	        success: function(data){
	        	console.log("Success! Data: " + data);
	        	var img_tag = "<img src=\"" + data + "\" height=\"300\">";
	        	console.log(img_tag);
	        	$("#div-image").html(img_tag);
	        	for(var i=1;i<=14;i++){
	        		try{
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
	$.get( "http://pearl.vasc.ri.cmu.edu/cgi-bin/time.py").done(function( data ) {
	    document.myForm.time.value = data;
	});
}
$(init);