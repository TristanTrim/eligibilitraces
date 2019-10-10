
var xPix = 40;
var yPix = 32;


function start(){
	// canvas setup
	var valueCanvas = document.getElementById("valueCanvas");
	var valueContext = valueCanvas.getContext("2d");

	var gridCanvas = document.getElementById("gridWorldCanvas");
	var gridContext = gridCanvas.getContext("2d");

	//valueContext.fillStyle = "#000000";
	pixWidth = valueCanvas.width/xPix;
	pixHeight = valueCanvas.height/yPix;

	var env = {}
	env.step = function () {
		let roll = Math.random();
		if(roll<0.25){
			if(agentLocation[0]<xPix) agentLocation[0]++;
		}else if(roll<.5){
			if(agentLocation[1]<yPix) agentLocation[1]++;
		}else if(roll<.75){
			if(agentLocation[0]>0) agentLocation[0]--;
		}else{
			if(agentLocation[1]>0) agentLocation[1]--;
		}
	}


	// logic setup
	var stepcount = 0;
	var agentLocation = [0,0];

	//
	function draw() {
		gridContext.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
		valueContext.clearRect(0, 0, valueCanvas.width, valueCanvas.height);
		gridContext.fillRect(agentLocation[0]*pixWidth, agentLocation[1]*pixHeight, pixWidth, pixHeight);
		for (x=0;x<xPix;x++){
			for (y=0;y<yPix;y++){
				valueContext.fillStyle = "#00"+x+y;
				gridContext.fillStyle = "#0"+x+y;
				valueContext.fillRect(x*pixWidth, y*pixHeight, pixWidth, pixHeight);
			}
		}
	}

	function continueLogic() {
		stepcount++;
		for(i=0;i<10;i++) env.step();
		draw();
		setTimeout(continueLogic, 100);
	}
	continueLogic();
}

//document.addEventListener("load", start);// I don't work.
//document.onload = start;// I don't work
window.onload = start; // I work!!!
