function getBaseURL() {
   return location.protocol + "//" + location.hostname + 
      (location.port && ":" + location.port) + "/";
}
function cutHex(h) { return (h.charAt(0)=="#") ? h.substring(1,7) : h}
function hexToRGB(hex, type) {
	if (hex[0] != '#') {
		return hex;
	}
	var h = hex.substring(1,7);
	if (!type) {
		return 'rgb(' + parseInt((h).substring(0,2),16) + ', ' + parseInt((h).substring(2,4),16) + ', ' + parseInt((h).substring(4,6),16) + ')';
	} else {
		return {'r': parseInt((h).substring(0,2),16), 'g': parseInt((h).substring(2,4),16), 'b': parseInt((h).substring(4,6),16)};
	}
}
function rgb2hex(rgb) {
	if (rgb[0] != 'r') {
		return rgb;
	}
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}
function getPixelColour(data, x, y, width, type) { // returns an RGBa object/string. imageData.data, x, y, canvas.width, type
	if (x < 0 || x > width || y < 0 || y > data.length /4 /width) {
		return -1;
	}
	var i = y * width + x;
	if (i > data.length -4) {
		return -1;
	}
	if (!type) {
		return {'r': data[i*4], 'g': data[i*4 +1], 'b': data[i*4 +2], 'a': data[i*4 +3]};
	} else {
		return 'rgb(' + data[i*4] + ', ' + data[i*4 +1] + ', ' + data[i*4 +2] + ')';
	}
}
function getPixelColourRaw(data, i, type) { // returns an RGBa object/string
	if (!type) {
		return {'r': data[i], 'g': data[i +1], 'b': data[i +2], 'a': data[i +3]};
	} else {
		return 'rgb(' + data[i] + ', ' + data[i +1] + ', ' + data[i +2] + ')';
	}
}
function setPixelColour(data, x, y, width, r, g, b) {
	var i = y * width + x;
	data[i*4] = r;
	data[i*4 +1] = g;
	data[i*4 +2] = b;
	return data;
}
function setPixelColourRaw(data, i, r, g, b) {
	data[i] = r;
	data[i+1] = g;
	data[i+2] = b;
	return data;
}

function rgb_to_cielab(r, g, b) {
	var xyz = rgb_to_xyz(r/255, g/255, b/255);
	return xyz_to_cielab(xyz[0], xyz[1], xyz[2]);
}

function rgb_to_xyz(r, g, b) {
	if (r > 0.04045) {
		r = Math.pow(((r + 0.055) / 1.055), 2.4);
	} else {
		r = r / 12.92;
	}
	if (g > 0.04045) {
		g = Math.pow(((g + 0.055) / 1.055), 2.4);
	} else {
		g = g / 12.92;
	}
	if (b > 0.04045) {
		b = Math.pow(((b + 0.055) / 1.055), 2.4);
	} else {
		b = b / 12.92;
	}
	r = r * 100;
	g = g * 100;
	b = b * 100;
	x = r * 0.4124 + g * 0.3576 + b * 0.1805;
	y = r * 0.2126 + g * 0.7152 + b * 0.0722;
	z = r * 0.0193 + g * 0.1192 + b * 0.9505;
	return [x, y, z];
}
 
function xyz_to_cielab(x, y, z) {
	x /= 95.047;
	y /= 100.000;
	z /= 108.883;
	if (x > 0.008856)
		x = Math.pow(x, (1 / 3));
	else
		x = (7.787 * x) + (16 / 116);
	if (y > 0.008856)
		y = Math.pow(y, (1 / 3));
	else
		y = (7.787 * y) + (16 / 116);
	if (z > 0.008856)
		z = Math.pow(z, (1 / 3));
	else
		z = (7.787 * z) + (16 / 116);
	L = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);
	return [L, a, b];
}

function euclidian_distance(v1, v2) {
	var d = 0;
	for (var i = 0; i < v1.length; i++) {
		d += Math.pow((v1[i] - v2[i]), 2);
	}
	return Math.sqrt(d);
}

