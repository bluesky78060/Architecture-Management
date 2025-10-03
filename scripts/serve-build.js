/* Simple static server for CRA build with SPA fallback */
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 5000;
const root = path.resolve(__dirname, '..', 'build');

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURI(req.url.split('?')[0]);
  const safePath = urlPath.replace(/\.\./g, '');
  let filePath = path.join(root, safePath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (err2, data) => {
      if (err2) {
        // SPA fallback to index.html
        const indexPath = path.join(root, 'index.html');
        fs.readFile(indexPath, (err3, indexData) => {
          if (err3) {
            res.statusCode = 500;
            res.end('Server error');
            return;
          }
          res.setHeader('Content-Type', 'text/html');
          res.end(indexData);
        });
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
      res.end(data);
    });
  });
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Static server listening on http://localhost:${port}`);
});

