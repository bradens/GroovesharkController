var _isPageListener = false;
var sendResponseNotFull = false;
var searchTimer = null;
var TWEET_CURRENT_SONG = null;

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
		{
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
		// check for search boxes, 1 of two places
		var inputWrap = document.getElementById(GSDefines.SEARCHBAR_INPUT);
		
		// the top Right searchbar is there.
		if (!inputWrap)
		{
			var gs = document.getElementById(GSDefines.GROOVESHARK_BANNER);
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
		var songRow = $("div[row='" + request.songObj.rowNum + "']." + GSDefines.UI_WIDGET_CONTENT + "." + GSDefines.SLICK_ROW);
		if (!songRow)
		{
			// there was an error
			sendResponse({
				msg: "failed"
			});
		}
		else
		{
			var domSongRow = songRow.children("div." + GSDefines.SLICK_CELL + ".c0.song")[0];
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
		var songRow = $("div[row='" + request.songObj.rowNum + "']." + GSDefines.UI_WIDGET_CONTENT + "." + GSDefines.SLICK_ROW);
		if (!songRow) {
			// there was an error
			sendResponse({
				msg: "failed"
			});
		}
		else {
			var jQSongRowSong = songRow.children("div." + GSDefines.SLICK_CELL + ".c0.song");
			var domSongRowSong = jQSongRowSong[0];
			var domSongRowAdd = jQSongRowSong.children("a." + GSDefines.PLAY)[0];
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
		var clearBtn = $(GSDefines.CLEAR_BUTTON);
		clearBtn ? clearBtn.click() : "";
		sendResponse({
			msg: "doneClear"
		});
	}
	else if(request.action == "startListeningToTweets")
	{
		setInterval(function() { 
			var url='http://search.twitter.com/search.json?q=vicsdj&result_type=recent&count=1'; // make the url
			$.getJSON(url,function(results){ // get the tweets
				// incoming tweet from 
				
				var tweet = results.results[0];
				
				console.log(tweet.from_user);
				console.log(tweet.text);
				
				// Parse song name
				var searchCriteria = tweet.text.substr(tweet.text.indexOf(" ") + 1);
				
				if (searchCriteria == TWEET_CURRENT_SONG)
				{
					return;
				}
				else
					TWEET_CURRENT_SONG = searchCriteria;
				// check for search boxes, 1 of two places
		        var inputWrap = document.getElementById(GSDefines.SEARCHBAR_INPUT);
		        
		        // the top Right searchbar is there.
		        if (!inputWrap)
		        {
			        var songRow = $("div[row='0']." + GSDefines.UI_WIDGET_CONTENT + "." + GSDefines.SLICK_ROW);
		            var jQSongRowSong = songRow.children("div." + GSDefines.SLICK_CELL + ".c0.song");
		            var domSongRowSong = jQSongRowSong[0];
		            var domSongRowAdd = jQSongRowSong.children("a." + GSDefines.PLAY)[0];
		            if(document.dispatchEvent) 
		            { 
		            	var oEvent = document.createEvent("MouseEvents");
		                oEvent.initMouseEvent("click", true, true,window, 1, 1, 1, 1, 1, false, false, false, false, 0, domSongRowSong);
		                domSongRowSong.dispatchEvent( oEvent );
		            	
		                oEvent = document.createEvent("MouseEvents");
		                oEvent.initMouseEvent("click", true, true,window, 1, 1, 1, 1, 1, false, false, false, false, 0, domSongRowAdd);
		                domSongRowAdd.dispatchEvent( oEvent );
		            }
		            
		        }
		        else
		        	continueTweetResponse(request, searchCriteria);
				
			});
		}, 10000);
		
	}
	else
		sendResponse({});
});

function continueTweetResponse(request, searchCriteria) {
	// TODO write one method for this
	var inputWrap = document.getElementById(GSDefines.SEARCHBAR_INPUT);
	var inputBox = null;
	var inputSubmit = $('#' + GSDefines.SEARCH_BUTTON);
	for (var i = 0;i < inputWrap.children.length;i++)
	{
		if (inputWrap.children[i].getAttribute('type') == "text")
		{
			inputBox = inputWrap.children[i];
		}
	}
	inputBox.focus();
	inputBox.value = searchCriteria;
	inputSubmit.click();
	
	var pageWrapper = document.getElementById(GSDefines.PAGE_WRAPPER);
	if (pageWrapper) {
		pageWrapper.addEventListener('DOMSubtreeModified', onTweetRequest, false);
	}
}

function onTweetRequest(request) {
	var page = document.getElementById(GSDefines.PAGE);
	if (page)
	{
		var grid = $("#" + GSDefines.GRID);
		if (grid)
		{
			var elems = grid.find("." + GSDefines.UI_WIDGET_CONTENT);
			console.log('Currently ' + elems.length + " in the list.");	
			if (elems.length > 0 && elems[0].getAttribute(GSDefines.TITLE) !== undefined) {
				setTimeout(function() {
					var songRow = $("div[row='0']." + GSDefines.UI_WIDGET_CONTENT + "." + GSDefines.SLICK_ROW);
					if (!songRow)
					{
						// there was an error
						sendResponse({
							msg: "failed"
						});
					}
					else
					{
						var domSongRow = songRow.children("div." + GSDefines.SLICK_CELL + ".c0.song")[0];
						if(document.dispatchEvent) 
						{ 
						    var oEvent = document.createEvent("MouseEvents");
						    oEvent.initMouseEvent("dblclick", true, true,window, 1, 1, 1, 1, 1, false, false, false, false, 0, domSongRow);
						    domSongRow.dispatchEvent( oEvent );
					    }
						sendResponse({
						});	
					}
				}, 50);
				var pageWrapper = document.getElementById(GSDefines.PAGE_WRAPPER);
				pageWrapper.removeEventListener('DOMSubtreeModified', onTweetRequest, false);
			}
		}
	}
	
}

function startSearchInput(request)
{
	searchTimer = setTimeout(sendSearchResults, 5000);
	var inputWrap = document.getElementById(GSDefines.SEARCHBAR_INPUT);
	var inputBox = null;
	var inputSubmit = $('#' + GSDefines.SEARCH_BUTTON);
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
	var pageWrapper = document.getElementById(GSDefines.PAGE_WRAPPER);
	if (pageWrapper) {
		if (_isPageListener)
			removeQueryListener();
		pageWrapper.addEventListener('DOMSubtreeModified', startQueryResponse, false);
		_isPageListener = true;
	}
}

function removeQueryListener()
{
	var pageWrapper = document.getElementById(GSDefines.PAGE_WRAPPER);
	if (pageWrapper) {
		pageWrapper.removeEventListener('DOMSubtreeModified', startQueryResponse, false);
	}
}

function startQueryResponse()
{
	var page = document.getElementById(GSDefines.PAGE);
	if (page)
	{
		var grid = $("#" + GSDefines.GRID);
		if (grid)
		{
			var elems = grid.find("." + GSDefines.UI_WIDGET_CONTENT);
			console.log('Currently ' + elems.length + " in the list.");	
			if (elems.length >= 50 && elems[0].getAttribute(GSDefines.TITLE) !== undefined) {
				setTimeout(sendSearchResults, 50);
			}
		}
	}
}

function sendSearchResults()
{
	clearTimeout(searchTimer);
	var elems = $("#" + GSDefines.GRID + " ." + GSDefines.UI_WIDGET_CONTENT);
	removeQueryListener();
	var jsonElems = [];
	var tempSongStruct;
	for (var i = 0;i < elems.length;i++)
	{
		if (i > 50)
			break;
		tempSongStruct = {song: null, artist: null, rowNum: i};
		var tmpVal = $(elems[i]).find("." + GSDefines.SONGLINK)[0];
		tempSongStruct.song = tmpVal ? tmpVal.getAttribute(GSDefines.TITLE) : ""; 
		tmpVal = $(elems[i]).find("." + GSDefines.FIELD)[0];
		tempSongStruct.artist = tmpVal ? tmpVal.getAttribute(GSDefines.TITLE) : ""; 
		jsonElems.push(tempSongStruct);
	}
	_inSearch = false;
	sendResponseNotFull = false;
	chrome.extension.sendRequest({
		msg: "songsDone",
		data: jsonElems 
	});
}

