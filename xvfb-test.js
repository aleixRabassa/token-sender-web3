const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

(async () => {
  const cacheSynpress = path.join(process.cwd(), '.cache-synpress');
  const metamaskPath = path.join(cacheSynpress, 'metamask-chrome-13.13.1');
  const hash = '0021ecc55d70145719e7';
  const cacheDir = path.join(cacheSynpress, hash);
  const tmpDir = '/tmp/synpress-xvfb-test';
  
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.cpSync(cacheDir, tmpDir, { recursive: true });
  
  const context = await chromium.launchPersistentContext(tmpDir, {
    headless: false,
    args: [
      '--disable-extensions-except=' + metamaskPath,
      '--load-extension=' + metamaskPath,
    ],
    timeout: 30000,
  });
  
  await new Promise(r => setTimeout(r, 5000));
  const extensionId = 'ikkihdhafhhpjllhcnfpgkakmlahjhel';

  // Unlock
  const mmPage = context.pages().find(p => p.url().includes('chrome-extension')) || context.pages()[0];
  await mmPage.goto('chrome-extension://' + extensionId + '/home.html');
  await new Promise(r => setTimeout(r, 3000));
  if (await mmPage.locator('[data-testid="unlock-password"]').count() > 0) {
    await mmPage.locator('[data-testid="unlock-password"]').fill('Tester@1234');
    await mmPage.locator('[data-testid="unlock-submit"]').click();
    await new Promise(r => setTimeout(r, 5000));
    console.log('Unlocked');
  }

  context.on('page', (p) => console.log('NEW PAGE:', p.url()));

  // Navigate to localhost
  const appPage = await context.newPage();
  await appPage.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 3000));
  console.log('App page loaded');

  // Trigger eth_requestAccounts
  console.log('Triggering eth_requestAccounts...');
  appPage.evaluate(() => {
    window.ethereum.request({ method: 'eth_requestAccounts' });
  }).catch(() => {});
  
  // Wait up to 15 seconds for notification page to appear
  let notifFound = false;
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const pages = context.pages();
    const notif = pages.find(p => p.url().includes('notification.html'));
    if (notif) {
      console.log('Notification page found after ' + (i+1) + 's!');
      notifFound = true;
      break;
    }
  }
  
  if (!notifFound) {
    console.log('No notification page after 15s');
    console.log('Pages:', context.pages().map(p => p.url()));
  }
  
  await context.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
