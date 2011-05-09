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
	zoom: 14,
	center: default_location,
	mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"),
				  myOptions);
    rectangle = new google.maps.Rectangle({bounds: getBounds(default_location), map: map,
					   fillColor: "999999"});

    MakeCenterMarker(default_location, function (m) {});
    MakeNodeMarker(new google.maps.LatLng(37.874, -122.265), function (m) {});

    var buttonDiv = document.createElement('DIV');
    var xmlButton = new XMLButton(buttonDiv, map);
    var randButton = new RandomGenButton(buttonDiv, map);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(buttonDiv);
}

function changeStatus(text) {
    var status = document.getElementById('status');
    status.value += '\n'+text;
    status.scrollTop = status.scrollHeight;
}

constantBound = 0.05;
function getBounds(latlng) {
    var latlng1 = new google.maps.LatLng(latlng.lat()-constantBound, latlng.lng()-constantBound);
    var latlng2 = new google.maps.LatLng(latlng.lat()+constantBound, latlng.lng()+constantBound);
    changeStatus(latlng1);
    changeStatus(latlng2);
    return new google.maps.LatLngBounds(latlng1, latlng2);
}

function sizeof(map) {
    var length = 0;
    for (i in map) {
	length += 1;
    }
    return length;
}
