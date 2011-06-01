var _currentSongTd = null;
var _currentSongName = "";
var port;
var tabId;
var KEYCODE_ENTER = 13;

function createNowPlaying()
{
	getNowPlayingFromGS();
	getControlState();
	startSearchListeners();
}

function startSearchListeners()
{
	document.getElementById('search_input_box').addEventListener('onkeyup', searchKeyUp, false);
}

function setNowPlayingEvents()
{
	var elements = document.getElementsByClassName('songCell');
	for (var i = 0;i < elements.length;i++)
	{
		elements[i].addEventListener('click', playCurrentSong, false);
	}
}

function createPlaySongImg(td)
{
	var checkForExists = document.getElementById('nowPlayingGif');
	checkForExists ? checkForExists.offsetParent.removeChild(checkForExists) : checkForExists = null;
		
	var songCellTextWrap = td.firstChild.firstChild;
	var loadingImage = document.createElement('img');
	loadingImage.setAttribute('id', 'nowPlayingGif');
	loadingImage.setAttribute('src', 'images/nowPlayingGif.gif');
	loadingImage.style.verticalAlign = 'baseline';
	songCellTextWrap.addChild(loadingImage);
}

function playCurrentSong(e)
{
	chrome.windows.getCurrent(function(window){
		
		chrome.tabs.getAllInWindow(window.id, function(tabs){
			console.log("# of tabs: " + tabs.length);
			
			for (var i = 0; i < tabs.length; i++) 
			{
				if (gSharkRegex.test(tabs[i].url) === true)
				{
					chrome.tabs.sendRequest(tabs[i].id, { action: GSDefines.PLAYSONG_REQ, songId: e.target.offsetParent.getAttribute('id') }, function(response) {
						getNowPlayingFromGS();
					});
				}
			}
		});
	});
}

function removeNowPlaying(tbl)
{
	if (tbl.children)
	{
		for (var i = tbl.children.length-1;i >= 0;i--) {
			for (var j = 0;j < tbl.children[i].children.length;j++)
			{
				// remove event listeners
				tbl.children[i].children[j].removeEventListener('click', playCurrentSong, false);
			}
			tbl.deleteRow(i);
		}
		tbl.children = null;
	}
}

function toggleShuffle()
{
	var shuffleBtn = document.getElementById('shuffleButton');
	if (hasClass(shuffleButton, 'shuffleOn')) {
		shuffleBtn.className = shuffleBtn.className.replace(/\bshuffleOn\b/, '');
		shuffleBtn.className += ' shuffleOff';
	}
	else if (hasClass(shuffleButton, 'shuffleOff')) {
			shuffleBtn.className = shuffleBtn.className.replace(/\bshuffleOff\b/, '');
			shuffleBtn.className += ' shuffleOn';	
	}
	go('shuffle');
}

function cycleRepeat()
{
	var repeatBtn = document.getElementById('repeatButton');
	if(repeatBtn.className.indexOf('repeatOff') !== -1)
	{
		repeatBtn.className = repeatBtn.className.replace(/\brepeatOff\b/, '');
		repeatBtn.className += ' repeatAll';
	}
	else if(repeatBtn.className.indexOf('repeatAll') !== -1)
	{
		repeatBtn.className = repeatBtn.className.replace(/\brepeatAll\b/, '');
		repeatBtn.className += ' repeatOne';
	}
	else if(repeatBtn.className.indexOf('repeatOne') !== -1)
	{
		repeatBtn.className = repeatBtn.className.replace(/\brepeatOne\b/, '');
		repeatBtn.className += ' repeatOff';
	}
	go('repeat');
}

