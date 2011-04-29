var getFnFromContext = function(context)
{
	switch (context)
	{
		case "Play/Pause":
			return play;
		case "Back":
			return back;
		case "Next":
			return next;
	}
};

var setupContextMenus = function()
{
	var menus = ["Play/Pause", "Back", "Next"];
	var contexts = ["page", "image", "selection", "link", "editable", "video", "audio"];
	for (var i = 0;i < menus.length;i++)
	{
		var title = menus[i];
		var fn = getFnFromContext(title);
		var id = chrome.contextMenus.create({
			"title": title,
			"type": "normal",
			"contexts": contexts,
			"onclick": fn
		});
		console.log("'" + title + "' item: " + id);
	}
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

setupContextMenus();
