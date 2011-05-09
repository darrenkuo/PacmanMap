function PButton(controlDiv, map) {

    // Set CSS styles for the DIV containing the control
    // Setting padding to 5 px will offset the control
    // from the edge of the map
    controlDiv.style.padding = '5px';

    // Set CSS for the control border
    var controlUI = document.createElement('DIV');
    controlUI.style.backgroundColor = 'white';
    controlUI.style.borderStyle = 'solid';
    controlUI.style.borderWidth = '2px';
    controlUI.style.cursor = 'pointer';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Click to set the map to Home';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior
    var controlText = document.createElement('DIV');
    controlText.style.fontFamily = 'Arial,sans-serif';
    controlText.style.fontSize = '12px';
    controlText.style.paddingLeft = '4px';
    controlText.style.paddingRight = '4px';
    controlText.innerHTML = 'Home';
    controlUI.appendChild(controlText);

    this.controlUI = controlUI;
    this.controlText = controlText;

    // Setup the click event listeners: simply set the map to Chicago
    google.maps.event.addDomListener(controlUI, 'click', this.click_func);
}


function XMLButton(controlDiv, map) {
    this.divTag = null;
    var obj = this;
    this.click_func = function() {
	if (window.webviewinterface != null) {
	    changeStatus("interface: " + window.webviewinterface);
	    window.webviewinterface.setXmlContent(toXML());
	}
	$.post('js/xml_file.php', {xml: toXML()}, function(filename) {
		var filename = filename.replace(/[\"\']{1}/gi,"");
		filename = filename.replace('\\', '');
		var oldTag = document.getElementById("xml_div");
		if (oldTag != null)
		    document.body.removeChild(oldTag);

		//changeStatus('filename: ' + filename);
		var divTag = document.createElement("div");
		divTag.id = "xml_div";
		divTag.style.position = "absolute";
		divTag.style.width = "200px";
		divTag.style.height = "50px";
		divTag.style.zindex = "100";

		var atag = document.createElement("a");
		atag.href = "js/" + filename;
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

function RandomGenButton(controlDiv, map) {
    this.divTag = null;
    var obj = this;
    this.click_func = function() {
	$.post('js/random_map.php', {point: "point"}, function(json_code) {
		var obj = JSON.parse(json_code, function(k,v){return v});
		changeStatus(json_code);
		changeStatus(obj);
		changeStatus(sizeof(obj));
	    });
	changeStatus("Random DONE");
	
    };
    PButton.apply(this, arguments);
    this.controlText.innerHTML = "Random Map";
    this.controlUI.title = 'Click to generate random map';
}
