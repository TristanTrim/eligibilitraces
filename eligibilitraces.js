// All code in this document is entirely fictional. All algorithms
// are impersonated... poorly. The following code contains weird
// variable names and due to its contents it should not be viewed
// by anyone.
// I have bits of nice language layers mixed in with lots of half
// baked waterfall design.


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
var exploration = 0.001;  // also made up by me. This is the amount to add to all value estimates every so many steps.
var explorationInterval = 100

var stepsBetweenDraw = 10;
var delayBetweenSteps = 0;
var skinnerbox = 1;

var toggle;
var running = false;
var agent;
var env = {};
env.draw = function(){};
var valueFunction;

var stepcount;
var agentLocation;
var nActions;
var policy;

var paintType = 2;
var paintTypeBuf = 2;
var mouseIsDown = false;

var imgTailLength = 300;
var logicTailLength = 20;
function setPaintType(type){paintType=type}

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
	function mousemove(ev){
		if(mouseIsDown){
			coords = getMousePos(ev.target, ev);
			if(paintType<3){
				changed = env.setSquareLogic(coords,paintTypeBuf);
				if(changed) env.draw();
			}else{
				if(paintType==3){
					valueFunction[coords[0]][coords[1]]+=0.15;
				}else if(paintType==4){
					valueFunction[coords[0]][coords[1]]*=0.95;
				}
				env.draw();
			}
		}
	}
	gridCanvas.addEventListener('mousemove', ev => mousemove(ev));
	valueCanvas.addEventListener('mousemove', ev => mousemove(ev));
	function mouseup(ev){
		mouseIsDown = false;
	}
	gridCanvas.addEventListener('mouseup', ev => mouseup(ev));
	valueCanvas.addEventListener('mouseup', ev => mouseup(ev));
	function mousedown(ev){
		coords = getMousePos(ev.target, ev);
		console.log("coords: "+coords+" paintType: "+paintType);
		if(env.stateActions[coords[0]][coords[1]][0] == paintType){
			paintTypeBuf = 0;
		}else{
			paintTypeBuf = paintType;
		}
		if(paintType<3){
			changed = env.setSquareLogic(coords,paintTypeBuf);
			if(changed) env.draw();
		}else{
			if(paintType==3){
				valueFunction[coords[0]][coords[1]]+=0.15;
			}else if(paintType==4){
				valueFunction[coords[0]][coords[1]]*=0.95;
			}
			env.draw();
		}
		mouseIsDown = true;
	}
	gridCanvas.addEventListener('mousedown', ev => mousedown(ev));
	valueCanvas.addEventListener('mousedown', ev => mousedown(ev));

	gridContext.fillStyle = "#000000";
	pixWidth = valueCanvas.width/xPix;
	pixHeight = valueCanvas.height/yPix;

	// logic setup
	stepcount = 0;
	agentLocation = [0,0];
	//valueFunction = Array(xPix).fill().map(x => Array(yPix).fill().map(x => 1.5+Math.random()));
	valueFunction = Array(xPix).fill().map(x => Array(yPix).fill().map(x => 4));
	 nActions = 4;
	 policy = Array(xPix).fill().map(x => Array(yPix).fill().map(y => Array(nActions-(x==0?1:0)-(y==0?1:0)-(x==xPix-1?1:0)-(y==yPix-1?1:0)).fill(1/nActions)));

	agent = {};
	agent.eligibilityQueue = [agentLocation.slice()];
	agent.choose = function(agentLocation){//I get the feeling that passing an agent it's own location is incorrect data modeling.
		cx=agentLocation[0];
		cy=agentLocation[1];
		action = null;
			roll = Math.random();
		for (jj=0;jj<policy[cx][cy].length;jj++){// I don't think it actually needs to know how many actions... it will break just as well if it loops to long either way.
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
				if( y > 0){ moves.push(valueFunction[x][y-1]); }
				if( x < xPix-1){ moves.push(valueFunction[x+1][y]); }
				if( y < yPix-1){ moves.push(valueFunction[x][y+1]); }
				if( x > 0){ moves.push(valueFunction[x-1][y]); }
				policy[x][y] = probabilityNormalizer(moves);
				/// this was a clever way to solve a problem that it was not clever to have had.
			////////moves = [];
			////////mask = [];
			////////let iii=1;
			////////if( y > 0){
			////////	moves.push(valueFunction[x][y-1]);
			////////	mask.push(iii++);
			////////}else{
			////////	mask.push(0);
			////////}
			////////if( x < xPix-1){
			////////	moves.push(valueFunction[x+1][y]);
			////////	mask.push(iii++);
			////////}else{
			////////	mask.push(0);
			////////}
			////////if( y < yPix-1){
			////////	moves.push(valueFunction[x][y+1]);
			////////	mask.push(iii++);
			////////}else{
			////////	mask.push(0);
			////////}
			////////if( x > 0){
			////////	moves.push(valueFunction[x-1][y]);
			////////	mask.push(iii);
			////////}else{
			////////	mask.push(0);
			////////}
			////////policyBuf = [0].concat(probabilityNormalizer(moves));
			////////for(iii=0;iii<4;iii++){
			////////	policy[x][y][iii] = policyBuf[mask[iii]];
			////////}
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
	alphaSlider.onclick();

	gammaSlider = document.getElementById("Gamma");
	gammaSlider.onclick = function(){
		gamma = this.value;
		console.log("gamma set to: "+gamma);
		env.draw();
	}
	gammaSlider.onclick();

	lambdaSlider = document.getElementById("Lambda");
	lambdaSlider.onclick = function(){
		lambda = this.value;
		console.log("lambda set to: "+lambda);
		env.draw()
	}
	lambdaSlider.onclick();

	//	 Half baked environment sim
	function agentUp(){agentLocation[1]-=1; return 0}
	function agentRight(){agentLocation[0]+=1; return 0}
	function agentDown(){agentLocation[1]+=1; return 0}
	function agentLeft(){agentLocation[0]-=1; return 0}
	function agentNull(){return 0}
	function agentWin(){ agentLocation = [0,0]; return 1;
	}

	// basic gridworld
	// stateActions are in an Array with the shape:
	// stateActions[x][y][square type, [actions]]
	// where the x,y are the coordinates,
	// the square type is:
	// 0: normal square,
	// 1: goal square,
	// 2: blocking square
	// and the actions are functions that are called
	// when the agent makes a choice of action.
	env.stateActions=[];
	for(x=0;x<xPix;x++){
		env.stateActions[x]=[];
		for(y=0;y<yPix;y++){
			env.stateActions[x][y]=[0,[]];
			if(y>0) env.stateActions[x][y][1].push(agentUp);
			if(x<xPix-1) env.stateActions[x][y][1].push(agentRight);
			if(y<yPix-1) env.stateActions[x][y][1].push(agentDown);
			if(x>0) env.stateActions[x][y][1].push(agentLeft);
		}
	}
	//env.stateActions = Array(xPix).fill().map(x => Array(yPix).fill().map(x =>
		//[0,[]));// so... technically the agent
			// can move out of bounds, but it never will because there's no
			// value out there.
	// environment dynamics function!
	env.step = function (choice) {
		x = agentLocation[0];
		y = agentLocation[1];
		r = this.stateActions[x][y][1][choice]();
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
	// modify the actions of the squares around this square
	// to accord with the current type of the square
	// eg, trying to move onto a block leaves you in the same place
	env.resetSquare = function(coord){
		rsx = coord[0];
		rsy = coord[1];
		type = this.stateActions[rsx][rsy][0];
		if(type == 0){// Normal square
			//default actions
			env.stateActions[rsx][rsy][1] = [];
			if( rsy > 0){
				if(env.stateActions[rsx][rsy-1][0] == 2) env.stateActions[rsx][rsy][1].push(agentNull);
				else env.stateActions[rsx][rsy][1].push(agentUp);
			}
			if( rsx < xPix-1){
				if(env.stateActions[rsx+1][rsy][0] == 2) env.stateActions[rsx][rsy][1].push(agentNull);
				else env.stateActions[rsx][rsy][1].push(agentRight);
			}
			if( rsy < yPix-1){
				if(env.stateActions[rsx][rsy+1][0] == 2) env.stateActions[rsx][rsy][1].push(agentNull);
				else env.stateActions[rsx][rsy][1].push(agentDown);
			}
			if( rsx > 0){
				if(env.stateActions[rsx-1][rsy][0] == 2) env.stateActions[rsx][rsy][1].push(agentNull);
				else env.stateActions[rsx][rsy][1].push(agentLeft);
			}
		}else if(type == 1){// Goal square
			env.stateActions[rsx][rsy][1] = [];
			if( rsy > 0){ env.stateActions[rsx][rsy][1].push(agentWin) }
			if( rsx < xPix-1){ env.stateActions[rsx][rsy][1].push(agentWin) }
			if( rsy < yPix-1){ env.stateActions[rsx][rsy][1].push(agentWin) }
			if( rsx > 0){ env.stateActions[rsx][rsy][1].push(agentWin) }
		}else if(type == 2){// Blocking square
			env.stateActions[rsx][rsy][1] = [];
			if( rsy > 0){ env.stateActions[rsx][rsy][1].push(agentUp); }
			if( rsx < xPix-1){ env.stateActions[rsx][rsy][1].push(agentRight); }
			if( rsy < yPix-1){ env.stateActions[rsx][rsy][1].push(agentDown); }
			if( rsx > 0){ env.stateActions[rsx][rsy][1].push(agentLeft); }
		}
	}
	env.setSquareLogic = function(coord, type){
		x = coord[0];
		y = coord[1];
		changingFromType = this.stateActions[x][y][0];
		if(changingFromType == type) return false;

		if(type == 1) this.goals.add(coord);
		else if(type ==2) this.blocks.add(coord);
		if(changingFromType == 1) this.goals.del(coord);
		if(changingFromType == 2) this.blocks.del(coord);
		this.stateActions[x][y][0] = type;
		this.resetSquare(coord);// this will make the logic agree with the type we just set.
		if( changingFromType == 2 || type == 2){
			if(y>0) this.resetSquare([x,y-1]);
			if(x<xPix-1) this.resetSquare([x+1,y]);
			if(y<yPix-1) this.resetSquare([x,y+1]);
			if(x>0) this.resetSquare([x-1,y]);
		}
		return true;
	}

	env.toggleGoal = function(coord){
		if(this.stateActions[coord[0]][coord[1]] == 1) this.setSquareLogic(coord, 0);
		else this.setSquareLogic(coord, 1);
	}
	env.toggleBlock = function(coord){
		if(this.stateActions[coord[0]][coord[1]] == 2) this.setSquareLogic(coord, 0);
		else this.setSquareLogic(coord, 2);
	}

		
	env.toggleGoal([xPix-2,0]);
	env.toggleGoal([xPix-2,yPix-5]);// these are good goal locations. Don't tell the agent where they are.
	// add some blocks to make it tricky.
	for(i = 1; i<yPix-1; i++){
		env.toggleBlock([Math.floor((i*xPix)/(3*yPix)+xPix/3),i]);
		if (i == Math.floor(yPix/3)) i++;
	}


	// TODO: move this up with the agent
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
		return probs;
	}
	

	//
	env.draw = function() {
		// Clear screen for drawing next frame.
		gridContext.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
		valueContext.clearRect(0, 0, valueCanvas.width, valueCanvas.height);

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
		eligibilityForColor = 1;
		for (ii=agent.eligibilityQueue.length-1; ii>=0; ii--){
			x = agent.eligibilityQueue[ii][0];
			y = agent.eligibilityQueue[ii][1];
			valueContext.fillStyle = 
				`rgba(
					255, 255, 180,
					${eligibilityForColor}
				)`;
			valueContext.fillRect(x*pixWidth, y*pixHeight, pixWidth, pixHeight);
			eligibilityForColor = gamma * lambda * eligibilityForColor;
			gridContext.fillStyle = 
				`rgba(
					203, 76, 22,
					${ii/agent.eligibilityQueue.length*.8}
				)`;
			gridContext.fillRect(x*pixWidth, y*pixHeight, pixWidth, pixHeight);
		}
		// Draw agent
		gridContext.fillStyle="#d51"
		gridContext.fillRect(agentLocation[0]*pixWidth, agentLocation[1]*pixHeight, pixWidth, pixHeight);

		// Draw goals
		gridContext.fillStyle="#8a0"
		for(ii=0;ii<env.goals.array.length;ii++){
			x = env.goals.array[ii][0];
			y = env.goals.array[ii][1];
			gridContext.fillRect(x*pixWidth, y*pixHeight, pixWidth, pixHeight);
		}
		// Draw blocks
		gridContext.fillStyle="#688"
		for(ii=0;ii<env.blocks.array.length;ii++){
			x = env.blocks.array[ii][0];
			y = env.blocks.array[ii][1];
			gridContext.fillRect(x*pixWidth, y*pixHeight, pixWidth, pixHeight);
		}
	}
	//TODO: part of agent?
	function removeFromEQ(array,coord){
		// remove old eligibilities of state if already in eligibilityQueue
		for(jj=array.length-1; jj>=0; jj--){
			if (array[jj][0] == coord[0]
				&& array[jj][1] == coord[1]){
				agent.eligibilityQueue.splice(jj, 1);
			}
		}
	}
	//TODO: part of agent?
	function logicUpdate() {
		for(ii=0;ii<stepsBetweenDraw + skinnerbox*stepsBetweenDraw*Math.random();ii++) {
			oldX=agentLocation[0];
			oldY=agentLocation[1];

			action = agent.choose(agentLocation);
			reward = env.step(action);

			xmask=[];
			ymask=[];
			if(y>0){ xmask.push(0); ymask.push(-1);}
			if(x<xPix-1) { xmask.push(1); ymask.push(0);}
			if(y<yPix-1) { xmask.push(0); ymask.push(1);}
			if(x>0) { xmask.push(-1); ymask.push(0);}
			predictedX = oldX+xmask[action];
			predictedY = oldY+ymask[action];
			newX=agentLocation[0];
			newY=agentLocation[1];

			/// ugg, this is such a kludge. Basically we're updating the value of the square we just moved off
			// of unless we didn't move cause there's a block where we're trying to move to,
			// in which case we update the value of the square we're trying to move to.
			// this whole thing is because I stupidly used state values instead of state-action values because
			// I thought "Oh, the dynamics of the environment are simple and state values will visualize better!"
			// (read in high pitch mocking voice) But no. I was a fool!
			if(oldX==newX && oldY==newY){
				removeFromEQ(agent.eligibilityQueue,[oldX,oldY]);
				agent.eligibilityQueue.push([oldX,oldY]);
				removeFromEQ(agent.eligibilityQueue,[predictedX,predictedY]);
				agent.eligibilityQueue.push([predictedX,predictedY]);
			}else{
				removeFromEQ(agent.eligibilityQueue,[oldX,oldY]);
				agent.eligibilityQueue.push([oldX,oldY]);
			}
			if((agent.eligibilityQueue.length > imgTailLength) || (stepcount%4 ==0 && agent.eligibilityQueue.length>1)) agent.eligibilityQueue.shift();


			surprise = reward + gamma*valueFunction[newX][newY] - valueFunction[oldX][oldY];// a surprise can be positive or negative.
			if (Math.abs(surprise) > jadedness) {
				//Nice eligibility value function update
				eligibility = 1;
				for (jj=agent.eligibilityQueue.length-1; !(jj<0 || jj<agent.eligibilityQueue.length-logicTailLength); jj--){
					x = agent.eligibilityQueue[jj][0];
					y = agent.eligibilityQueue[jj][1];
					valueFunction[x][y] = valueFunction[x][y] + alpha * surprise * eligibility;
					eligibility = gamma * lambda * eligibility;
				}
				agent.policyUpdate();
			}
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
		if(stepcount%explorationInterval==0){
			valueFunction = valueFunction.map(x => x.map(y => y+exploration));
		}
		logicUpdate();
		env.draw();
		if(running) setTimeout(continueLogic, delayBetweenSteps);
	}
	env.draw();
	//continueLogic();
}



function initializeParams(){
	// Cider Sliders! lol jk, they are html sliders!
	simSpeedSlider = document.getElementById("SimSpeed");
	simSpeedSlider.value = 30;
	simSpeedSlider.onclick();

	alphaSlider = document.getElementById("Alpha");
	alphaSlider.value=0.2;
	alphaSlider.onclick();

	gammaSlider = document.getElementById("Gamma");
	gammaSlider.value = 0.99;
	gammaSlider.onclick();

	lambdaSlider = document.getElementById("Lambda");
	lambdaSlider.value = 0.9;
	lambdaSlider.onclick();
}



//document.addEventListener("load", initialize);// I don't work.
//document.onload = initialize;// I don't work
window.onload = function(){
	initialize();
	initializeParams();
}; // I work!!!
