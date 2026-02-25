import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, '..', 'public', 'docs');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();

  console.log('Loading PragyaX...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 60000 });

  console.log('Waiting for boot sequence...');
  await sleep(14000);

  // Screenshot 1: Full overview
  console.log('Capturing main overview...');
  await page.screenshot({ path: path.join(docsDir, 'pragyax-main.png'), fullPage: false });

  // Screenshot 2: Switch to FLIR mode
  console.log('Capturing tactical mode...');
  try {
    const modeButtons = await page.$$('button');
    for (const btn of modeButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('FLIR')) {
        await btn.click();
        break;
      }
    }
    await sleep(2000);
    await page.screenshot({ path: path.join(docsDir, 'pragyax-tactical.png'), fullPage: false });
  } catch (e) {
    console.log('Could not capture tactical mode:', e.message);
  }

  // Screenshot 3: Left panel
  console.log('Capturing left panel...');
  await page.screenshot({
    path: path.join(docsDir, 'pragyax-left-panel.png'),
    clip: { x: 0, y: 38, width: 220, height: 700 },
  });

  // Screenshot 4: Top HUD
  console.log('Capturing top HUD...');
  await page.screenshot({
    path: path.join(docsDir, 'pragyax-top-hud.png'),
    clip: { x: 0, y: 0, width: 1920, height: 42 },
  });

  // Screenshot 5: Bottom nav
  console.log('Capturing bottom nav...');
  await page.screenshot({
    path: path.join(docsDir, 'pragyax-bottom-nav.png'),
    clip: { x: 0, y: 1038, width: 1920, height: 42 },
  });

  // Screenshot 6: Right panel
  console.log('Capturing right panel...');
  await page.screenshot({
    path: path.join(docsDir, 'pragyax-right-panel.png'),
    clip: { x: 1740, y: 38, width: 180, height: 700 },
  });

  await browser.close();
  console.log('All screenshots captured in public/docs/');
}

main().catch(err => {
  console.error('Screenshot failed:', err);
  process.exit(1);
});
