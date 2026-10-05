const http = require('http');

const question = 'What percentage of users abandon their search?';
const body = JSON.stringify({ question });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/rag',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
    // Print first token we get
    if (data.includes('data:') && data.length < 2000) {
      process.stdout.write(data);
    }
  });
  res.on('end', () => {
    console.log('\n--- DONE (first 800 chars) ---');
    console.log(data.substring(0, 800));
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
  process.exit(1);
});

req.write(body);
req.end();

// Timeout after 25s
setTimeout(() => {
  console.log('Timeout');
  process.exit(0);
}, 25000);
