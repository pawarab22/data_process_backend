const fs = require('fs');
const request = require('http').request;
const app = require('./src/app');
const http = require('http');
const DatabaseInitializer = require('./src/config/dbInit');
require('dotenv').config();

const PORT = 5005; // Use different port for testing

// Create test files
fs.writeFileSync('empty.json', '[]');
fs.writeFileSync('malformed.json', '{ "missingQuote: 123 }');

let server;

async function testEdgeCases() {
  await DatabaseInitializer.init();
  server = http.createServer(app).listen(PORT, async () => {
    
    console.log('\n--- 1. Testing Empty File ---');
    await uploadFile('empty.json', 'application/json');

    console.log('\n--- 2. Testing Malformed JSON ---');
    await uploadFile('malformed.json', 'application/json');

    console.log('\n--- 3. Testing Invalid Query Params ---');
    await testQueryOptions(99999, { filters: 'not an array' });

    console.log('\n--- 4. Testing Query on Non-existent Dataset Check ---');
    await testQueryOptions(99999, { filters: [] }); // Valid options but dataset missing
    
    server.close();
    process.exit(0);
  });
}

function uploadFile(filename, mimetype) {
  return new Promise((resolve) => {
    const fileBuf = fs.readFileSync(filename);
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    let data = '';
    data += `--${boundary}\r\n`;
    data += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
    data += `Content-Type: ${mimetype}\r\n\r\n`;
    
    const postData = Buffer.concat([
      Buffer.from(data, 'utf8'),
      fileBuf,
      Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'),
    ]);

    const req = request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/datasets/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': postData.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${body}`);
        resolve();
      });
    });
    req.write(postData);
    req.end();
  });
}

function testQueryOptions(id, bodyObj) {
    return new Promise((resolve) => {
        const postData = JSON.stringify(bodyObj);
        const req = request({
            hostname: 'localhost',
            port: PORT,
            path: `/api/datasets/${id}/query`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response: ${body}`);
                resolve();
            });
        });
        req.write(postData);
        req.end();
    });
}

testEdgeCases();