function closestColour(palette, colour) {
	colour = rgb_to_cielab(colour.r, colour.g, colour.b);
	var lowest, index, distance, clab;
	for (var i = 0; i < palette.length; i++) {
		clab = rgb_to_cielab(palette[i].r, palette[i].g, palette[i].b);
		distance = euclidian_distance(clab, colour);
		if (lowest === undefined || distance < lowest) {
			lowest = distance;
			index = i;
		}
	}
	return index;
}

function fillArea(data, x, y, width, height, canvasw, r, g, b) {
	for (var i = 0; i < height; i++) {
		for (var j = 0; j < width; j++) {
			data = setPixelColour(data, x+j, y+i, canvasw, r, g, b);
		}
	}
	return data;
}
function floodFill(context, x, y, replace, blocksize) {
	blocksize.w = parseInt(blocksize.w);
	blocksize.h = parseInt(blocksize.h);
	var width = context.canvas.width;
	var imagedata = context.getImageData(0, 0, width, context.canvas.height);
	var data = imagedata.data;
	var replacergb = hexToRGB(replace);
	var replace = hexToRGB(replace, 1);
	var targetrgb = getPixelColour(data, x, y, width, 1);
	var targethex = rgb2hex(targetrgb);
	if (targetrgb == replacergb || targetrgb == -1) {
		return false;
	}
	var q = [];
	q.push([x,y]);
	while (q.length > 0) {
		var n = q.pop();
		if (getPixelColour(data, n[0]+1, n[1]+1, width, 1) == targetrgb) {
			data = fillArea(data, n[0], n[1], blocksize.w, blocksize.h, width, replace.r, replace.g, replace.b);
			q.push([n[0] - blocksize.w, n[1]]);
			q.push([n[0] + blocksize.w, n[1]]);
			q.push([n[0], n[1] - blocksize.h]);
			q.push([n[0], n[1] + blocksize.h]);
		}
	}
	imagedata.data = data;
	context.putImageData(imagedata, 0, 0);
	return true;
}

function imageToIRC(canvas, image, palette, blocksize, width, height, callback) {
	var tmppalette = [];
	for (var i=0; i < palette.length; i++) {
		tmppalette.push(rgb2hex(palette[i]));
	}
	hexpalette = tmppalette;
	tmppalette = [];
	for (var i=0; i < palette.length; i++) {
		tmppalette.push(hexToRGB(palette[i], 1));
	}
	rgbpalette = tmppalette;
	var context = canvas.getContext("2d");
	canvas.width = blocksize.w * width;
	canvas.height = blocksize.h * height;
	var tmpcanvas = document.createElement("canvas");
	var ctx = tmpcanvas.getContext("2d");
	tmpcanvas.width = width;
	tmpcanvas.height = height;
	ctx.drawImage(image, 0, 0, tmpcanvas.width, tmpcanvas.height);
	var colouridx, lastcolouridx, currColour, currX = 0, currY = 0;
	imagedata = ctx.getImageData(0, 0, tmpcanvas.width, tmpcanvas.height);
	for(var i = 0; i <= imagedata.data.length -4; i += 4) { // loops through the imagedata.data of a resized image of which every pixel represents a block to write to the original canvas
		currColour = getPixelColourRaw(imagedata.data, i);
		if (currColour.a == 0 && currColour.r == 0 && currColour.g == 0 && currColour.b == 0) {
			colouridx = 0;
		} else {
			colouridx = closestColour(rgbpalette, currColour);
		}
		if (colouridx != lastcolouridx) {
			context.fillStyle = hexpalette[colouridx];
			lastcolouridx = colouridx;
		}
		context.fillRect(currX * blocksize.w, currY * blocksize.h, blocksize.w, blocksize.h);
		currX += 1;
		if (currX == tmpcanvas.width) {
			currX = 0;
			currY += 1;
		}
	}
	if (callback !== undefined) {
		callback();
	}
	return true;
}

