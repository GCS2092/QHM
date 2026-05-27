# QHM — Vérification et lancement du projet
# Usage: .\run-projet.ps1           → vérifie builds
#        .\run-projet.ps1 -Dev      → lance Strapi + Next (2 processus)
#        .\run-projet.ps1 -Seed     → exécute seed:qhm (Strapi doit avoir tourné au moins une fois)

param(
    [switch]$Dev,
    [switch]$Seed
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$Cms = Join-Path $Root "fiscalscore-cms"
$App = Join-Path $Root "fiscalscore-app"

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

# Node / npm
Write-Step "Vérification Node.js"
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "ERREUR: Node.js introuvable. Installez Node 20+ depuis https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "Node: $(node -v)"
if (-not $npmCmd) {
    Write-Host "ERREUR: npm introuvable." -ForegroundColor Red
    exit 1
}
Write-Host "npm: $(npm -v)"

# Install
foreach ($dir in @($Cms, $App)) {
    if (-not (Test-Path (Join-Path $dir "node_modules"))) {
        Write-Step "npm install dans $dir"
        Push-Location $dir
        npm install
        Pop-Location
    }
}

# Env
if (-not (Test-Path (Join-Path $App ".env.local"))) {
    Write-Step "Création fiscalscore-app\.env.local depuis .env.example"
    Copy-Item (Join-Path $App ".env.example") (Join-Path $App ".env.local")
}

if ($Seed) {
    Write-Step "Seed QHM (npm run seed:qhm)"
    Push-Location $Cms
    npm run seed:qhm
    if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
    Pop-Location
    Write-Host "Seed terminé." -ForegroundColor Green
}

Write-Step "Build Strapi"
Push-Location $Cms
npm run build
$strapiOk = $LASTEXITCODE -eq 0
Pop-Location
if (-not $strapiOk) {
    Write-Host "ERREUR: build Strapi échoué." -ForegroundColor Red
    exit 1
}
Write-Host "Build Strapi OK" -ForegroundColor Green

Write-Step "Build Next.js"
Push-Location $App
npm run build
$appOk = $LASTEXITCODE -eq 0
Pop-Location
if (-not $appOk) {
    Write-Host "ERREUR: build Next.js échoué." -ForegroundColor Red
    exit 1
}
Write-Host "Build Next.js OK" -ForegroundColor Green

Write-Step "Lint Next.js"
Push-Location $App
npm run lint 2>&1
$lintOk = $LASTEXITCODE -eq 0
Pop-Location
if (-not $lintOk) {
    Write-Host "AVERTISSEMENT: lint avec erreurs (voir ci-dessus)." -ForegroundColor Yellow
}

if ($Dev) {
    Write-Step "Démarrage Strapi (nouvelle fenêtre)"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Cms'; npm run develop"
    Start-Sleep -Seconds 3
    Write-Step "Démarrage Next.js (nouvelle fenêtre)"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$App'; npm run dev"
    Write-Host "`nStrapi: http://localhost:1337/admin" -ForegroundColor Green
    Write-Host "App:   http://localhost:3000/login" -ForegroundColor Green
    Write-Host "Admin: admin@qhm.local / AdminQhm2026! (après seed:qhm)" -ForegroundColor Green
} else {
    Write-Host "`nBuilds réussis. Pour lancer en dev:" -ForegroundColor Green
    Write-Host "  .\run-projet.ps1 -Dev" -ForegroundColor White
    Write-Host "  .\run-projet.ps1 -Seed   # données CDC (après 1er démarrage Strapi)" -ForegroundColor White
}

exit 0
