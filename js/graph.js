var nodeCount = 0;
function TreeNode(latlng, street) {
    this.id = nodeCount;
    nodeCount += 1;
    this.latlng = latlng;
    this.street = street;
    this.neighbors = {};
    this.addNeighbor = function(node) {
	this.neighbors[node.latlng.toString()] = node;
    };
    this.removeNeighbor = function(node) {
	delete this.neighbors[node.latlng.toString()];
    };
    this.toString = function() {
	return "[" + this.latlng.toString() + " neighbors count: " + Object.size(this.neighbors)+"]";
    }
}

function Edge(distance, path) {
    this.distance = distance;
    this.path = path;
}

function EdgeMap() {
    this.map = {};//new Array();
    this.getEdge = function (s, e) {
	return this.map[s.id + " to " + e.id];
    };
    this.addEdge = function (s, e, edge) {
	this.map[s.id + " to " + e.id] = edge;
    };
    this.removeEdge = function(s, e) {
	delete this.map[s.id + " to " + e.id];
    };
}

function makeRoot(loc) {
    var request = {location: loc};
    //changeStatus("requesting to make root");
    geocoder.geocode(request, function(response) {
	    //changeStatus("making root");
	    root = new TreeNode(loc, response[0].address_components[1].long_name);
	    //changeStatus("made root");
	});
    //changeStatus("Requested to make root");
}

function initialize_data_structures() {
    //changeStatus("in initialize_data_structure");
    edge_map = new EdgeMap();
    //changeStatus("made edge map");
    
    makeRoot(loc);

    //changeStatus("made tree node");
    polylines = [];
    //changeStatus("made polyline array");
    colors = new ColorIterator();
}

var done = [];
function draw(root) {
    changeStatus('drawing tree');
    done = []
    drawTree(root, root);
}

function drawTree(root, s) {
    changeStatus("drawing root: " + root.toString());
    var neighbors = root.neighbors;
    for (i in neighbors) {
	if (neighbors[i] != s && !done.contains(neighbors[i])) {
	    changeStatus('drawing edge from s to neighbor: ' + root + " " + neighbors[i].toString());
	    var edge = edge_map.getEdge(root, neighbors[i]);
	    drawPath(edge.path);
	    done.push(neighbors[i]);
	    changeStatus('drawn path');
	    drawTree(neighbors[i], root, done);
	    changeStatus('drawn neighbor subtree');
	}
    }
    changeStatus('returning back from drawing tree');
}

function drawPath(path) {
    changeStatus('drawing path');
    var options = {map: map, path: path, strokeColor: colors.nextColor()};
    polylines.push(new google.maps.Polyline(options));
}

function clearDrawing() {
    changeStatus('clearing out polylines');
    for (i = 0; i < polylines.length; i++) {
	polylines[i].setMap(null);
    }
    changeStatus('set polylines to null');
    polylines = [];

}

function addSteps(root, steps, i, previousNode) {
    if (i < steps.length) {
	changeStatus("adding step: " + i);

	var request = {location: steps[i].end_location};       
	var callback = function(response, status) {
	    if (status == google.maps.GeocoderStatus.OK) {
		changeStatus("got geocode response");
		var street = response[0].address_components[1].long_name;
		var x = addNodesAndEdges(root, steps[i], previousNode, street);
		addSteps(x, steps, i+1, root);
	    } else {
		geocoder.geocode(request, callback);
	    }	   
	};
	geocoder.geocode(request, callback);
	changeStatus("made geocode request: " + i);
    } else {	
	clearDrawing();
	changeStatus("drawing root");
	draw(root);
	changeStatus('DONE');
    }
}