function canvasResize(canvas, width, height, side, bgcolour) { // TODO: implement side
	var context = canvas.getContext("2d");
	var imagedata = context.getImageData(0, 0, canvas.width, canvas.height);
	canvas.width = width;
	canvas.height = height;
	if (bgcolour !== undefined) {
		context.fillStyle = bgcolour;
		context.fillRect(0, 0, canvas.width, canvas.height);
	}
	context.putImageData(imagedata, 0, 0);
	return true;
}
function canvasChangeColours(canvas, oldpalette, newpalette) {
	// convert arrays from hex strings to rgb objects/string
	var tmppalette = [];
	var tmpstrpalette = [];
	for (i=0; i < oldpalette.length; i++) {
		tmppalette.push(hexToRGB(oldpalette[i], 1));
		tmpstrpalette.push(hexToRGB(oldpalette[i]));
	}
	oldpalette = tmppalette;
	oldpalettestr = tmpstrpalette;
	tmppalette = [];
	tmpstrpalette = [];
	for (i=0; i < newpalette.length; i++) {
		tmppalette.push(hexToRGB(newpalette[i], 1));
		tmpstrpalette.push(hexToRGB(newpalette[i]));
	}
	newpalette = tmppalette;
	newpalettestr = tmpstrpalette;
	// go through the imagadata.data
	var context = canvas.getContext("2d");
	imagedata = context.getImageData(0, 0, canvas.width, canvas.height);
	var data = imagedata.data;
	for (var i = 0; i <= data.length -4; i += 4) {
		colouridx = oldpalettestr.indexOf(getPixelColourRaw(data, i, 1));
		if (colouridx >= 0) {
			data = setPixelColourRaw(data, i, newpalette[colouridx].r, newpalette[colouridx].g,  newpalette[colouridx].b);
		}
	}
	imagedata.data = data;
	context.putImageData(imagedata, 0, 0);
	return true;
}

function canvasTrim(canvas, blocksize, bgcolour) { // trims the canvas
	blocksize.w = parseInt(blocksize.w);
	blocksize.h = parseInt(blocksize.h);
	bgcolour = hexToRGB(bgcolour);
	var context = canvas.getContext("2d");
	var imagedata = context.getImageData(0, 0, canvas.width, canvas.height);
	var row = canvas.width *4;
	var columnjump = blocksize.w *4;
	var rowjump = canvas.width * blocksize.h *4; // pixels per row * 4 (RGBa)
	var i = 0, top, bottom, left = canvas.width, right = 0, currX = 0, currY = 0;
	while (i <= imagedata.data.length -4) {
		if (getPixelColourRaw(imagedata.data, i, 1) != bgcolour) {
			if (top === undefined) {
				top = currY;
			}
			if (currX < left) {
				left = currX;
			}
			if (currX > right) {
				right = currX;
			}
			bottom = currY;
		}
		i += columnjump;
		currX += 1;
		if ((i % row) == 0) {
			i += rowjump -row;
			currX = 0;
			currY += 1;
		}
	}
	if (top === undefined) {
		return false;
	}
	var x = left * blocksize.w;
	var y = top * blocksize.h;
	var w = (right - left) * blocksize.w + blocksize.w;
	var h = (bottom - top) * blocksize.h + blocksize.h;
	var newimage = context.getImageData(x, y, w, h);
	canvas.width = w;
	canvas.height = h;
	context.putImageData(newimage, 0, 0);
	return true;
}

