var _isPageListener = false;
var sendResponseNotFull = false;
var _inSearch = false;
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if (request.action == GSDefines.GETQUEUE_REQ) 
	{
		var Songs = [];
		var tempSong = { name: null, artist: null, imgHref: null, id: null };
		
		var queueSongs = $("li." + GSDefines.QUEUE_ITEM_CLASS);
		queueSongs.sort(GSDefines.REL_ATTR, "asc");
		for (var i = 0;i < queueSongs.length;i++)
		{
			var queueItem = queueSongs.eq(i).find("." + GSDefines.QUEUESONG_CLASS);
			tempSong.id = queueItem.attr("id");
			tempSong.artist = queueItem.children("a." + GSDefines.QUEUESONG_ARTIST_CLASS + "." + GSDefines.ARTIST_CLASS).attr("title");
			tempSong.imgHref = queueItem.find("img").attr("src");
			tempSong.name = queueItem.children("a." + GSDefines.QUEUESONG_NAME_CLASS + "." + GSDefines.SONG_CLASS).attr("title");
			Songs.push(tempSong);
			tempSong = {
				name: null,
				artist: null,
				imgHref: null,
				id: null
			};
		}
		sendResponse({
			queue: Songs
		});
		delete Songs;
	}
	else if (request.action == GSDefines.GET_CONTROL_STATE_REQ)
	{
		var shuffleButtonClass;
		var repeatButtonClass;
		try {
			document.getElementById(GSDefines.PLAYER_SHUFFLE_CLASS) ? shuffleButtonClass = document.getElementById(GSDefines.PLAYER_SHUFFLE_CLASS).className : "";
			document.getElementById(GSDefines.PLAYER_LOOP_CLASS) ? repeatButtonClass = document.getElementById(GSDefines.PLAYER_LOOP_CLASS).className : "";
		}
		catch (e)
		{
			sendResponse({
				shuffleClass: shuffleButtonClass,
				repeatClass: repeatButtonClass
			});
		}
		sendResponse({
			shuffleClass: shuffleButtonClass,
			repeatClass: repeatButtonClass
		});
	}
	else if (request.action == GSDefines.PLAYSONG_REQ)
	{	
		// search the queue for our element
		var songItem = document.getElementById(request.songId);
		var songHref = songItem.children[1].children[2];
		if(document.dispatchEvent) 
		{ // W3C
		    var oEvent = document.createEvent("MouseEvents");
		    oEvent.initMouseEvent("click", true, true,window, 1, 1, 1, 1, 1, false, false, false, false, 0, songHref);
		    songHref.dispatchEvent( oEvent );
	    }
		sendResponse({
			isSuccess: true
		});
	}
	else if(request.action == GSDefines.STARTSEARCH_REQ)
	{
        // DEFINING CURRENT PLACE....
		// check for search boxes, 1 of two places
		var inputWrap = document.getElementById(GSDefines.SEARCHBAR_INPUT);
		
		// the top Right searchbar is there.
		if (!inputWrap)
		{
			var gs = document.getElementById(GSDEFINES.GROOVESHARK_BANNER);
			if(document.dispatchEvent) 
			{ 
			    var oEvent = document.createEvent( "MouseEvents" );
			    oEvent.initMouseEvent("click", true, true,window, 1, 1, 1, 1, 1, false, false, false, false, 0, gs);
			    gs.dispatchEvent( oEvent );
				setTimeout(function(){startSearchInput(request);},1000);			
		    }	
		}
		else
			startSearchInput(request);
		
		sendResponse({
			msg: "working"
		});
	}
	else if(request.action == "playSongFromResults")
	{
		var songRow = $("div[row='" + request.songObj.rowNum + "'].ui-widget-content.slick-row");
		if (!songRow)
		{
			// there was an error
			sendResponse({
				msg: "failed"
			});
		}
		else
		{
			var domSongRow = songRow.children("div.slick-cell.c0.song")[0];
			if(document.dispatchEvent) 
			{ 
			    var oEvent = document.createEvent("MouseEvents");
			    oEvent.initMouseEvent("dblclick", true, true,window, 1, 1, 1, 1, 1, false, false, false, false, 0, domSongRow);
			    domSongRow.dispatchEvent( oEvent );
		    }
			sendResponse({
				msg: "donePlaying"
			});	
		}
	}
	else if(request.action == "addToNowPlayingFromResults")
	{
		var songRow = $("div[row='" + request.songObj.rowNum + "'].ui-widget-content.slick-row");
		if (!songRow) {
			// there was an error
			sendResponse({
				msg: "failed"
			});
		}
		else {
			var jQSongRowSong = songRow.children("div.slick-cell.c0.song");
			var domSongRowSong = jQSongRowSong[0];
			var domSongRowAdd = jQSongRowSong.children("a.play")[0];
			if(document.dispatchEvent) 
			{ 
				var oEvent = document.createEvent("MouseEvents");
			    oEvent.initMouseEvent("click", true, true,window, 1, 1, 1, 1, 1, false, false, false, false, 0, domSongRowSong);
			    domSongRowSong.dispatchEvent( oEvent );
				
			    oEvent = document.createEvent("MouseEvents");
			    oEvent.initMouseEvent("click", true, true,window, 1, 1, 1, 1, 1, false, false, false, false, 0, domSongRowAdd);
			    domSongRowAdd.dispatchEvent( oEvent );
		    }
			sendResponse({
				msg: "doneAdding"
			});	
		}
	}
	else if(request.action == "clearSongs")
	{
		var clearBtn = $("button#queue_clear_button");
		clearBtn ? clearBtn.click() : "";
		sendResponse({
			msg: "doneClear"
		});
	}
	else
		sendResponse({});
});

