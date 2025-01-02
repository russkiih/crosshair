Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.ExpandEnvironmentStrings("%USERPROFILE%") & "\Desktop\DayZ Crosshair.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = oWS.CurrentDirectory & "\start-crosshair.bat"
oLink.IconLocation = oWS.CurrentDirectory & "\icon.ico"
oLink.WindowStyle = 7
oLink.WorkingDirectory = oWS.CurrentDirectory
oLink.Description = "DayZ Crosshair Overlay"
oLink.Save 