function canvasToIRC(canvas, colours, blocksize, convert) {
	if (convert !== undefined) {
		var tempcolours = [];
		for(i=0; i < colours.length; i++) {
			tempcolours.push(hexToRGB(colours[i]));
		}
		colours = tempcolours;
	}
	var context = canvas.getContext("2d");
	var imagedata = context.getImageData(0, 0, canvas.width, canvas.height);
	var columnjump = blocksize.w *4;
	var rowjump = canvas.width * blocksize.h *4; // pixels per row * 4 (RGBa)
	var row = canvas.width *4
	var k = '';
	var sep = 'X';
	IRCstr = "";
	var lastcolour = -1;
	var i = 0;
	var colour;
	while (i <= imagedata.data.length -4) {
		colour = colours.indexOf(getPixelColourRaw(imagedata.data, i, 1));
		if (colour >= 0) {
			if (colour == lastcolour) {
				IRCstr += sep;
			} else {
				IRCstr += k + colour + "," + colour + sep;
				lastcolour = colour;
			}
		} else {
			// TODO: colour didnt match - implement abort
		}
		i += columnjump;
		if ((i % row) == 0) {
			IRCstr += "\r\n";
			lastcolour = -1;
			i += rowjump -row;
		}
	}
	return IRCstr;
}

function IRCtoCanvas(canvas, palette, blocksize, irc) {
	blocksize.w = parseInt(blocksize.w);
	blocksize.h = parseInt(blocksize.h);
	var tmppalette = [];
	for (i=0; i < palette.length; i++) { // convert the palette array into an hex array
		tmppalette.push(rgb2hex(palette[i]));
	}
	newpalette = tmppalette;
	irc = irc.split(/\r\n|\r|\n/);
	canvas.width = irc[0].replace(/[0-9\,]/g, '').length * blocksize.w;
	canvas.height = irc.length * blocksize.h - blocksize.h;
	var context = canvas.getContext("2d");
	var line, seppos, x = 0, y = 0, lwidth;
	for (var i=0; i < irc.length; i++) {
		line = irc[i].split("");
		for (var j=0; j < line.length; j++) {
			if (line[j].length > 0) {
				seppos = line[j].indexOf(",");
				context.fillStyle = palette[parseInt(line[j].substr(0,seppos))];
				lwidth = (line[j].length - seppos *2 -1) * blocksize.w;
				context.fillRect(x, y, lwidth, blocksize.h);
				x += lwidth;
			}
		}
		x = 0;
		y += blocksize.h;
	}
}

function addImageDataState(state, context) {
	if (state.states.length > state.current) {
		state.states.splice(state.current, state.states.length - state.current);
	}
	state.states.push(context.getImageData(0, 0, canvas.width, canvas.height));
	if (state.current > 0 && $("#undo").hasClass("btn-disabled")) {
		$("#undo").removeClass("btn-disabled").removeAttr("disabled");
	}
	if (!$("#redo").hasClass("btn-disabled")) {
		$("#redo").addClass("btn-disabled").attr("disabled", "disabled");
	}
	state.current += 1;
	return state;
}

function generateClick() {
	var currentColours = [];
	$("#palette a li").each(function() {
		currentColours.push(rgb2hex($(this).css("background-color")));
	});
	$("#gentextarea").text(canvasToIRC(canvas, currentColours, blocksize, 1)).show(500);
	return false;
}

function undoClick() {
	if (state.current > 1) {
		state.current -= 1;
		context.putImageData(state.states[state.current -1], 0, 0);
		if (state.current == 1) {
			if (!$("#undo").hasClass("btn-disabled")) {
				$("#undo").addClass("btn-disabled").attr("disabled", "disabled");
			}
		}
		if ($("#redo").hasClass("btn-disabled")) {
			$("#redo").removeClass("btn-disabled").removeAttr("disabled");
		}
	}
}

function redoClick() {
	if (state.current < state.states.length) {
		state.current += 1;
		context.putImageData(state.states[state.current -1], 0, 0);
		if (state.current == state.states.length) {
			if (!$("#redo").hasClass("btn-disabled")) {
				$("#redo").addClass("btn-disabled").attr("disabled", "disabled");
			}
		}
		if ($("#undo").hasClass("btn-disabled")) {
			$("#undo").removeClass("btn-disabled").removeAttr("disabled");
		}
	}
	return false;
}

