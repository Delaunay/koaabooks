// Draws the Koaabooks app icon and writes the PNG sizes the PWA needs. Pure
// Node, no image library:  npm run icons
// A ruled ledger with a gold coin resting on its corner, on an emerald ground.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const OUT = new URL('../public/', import.meta.url);

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = buf => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function png(size, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const BG_TOP = [6, 95, 70];
const BG_BOTTOM = [2, 44, 34];
const PAGE = [250, 245, 230];
const RULE = [167, 199, 186];
const MARGIN = [220, 120, 110];
const SPINE = [180, 83, 9];
const COIN = [251, 191, 36];
const COIN_EDGE = [217, 119, 6];
const COIN_SHINE = [254, 243, 199];
const SHADOW = [1, 30, 23];

const inRoundRect = (x, y, x0, y0, x1, y1, r) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return Math.hypot(x - cx, y - cy) <= r;
};

// The book, slightly left of centre so the coin fits on its lower right.
const BOOK = [0.2, 0.17, 0.72, 0.8];
const COIN_C = [0.7, 0.72];
const COIN_R = 0.17;

/** Colour at (u, v) in [0, 1]; `pad` shrinks the art for maskable icons (safe zone). */
function shade(u, v, pad) {
  let c = mix(BG_TOP, BG_BOTTOM, v);
  const x = 0.5 + (u - 0.5) / (1 - 2 * pad);
  const y = 0.5 + (v - 0.5) / (1 - 2 * pad);
  const [bx0, by0, bx1, by1] = BOOK;

  if (inRoundRect(x, y, bx0 + 0.02, by0 + 0.025, bx1 + 0.02, by1 + 0.025, 0.04)) c = mix(c, SHADOW, 0.6);
  if (inRoundRect(x, y, bx0, by0, bx1, by1, 0.04)) {
    c = PAGE;
    // Ruled lines and a red margin, like an accounting ledger.
    if (y > by0 + 0.1 && y < by1 - 0.04 && ((y - by0) % 0.075) < 0.012) c = RULE;
    if (Math.abs(x - (bx0 + 0.2)) < 0.006 && y > by0 + 0.03 && y < by1 - 0.03) c = MARGIN;
    if (x < bx0 + 0.07) c = SPINE;
  }

  const d = Math.hypot(x - COIN_C[0], y - COIN_C[1]);
  if (d < COIN_R + 0.02 && d >= COIN_R) c = mix(c, SHADOW, 0.35);
  if (d < COIN_R) {
    c = d > COIN_R - 0.025 ? COIN_EDGE : COIN;
    // An inner ring, and a glint on the upper left.
    if (Math.abs(d - (COIN_R - 0.05)) < 0.008) c = COIN_EDGE;
    const a = Math.atan2(y - COIN_C[1], x - COIN_C[0]);
    if (Math.abs(d - (COIN_R - 0.085)) < 0.012 && a > -2.6 && a < -1.75) c = COIN_SHINE;
  }
  return c;
}

function draw(size, pad = 0) {
  const SS = 4; // supersampling for smooth edges
  const out = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let acc = [0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = shade((px + (sx + 0.5) / SS) / size, (py + (sy + 0.5) / SS) / size, pad);
          acc = acc.map((v, i) => v + c[i]);
        }
      }
      const o = (py * size + px) * 4;
      for (let i = 0; i < 3; i++) out[o + i] = Math.round(acc[i] / (SS * SS));
      out[o + 3] = 255;
    }
  }
  return png(size, out);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(new URL('apple-touch-icon.png', OUT), draw(180));
writeFileSync(new URL('icon-192.png', OUT), draw(192));
writeFileSync(new URL('icon-512.png', OUT), draw(512));
writeFileSync(new URL('icon-maskable-512.png', OUT), draw(512, 0.1));
writeFileSync(new URL('favicon.png', OUT), draw(64));
console.log('Koaabooks icons written to', OUT.pathname);
