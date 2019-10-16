// All code in this document is entirely fictional. All algorithms
// are impersonated... poorly. The following code contains weird
// variable names and due to its contents it should not be viewed
// by anyone.


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
var running = false;
var agent;
var env;
var valueFunction;

var stepcount;
var agentLocation;
var nActions;
var policy;

var imgTailLength = 200;
var logicTailLength = 20;


function initialize(){
	// canvas setup
	var valueCanvas = document.getElementById("valueCanvas");
	var valueContext = valueCanvas.getContext("2d");

	var gridCanvas = document.getElementById("gridWorldCanvas");
	var gridContext = gridCanvas.getContext("2d");

	function getMousePos(canvas, evt) {
	    var rect = canvas.getBoundingClientRect();
	    return([Math.floor((evt.clientX - rect.left)/pixWidth),
	       Math.floor((evt.clientY - rect.top)/pixHeight)]);
	}
	gridCanvas.onclick = function(ev){
		coords = getMousePos(gridCanvas, ev);
		console.log("coords: "+coords);
		env.toggleGoal(coords);
	};

	//styling in js cause I am the worst.
	valueCanvas.style.borderStyle = "solid"; 
	gridCanvas.style.borderStyle = "solid"; 

	gridContext.fillStyle = "#000000";
	pixWidth = valueCanvas.width/xPix;
	pixHeight = valueCanvas.height/yPix;

	// logic setup
	stepcount = 0;
	agentLocation = [0,0];
	//valueFunction = Array(xPix).fill().map(x => Array(yPix).fill().map(x => 1.5+Math.random()));
	valueFunction = Array(xPix).fill().map(x => Array(yPix).fill().map(x => 4));
	 nActions = 4;
	 policy = Array(xPix).fill().map(x => Array(yPix).fill().map(x => Array(nActions).fill(1/nActions)));

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
	};
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

	// Cider Sliders! lol jk, they are html sliders!
	simSpeedSlider = document.getElementById("SimSpeed");
	simSpeedSlider.onclick = function(){
		if (this.value > 50){
			skinnerbox = 1;
			delayBetweenSteps = 0;
			stepsBetweenDraw = 0.1*(this.value-50)*(this.value-50);
		}else{
			skinnerbox = 0;
			stepsBetweenDraw = 1;
			delayBetweenSteps = 3*(50 - this.value);
		}
		console.log("steps: "+stepsBetweenDraw+" delays: "+delayBetweenSteps);
	}
	simSpeedSlider.onclick();

	alphaSlider = document.getElementById("Alpha");
	alphaSlider.onclick = function(){
		alpha = this.value;
		console.log("alpha set to: "+alpha);
	}
	alphaSlider.value = 0.1;

	// Half baked environment sim
	function agentUp(){agentLocation[1]-=1; return 0}
	function agentRight(){agentLocation[0]+=1; return 0}
	function agentDown(){agentLocation[1]+=1; return 0}
	function agentLeft(){agentLocation[0]-=1; return 0}
	function agentNull(){return 0}
	function agentWin(){ agentLocation = [0,0]; return 1;
	}
	var env = {}
	// basic gridworld
	env.stateActions = Array(xPix).fill().map(x => Array(yPix).fill().map(x =>
		[agentUp,agentRight,agentDown,agentLeft]));
//	// left boarder
//	env.stateActions[0] = env.stateActions[0].map(x =>
//		[agentUp,agentRight,agentDown,agentNull]);
//	// right boarder
//	env.stateActions[xPix-1] = env.stateActions[xPix-1].map(x =>
//		[agentUp,agentNull,agentDown,agentLeft]);
//	// top boarder
//	env.stateActions.map(x => x.splice(0,1,x[0].splice(0,1,agentNull)));// readability? where we're going, we don't need readability!
//	// bottom boarder
//	env.stateActions.map(x => x.splice(yPix-1,1,x[yPix-1].splice(2,1,agentNull)));
	// environment dynamics function!
	env.step = function (choice) {
		x = agentLocation[0];
		y = agentLocation[1];
		r = this.stateActions[x][y][choice]();
		return r;
	}
	function coordSet(){//its not good, but it works.
		this.array = Array();
		this.add = function(coord){
			found = this.del(coord)
			this.array.push(coord);
			return found;
		}
		this.del = function(coord){
			// returns true if found and deleted else false;
			found=false;
			for(ii=0;ii<this.array.length;ii++){
				if (coord[0] == this.array[ii][0]
					&& coord[1] == this.array[ii][1]){
					this.array.splice(ii, 1);
					found=true;
				}
			}
			return found;
		}
	}
	env.goals = new coordSet();// don't touch
	env.blocks = new coordSet();// hands off!
	env.toggleGoal = function(coord){
		if(this.goals.del(coord)){
			env.stateActions[coord[0]][coord[1]] = [agentUp,agentRight,agentDown,agentLeft];
		}else{
			this.goals.add(coord);
			env.stateActions[coord[0]][coord[1]] = [agentWin,agentWin,agentWin,agentWin];
		}
		draw()
	}

		
	env.toggleGoal([xPix-2,0]);
	env.toggleGoal([xPix-2,yPix-5]);// these are good goal locations. Don't tell the agent where they are.
//	for(i = 0; i<yPix; i++){
//		env.toggleBlock([10,i]);
//		if (i == 10) i++;
//	}


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
		for(ii=0;ii<env.goals.array.length;ii++){
			x = env.goals.array[ii][0];
			y = env.goals.array[ii][1];
			gridContext.fillRect(x*pixWidth, y*pixHeight, pixWidth, pixHeight);
		}

		// Draw valueFunction
		for (x=0;x<xPix;x++){
			for (y=0;y<yPix;y++){
				//+x+y+valueFunction[x][y];// whaaa?
				valueContext.fillStyle = 
					`rgb(
						0,
						${50*valueFunction[x][y]},
						${50*valueFunction[x][y]}
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
	function logicUpdate() {
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
	}

	toggle = function (){
		running=!running;
		if(running) continueLogic();
	}

	// Main loop! Get outta here async programming!
	function continueLogic() {
		stepcount++;
		draw();
		logicUpdate();
		if(running) setTimeout(continueLogic, delayBetweenSteps);
	}
	draw();
	//continueLogic();
}

//document.addEventListener("load", initialize);// I don't work.
//document.onload = initialize;// I don't work
window.onload = initialize; // I work!!!
