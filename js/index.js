var default_location = new google.maps.LatLng(37.874320,-122.264678);

function initialize() {

    max_scale = 0.005;
    directions_service = new google.maps.DirectionsService();
    directions_displays = new Array();

    geocoder = new google.maps.Geocoder();

    display_options = {
	preserveViewport: true,
	markerOptions:  {visible: false}
    };

    // setup map_canvas to take the maximum size
    var canvas = document.getElementById("map_canvas");
    canvas.style.width = (document.documentElement.clientWidth * 0.95 - 300)+ "px";
    canvas.style.height = document.documentElement.clientHeight * 0.9 + "px";

    var textarea = document.getElementById("status");
    textarea.style.height = canvas.style.height;

    var myOptions = {
	zoom: 16,
	center: default_location,
	mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"),
				  myOptions);
    rectangle = new google.maps.Rectangle({bounds: getBounds(default_location), map: map,
					   fillColor: "999999"});

    new CenterMarker(default_location);
    new NodeMarker(new google.maps.LatLng(37.874, -122.265));

    var buttonDiv = document.createElement('DIV');
    var xmlButton = new XMLButton(buttonDiv, map);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(buttonDiv);
}

function changeStatus(text) {
    var status = document.getElementById('status');
    status.value += '\n'+text;
    status.scrollTop = status.scrollHeight;
}

constantBound = 0.005;
function getBounds(latlng) {
    var latlng1 = new google.maps.LatLng(latlng.lat()-constantBound, latlng.lng()-constantBound);
    var latlng2 = new google.maps.LatLng(latlng.lat()+constantBound, latlng.lng()+constantBound);
    return new google.maps.LatLngBounds(latlng1, latlng2);
}

function XMLButton(controlDiv, map) {
    this.divTag = null;
    var obj = this;
    this.click_func = function() {
	$.post('js/xml_file.php', {xml: toXML()}, function(filename) {
		var filename = filename.replace(/[\"\']{1}/gi,"");
		var oldTag = document.getElementById("xml_div");
		if (oldTag != null)
		    document.body.removeChild(oldTag);

		var divTag = document.createElement("div");
		divTag.id = "xml_div";
		divTag.style.position = "absolute";
		divTag.style.width = "200px";
		divTag.style.height = "50px";
		divTag.style.zindex = "100";

		var atag = document.createElement("a");
		atag.href = "js/"+filename;
		atag.innerHTML = "Click here to download";
		
		divTag.appendChild(atag);
		document.body.appendChild(divTag);
		floatingMenu.add('xml_div', {
			targetRight: 10,  
			    targetTop: 10,  
			    snap: true  
			    });
	    });
	changeStatus("DONE");
	
    };
    PButton.apply(this, arguments);
    this.controlText.innerHTML = "To XML";
    this.controlUI.title = 'Click to output XML code';
}
