Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('c:\Users\lingc\Downloads\FYP\Final_Year_Project_IP1_1002473193 (1).docx')
$entry = $zip.GetEntry('word/document.xml')
$reader = New-Object System.IO.StreamReader($entry.Open())
$xml = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
$text = $xml -replace '<[^>]+>', ' '
[System.IO.File]::WriteAllText('c:\Users\lingc\Downloads\FYP\proposal.txt', $text)
