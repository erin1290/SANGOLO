# Add firewall rules for Expo and Django
New-NetFirewallRule -DisplayName "Expo Dev Server" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Django Backend" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Metro Bundler" -Direction Inbound -Protocol TCP -LocalPort 19000 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Metro Bundler 2" -Direction Inbound -Protocol TCP -LocalPort 19006 -Action Allow -ErrorAction SilentlyContinue
Write-Host "Firewall rules added successfully"