function addNodesAndEdges(s, step, start, street) {
    // first check if it's already an neighbor
    changeStatus("check if end_location is in s.neighbors");
    changeStatus("end_location: " +step.end_location.toString());
    changeStatus("start s: " + s.toString());
    changeStatus("neighbors size: " + Object.size(s.neighbors));
    if (step.end_location.equals(s.latlng))
	return s;
    if (step.end_location in s.neighbors) {
	changeStatus("it's a neighbor!");
	return s.neighbors[step.end_location];
    } else {
	changeStatus("not in s.neighbors..");
	var node = checkNeighbors(s, step, start, street);
	if (node != null)
	    return node;
	else {
	    changeStatus("new node..");
	    var node = new TreeNode(step.end_location, street);
	    changeStatus("adding edge from s: " + s.toString() + " to: " + node.toString());
	    addNodeAndEdgesToMap(s, node, step);
	    return node;
	}
    }
}

function latlngDist(latlng1, latlng2) {
    var x = (latlng1.lat() - latlng2.lat());
    var y = (latlng1.lng() - latlng2.lng());
    return Math.sqrt(x*x + y*y);
}

function checkNeighbors(s, step, start, street) {
    var neighbors = s.neighbors;
    var possibleNeighbor = new Array();
    changeStatus("checking neighbors");
    //changeStatus("checking street: " + street);
    for (i in neighbors) {
	if (i == start)
	    continue;
	changeStatus("neighbor street: " + neighbors[i].street);
	
	if (neighbors[i].street == street) {
	    possibleNeighbor.push(neighbors[i]);
	}
    }
    changeStatus("possibleNeighbors: " + possibleNeighbor);
    //changeStatus("possibleNeighbors: " + possibleNeighbor);

    var bestT = 10000000;
    var bestN = null;
    changeStatus("checking if bestN: " + bestN);
    for (i = 0; i < possibleNeighbor.length; i++) {
	var n = possibleNeighbor[i];
	var T = latlngDist(n.latlng, step.end_location);
	var T2 = latlngDist(step.end_location, s.latlng);
	if (T < bestT && T < T2) {
	    bestT = T;
	    bestN = n;
	}
    }
    changeStatus("bestN: " + bestN);

    if (bestN == null) {
	return null;
    } else {

	var edge = edge_map.getEdge(s, bestN);
	
	var j = 0;
	var dist = new Array();
	for (; j < edge.path.length; j++) {
	    dist.push(latlngDist(edge.path[j], step.end_location));
	}
	var type = checkType(dist);
	var n = bestN;
	if (type == -1) {

	    var paths = combinePaths(edge.path, step.path, s.latlng);
	    var newstep1 = {distance: step.distance,
			    end_location: step.end_location,
			    path: paths[0]};
	    var newstep2 = {distance: (n.distance - step.distance),
			    end_location: n.latlng,
			    path: paths[1]};
	    
	    s.removeNeighbor(n);
	    n.removeNeighbor(s);
	    
	    edge_map.removeEdge(s, n);
	    edge_map.removeEdge(n, s);
	    
	    var node = new TreeNode(step.end_location, street);
	    
	    changeStatus("new node: " + node.toString() + " between " + s.toString() + " and " + n.toString());
	    
	    addNodeAndEdgesToMap(s, node, newstep1);
	    addNodeAndEdgesToMap(node, s, newstep1);
	    addNodeAndEdgesToMap(node, n, newstep2);
	    addNodeAndEdgesToMap(n, node, newstep2);
	    return node;

	} else {
	    var path = getNewPath(step.path, type);
	    var newstep = {distance: step.distance - n.distance,
			   end_location: step.end_location,
			   path: path};
	    return addNodesAndEdges(n, newstep, s, street);
	}
    }
    return null;
}

function getNewPath(path, i) {
    var newpath = [];
    for (; i < path.length; i ++) {
	newpath.push(path[i]);
    }
    return newpath;
}

function checkType(dist) {
    var i = 0;
    for (; i < dist.length - 1; i++) {
	if (dist[i] < dist[i+1])
	    return i+1;
    }
    return -1;
}

