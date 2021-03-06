// start of file

//-------------------
// UBER FUCNTIONS
//-------------------

	function loadPage_charedit(){
		// debug("LOADING PAGE >> loadPage_charedit");

		getEditDocument().getElementById('mainwrapper').innerHTML = editPage_Content();
		setupEditCanvas();
		initEventHandlers();

		_UI.selectedtool = 'pathedit';
		
		_UI.selectedshape = -1;
		if(_UI.devselectedshape){
			_UI.selectedshape = _UI.devselectedshape;
			_UI.devselectedshape = false;
		}

		if(_UI.selectedchar.length > 6) _UI.selectedchar = getFirstCharID();

		redraw("loadPage_charedit");
	}


//-------------------
// Redraw
//-------------------
	function redraw_CharacterEdit(){
		// debug('\n redraw_CharacterEdit - START');

		_UI.redrawing = true;

		var sc = getSelectedChar();
		drawGrid();
		drawGuides();

		// load char info
		if(sc){
			sc.drawCharToArea(_UI.chareditctx, getView('Redraw'));
		}

		// Finish up
		var s = ss('Redraw');
		if(s) {
			s.drawSelectOutline(s.link !== false);
			if(s.link){
				_UI.selectedtool = 'shaperesize';
			}
		}

		_UI.redrawing = false;
	}

// end of file