function getControlState()
{
	chrome.windows.getCurrent(function(window){
	
		console.log("Window ID: " + window.id);
		chrome.tabs.getAllInWindow(window.id, function(tabs){
			console.log("# of tabs: " + tabs.length);
			
			for (var i = 0; i < tabs.length; i++) 
			{
				console.log("Tab: " + tabs[i].title);
				if (gSharkRegex.test(tabs[i].url) === true)
				{
					chrome.tabs.sendRequest(tabs[i].id, {
						action: GSDefines.GET_CONTROL_STATE_REQ }, function(response){
						
						var fakeElemShuffle = document.createElement('div');
						fakeElemShuffle.style.display = 'none';
						fakeElemShuffle.className = response.shuffleClass;
						
						var fakeElemRepeat = document.createElement('div');
						fakeElemRepeat.style.display = 'none';
						fakeElemRepeat.className = response.repeatClass;
						
						var shuffleButton = document.getElementById('shuffleButton');
						var repeatButton = document.getElementById('repeatButton');
			
						if (hasClass(fakeElemShuffle, 'active'))
						{
							shuffleButton.className = shuffleButton.className.replace(/\bshuffleOff\b/, '');
							shuffleButton.className += ' shuffleOn';	
						}
						else
						{
							shuffleButton.className = shuffleButton.className.replace(/\bshuffleOn\b/, '');
							shuffleButton.className += ' shuffleOff';
						}
						
						repeatButton.className = repeatButton.className.replace(/\brepeatAll\b/, '');
						repeatButton.className = repeatButton.className.replace(/\brepeatOff\b/, '');
						repeatButton.className = repeatButton.className.replace(/\brepeatOne\b/, '');
						
						if (hasClass(fakeElemRepeat, 'all'))
							repeatButton.className += ' repeatAll';
						else if (hasClass(fakeElemRepeat, 'one'))
							repeatButton.className += ' repeatOne';
						else if (hasClass(fakeElemRepeat, 'none'))
							repeatButton.className += ' repeatOff';
						
						delete fakeElemShuffle;
						delete fakeElemRepeat;
					});
				}
			}
		});
	});
}

function getNowPlayingFromGS()
{
	// clean up current list if for some reason we have one
	removeNowPlaying(document.getElementById('nowPlayingTbl'));
	
	chrome.windows.getCurrent(function(window) {

		chrome.tabs.getAllInWindow(window.id, function(tabs) {
			console.log("# of tabs: " + tabs.length);

			for (var i = 0;i < tabs.length;i++)
			{
				if (gSharkRegex.test(tabs[i].url) == true)
				{
					chrome.tabs.sendRequest(tabs[i].id, { action: GSDefines.GETQUEUE_REQ }, function(response)
					{
						var queueList = response.queue;
						
						var nowPlayingTbl = document.getElementById('nowPlayingTbl')
						for (var i = 0;i < queueList.length;i++)
						{
							if ((i % 5) == 0)
							{
								var nowPlayingRow = document.createElement('tr');
								nowPlayingRow.setAttribute('class', 'songRow');
								nowPlayingTbl.appendChild(nowPlayingRow);
							}
							var newTd = document.createElement('td');
							newTd.setAttribute('class', 'songCell');
							newTd.setAttribute('id', queueList[i].id);
							newTd.setAttribute('songName', queueList[i].name);
							newTd.setAttribute('artistName', queueList[i].artist)
							newTd.setAttribute('thumbSrc', queueList[i].imgHref);
							
							var newTextWrap = document.createElement('div')
							newTextWrap.setAttribute('class', 'songCellTextWrap');
							if (queueList[i].imgHref.indexOf('/images/default/album_250.png') == -1) 
								newTextWrap.style.backgroundImage = "url(" + queueList[i].imgHref + ")";
							else {
								newTextWrap.style.backgroundImage = "url('images/play.png')";
								newTextWrap.style.backgroundSize = '4em';
							}
							
							var newText = document.createElement('div')
							newText.setAttribute('class', 'songCellText');
							newText.innerHTML = queueList[i].name + "</br><span class='playlistartist'>" + queueList[i].artist + "</span>";
							newTextWrap.appendChild(newText);
							newTd.appendChild(newTextWrap);
							nowPlayingRow.appendChild(newTd);
						}
						nowPlayingTbl.appendChild(nowPlayingRow);
						setNowPlayingEvents();
					});
					break;
				}
			}
		});
	});
}

function searchKeyUp(e)
{
	console.log(e.keyCode);
	if (e.keyCode == KEYCODE_ENTER)
	{
		runSearch();
	}
}

function runSearch()
{
	
	chrome.windows.getCurrent(function(window) {
		chrome.tabs.getAllInWindow(window.id, function(tabs) {
			console.log("# of tabs: " + tabs.length);

			for (var i = 0;i < tabs.length;i++)
			{
				if (gSharkRegex.test(tabs[i].url) === true)
				{
					
					$("#songResultListWrap").dialog({
						dialogClass: "songResultListWrap songListWaiting", 
						close: function() { 
							$("#songResultListWrap").empty();
						},
						show: "puff",
						hide: "puff",
						width: 500,
						height: 400,
						position: "top",
						modal: true
					});
					
					var value = document.getElementById('search_input_box').value;
					console.log("Running search on " + value);
					
					chrome.tabs.sendRequest(tabs[i].id, { action: GSDefines.STARTSEARCH_REQ, value: value }, function(response)
					{
						console.log(response.msg);
					});
				}
			}
		});
	});
}

