
// keep as multiples of 13 and 7 cause pretty.
pixScale = 3;
var xPix = 13 *pixScale;
var yPix = 7  *pixScale;
var alpha = 0.05; // alpha is ml for learning update rate
var gamma = 0.99; // gamma is ml for future is fuzzy coefficient
var lambda = 0.95; // lam' is ml for decay rate of states eligibility as action
			// that influinced current reward... Thats a mouthful.
var jadedness = 0.0001; // jadedness is the amount the agent needs to be surprised before it will update value functions
				// I made this up. It's not a real ml thing.
var stepsBetweenDraw = 10;
var delayBetweenSteps = 0;
var skinnerbox = 1;

var toggle;
var agent;
var valueFunction;

var imgTailLength = 200;
var logicTailLength = 20;

function initialize(){
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

	simSpeedSlider = document.getElementById("SimSpeed");
	simSpeedSlider.onclick = function(){
		if (this.value > 50){
			skinnerbox = 1;
			stepsBetweenDraw = 5*(this.value-50);
		}else{
			skinnerbox = 0;
			stepsBetweenDraw = 1;
			delayBetweenSteps = 3*(50 - this.value);
		}
		console.log(stepsBetweenDraw,delayBetweenSteps);
	}
	simSpeedSlider.onclick();

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
		if(agentLocation[0]==goalLocation1[0] && agentLocation[1]==goalLocation1[1]){// ahh this is not how to do multiple goals go home and sleep!
			agentLocation=[0,0];
			return 1;
		}else if(agentLocation[0]==goalLocation2[0] && agentLocation[1]==goalLocation2[1]){
			agentLocation=[0,0];
			return 1;
		}else{
			return 0;
		}

	}

	function probabilityNormalizer(probs){

		//probs = probs.map(x => Math.pow(x,10)); // power is heavy

		max = probs.reduce((a,b)=> a>b?a:b);
		probs = probs.map(x => max + 0.000001 - x);// <-- This parameter is important
		probs = probs.map(x => 1 / x);

		//min = probs.reduce((a,b)=>a>b?b:a);
		//probs = probs.map(x => x-min);

		//normalize to p mass = 1
		sum = probs.reduce((a,b)=> a+b,0);
		probs = probs.map(x => x/sum);
		return probs
	}
	

	// logic setup
	var stepcount = 0;
	var agentLocation = [0,0];
	var goalLocation1 = [xPix-2,yPix-2];// psst, don't tell the agent we hard coded this.
	var goalLocation2 = [xPix-2,yPix-5];// psst, don't tell the agent we hard coded this.
	//valueFunction = Array(xPix).fill().map(x => Array(yPix).fill().map(x => 1.5+Math.random()));
	valueFunction = Array(xPix).fill().map(x => Array(yPix).fill().map(x => 2));
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
				policy[x][y] = probabilityNormalizer(moves);
			}
		}
	}
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
		gridContext.fillRect(goalLocation1[0]*pixWidth, goalLocation1[1]*pixHeight, pixWidth, pixHeight);
		gridContext.fillRect(goalLocation2[0]*pixWidth, goalLocation2[1]*pixHeight, pixWidth, pixHeight);
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
		draw();
		for(ii=0;ii<stepsBetweenDraw + skinnerbox*stepsBetweenDraw*Math.random();ii++) {
			oldX=agentLocation[0];
			oldY=agentLocation[1];
			roll = Math.random();
			action = agent.choose(agentLocation);
			//if(stepcount%100==10) console.log(action);
			reward = env.step(action);
			newX=agentLocation[0];
			newY=agentLocation[1];
			surprise = reward + gamma*valueFunction[newX][newY] - valueFunction[oldX][oldY];// a surprise can be positive or negative.
			if (Math.abs(surprise) > jadedness) {
				eligibility = 1;
				for (jj=agent.eligibilityQueue.length-1; !(jj<0 || jj<agent.eligibilityQueue.length-logicTailLength); jj--){
					x = agent.eligibilityQueue[jj][0];
					y = agent.eligibilityQueue[jj][1];
					valueFunction[x][y] = valueFunction[x][y] + alpha * surprise * eligibility;
					eligibility = gamma * lambda * eligibility;
				}
				agent.policyUpdate();
			}
			// remove old eligibilities of state if already in eligibilityQueue
			for(jj=agent.eligibilityQueue.length-1; jj>=0; jj--){
				if (agent.eligibilityQueue[jj][0] == newX
					&& agent.eligibilityQueue[jj][1] == newY){
					agent.eligibilityQueue.splice(jj, 1);
				}
			}
			agent.eligibilityQueue.push([newX,newY]);
			if((agent.eligibilityQueue.length > imgTailLength) || (stepcount%4 ==0 && agent.eligibilityQueue.length>1)) agent.eligibilityQueue.shift();
			if(reward) console.log("Yay");
		}
		if(running) setTimeout(continueLogic, delayBetweenSteps);
	}
	draw();
	//continueLogic();
}

//document.addEventListener("load", initialize);// I don't work.
//document.onload = initialize;// I don't work
window.onload = initialize; // I work!!!
