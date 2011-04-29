var getFnFromContext = function(context)
{
	switch (context)
	{
		case "Play/Pause":
			return doPlay;
		case "Back":
			return doBack;
		case "Next":
			return doNext;
	}
};

var doPlay = function()
{
	go('play');
};

var doBack = function()
{
	go('back');
};

var doNext = function()
{
	go('next');
};

var gSharkRegex = new RegExp("^http://grooveshark.com");
			
var play = function(tab)
{
	console.log("playing/pausing!");
	var jscript = "document.getElementById('player_play_pause').click();";
	chrome.tabs.executeScript(tab.id, { code: jscript });
	console.log("done play/pause!");
};

var next = function(tab)
{
	var jscript = "document.getElementById('player_next').click();";
	chrome.tabs.executeScript(tab.id, { code: jscript });
};

var back = function(tab)
{
	var jscript = "document.getElementById('player_previous').click();";
	chrome.tabs.executeScript(tab.id, { code: jscript });
};

function shuffle(tab)
{
	var jscript = "document.getElementById('player_shuffle').click();";
	chrome.tabs.executeScript(tab.id, {code: jscript });
}

function repeat(tab)
{
	var jscript = "document.getElementById('player_loop').click();";
	chrome.tabs.executeScript(tab.id, {code: jscript });
}

var go = function(fn)
{
	chrome.windows.getCurrent(function(window) {

		console.log("Window ID: " + window.id);
		chrome.tabs.getAllInWindow(window.id, function(tabs) {
			console.log("# of tabs: " + tabs.length);

			for (var i = 0;i < tabs.length;i++)
			{
				console.log("Tab: " + tabs[i].title);
				if (gSharkRegex.test(tabs[i].url) == true)
				{
					console.log("GrooveShark tab is: " + i);
					switch(fn)
					{
						case 'play':
							play(tabs[i]);
							break;
						case 'next':
							next(tabs[i]);
							break;
						case 'back':
							back(tabs[i]);
							break;
						case 'repeat':
							repeat(tabs[i]);
							break;
						case 'shuffle':
							shuffle(tabs[i]);
							break;
					}
					break;
				}
			}
		});
	});
};

function hasClass(el, class_to_match) {
    var c;
    if (el && el.className && typeof class_to_match === "string") {
        c = el.getAttribute("class");
        c = " "+ c + " ";
        return c.indexOf(" " + class_to_match + " ") > -1;
    } else {
        return false;
    }
}
