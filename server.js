const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
};

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = files[pathname];
  if (!file || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404).end('Not found');
    return;
  }
  fs.readFile(path.join(__dirname, file[0]), (error, contents) => {
    if (error) {
      response.writeHead(500).end('Server error');
      return;
    }
    response.writeHead(200, { 'Content-Type': file[1], 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : contents);
  });
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  server.listen(port, '127.0.0.1', () => console.log(`Open http://127.0.0.1:${port}`));
}
module.exports = server;
