// Serveur de fichiers statiques minimal, sans dépendance (uniquement les
// modules natifs de Node). Rôle unique : servir index.html/css/js/vendor
// sur http://localhost pour que les modules ES et IndexedDB fonctionnent de
// façon fiable (contrairement à une ouverture directe en file://). Aucune
// logique métier ici, aucun accès à la base de données : ce n'est pas un
// "backend applicatif", juste l'équivalent de `python -m http.server`.
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5500;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function safeJoin(root, requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const resolved = path.normalize(path.join(root, decoded));
  if (!resolved.startsWith(root)) return null; // empêche de sortir du dossier du projet
  return resolved;
}

const server = http.createServer((req, res) => {
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = safeJoin(ROOT, urlPath);

  if (!filePath) {
    res.writeHead(400);
    res.end('Requête invalide.');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Fichier introuvable : ${urlPath}`);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Le port ${PORT} est déjà utilisé. gParoisse tourne peut-être déjà : ouvrez http://localhost:${PORT}`);
  } else {
    console.error(err);
  }
  process.exitCode = 1;
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`gParoisse est prêt : ${url}`);

  const openCommand = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(openCommand, () => {});
});