colours = [
	{
		"name": "mIRC",
		"colours": ["#ffffff", "#000000", "#00007f", "#009300", "#ff0000", "#7f0000", "#9c009c", "#fc7f00", "#ffff00", "#00fc00", "#009393", "#00ffff", "#0000fc", "#ff00ff", "#7f7f7f", "#d2d2d2"]
	},
	{
		"name": "Irssi",
		"colours": ["#d3d7cf", "#2e3436", "#3465a4", "#4e9a06", "#cc0000", "#ca0001", "#74507b", "#c4a000", "#c4a001", "#519a06", "#06989a", "#069899", "#3465a3", "#75507b", "#2e3435", "#d3d7ce"]
	}
];

$(document).ready(function() {
	$.each(colours, function(key, value) {   
		$("#colourScheme").append($("<option></option>").attr("value",key).text(value.name)); 
	});
	$.each(colours[0].colours, function(key, value) {
		$($("#palette li")[key]).css("background-color", value);
	});
	blocksize = {'w': $("#cellwidth").val(), 'h': $("#cellheight").val()}; // 450x100 yields a 30*5 matrix
	canvas = document.getElementById("myCanvas");
	canvas.width = blocksize.w * $("#columns").val();
	canvas.height = blocksize.h * $("#rows").val();
	context = canvas.getContext("2d");
	context.rect(0, 0, canvas.width, canvas.height);
	context.fillStyle = rgb2hex($($("#palette li")[0]).css("background-color"));
	context.fill();
	currentpalette = [];
	state = {"current": 0, "states": []};
	state = addImageDataState(state, context); // save the initial state of ImageData
	mousestate = false;
	$("canvas").bind({
		mousedown: function(e) {
			if (e.which === 3) { // if right click - change colours
				var current = $("#current").css("background-color");
				var altcolour = $("#altcolour").css("background-color");
				$("#current").css("background-color", altcolour);
				$("#altcolour").css("background-color", current);
				return;
			}
			context.fillStyle = rgb2hex($("#current").css("background-color"));
			offset = $(this).offset();
			var x = e.pageX - offset.left -1;
			var y = e.pageY - offset.top -1;
			var sx = Math.floor(x/blocksize.w) * blocksize.w;
			var sy = Math.floor(y/blocksize.h) * blocksize.h;
			if ($("#draw-tools button.active").attr("id") == "pencil") {
				context.fillRect(sx, sy, blocksize.w, blocksize.h);
				$(this).bind("mousemove", function(e) {
					x = e.pageX - offset.left -1;
					y = e.pageY - offset.top -1;
					
					sx = Math.floor(x/blocksize.w) * blocksize.w;
					sy = Math.floor(y/blocksize.h) * blocksize.h;
					if (sx >= 0 && sy >= 0) {
						context.fillRect(sx, sy, blocksize.w, blocksize.h);
					}
				});
				mousestate = true;
			} else if ($("#draw-tools button.active").attr("id") == "flood") {
				floodFill(context, sx, sy, context.fillStyle, blocksize);
			}
		},
		mouseup: function() {
			$(this).unbind("mousemove");
			state = addImageDataState(state, context);
			mousestate = false;
		},
		mouseleave: function() {
			if (mousestate) {
				$(this).unbind("mousemove");
				state = addImageDataState(state, context);
				mousestate = false;
			}
		},
		contextmenu: function() {
			return false;
		}
	});
	$("#undo").click(function() {
		undoClick();
	});
	$("#redo").click(function() {
		redoClick();
	});
	$(document).keydown(function(e){
		if (e.which === 90 && e.ctrlKey){ // Ctrl+z
			undoClick();
		}
		else if( e.which === 89 && e.ctrlKey ){ // Ctrl+y
			redoClick();
		}          
	});
	$("#trim").click(function() {
		canvasTrim(canvas, blocksize, $($("#palette li")[0]).css("background-color"));
	});
	$("#palette a").bind({
		mousedown: function(e) {
			if (e.which === 3) { // if right click - change alt colour
				$("#activepalette #altcolour").css("background-color", $(this).children("li").css("background-color"));
				return;
			}
			$("#activepalette #current").css("background-color", $(this).children("li").css("background-color"));
		},
		dblclick: function() {
			$("#colourpicker").farbtastic($(this).children("li"));
			$("#colourpicker").css("display", "block");
			currentpalette = [];
			$("#palette li").each(function() {
				currentpalette.push(rgb2hex($(this).css("background-color")));
			});
		},
		contextmenu: function() {
			return false;
		}
	});
	$("#columns").focusout(function() {
		canvasResize(canvas, $(this).val() * blocksize.w, $("#rows").val() * blocksize.h, "left", "#FFFFFF");
	});
	$("#rows").focusout(function() {
		canvasResize(canvas, $("#columns").val() * blocksize.w, $(this).val() * blocksize.h, "left", "#FFFFFF");
	});
	$("#generate").click(function() {
		generateClick();
	});
	$("#reset").click(function() {
		blocksize = {'w': $("#cellwidth").val(), 'h': $("#cellheight").val()};
		canvas.width = blocksize.w * $("#columns").val();
		canvas.height = blocksize.h * $("#rows").val();
		context = canvas.getContext("2d");
		context.rect(0, 0, canvas.width, canvas.height);
		context.fillStyle = $($("#palette li")[0]).css("background-color");
		context.fill();
		state = {"current": 0, "states": []};
		state = addImageDataState(state, context);
		if (!$("#undo").hasClass("btn-disabled")) {
			$("#undo").addClass("btn-disabled").attr("disabled", "disabled");
		}
		if (!$("#redo").hasClass("btn-disabled")) {
			$("#redo").addClass("btn-disabled").attr("disabled", "disabled");
		}
	});
	$("#colourScheme").change(function() {
		var oldpalette = [];
		$("#palette li").each(function() {
			oldpalette.push(rgb2hex($(this).css("background-color")));
		});
		var newpalette = colours[$(this).val()].colours;
		var palettes = $("#palette li");
		$.each(newpalette, function(key, value) {
			$(palettes[key]).css("background-color", value);
		});
		$("#current").css("background-color", newpalette[1]);
		$("#altcolour").css("background-color", newpalette[0]);
		canvasChangeColours(canvas, oldpalette, newpalette);
	});
	$("#gentextarea").click(function() {
		$(this).select();
	});
	$("#image-upload, #image-close").click(function() {
		$("#image-upload-container").toggle(600);
	});
	$("#image-generate").click(function() {
		var files = $("#image-upload-container #fileInput").get(0).files;
		if (files.length == 1) {
			var currentColours = [];
			$("#palette a li").each(function() {
				currentColours.push(rgb2hex($(this).css("background-color")));
			});
			var blocksize = {"w": $("#image-cell-width").val(), "h": $("#image-cell-height").val()};
			files = files[0];
			if (files.type.match('image.*')) {
				var reader = new FileReader();
				reader.onload = (function(files) {
					return function(e) {
						img = new Image();
						img.onload = (function(img) {
							return function(e) {
								imageToIRC(canvas, img, currentColours, blocksize, $("#image-width").val(), $("#image-height").val(), generateClick);
							}
						})(img);
						img.src = e.target.result;
					}
				})(files);
				reader.readAsDataURL(files);
			}
			$("#image-upload-container").toggle(600);
		}
	});
	$("#draw-tools button").click(function() {
		if (!$(this).hasClass("active")) {
			$(this).siblings(".active").removeClass("active");
			$(this).addClass("active");
		}
	});
	$(".sidebar form input[type=text], #gentextarea, #image-upload-container input[type=text], #trim").tooltip({placement: "right"});
});
