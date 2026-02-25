const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Check for certificate files before starting
const keyPath = path.join(__dirname, '../certs/localhost-key.pem');
const certPath = path.join(__dirname, '../certs/localhost-cert.pem');

if (!fs.existsSync(keyPath)) {
  console.error('Error: SSL key file not found:', keyPath);
  console.error('Run: npm run setup:certs');
  process.exit(1);
}

if (!fs.existsSync(certPath)) {
  console.error('Error: SSL certificate file not found:', certPath);
  console.error('Run: npm run setup:certs');
  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on https://${hostname}:${port}`);
    console.log('> PWA installation available');
  });
});
