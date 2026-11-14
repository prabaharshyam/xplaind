// BL-2 (2026-11-14): blog covers are typographic, in the brand teal, with one simple line drawing per
// guide and a single brass accent (docs/brand.md). Add a row to POSTS for a new guide, then run
// `npm run covers` to write public/blog/covers/<slug>.webp at 1200 x 600.
// Keep the cover line to two short lines: cards crop the top and bottom of the image.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "node_modules");
const OUT = path.join(process.cwd(), "public", "blog", "covers");
const SEA = '#7fd1c7', BRASS = '#d9b26a', MID = '#0e4a50', INK = '#0a2e33', PAPER = '#f4f7f6';
const sw = `stroke="${SEA}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
const M: Record<string, string> = {
  stopwatch: `<circle cx="300" cy="320" r="170" fill="${MID}" ${sw}/>
    <path d="M300 150 A170 170 0 1 1 152 405" stroke="${BRASS}" stroke-width="14" fill="none" stroke-linecap="round"/>
    <rect x="280" y="104" width="40" height="30" rx="8" fill="${SEA}"/><line x1="300" y1="320" x2="300" y2="215" stroke="${PAPER}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="300" cy="320" r="12" fill="${PAPER}"/>`,
  seals: [0, 1, 2, 3, 4].map((i) => { const x = 90 + i*95, y = 300 + (i%2)*60, c = i===2 ? BRASS : SEA;
    return `<path d="M${x-22} ${y+40} l-14 70 l36 -22 l36 22 l-14 -70" fill="${MID}" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="${x}" cy="${y}" r="58" fill="${MID}" stroke="${c}" stroke-width="4"/><circle cx="${x}" cy="${y}" r="38" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="6 8"/>`; }).join(''),
  certificate: `<rect x="70" y="150" width="400" height="290" rx="18" fill="${MID}" ${sw}/>
    <line x1="120" y1="215" x2="330" y2="215" stroke="${PAPER}" stroke-width="10" stroke-linecap="round"/>
    <line x1="120" y1="260" x2="400" y2="260" ${sw}/><line x1="120" y1="300" x2="360" y2="300" ${sw}/><line x1="120" y1="340" x2="280" y2="340" ${sw}/>
    <path d="M380 410 l-16 80 l40 -24 l40 24 l-16 -80" fill="${BRASS}"/><circle cx="404" cy="390" r="52" fill="${BRASS}"/><circle cx="404" cy="390" r="34" fill="none" stroke="${INK}" stroke-width="4"/>`,
  path: `<path d="M60 500 C 200 500, 160 380, 260 360 S 330 230, 430 220 S 470 110, 520 100" ${sw} stroke-dasharray="2 14" stroke-width="6"/>
    ${[[60,500],[260,360],[430,220]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="20" fill="${MID}" stroke="${SEA}" stroke-width="5"/>`).join('')}
    <circle cx="520" cy="100" r="34" fill="${BRASS}"/><circle cx="520" cy="100" r="14" fill="${INK}"/>`,
  steps: [0, 1, 2, 3].map((i) => `<rect x="${70+i*115}" y="${440-i*85}" width="100" height="${85+i*85}" rx="12" fill="${i===3?BRASS:MID}" stroke="${i===3?BRASS:SEA}" stroke-width="4"/>`).join('') + `<circle cx="${70+3*115+50}" cy="${440-3*85-40}" r="16" fill="${PAPER}"/>`,
  flow: `<rect x="60" y="140" width="170" height="110" rx="18" fill="${MID}" ${sw}/><rect x="60" y="370" width="170" height="110" rx="18" fill="${MID}" ${sw}/>
    <rect x="330" y="255" width="170" height="110" rx="18" fill="${MID}" ${sw}/>
    <path d="M230 195 C 290 195, 270 300, 330 300" ${sw}/><path d="M230 425 C 290 425, 270 320, 330 320" ${sw}/>
    <circle cx="415" cy="310" r="26" fill="${BRASS}"/><line x1="90" y1="180" x2="180" y2="180" stroke="${PAPER}" stroke-width="8" stroke-linecap="round"/><line x1="90" y1="410" x2="160" y2="410" stroke="${PAPER}" stroke-width="8" stroke-linecap="round"/>`,
  videos: [0, 1, 2, 3, 4, 5].map((i) => { const x = 60 + (i%3)*160, y = 150 + Math.floor(i/3)*170, b = i===4;
    return `<rect x="${x}" y="${y}" width="140" height="140" rx="20" fill="${b?BRASS:MID}" stroke="${b?BRASS:SEA}" stroke-width="4"/>
    <path d="M${x+55} ${y+45} L${x+95} ${y+70} L${x+55} ${y+95} Z" fill="${b?INK:SEA}"/>`; }).join(''),
};
const POSTS: [slug: string, line1: string, line2: string, drawing: string][] = [
  ['ai-interview-preparation', 'Answer out loud.', 'Against the clock.', 'stopwatch'],
  ['free-ai-certifications-big-tech', 'Big tech AI badges.', 'Which are free?', 'seals'],
  ['free-ai-courses-with-certificate-india', 'Free AI courses.', 'With a certificate.', 'certificate'],
  ['how-to-become-an-ai-engineer-in-india', 'Fresher to', 'AI engineer.', 'path'],
  ['how-to-learn-ai', 'Learn AI,', 'in the right order.', 'steps'],
  ['learn-ai-without-coding', 'AI at work,', 'without code.', 'flow'],
  ['youtube-channels-to-learn-ai', 'AI channels', 'worth your time.', 'videos'],
];
const font = path.join(ROOT, '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2');
const geist = path.join(ROOT, 'geist/dist/fonts/geist-sans/Geist-Medium.woff2');
const F = 'data:font/woff2;base64,' + fs.readFileSync(font).toString('base64');
const GF = 'data:font/woff2;base64,' + fs.readFileSync(geist).toString('base64');
const html = (a: string, b: string, m: string) => `<!doctype html><html><head><style>
@font-face{font-family:B;src:url(${F}) format('woff2');font-weight:200 800}
@font-face{font-family:G;src:url(${GF}) format('woff2');font-weight:500}
*{margin:0;box-sizing:border-box}body{width:1200px;height:600px;background:${INK};overflow:hidden;font-family:G}
.t{position:absolute;left:80px;top:150px;width:540px;font-family:B;font-weight:640;font-size:70px;line-height:1.02;letter-spacing:-0.035em;color:${PAPER}}
.t span{display:block;color:${SEA}}
.w{position:absolute;left:80px;bottom:92px;font-size:22px;letter-spacing:.01em;color:${SEA};font-weight:500}
svg{position:absolute;right:40px;top:30px}
</style></head><body><p class="t">${a}<span>${b}</span></p><p class="w">Xplaind guide</p>
<svg width="510" height="530" viewBox="0 0 580 600">${M[m]}</svg></body></html>`;
async function main() {
  const only = process.argv[2];
  const br = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
  const pg = await br.newPage({ viewport: { width: 1200, height: 600 }, deviceScaleFactor: 1 });
  for (const [id, a, b, m] of POSTS) {
    if (only && only !== id) continue;
    await pg.setContent(html(a, b, m), { waitUntil: "load" });
    await pg.evaluate(() => document.fonts.ready);
    const png = await pg.screenshot();
    await sharp(png).webp({ quality: 88 }).toFile(path.join(OUT, `${id}.webp`));
    console.log(`wrote ${id}.webp`);
  }
  await br.close();
}
void main();
