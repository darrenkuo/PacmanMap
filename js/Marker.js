var markers = new Array();
var directions_service = new google.maps.DirectionsService();
var id = 0;

function ProtoMarker(options) {
    this.select_image = options["select_image"];
    this.deselect_image = options["deselect_image"];
    
    this.latlng = options["latlng"];
    this.marker = new google.maps.Marker({
	    map: map,
	    icon: this.deselect_image,
	    draggable: false,
	    animation: google.maps.Animation.DROP,
	    position: this.latlng
	});
    this.selected = false;
    this.id = id;
    id += 1;

    this.neighbors = new Array();

    var obj = this;

    this.select = function() {
	obj.marker.setIcon(obj.select_image);
	obj.selected = true;

	for (i = 0; i < markers.length; i++) {
	    if (markers[i] != obj)
		markers[i].deselect();
	}

	google.maps.event.removeListener(obj.listener);
	obj.listener = google.maps.event.addListener(obj.marker, 'click', obj.deselect);
	obj.addListener = google.maps.event.addListener(rectangle, 'click', obj.addNeighbor);
    };
    this.deselect = function() {
	obj.marker.setIcon(obj.deselect_image);
	obj.selected = false;
	google.maps.event.removeListener(obj.listener);
	obj.listener = google.maps.event.addListener(obj.marker, 'click', obj.select);
	if (obj.addListener != null)
	    google.maps.event.removeListener(obj.addListener);
	obj.addListener = null;
    }

    this.addNeighbor = function(e) {
	directions_service.route({origin: e.latLng,
				  destination: e.latLng,
				  travelMode: google.maps.DirectionsTravelMode.DRIVING},
	    function(results, status) {
		if (status == google.maps.DirectionsStatus.OK) {
		    var routes = results.routes;
		    var legs = routes[routes.length-1].legs;
		    var latlng = legs[legs.length-1].end_location;

		    directions_service.route({origin: obj.latlng,
				destination: latlng,
				travelMode: google.maps.DirectionsTravelMode.DRIVING},
			function(results, status) {
			    if (status == google.maps.DirectionsStatus.OK) {
				var newMarker = new NodeMarker(latlng);
				new Edge(this, newMarker, flatten(results));
				obj.neighbors.push(newMarker);
			    }
			});
		}
	    });
    };

    this.listener = google.maps.event.addListener(this.marker, 'click', this.select);
    this.addListener = null;

    markers.push(this);
    this.select();
}

function NodeMarker(latlng) {
    var options = {latlng: latlng,
		   select_image: "images/markers/red-dot.png",
		   deselect_image: "images/markers/blue.png"};
    ProtoMarker.apply(this, [options]);

    var obj = this;
    this.remove = function() {
	obj.marker.setMap(null);
    }
    google.maps.event.addListener(this.marker, 'rightclick', this.remove);
}

function CenterMarker(latlng) {
    var options = {latlng: latlng,
		   select_image: "images/markers/green-dot.png",
		   deselect_image: "images/markers/green.png"};
    ProtoMarker.apply(this, [options]);
    this.marker.setDraggable(true);
    google.maps.event.addListener(this.marker, 'dragend', function(e) {
	    rectangle.setBounds(getBounds(e.latLng));
	    map.setCenter(e.latLng);
	});
}

var edge_map = {};

function Edge(marker1, marker2, steps) {
    this.marker1 = marker1;
    this.marker2 = marker2;
    this.steps = steps;

    this.polylines = new Array();
    for (var i = 0; i < steps.length; i ++) {
	var step = steps[i];
	var options = {map: map, 
		       path: step.path, 
		       strokeColor: "#FFAA00"};
	this.polylines.push(new google.maps.Polyline(options));
    }

    var obj = this;
    this.remove = function() {
	for (var i = 0; i < obj.polylines.length; i ++) {
	    obj.polylines[i].setMap(null);
	}
    };
    edge_map[marker1.id + " to " + marker2.id] = this;
}

// support functions

function flatten(results) {
    var routes = results.routes;
    var steps = new Array();
    for (var i = 0; i < routes.length; i ++) {
	for (var j = 0; j < routes[i].legs.length; j++) {
	    steps = steps.concat(routes[i].legs[j].steps);
	}
    }
    return steps;
}

function toXML() {
    writer = new XMLWriter();
    for (var i = 0; i < markers.length; i ++) {
	var marker = markers[i];
	writer.BeginNode("Node");
	writer.Attrib("id", marker.id +"");

	//LatLng node
	writer.BeginNode("LatLng");
	writer.Attrib("lat", marker.latlng.lat());
	writer.Attrib("lng", marker.latlng.lng());
	writer.EndNode();

	writer.EndNode();
    }
    return "<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?>" + writer.ToString();
}