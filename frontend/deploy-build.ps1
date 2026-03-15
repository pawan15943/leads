# Creates static deploy folder for leads.libraro.in (Windows)
# No Node.js needed on server - works with Apache/PHP shared hosting
$ErrorActionPreference = "Stop"

Write-Host "Building Next.js static export..."
npm run build

Write-Host "Creating deploy folder..."
$deployDir = "deploy"
if (Test-Path $deployDir) { Remove-Item -Recurse -Force $deployDir }
New-Item -ItemType Directory -Path $deployDir | Out-Null

# Copy static export output (HTML, CSS, JS)
Copy-Item -Path "out\*" -Destination $deployDir -Recurse -Force

# Copy .htaccess for Apache
if (Test-Path "public\.htaccess") {
    Copy-Item -Path "public\.htaccess" -Destination $deployDir -Force
}

Write-Host "Done! Deploy folder: $deployDir"
Write-Host "Upload ALL contents of $deployDir to your web root (e.g. public_html for leads.libraro.in)"
Write-Host "No Node.js required - works with Apache/PHP hosting"
