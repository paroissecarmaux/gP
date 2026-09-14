@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo Node.js n'est pas installe sur cet ordinateur.
    echo Va sur https://nodejs.org, installe la version "LTS", redemarre
    echo l'ordinateur si demande, puis relance ce fichier.
    echo.
    pause
    exit /b 1
)

if not exist node_modules (
    echo Premier lancement : installation des composants necessaires...
    echo Cela peut prendre quelques minutes, merci de patienter.
    call npm install
    if errorlevel 1 (
        echo.
        echo L'installation a echoue. Verifie la connexion internet et reessaie.
        pause
        exit /b 1
    )
)

echo.
echo Demarrage de gParoisse... l'application va s'ouvrir dans le navigateur.
echo Pour l'arreter : ferme cette fenetre noire, ou appuie sur Ctrl+C.
echo.
call npm run dev

pause
