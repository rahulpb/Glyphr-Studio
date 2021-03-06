// start of file

	_UI.eventhandlers = {
		'tempnewbasicshape' : false,
		'mousex' : 0,
		'mousey' : 0,
		'ismouseovercec' : false,
		'corner' : false,
		'toolhandoff' : false,
		'lastx' : -100,
		'lasty' : -100,
		'firstx' : -100,
		'firsty' : -100,
		'uqhaschanged' : false,
		'eh_shapesel' : false,
		'eh_shaperesize' : false,
		'eh_pantool' : false,
		'eh_addpath' : false,
		'lastTool' : 'pathedit',
		'isSpaceDown' : false
	};

	function initEventHandlers() {
		var tool = new Tool_PathEdit();
		_UI.eventhandlers.eh_addrectoval = new Tool_NewBasicShape();
		_UI.eventhandlers.eh_shapesel = new Tool_PathEdit();
		_UI.eventhandlers.eh_shaperesize = new Tool_ShapeResize();
		_UI.eventhandlers.eh_pantool = new Tool_Pan();
		_UI.eventhandlers.eh_addpath = new Tool_NewPath();
		_UI.eventhandlers.eh_addrectoval = new Tool_NewBasicShape();
		_UI.eventhandlers.eh_kern = new Tool_Kern();

		// Mouse Event Listeners
		_UI.chareditcanvas.addEventListener('mousedown', ev_canvas, false);
		_UI.chareditcanvas.addEventListener('mousemove', ev_canvas, false);
		_UI.chareditcanvas.addEventListener('mouseup',   ev_canvas, false);
		_UI.chareditcanvas.onmouseover = mouseovercec;
		_UI.chareditcanvas.onmouseout = mouseoutcec;
		_UI.chareditcanvas.addEventListener('wheel', mousewheel, false);
		if (document.getElementById('navarea_panel')) {
            document.getElementById('navarea_panel').addEventListener('wheel', function(ev){ev.stopPropagation();}, false);
        }

		// Document Key Listeners
		getEditDocument().addEventListener('keypress', keypress, false);
		getEditDocument().addEventListener('keydown', keypress, false);
		getEditDocument().addEventListener('keyup', keyup, false);

		// The general-purpose event handler.
		function ev_canvas (ev) {

			//debug('EVENTHANDLER - Raw mouse event x/y = ' + ev.layerX + ' / ' + ev.layerY);
			mouseovercec();

			// Fixes a Chrome cursor problem
			document.onselectstart = function () { return false; };

			if (ev.layerX || ev.layerX) {
				// Firefox
				_UI.eventhandlers.mousex = ev.layerX;
				_UI.eventhandlers.mousey = ev.layerY;
			}

			if (ev.offsetX || ev.offsetX) {
				// IE, Chrome, (Opera?)
				_UI.eventhandlers.mousex = ev.offsetX;
				_UI.eventhandlers.mousey = ev.offsetY;
			}

			//debug('EV_CANVAS offsetx / offsety / layerx / layery: ' +  ev.offsetX + ' ' + ev.offsetY + ' ' + ev.layerX + ' ' + ev.layerY);

			resetCursor();

			// Switch Tool function
			switch(_UI.selectedtool){
				case 'pathedit' :
					tool = _UI.eventhandlers.eh_shapesel;
					break;
				case 'shaperesize' :
					tool = _UI.eventhandlers.eh_shaperesize;
					break;
				case 'pan' :
					getEditDocument().body.style.cursor = 'move';
					tool = _UI.eventhandlers.eh_pantool;
					break;
				case 'newpath' :
					getEditDocument().body.style.cursor = 'crosshair';
					tool = _UI.eventhandlers.eh_addpath;
					break;
				case 'newrect' :
				case 'newoval' :
					getEditDocument().body.style.cursor = 'crosshair';
					tool = _UI.eventhandlers.eh_addrectoval;
					break;
				case 'kern':
					getEditDocument().body.style.cursor = 'col-resize';
					tool = _UI.eventhandlers.eh_kern;
					break;
			}

			// Call the event handler of the tool.
			tool[ev.type](ev);
		}
	}


	// ---------------------------------------------------------
	// new path - adds many points to a new path
	// ---------------------------------------------------------
	function Tool_NewPath(){
		this.dragging = false;
		this.firstpoint = true;
		this.currpt = {};

		this.mousedown = function (ev) {
			//debug('Tool_NewPath MOUSEDOWN');
			var newpoint = new PathPoint({'P':new Coord({'x':cx_sx(_UI.eventhandlers.mousex), 'y':cy_sy(_UI.eventhandlers.mousey)}), 'H1':new Coord({'x':cx_sx(_UI.eventhandlers.mousex-100), 'y':cy_sy(_UI.eventhandlers.mousey)}), 'H2':new Coord({'x':cx_sx(_UI.eventhandlers.mousex+100), 'y':cy_sy(_UI.eventhandlers.mousey)}), 'type':'flat', 'selected':true, 'useh1':false, 'useh2':false});

			if(this.firstpoint) {
				//debug('Tool_NewPath MOUSEDOWN - tool.firstpoint=true, making a new path');
				//alert('EVENTHANDLER - Tool_NewPath mousedown - tool.firstpoint=true, making a new path');

				// make a new path with one point
				var newpath = new Path({'pathpoints':[newpoint]});
				//debug('Tool_NewPath MOUSEDOWN - after new path is made.');

				// make a new shape with the new path
				var count = (_UI.navhere === 'linked shapes')? (getLength(_GP.linkedshapes)) : getSelectedCharShapes().length;
				var newshape = addShape(new Shape({'name': ('Path '+count), 'path': newpath}));
				newshape.path.selectPathPoint(0);
				//debug('Tool_NewPath MOUSEDOWN - end of firstpoint, new shape added with new path with single point.');

			} else {
				//debug('Tool_NewPath MOUSEDOWN - after firstpoint, placing another point');
				var currpath = ss('Event Handler New Path').path;
				var ccp = currpath.isOverControlPoint(cx_sx(_UI.eventhandlers.mousex), cy_sy(_UI.eventhandlers.mousey));
				//debug('Tool_NewPath MOUSEDOWN - after creating ccp: ' + ccp);
				if((ccp==='P')&&(currpath.pathpoints.length > 1)){
					var p = currpath.pathpoints[0];
					var hp = _GP.projectsettings.pointsize/getView('Event Handler Tool_NewPath mousedown').dz;
					if( ((p.P.x+hp) > cx_sx(_UI.eventhandlers.mousex)) && ((p.P.x-hp) < cx_sx(_UI.eventhandlers.mousex)) && ((p.P.y+hp) > cy_sy(_UI.eventhandlers.mousey)) && ((p.P.y-hp) < cy_sy(_UI.eventhandlers.mousey)) ){
						//clicked on an existing control point in this path
						//if first point - close the path
						_UI.selectedtool = 'pathedit';
						_UI.eventhandlers.eh_shapesel.moving = true;
						_UI.eventhandlers.eh_shapesel.controlpoint = 'H2';
						_UI.eventhandlers.toolhandoff = true;
						this.dragging = false;
						this.firstmove = false;
						_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
						_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
						redraw('Event Handler Tool_NewPath mousedown');
						return;
					}
				}

				currpath.addPathPoint(newpoint, false);
				//debug('Tool_NewPath MOUSEDOWN - after AddPathPoint');
			}

			this.currpt = ss('Event Handler New Path').path.sp(false, 'Event Handler New Path');
			this.firstpoint = false;
			this.dragging = true;
			_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
			_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;

			//debug('Tool_NewPath MOUSEDOWN - end of function, this.currpt:\n' + JSON.stringify(newpoint));
		};

		this.mouseup = function () {
			//debug('Tool_NewPath MOUSEUP');
			var currpath = ss('Event Handler New Path').path;
			currpath.winding = currpath.findWinding();
			this.dragging = false;
			this.firstmove = false;
			_UI.eventhandlers.lastx = -100;
			_UI.eventhandlers.lasty = -100;

			if(_UI.eventhandlers.uqhaschanged){
				currpath.calcMaxes();
				updateCurrentCharWidth();
				// For new shape tools, mouse up always adds to the undo-queue
				history_put('New Path tool');
				_UI.eventhandlers.uqhaschanged = false;
				redraw('Event Handler Tool_NewPath mouseup');
			}
		};

		this.mousemove = function (ev) {
			//debug('Tool_NewPath MOUSEMOVE');
			if(this.dragging){
				//avoid really small handles
				//debug('Tool_NewPath MOUSEMOVE - ps*2 = ' + (_GP.projectsettings.pointsize*2) + ' x / y: ' + Math.abs(this.currpt.P.x-cx_sx(_UI.eventhandlers.mousex)) + ' / ' + Math.abs(this.currpt.P.y-cy_sy(_UI.eventhandlers.mousey)) );
				if( (Math.abs(this.currpt.P.x-cx_sx(_UI.eventhandlers.mousex)) > (_GP.projectsettings.pointsize*2)) || (Math.abs(this.currpt.P.y-cy_sy(_UI.eventhandlers.mousey)) > (_GP.projectsettings.pointsize*2)) ){
					//debug('Tool_NewPath MOUSEMOVE - dragging H2, this.currpt:\n' + JSON.stringify(this.currpt));
					this.currpt.useh1 = true;
					this.currpt.useh2 = true;
					this.currpt.H2.x = cx_sx(_UI.eventhandlers.mousex);
					this.currpt.H2.y = cy_sy(_UI.eventhandlers.mousey);
					this.currpt.makeSymmetric('H2');
				} else {
					//debug('Tool_NewPath MOUSEMOVE - no handle created yet');
				}
				_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
				_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
				_UI.eventhandlers.uqhaschanged = true;

				redraw('Event Handler Tool_NewPath mousemove');
			}
		};
	}


	// ---------------------------------------------------------
	// new basic shape - adds many points to a new path
	// ---------------------------------------------------------
	function Tool_NewBasicShape(){

		this.mousedown = function (ev) {
			_UI.eventhandlers.tempnewbasicshape = {
				'xmax': cx_sx(_UI.eventhandlers.mousex),
				'xmin': cx_sx(_UI.eventhandlers.mousex),
				'ymax': cy_sy(_UI.eventhandlers.mousey),
				'ymin': cy_sy(_UI.eventhandlers.mousey)
			};

			var newshape = new Shape({'visible':false, 'name':'...'});
			newshape.path.maxes = _UI.eventhandlers.tempnewbasicshape;
			newshape = addShape(newshape);

			_UI.eventhandlers.firstx = cx_sx(_UI.eventhandlers.mousex);
			_UI.eventhandlers.firsty = cy_sy(_UI.eventhandlers.mousey);

			redraw('Event Handler Tool_NewBasicShape mousedown');
			//debug('Tool_NewBasicShape MOUSEDOWN - after REDRAW');
		};

		this.mousemove = function (ev) {
			if(_UI.eventhandlers.tempnewbasicshape){
				_UI.eventhandlers.tempnewbasicshape.xmax = Math.max(_UI.eventhandlers.firstx, cx_sx(_UI.eventhandlers.mousex));
				_UI.eventhandlers.tempnewbasicshape.xmin = Math.min(_UI.eventhandlers.firstx, cx_sx(_UI.eventhandlers.mousex));
				_UI.eventhandlers.tempnewbasicshape.ymax = Math.max(_UI.eventhandlers.firsty, cy_sy(_UI.eventhandlers.mousey));
				_UI.eventhandlers.tempnewbasicshape.ymin = Math.min(_UI.eventhandlers.firsty, cy_sy(_UI.eventhandlers.mousey));

				ss().path.maxes = _UI.eventhandlers.tempnewbasicshape;

				_UI.eventhandlers.uqhaschanged = true;
				redraw('Event Handler Tool_NewBasicShape mousemove');
				//debug('Tool_NewBasicShape MOUSEMOVE past redraw');
			}
		};

		this.mouseup = function () {
			// prevent really small shapes
			var newshape = ss('NEWSHAPE MOUSEUP');
			var tnbs = _UI.eventhandlers.tempnewbasicshape;

			if ( (Math.abs(tnbs.xmax-tnbs.xmin) > _GP.projectsettings.pointsize) &&
				(Math.abs(tnbs.ymax-tnbs.ymin) > _GP.projectsettings.pointsize) ){

				var count = (_UI.navhere === 'linked shapes')? (getLength(_GP.linkedshapes)) : getSelectedCharShapes().length;

				if(_UI.selectedtool==='newrect'){
					newshape.name = ('Rectangle ' + count);
					newshape.path = rectPathFromMaxes(tnbs);
				} else {
					newshape.name = ('Oval ' + count);
					newshape.path = ovalPathFromMaxes(tnbs);
				}

				newshape.visible = true;
				//updateCurrentCharWidth();
			} else {
				deleteShape();
			}

			_UI.eventhandlers.firstx = -100;
			_UI.eventhandlers.firsty = -100;
			_UI.eventhandlers.tempnewbasicshape = false;
			history_put('New Basic Shape tool');
			_UI.eventhandlers.uqhaschanged = false;

			clickTool('pathedit');
		};
	}


	// ---------------------------------------------------------
	// Path Edit - selects points and moves points and handles
	// ---------------------------------------------------------
	function Tool_PathEdit(){
		this.moving = false;
		this.controlpoint = false;

		this.mousedown = function (ev) {
			//debug('mouse down: ' + _UI.eventhandlers.mousex + ':' + _UI.eventhandlers.mousey);
			var s = ss('Path Edit - Mouse Down');
			this.controlpoint = s? s.path.isOverControlPoint(cx_sx(_UI.eventhandlers.mousex), cy_sy(_UI.eventhandlers.mousey)) : false;
			if(this.controlpoint){
				this.moving = true;
				_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
				_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
			} else if (clickSelectShape(_UI.eventhandlers.mousex, _UI.eventhandlers.mousey)){
				//clickSelectShape checks to switch the tool if need be.
				_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
				_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
			} else {
				if(s){s.path.calcMaxes();}
				clickEmptySpace();
			}
			redraw('Event Handler Tool_PathEdit mousedown');
		};

		this.mousemove = function (ev) {
			if (this.moving) {
				var s = ss('Path Edit - Mouse Move');
				var sp = s.path.sp();
				if(_UI.eventhandlers.toolhandoff){
					sp.H2.x = cx_sx(_UI.eventhandlers.mousex);
					sp.H2.y = cy_sy(_UI.eventhandlers.mousey);
					_UI.eventhandlers.toolhandoff = false;
				}
				// Moving points if mousedown
				var dx = 0;
				var dy = 0;
				var dz = getView('Event Handler Tool_PathEdit mousemove').dz;
				switch (this.controlpoint){
					case 'P':
						if(!sp.P.xlock) dx = (_UI.eventhandlers.mousex-_UI.eventhandlers.lastx)/dz;
						if(!sp.P.ylock) dy = (_UI.eventhandlers.lasty-_UI.eventhandlers.mousey)/dz;
						break;
					case 'H1':
						if(!sp.H1.xlock) dx = (_UI.eventhandlers.mousex-_UI.eventhandlers.lastx)/dz;
						if(!sp.H1.ylock) dy = (_UI.eventhandlers.lasty-_UI.eventhandlers.mousey)/dz;
						break;
					case 'H2':
						if(!sp.H2.xlock) dx = (_UI.eventhandlers.mousex-_UI.eventhandlers.lastx)/dz;
						if(!sp.H2.ylock) dy = (_UI.eventhandlers.lasty-_UI.eventhandlers.mousey)/dz;
						break;
				}
				sp.updatePathPointPosition(this.controlpoint, dx, dy);
				s.path.calcMaxes();

				_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
				_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
				_UI.eventhandlers.uqhaschanged = true;
				redraw('Event Handler Tool_PathEdit mousemove');
			}
		};

		this.mouseup = function () {
			this.moving = false;
			_UI.eventhandlers.lastx = -100;
			_UI.eventhandlers.lasty = -100;

			if(_UI.eventhandlers.uqhaschanged) {
				ss('Path Edit - Mouse Up').path.calcMaxes();
				updateCurrentCharWidth();
				history_put('Path Edit tool');
				_UI.eventhandlers.uqhaschanged = false;
				redraw('Event Handler Tool_PathEdit mouseup');
			}
		};

	}


	// --------------------------------------------------
	// Shape Resize - resizes whole shapes
	// --------------------------------------------------
	function Tool_ShapeResize(){
		this.dragging = false;
		this.resizing = false;
		_UI.eventhandlers.corner = false;

		this.mousedown = function (ev) {
			//debug('\nTool_ShapeResize TOOL - mouse down: ' + _UI.eventhandlers.mousex + ':' + _UI.eventhandlers.mousey);
			var s = ss('eventHandler - mousedown');
			_UI.eventhandlers.corner = s? s.isOverHandle(_UI.eventhandlers.mousex, _UI.eventhandlers.mousey) : false;
			_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
			_UI.eventhandlers.firstx = _UI.eventhandlers.mousex;
			_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
			_UI.eventhandlers.firsty = _UI.eventhandlers.mousey;

			if (_UI.eventhandlers.corner){
				//debug('Tool_ShapeResize TOOL: clicked on _UI.eventhandlers.corner: ' + _UI.eventhandlers.corner);
				this.resizing = true;
				this.dragging = false;
			} else if (clickSelectShape(_UI.eventhandlers.mousex, _UI.eventhandlers.mousey)){
				this.dragging = true;
				this.resizing = false;
				redraw('Event Handler Tool_ShapeResize mousedown');
			} else {
				clickEmptySpace();
			}
		};

		this.mousemove = function (ev) {
			var s = ss('eventHandler - Tool_ShapeResize mousemove');
			//debug('\nTool_ShapeResize TOOL - ss returned s.link: ' + s.link);
			var didstuff = false;
			var dz = getView('Event Handler Tool_ShapeResize mousemove').dz;
			if(s.link){
				//debug('\tTool_ShapeResize dragging linked shape');
				if(this.dragging && !s.uselinkedshapexy){
					//debug('Tool_ShapeResize, this.dragging=' + this.dragging + ' && !s.uselinkedshapexy=' + !s.uselinkedshapexy);
					s.xpos += ((_UI.eventhandlers.mousex-_UI.eventhandlers.lastx)/dz);
					s.ypos += ((_UI.eventhandlers.lasty-_UI.eventhandlers.mousey)/dz);
					didstuff = true;
					resetCursor();
				}
			} else {
				//debug('\tTool_ShapeResize dragging normal shape');
				if (this.dragging) {
					// Moving shapes if mousedown
					//debug('\tTool_ShapeResize - Moving Shape on Drag');
					var dx = s.xlock? 0 : dx = ((_UI.eventhandlers.mousex-_UI.eventhandlers.lastx)/dz);
					var dy = s.ylock? 0 : dy = ((_UI.eventhandlers.lasty-_UI.eventhandlers.mousey)/dz);

					s.path.updatePathPosition(dx, dy);
					resetCursor();
					didstuff = true;
				} else if (this.resizing){
					// Resizing shapes if mousedown over handle
					//debug('\tTool_ShapeResize - Resizing Shape over handle');
					evHanShapeResize(s, _UI.eventhandlers.corner);
					didstuff = true;
				}

				//Translation fidelity, passing raw canvas values
				if(s) s.isOverHandle(_UI.eventhandlers.mousex, _UI.eventhandlers.mousey);
			}

			if(didstuff){
				_UI.eventhandlers.lastx = _UI.eventhandlers.mousex;
				_UI.eventhandlers.lasty = _UI.eventhandlers.mousey;
				_UI.eventhandlers.uqhaschanged = true;
				redraw('Event Handler Tool_ShapeResize mousemove');
			}
		};


		this.mouseup = function () {
			//debug('Mouse Up');
			resetCursor();
			var s = ss('eventHandler - mouseup');
			if(_UI.eventhandlers.tempnewbasicshape){
				_UI.eventhandlers.tempnewbasicshape = false;
				s.hidden = false;
				_UI.eventhandlers.lastx = _UI.eventhandlers.firstx;
				_UI.eventhandlers.lasty = _UI.eventhandlers.firsty;
				evHanShapeResize(s, _UI.eventhandlers.corner);
			}

			if(this.resizing) s.path.calcMaxes();
			updateCurrentCharWidth();

			this.dragging = false;
			this.resizing = false;
			_UI.eventhandlers.lastx = -100;
			_UI.eventhandlers.lasty = -100;
			_UI.eventhandlers.firstx = -100;
			_UI.eventhandlers.firsty = -100;
			if(_UI.eventhandlers.uqhaschanged) history_put('Path Edit tool');
			_UI.eventhandlers.uqhaschanged = false;
			redraw('Event Handler Tool_ShapeResize mouseup');
			//debug('EVENTHANDLER - after Tool_ShapeResize Mouse Up REDRAW');
		};
	}


	// --------------------------------------------------
	// Pan - moves the canvas view
	// --------------------------------------------------
	function Tool_Pan(){
		this.dragging = false;
		this.deltax = 0;
		this.deltay = 0;

		this.mousedown = function (ev) {
			//debug('PAN TOOL - mouse down: ' + _UI.eventhandlers.mousex + ':' + _UI.eventhandlers.mousey);
			var v = getView('Event Handler Tool_Pan mousedown');
			this.deltax = (_UI.eventhandlers.mousex-v.dx);
			this.deltay = (_UI.eventhandlers.mousey-v.dy);
			this.dragging = true;
		};

		this.mouseup = function () {
			//debug('PAN TOOL - Mouse Up');
			this.dragging = false;
			this.deltax = 0;
			this.deltay = 0;
		};

		this.mousemove = function (ev) {
			if (this.dragging) {
				// Moving shapes if mousedown
				setView({'dx' : (_UI.eventhandlers.mousex-this.deltax), 'dy' : (_UI.eventhandlers.mousey-this.deltay)});
				redraw('Event Handler Tool_Pan mousemove');
			}
		};
	}


	// --------------------------------------------------
	// Kern - moves the left kern group
	// --------------------------------------------------
	function Tool_Kern(){
		this.dragging = false;
		this.deltax = 0;

		this.mousedown = function (ev) {
			//debug('Tool_Kern - mouse down: ' + _UI.eventhandlers.mousex + ':' + _UI.eventhandlers.mousey);
			var v = getView('Event Handler Tool_Kern mousedown');
			this.deltax = (_UI.eventhandlers.mousex);
			this.dragging = true;
		};

		this.mouseup = function () {
			//debug('Tool_Kern - Mouse Up');
			this.dragging = false;
			this.deltax = 0;
			history_put('Kern Adjustment: ' + getSelectedKern().value);
		};

		this.mousemove = function (ev) {
			if (this.dragging) {
				// Moving shapes if mousedown
				var sk = getSelectedKern();
				var val = (1*sk.value);
				sk.value = val + (1*(_UI.eventhandlers.mousex - this.deltax)/getView().dz);
				this.deltax = (_UI.eventhandlers.mousex);
				redraw();
			}
		};
	}







	// Helper Functions

	//convert canvas x-y inputs to saved shape x-y
	function cx_sx(cx){
		var v = getView('cx_sx');
		return ((cx-v.dx)/(v.dz));
	}

	function cy_sy(cy){
		var v = getView('cy_sy');
		return ((v.dy-cy)/(v.dz));
	}

	function clickEmptySpace(){
		var s = ss('Click Empty Space');
		if(s) {
			s.path.selectPathPoint(false);
			s.path.calcMaxes();
		}
		_UI.selectedshape = -1;
	}

	function evHanShapeResize(s, pcorner){
		//debug('EVHANSHAPERESIZE - ' + s.name + ' handle ' + pcorner);
		var mx = cx_sx(_UI.eventhandlers.mousex);
		var my = cy_sy(_UI.eventhandlers.mousey);
		var lx = cx_sx(_UI.eventhandlers.lastx);
		var ly = cy_sy(_UI.eventhandlers.lasty);
		var dh = (ly-my);
		var dw = (lx-mx);
		var ox = s.path.maxes.xmin;
		var oy = s.path.maxes.ymax;
		var rl = (!s.wlock && !s.hlock && s.ratiolock);

		switch(pcorner){

			case 'n':
				if(canResize('n')){
					dw = 0;
					dh*=-1;
					if(rl) dw = dh;
					s.path.updatePathSize(dw, dh);
					//s.path.setPathSize(false, false);
				}
				break;

			case 'ne':
				if(canResize('ne')){
					dw*=-1;
					dh*=-1;
					if(rl) dh = dw = getRatioLockValue(dh,dw);
					s.path.updatePathSize(dw, dh);
					s.path.setPathPosition(false, oy+dh);
				}
				break;

			case 'e':
				if(canResize('e')){
					dh = 0;
					dw*=-1;
					if(rl) dh = dw;
					s.path.updatePathSize(dw, dh);
					s.path.setPathPosition(false, oy+dh);
				}
				break;

			case 'se':
				if(canResize('se')){
					dw*=-1;
					//dh*=-1;
					if(rl) dh = dw = getRatioLockValue(dh,dw);
					s.path.updatePathSize(dw, dh);
					s.path.setPathPosition(ox, oy);
				}
				break;

			case 's':
				if(canResize('s')){
					dw = 0;
					if(rl) dw = dh;
					s.path.updatePathSize(dw, dh);
					s.path.setPathPosition(ox, oy);
				}
				break;

			case 'sw':
				if(canResize('sw')){
					if(rl) dh = dw = getRatioLockValue(dh,dw);
					s.path.updatePathSize(dw, dh);
					s.path.setPathPosition(ox-dw, oy);
				}
				break;

			case 'w':
				if(canResize('w')){
					dh = 0;
					if(rl) dh = dw;
					s.path.updatePathSize(dw, dh);
					s.path.setPathPosition(ox-dw, oy+dh);
				}
				break;

			case 'nw':
				if(canResize('nw')){
					dh*=-1;
					if(rl) dh = dw = getRatioLockValue(dh,dw);
					s.path.updatePathSize(dw, dh);
					s.path.setPathPosition(ox-dw, oy+dh);
				}
				break;
		}

		//if(!_UI.eventhandlers.tempnewbasicshape) s.path.calcMaxes();

		//debug('EVHANSHAPERESIZE - Done lx/rx/ty/by: ' + s.path.maxes.xmin + ',' + s.path.maxes.xmax + ',' + s.path.maxes.ymax + ',' + s.path.maxes.ymin);
	}

	function updateTNBS(dx,dy,dw,dh){
		//debug('updateTNBS dx/dy/dw/dh = '+dx+' '+dy+' '+dw+' '+dh);
		_UI.eventhandlers.tempnewbasicshape.xmin += (dx);
		_UI.eventhandlers.tempnewbasicshape.ymax += (dy);
		_UI.eventhandlers.tempnewbasicshape.xmax += (dw+dx);
		_UI.eventhandlers.tempnewbasicshape.ymin += (dh+dy);
	}

	function canResize(pc){
		var s = ss('canResize');
		switch(pc){
			case 'nw': return (!s.ylock && !s.hlock && !s.xlock && !s.wlock);
			case 'n':  return (!s.ylock && !s.hlock);
			case 'ne': return (!s.ylock && !s.hlock && !s.wlock);
			case 'e':  return (!s.wlock);
			case 'se': return (!s.hlock && !s.wlock);
			case 's':  return (!s.hlock);
			case 'sw': return (!s.hlock && !s.xlock && !s.wlock);
			case 'w':  return (!s.xlock && !s.wlock);
		}
		return true;
	}

	function mousewheel(event){
		var delta = (event.deltaY*-1);
		//debug('MOUSEWHEEL - deltaY: ' + event.deltaY);

		var canzoom = ((_UI.navhere === 'character edit') || (_UI.navhere === 'linked shapes'));
		canzoom = canzoom && (document.getElementById('dialog_box').style.display !== 'block');

		if(canzoom){
			if(event.ctrlKey){
				event.preventDefault();
				//debug('MOUSEWHEEL: canzoom=true and delta=' + delta );
				if(delta > 0){ viewZoom(1.1); }
				else { viewZoom(0.9); }
			}
		}
	}

	function mouseovercec() {
		//debug('MOUSEOVERCEC');
		_UI.eventhandlers.ismouseovercec = true;
		// Fixes a Chrome cursor problem
		document.onselectstart = function () { return false; };
	}

	function mouseoutcec() {
		//debug('MOUSEOUTCEC');
		_UI.eventhandlers.ismouseovercec = false;
		// Fixes a Chrome cursor problem
		document.onselectstart = function () {};
		resetCursor();
	}

	function keyup(event){
		if(!onCanvasEditPage()) return;

		var kc = getKeyFromEvent(event);
		//debug('Key Up:\t\t' + kc + ' from ' + event.which);
		var eh = _UI.eventhandlers;

		// Space
		if(kc=== 'space' && eh.ismouseovercec){
			_UI.selectedtool = eh.lastTool;
			eh.isSpaceDown = false;
			resetCursor();
			redraw('Event Handler - Keyup Spacebar for pan toggle');
		}
	}

	function keypress(event){

		if(!onCanvasEditPage()) return;
		if(event.type !== 'keydown') return;

		var s = ss('keypress event');
		var eh = _UI.eventhandlers;

		var kc = getKeyFromEvent(event);
		//debug('Key Press:\t' + kc + ' from ' + event.which);
		//debug(event);

		// Space
		if(kc === 'space' && eh.ismouseovercec){
			event.preventDefault();
			if(!eh.isSpaceDown){
				eh.lastTool = _UI.selectedtool;
				_UI.selectedtool = 'pan';
				eh.isSpaceDown = true;
				getEditDocument().body.style.cursor = 'move';
				redraw('Event Handler - Keydown Spacebar for pan toggle');
			}
		}

		if(kc==='esc'){
			closeDialog();
		}

		// ?
		if(kc==='?' || kc==='¿'){
			event.preventDefault();
			toggleKeyboardTips();
		}

		// z
		if(kc==='undo' || (event.ctrlKey && kc==='z')){
			event.preventDefault();
			history_pull();
		}

		// del
		if(kc==='del'){
			event.preventDefault();
			deleteShape();
			history_put('Delete Shape');
			redraw('Keypress DEL');
		}

		// c
		if(event.ctrlKey && kc==='c'){
			event.preventDefault();
			copyShape();
		}

		// v
		if(event.ctrlKey && kc==='v'){
			event.preventDefault();
			pasteShape();
			history_put('Paste Shape');
			redraw('Paste Shape');
		}

		// s
		if(event.ctrlKey && kc==='s'){
			event.preventDefault();
			saveGlyphrProjectFile();
		}

		// plus
		if(event.ctrlKey && kc==='plus'){
			event.preventDefault();
			viewZoom(1.1);
			redraw('Zoom Keyboard Shortcut');
		}

		// minus
		if(event.ctrlKey && kc==='minus'){
			event.preventDefault();
			viewZoom(0.9);
			redraw('Zoom Keyboard Shortcut');
		}

		// 0
		if(event.ctrlKey && kc==='0'){
			event.preventDefault();
			setView(clone(_UI.defaultview));
			redraw('Zoom Keyboard Shortcut');
		}

		// up
		if(kc==='up'){
			event.preventDefault();
			nudge(0,1);
		}

		// down
		if(kc==='down'){
			event.preventDefault();
			nudge(0,-1);
		}

		// left
		if(kc==='left'){
			event.preventDefault();
			nudge(-1,0);
		}

		// right
		if(kc==='right'){
			event.preventDefault();
			nudge(1,0);
		}
	}

	function getKeyFromEvent (event) {
		//debug('GETKEYFROMEVENT - keyCode:' + event.keyCode + '\twhich:' + event.which);
		var specialChars = {
			8:'backspace', 9:'tab', 13:'enter', 16:'shift', 17:'ctrl', 18:'alt', 20:'capslock', 26:'undo', 27:'esc', 32:'space', 33:'pageup', 34:'pagedown', 35:'end', 36:'home', 37:'left', 38:'up', 39:'right', 40:'down', 45:'ins', 46:'del', 91:'meta', 93:'meta', 187:'plus', 189:'minus', 224:'meta'
		};
		return specialChars[parseInt(event.which)] || String.fromCharCode(event.which).toLowerCase();
	}

	function nudge(dx, dy) {
		var s = ss('Nudge');
		var sp, mx, my;
		if(s){
			mx = (dx * _GP.projectsettings.spinnervaluechange);
			my = (dy * _GP.projectsettings.spinnervaluechange);
			sp = s.path.sp();
			if(sp){
				sp.updatePathPointPosition('P', mx, my);
			} else {
				s.path.updatePathPosition(mx, my);
			}
			redraw('Nudge');
		}
	}

// end of file