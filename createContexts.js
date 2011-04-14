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

setupContextMenus();