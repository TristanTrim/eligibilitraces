
// keep as multiples of 13 and 7 cause pretty.
pixScale = 3;
var xPix = 13 *pixScale;
var yPix = 7  *pixScale;

var toggle;
var agent;
var valueFunction;


function start(){
	// canvas setup
	var valueCanvas = document.getElementById("valueCanvas");
	var valueContext = valueCanvas.getContext("2d");

	var gridCanvas = document.getElementById("gridWorldCanvas");
	var gridContext = gridCanvas.getContext("2d");

	//styling in js cause I am the worst.
	valueCanvas.style.borderStyle = "solid"; 
	gridCanvas.style.borderStyle = "solid"; 

	gridContext.fillStyle = "#000000";
	pixWidth = valueCanvas.width/xPix;
	pixHeight = valueCanvas.height/yPix;

	var env = {}
	env.step = function (choice) {
		//let roll = Math.random();
		roll = choice/4;
		if(roll<0.25){
			if(agentLocation[1]>0) agentLocation[1]--;
		}else if(roll<.5){
			if(agentLocation[0]<xPix-1) agentLocation[0]++;
		}else if(roll<.75){
			if(agentLocation[1]<yPix-1) agentLocation[1]++;
		}else{
			if(agentLocation[0]>0) agentLocation[0]--;
		}
		if(agentLocation[0]==goalLocation[0] && agentLocation[1]==goalLocation[1]){
			agentLocation=[0,0];
			return 1;
		}else{
			return 0;
		}

	}

	// logic setup
	var stepcount = 0;
	var agentLocation = [0,0];
	var goalLocation = [xPix-2,yPix-2];// psst, don't tell the agent we hard coded this.
	valueFunction = Array(xPix).fill().map(x => Array(yPix).fill().map(x => 1+Math.random()));
	var nActions = 4;
	var policy = Array(xPix).fill().map(x => Array(yPix).fill().map(x => Array(nActions).fill(1/nActions)));
	agent = {};
	agent.eligibilityQueue = [agentLocation.slice()];
	agent.choose = function(agentLocation){//I get the feeling that passing an agent it's own location is incorrect data modeling.
		action = null;
		for (jj=0;jj<nActions;jj++){
			roll -= policy[agentLocation[0]][agentLocation[1]][jj];
			if (roll<=0){
				action = jj;
				break;
			}
		}
		return action;
	}
	agent.policyUpdate = function(){
		for (x=0;x<xPix;x++){
			for (y=0;y<yPix;y++){
				moves = [];
				if( y > 0) moves.push(valueFunction[x][y-1]); else moves.push(0);
				if( x < xPix-1) moves.push(valueFunction[x+1][y]); else moves.push(0);
				if( y < yPix-1) moves.push(valueFunction[x][y+1]); else moves.push(0);
				if( x > 0) moves.push(valueFunction[x-1][y]); else moves.push(0);
				total_value = moves.reduce((a, b) => a + b, 0);//sum
				for (a=0;a<nActions;a++){ // the agent will immediately stop trying to move out of bounds.
					policy[x][y][a] = moves[a] / total_value;valueFunction[x][y-1];
	}	}	}	}
	agent.policyUpdate();
	//
	function draw() {
		// Clear screen for drawing next frame.
		gridContext.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
		valueContext.clearRect(0, 0, valueCanvas.width, valueCanvas.height);
		// Draw agent
		gridContext.fillStyle="#000"
		gridContext.fillRect(agentLocation[0]*pixWidth, agentLocation[1]*pixHeight, pixWidth, pixHeight);
		// Draw goal
		gridContext.fillStyle="#090"
		gridContext.fillRect(goalLocation[0]*pixWidth, goalLocation[1]*pixHeight, pixWidth, pixHeight);
		// Draw valueFunction
		for (x=0;x<xPix;x++){
			for (y=0;y<yPix;y++){
				+x+y+valueFunction[x][y];
				valueContext.fillStyle = 
					`rgb(
						0,
						${100*valueFunction[x][y]},
						${100*valueFunction[x][y]}
					)`;
				valueContext.fillRect(x*pixWidth, y*pixHeight, pixWidth, pixHeight);
			}
		}
		// Draw eligibilityQueue
		for (ii=agent.eligibilityQueue.length-1; ii>=0; ii--){
			x = agent.eligibilityQueue[ii][0];
			y = agent.eligibilityQueue[ii][1];
			valueContext.fillStyle = 
				`rgba(
					255,255,255,
					${.1+ii/agent.eligibilityQueue.length/2}
				)`;
			valueContext.fillRect(x*pixWidth, y*pixHeight, pixWidth, pixHeight);
		}

	}

	var running = false;
	toggle = function (){
		running=!running;
		if(running) continueLogic();
	}
	function continueLogic() {
		stepcount++;
		for(ii=0;ii<10;ii++) {
			//let action = policy.chooseAction(agentLocation);
			//env.step(action);
			roll = Math.random();
			action = agent.choose(agentLocation);
			if(stepcount%100==10) console.log(action);
			reward = env.step(action);

			agent.eligibilityQueue.push(agentLocation.slice());
			if(agent.eligibilityQueue.length > 213) agent.eligibilityQueue.shift();
			if(reward) console.log("Yay");
		}
		draw();
		if(running) setTimeout(continueLogic, 100);
	}
	continueLogic();
}

//document.addEventListener("load", start);// I don't work.
//document.onload = start;// I don't work
window.onload = start; // I work!!!