function makeSongResponseList(request)
{
    if (!request.data || request.data.length === 0)
        return;
        
	var tbl = $('<table></table>');
	tbl.addClass("songResultsTable");
	
	var tempRow = $('<tr></tr>');
	tempRow.addClass('songResultsRowHeader');
	
	tempRow.append($('<td></td>'));
	
	var tempName = $('<td></td>');
	tempName.addClass('songResultsTd');
	tempName.append("Track name");
	
	var tempArtist = $('<td></td>');
	tempArtist.addClass('songResultsTd');
	tempArtist.append("Artist");
	
	tempRow.append(tempName);
	tempRow.append(tempArtist);
	
	tbl.append(tempRow);
	
	for (var i = 0;i < request.data.length;i++)
	{
		tempRow = $('<tr></tr>');
		tempRow.addClass('songResultsRow');
		if (i % 2)
			tempRow.addClass('songResultsRowOdd');
			
		tempName = $('<td></td>');
		tempName.addClass('songResultsTdSong');
		tempName.append(request.data[i].song);
		
		tempArtist = $('<td></td>');
		tempArtist.addClass('songResultsTdArtist');
		tempArtist.append(request.data[i].artist);
		
		var tempAddToPlaylist = $('<td></td>');
		tempAddToPlaylist.addClass('tempAddToPlaylistTd');		

		tempRow.append(tempAddToPlaylist);
		tempRow.append(tempName);
		tempRow.append(tempArtist);
		
		tempRow.attr('rownum', request.data[i].rowNum);
		tempRow.attr('song', request.data[i].song);
		tempRow.click(playSongFromResults);
		tempRow.click(addToPlaylistFromResponse);
		
		tbl.append(tempRow);
	}
	
	return tbl;
}

function addToPlaylistFromResponse(e)
{
	// if they didn't click on the add button.
	if (e.target.className.indexOf("tempAddToPlaylistTd") == -1)
		return;
	var slf = this;
	chrome.windows.getCurrent(function(window) {
		chrome.tabs.getAllInWindow(window.id, function(tabs) {
			for (var i = 0;i < tabs.length;i++)
			{
				if (gSharkRegex.test(tabs[i].url) == true)
				{
					chrome.tabs.sendRequest(tabs[i].id, { 
						action: 'addToNowPlayingFromResults', 
						songObj: { 
							song: slf.getAttribute('song'), 
							rowNum: slf.getAttribute('rownum') 
							}
						},
						function(response)
						{
							if (response.msg == "doneAdding")
							{
								console.log('added song ' + slf.getAttribute('song') + ' from response.');
								setTimeout(function() { getNowPlayingFromGS(); }, 1000);
							}
						}
					);
				}
			}
		});
	});
}

function playSongFromResults(e)
{
	// if it is the play button.
	if (e.target.className.indexOf("tempAddToPlaylistTd") !== -1)
		return;
	var slf = this;
	chrome.windows.getCurrent(function(window) {
		chrome.tabs.getAllInWindow(window.id, function(tabs) {
			for (var i = 0;i < tabs.length;i++)
			{
				if (gSharkRegex.test(tabs[i].url) === true)
				{
					chrome.tabs.sendRequest(tabs[i].id, { 
						action: 'playSongFromResults', 
						songObj: { 
							song: slf.getAttribute('song'), 
							rowNum: slf.getAttribute('rownum') 
							}
						}, 
						function(response)
						{
							if (response.msg == "donePlaying")
							{
								console.log('played song ' + slf.getAttribute('song') + ' from response.');
								setTimeout(function() { getNowPlayingFromGS(); }, 1000);
							}
						}
					);
				}
			}
		});
	});
}

function clearSongs()
{
	chrome.windows.getCurrent(function(window) {
		chrome.tabs.getAllInWindow(window.id, function(tabs) {
			for (var i = 0;i < tabs.length;i++)
			{
				if (gSharkRegex.test(tabs[i].url) === true)
				{
					chrome.tabs.sendRequest(tabs[i].id, { 
						action: "clearSongs"
						},
						function(response){
							setTimeout(function() { getNowPlayingFromGS(); }, 1000);
						}
					);
				}
			}
		});
	});
}

chrome.extension.onRequest.addListener(function(request) 
{
	if (request.msg == "songsDone")
	{		
		$("#songResultListWrap").append(makeSongResponseList(request));	
		$("#songResultListWrap").dialog("option", "dialogClass", "songResultListWrap");
	}
});

function onFocusSearchBox(sb)
{
	sb.value == 'Type to Search GrooveShark...' ? sb.value = '' : sb.select();
}