function combinePaths(epath, spath, start_loc) {
    var tmp = start_loc;
    var newpath1 = [];
    var newpath2 = [];
    var i = 0;
    var j = 0;
    while (i < epath.length && j < spath.length) {
	var dist1 = latlngDist(epath[i], tmp);
	var dist2 = latlngDist(spath[j], tmp);

	if (dist1 < dist2) {
	    newpath1.push(epath[i]);
	    tmp = epath[i];
	    i += 1;
	} else {
	    newpath1.push(spath[j]);
	    tmp = spath[j];
	    j += 1;
	}
    }

    if (i < epath.length) {
	for (; i < epath.length; i ++) {
	    newpath2.push(epath[i]);
	}
    } else {
	for (; j < spath.length; j ++) {
	    newpath2.push(spath[j]);
	}
    }
    return [newpath1, newpath2];
}

function addNodeAndEdgesToMap(s, e, step) {
    changeStatus("convert call to explicit call");
    addNodeAndEdgesToMapExplicit(s, e, step.distance, step.path);
}

function addNodeAndEdgesToMapExplicit(s, e, distance, path) {
    changeStatus("new edge 1");
    var edge1 = new Edge(distance, path);
    edge_map.addEdge(s, e, edge1);
    
    changeStatus("new edge 2");
    var edge2 = new Edge(distance, path.reverse());
    edge_map.addEdge(e, s, edge2);

    changeStatus("add as new neighbors");
    s.addNeighbor(e);
    e.addNeighbor(s);
}


function ColorIterator() {
    this.color = ["FFCCCC", "CCAFFF", "A6BEFF", "99FFFF", "D5CCBB", "99FF99", "FFFF99", "FFCC99", "CCCCCC"];
    this.index = 0;
    this.nextColor = function() {
	var c = this.color[this.index];
	this.index += 1;
	this.index %= this.color.length;
	return c;
    }
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] == obj) {
            return true;
        }
    }
    return false;
};

function WriteNodesToXML(root) {
    var XML = new XMLWriter();
    var nodes = getAllNodes(root);
    for (i = 0; i < nodes.length; i++) {
	var node = nodes[i];
	XML.BeginNode("Node");
	XML.Attrib("id", node.id+"");
	XML.BeginNode("LatLng");
	XML.Attrib("lat", node.latlng.lat()+"");
	XML.Attrib("lon", node.latlng.lng()+"");
	XML.EndNode();
	  
	XML.EndNode();          
    }

    XML.Close();
    return XML.ToString();
}

function WriteEdgesToXML(m) {
    var XML = new XMLWriter();
    for (i in m.map) {
        var array = i.split(' ');
        var s = array[0];
        var e = array[2];

        XML.BeginNode("Edge");
	XML.Attrib("source", s + "");
	XML.Attrib("dest", e + "");
	XML.EndNode();
    }
    XML.Close();
    return XML.ToString();
}


function getAllNodes(root) {
    doneXML = [];
    var ret = getAllNodesHelper(root);
    doneXML = [];
    return ret;
}

function getAllNodesHelper(root) {
    //changeStatus1("done nodes..:" + doneXML.length);
    if (doneXML.indexOf(root) != -1)
	return new Array();
    //changeStatus1("node: " + root);
    var nodes = new Array();
    nodes.push(root);
    doneXML.push(root);
    for (i in root.neighbors) {
	nodes = nodes.concat(getAllNodesHelper(root.neighbors[i]));
    }
    return nodes;
}

function displayXML() {
    //changeStatus1("Getting xml string");
    var str = WriteNodesToXML(root);
    var edgeStr = WriteEdgesToXML(edge_map);
    //changeStatus1("displaying xml!");
    changeStatus1("<xml>");
    changeStatus1(str);
    changeStatus1(edgeStr);
    changeStatus1("</xml>");
    //document.write(str);
}

function ConstructionFromJson(nodes) {
    
}