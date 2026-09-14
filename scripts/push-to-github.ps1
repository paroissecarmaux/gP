<#
.SYNOPSIS
    Publie le depot local sur https://github.com/paroissecarmaux/gP.git

.EXAMPLE
    .\scripts\push-to-github.ps1
    .\scripts\push-to-github.ps1 -CommitMessage "Ajout du module Agenda"
#>
param(
    [string]$CommitMessage = "Version initiale de gParoisse (V1 a V11)"
)

$RemoteUrl = "https://github.com/paroissecarmaux/gP.git"
$GitEmail = "blaurens31@gmail.com"
$GitName = if ($env:GIT_USER_NAME) { $env:GIT_USER_NAME } else { "Benjamin Laurens" }

Set-Location (Join-Path $PSScriptRoot "..")

if (-not (Test-Path ".git")) {
    Write-Host "Initialisation du depot git..."
    git init
    git branch -M main
}

# Identite locale a ce depot uniquement (ne touche pas a la config globale).
git config user.name $GitName
git config user.email $GitEmail

$hasOrigin = git remote 2>$null | Where-Object { $_ -eq "origin" }
if ($hasOrigin) {
    git remote set-url origin $RemoteUrl
} else {
    git remote add origin $RemoteUrl
}

git add -A

git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "Rien a committer (aucun changement depuis le dernier commit)."
} else {
    git commit -m $CommitMessage
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Le commit a echoue."
        exit 1
    }
}

Write-Host ""
Write-Host "Envoi vers $RemoteUrl..."
Write-Host "Si une fenetre de connexion GitHub s'ouvre, connectez-vous avec le compte blaurens31@gmail.com."
Write-Host ""

git push -u origin main
if ($LASTEXITCODE -ne 0) {
    Write-Error "Le push a echoue. Verifiez vos identifiants GitHub et que le depot paroissecarmaux/gP existe et vous est accessible."
    exit 1
}

Write-Host "Termine : le code est sur https://github.com/paroissecarmaux/gP"
