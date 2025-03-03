Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.ExpandEnvironmentStrings("%USERPROFILE%") & "\Desktop\DayZ Crosshair.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "wscript.exe"
oLink.Arguments = """" & oWS.CurrentDirectory & "\start-hidden.vbs"""
oLink.IconLocation = oWS.CurrentDirectory & "\icon.ico,0"
oLink.WindowStyle = 1
oLink.WorkingDirectory = oWS.CurrentDirectory
oLink.Description = "DayZ Crosshair Overlay"
oLink.Save 
