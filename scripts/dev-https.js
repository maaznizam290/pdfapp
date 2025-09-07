const { createServer } = require('https');
const { readFileSync } = require('fs');
const { spawn } = require('child_process');
const path = require('path');

// Create self-signed certificate for development
const { execSync } = require('child_process');

try {
  // Check if certificate exists
  require('fs').accessSync('./localhost.pem');
  require('fs').accessSync('./localhost-key.pem');
  console.log('SSL certificates found');
} catch (error) {
  console.log('Creating SSL certificates for development...');
  try {
    execSync('openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"', { stdio: 'inherit' });
    console.log('SSL certificates created successfully');
  } catch (certError) {
    console.log('Could not create SSL certificates. Please install OpenSSL or use Option 1.');
    process.exit(1);
  }
}

const options = {
  key: readFileSync('./localhost-key.pem'),
  cert: readFileSync('./localhost.pem')
};

// Start Next.js with HTTPS
const nextProcess = spawn('npx', ['next', 'dev', '--port', '3001'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

// Create HTTPS proxy
const server = createServer(options, (req, res) => {
  // Proxy to Next.js
  const proxyReq = require('http').request({
    hostname: 'localhost',
    port: 3001,
    path: req.url,
    method: req.method,
    headers: req.headers
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  req.pipe(proxyReq);
});

server.listen(3000, () => {
  console.log('🚀 Development server running on https://localhost:3000');
  console.log('📁 Next.js running on http://localhost:3001');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  nextProcess.kill();
  server.close();
  process.exit(0);
});