function startSearchInput(request)
{
	_inSearch = true;
	setTimeout(function() { _inSearch ? sendResponseNotFull = true : sendResponseNotFull = false; }, 5000);
	var inputWrap = document.getElementById(GSDEFINES.SEARCHBAR_INPUT);
	var inputBox = null;
	var inputSubmit = document.getElementById('searchButton');
	for (var i = 0;i < inputWrap.children.length;i++)
	{
		if (inputWrap.children[i].getAttribute('type') == "text")
		{
			inputBox = inputWrap.children[i];
		}
	}
	inputBox.focus();
	inputBox.value = request.value;
	inputSubmit.click();
	setupQueryListener(request);
}

function setupQueryListener(request)
{
	var pageWrapper = document.getElementById('page_wrapper');
	if (pageWrapper) {
		if (_isPageListener)
			removeQueryListener();
		pageWrapper.addEventListener('DOMSubtreeModified', startQueryResponse, false);
		_isPageListener = true;
	}
}

function removeQueryListener()
{
	var pageWrapper = document.getElementById('page_wrapper');
	if (pageWrapper) {
		pageWrapper.removeEventListener('DOMSubtreeModified', startQueryResponse, false);
	}
}

function startQueryResponse()
{
	var page = document.getElementById('page');
	if (page)
	{
		var grid = $("#grid");
		if (grid)
		{
			var elems = grid.find(".ui-widget-content");
			console.log('Currently ' + elems.length + " in the list.");	
			if ((elems.length >= 50 && elems[0].getAttribute('title') !== undefined)|| sendResponseNotFull) {
				removeQueryListener();
				var jsonElems = [];
				var tempSongStruct;
				for (var i = 0;i < 50;i++)
				{
					tempSongStruct = {song: null, artist: null, rowNum: i};
					var tmpVal = $(elems[i]).find(".songLink")[0];
					tempSongStruct.song = tmpVal ? tmpVal.getAttribute('title') : ""; 
					tmpVal = $(elems[i]).find(".field")[0];
					tempSongStruct.artist = tmpVal ? tmpVal.getAttribute('title') : ""; 
					jsonElems.push(tempSongStruct);
				}
				_inSearch = false;
				sendResponseNotFull = false;
				chrome.extension.sendRequest({
					msg: "songsDone",
					data: jsonElems 
				});
				return;
			}
		}
	}
}

