/**
 * Disheera Autonomous Batch Indexing Engine
 * 
 * Automatically publishes all canonical URLs to:
 * 1. Google Indexing API (Zero manual inspection needed)
 * 2. IndexNow Protocol (Bing, Yahoo, Microsoft Copilot, Yandex)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const SITEMAP_PATH = path.join(__dirname, '..', 'client', 'sitemap.xml');
const INDEXNOW_KEY = 'e7a9b1c3d5f84260a1b2c3d4e5f67890';
const HOST = 'disheera.site';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'service_account.json');

// Helper: Base64URL encoding
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// 1. Extract canonical URLs from client/sitemap.xml
function getSitemapUrls() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error(`[Error] Sitemap not found at: ${SITEMAP_PATH}`);
    process.exit(1);
  }
  const content = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const regex = /<loc>(https:\/\/disheera\.site[^<]*)<\/loc>/g;
  const urls = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!urls.includes(match[1])) {
      urls.push(match[1]);
    }
  }
  return urls;
}

// 2. Submit to IndexNow (Bing / Copilot / Yahoo)
async function submitIndexNow(urls) {
  console.log(`\n=======================================================`);
  console.log(`🚀 [1/2] Submitting ${urls.length} URLs to IndexNow (Bing & Copilot)...`);
  console.log(`=======================================================`);
  const payload = JSON.stringify({
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urls
  });

  return new Promise((resolve) => {
    const req = https.request(
      'https://api.indexnow.org/indexnow',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 202) {
            console.log(`✅ IndexNow Success: Status ${res.statusCode} — All URLs submitted for instant crawl!`);
            resolve(true);
          } else {
            console.log(`⚠️ IndexNow Status ${res.statusCode}: ${data || 'Accepted'}`);
            resolve(false);
          }
        });
      }
    );

    req.on('error', (err) => {
      console.error(`❌ IndexNow Connection Error:`, err.message);
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

// Helper: Obtain Google OAuth2 Access Token from Service Account Key
async function getGoogleAccessToken(keyData) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600; // 1 hour expiration

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const claimSet = {
    iss: keyData.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: exp,
    iat: iat
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
  const unsignedToken = `${encodedHeader}.${encodedClaimSet}`;

  // Sign using RSA-SHA256 and private key
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer.sign(keyData.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwtAssertion = `${unsignedToken}.${signature}`;

  const postData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwtAssertion}`;

  return new Promise((resolve, reject) => {
    const req = https.request(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.access_token) {
              resolve(parsed.access_token);
            } else {
              reject(new Error(parsed.error_description || parsed.error || body));
            }
          } catch (e) {
            reject(new Error(`Failed to parse token response: ${body}`));
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

// Publish single URL to Google Indexing API
async function publishUrlToGoogle(url, token) {
  const payload = JSON.stringify({
    url: url,
    type: 'URL_UPDATED'
  });

  return new Promise((resolve) => {
    const req = https.request(
      'https://indexing.googleapis.com/v3/urlNotifications:publish',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode === 200) {
              resolve({ success: true, url });
            } else {
              resolve({ success: false, url, error: json.error ? json.error.message : data });
            }
          } catch {
            resolve({ success: false, url, error: data });
          }
        });
      }
    );

    req.on('error', (err) => resolve({ success: false, url, error: err.message }));
    req.write(payload);
    req.end();
  });
}

// 3. Batch publish all URLs to Google Indexing API
async function submitGoogleIndexing(urls) {
  console.log(`\n=======================================================`);
  console.log(`🎯 [2/2] Publishing ${urls.length} URLs to Google Indexing API...`);
  console.log(`=======================================================`);

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.log(`❌ service_account.json not found in project root.`);
    return;
  }

  let keyData;
  try {
    keyData = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    console.log(`🔑 Service Account Authenticated: ${keyData.client_email}`);
  } catch (err) {
    console.error(`❌ Failed to read service_account.json:`, err.message);
    return;
  }

  let token;
  try {
    token = await getGoogleAccessToken(keyData);
    console.log(`✅ Google OAuth2 Token Generated Successfully!`);
  } catch (err) {
    console.error(`❌ Google OAuth2 Failed:`, err.message);
    return;
  }

  let successCount = 0;
  let failedCount = 0;
  let sampleError = null;

  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    process.stdout.write(`   [${i + 1}/${urls.length}] Publishing ${u} ... `);
    const result = await publishUrlToGoogle(u, token);
    if (result.success) {
      console.log(`✅ OK (Crawling Requested)`);
      successCount++;
    } else {
      console.log(`❌ FAILED`);
      failedCount++;
      if (!sampleError) sampleError = result.error;
    }
  }

  console.log(`\nGoogle Indexing Summary: ${successCount} Succeeded, ${failedCount} Failed`);
  if (sampleError) {
    console.log(`\n⚠️ Notice on Google Indexing Error:`);
    console.log(`   ${sampleError}`);
  }
}

async function main() {
  console.log(`\n=======================================================`);
  console.log(`       Disheera Autonomous Batch Indexing Pipeline      `);
  console.log(`=======================================================`);

  const urls = getSitemapUrls();
  console.log(`Found ${urls.length} Canonical URLs:`);
  urls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));

  // 1. Bing / Copilot
  await submitIndexNow(urls);

  // 2. Google
  await submitGoogleIndexing(urls);

  console.log(`\n🎉 Pipeline execution complete!\n`);
}

main().catch(console.error);
