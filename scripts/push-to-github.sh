#!/usr/bin/env bash
# Publie le dépôt local sur git@github.com:paroissecarmaux/gP.git
# Usage : bash scripts/push-to-github.sh ["message de commit"]
set -euo pipefail

REMOTE_URL="git@github.com:paroissecarmaux/gP.git"
GIT_EMAIL="blaurens31@gmail.com"
GIT_NAME="${GIT_USER_NAME:-Benjamin Laurens}"
COMMIT_MESSAGE="${1:-Version initiale de gParoisse (V1 à V11)}"

cd "$(dirname "$0")/.."

if [ ! -d .git ]; then
  echo "Initialisation du dépôt git..."
  git init
  git branch -M main
fi

# Identité locale à ce dépôt uniquement (ne touche pas à la config globale).
git config user.name "$GIT_NAME"
git config user.email "$GIT_EMAIL"

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REMOTE_URL"
else
  git remote set-url origin "$REMOTE_URL"
fi

git add -A

if git diff --cached --quiet; then
  echo "Rien à committer (aucun changement depuis le dernier commit)."
else
  git commit -m "$COMMIT_MESSAGE"
fi

echo "Test de connexion SSH à GitHub..."
if ! ssh -T git@github.com -o ConnectTimeout=8 2>&1 | grep -q "successfully authenticated"; then
  echo
  echo "⚠ L'authentification SSH à GitHub n'est pas encore active."
  echo "  Ajoutez la clé publique suivante à https://github.com/settings/ssh/new"
  echo "  (compte blaurens31@gmail.com), puis relancez ce script :"
  echo
  cat ~/.ssh/id_ed25519_gparoisse.pub 2>/dev/null || echo "  (clé introuvable — voir README pour la régénérer)"
  echo
  exit 1
fi

echo "Envoi vers $REMOTE_URL..."
git push -u origin main

echo "Terminé."
