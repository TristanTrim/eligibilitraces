
var xPix = 20;
var yPix = 16;


function start(){
	var valueCanvas = document.getElementById("valueCanvas");
	var valueContext = valueCanvas.getContext("2d");

	var gridCanvas = document.getElementById("gridWorldCanvas");
	var gridContext = gridCanvas.getContext("2d");

	valueContext.fillStyle = "#000000";
	pixWidth = valueCanvas.width/xPix;
	pixHeight = valueCanvas.height/yPix;
	for (x=0;x<xPix;){
		for (y=0;y<yPix;){
			valueContext.fillRect(x*pixWidth, y*pixHeight, pixWidth, pixHeight);
			gridContext.fillRect(x*pixWidth, y*pixHeight, pixWidth, pixHeight);
			y+=2;
		}
		x+=2;
	}

	//valueContext.stroke();
}

//document.addEventListener("load", start);// I don't work.
//document.onload = start;// I don't work
window.onload = start; // I work!!!
