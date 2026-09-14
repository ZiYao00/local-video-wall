Option Explicit

Dim shell, fso, root, servicePath, command
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(WScript.ScriptFullName)
servicePath = root & "\service.bat"
command = "cmd.exe /d /c " & Chr(34) & Chr(34) & servicePath & Chr(34) & " desktop" & Chr(34)
shell.Run command, 0, False
