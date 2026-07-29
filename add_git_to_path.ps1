$currentPath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
if ($currentPath -notlike '*Git*') {
    [Environment]::SetEnvironmentVariable('Path', $currentPath + ';C:\Program Files\Git\cmd', 'Machine')
    Write-Host 'Git added to PATH successfully'
} else {
    Write-Host 'Git already in PATH'
}
