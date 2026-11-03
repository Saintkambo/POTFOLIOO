import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Function to create a valid PNG buffer
function createPng(width, height, getPixel) {
  // 1. PNG Signature: 89 50 4E 47 0D 0A 1A 0A
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // 2. IHDR Chunk (13 bytes): width (4), height (4), bit depth (1), color type (1 = 6 RGBA), comp (0), filter (0), interlace (0)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // Deflate
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // No interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // 3. IDAT Chunk: Image scanlines
  // Each scanline begins with a filter byte (0 = None), followed by width * 4 bytes (RGBA)
  const scanlineWidth = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineWidth);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineWidth;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);

  // 4. IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const header = Buffer.alloc(4 + 4);
  header.writeUInt32BE(length, 0);
  header.write(type, 4, 4, 'ascii');

  const crcBuffer = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(crcBuffer);

  const footer = Buffer.alloc(4);
  footer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([header, data, footer]);
}

// CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

// POTFOLIOO Icon Drawer: Slate Navy (#33415C) background, Blackstone border, Citron Lime (#BFD200) card, Chevron check
function getPotfoliooPixel(x, y, w, h) {
  const normX = x / w;
  const normY = y / h;

  // Background: Slate Navy #33415C -> rgb(51, 65, 92)
  let r = 51, g = 65, b = 92, a = 255;

  // Outer border check (2px border feel)
  if (normX < 0.03 || normX > 0.97 || normY < 0.03 || normY > 0.97) {
    return [23, 23, 23, 255]; // Blackstone #171717
  }

  // Inner card: Citron Lime #BFD200 -> rgb(191, 210, 0)
  // Card bounds: x in [0.20, 0.80], y in [0.20, 0.80]
  const cardLeft = 0.20, cardRight = 0.80, cardTop = 0.20, cardBottom = 0.80;

  if (normX >= cardLeft && normX <= cardRight && normY >= cardTop && normY <= cardBottom) {
    // Card border
    if (
      normX <= cardLeft + 0.03 || normX >= cardRight - 0.03 ||
      normY <= cardTop + 0.03 || normY >= cardBottom - 0.03
    ) {
      return [23, 23, 23, 255]; // Blackstone
    }

    // Inside card: Citron Lime
    r = 191; g = 210; b = 0;

    // Chevron / Ledger motif: from (0.35, 0.45) down to (0.50, 0.60) then up to (0.65, 0.45)
    // Distance to line segments
    const inVee = isPointNearVee(normX, normY);
    if (inVee) {
      return [23, 23, 23, 255]; // Blackstone
    }
  }

  return [r, g, b, a];
}

function isPointNearVee(x, y) {
  // First segment: (0.35, 0.48) to (0.50, 0.60)
  const d1 = distToSegment(x, y, 0.35, 0.48, 0.50, 0.60);
  // Second segment: (0.50, 0.60) to (0.65, 0.48)
  const d2 = distToSegment(x, y, 0.50, 0.60, 0.65, 0.48);
  return Math.min(d1, d2) < 0.035;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Generate Icons
console.log('Generating PWA icons for POTFOLIOO...');

const publicDir = path.resolve(process.cwd(), 'public');

// 1. pwa-192x192.png
const png192 = createPng(192, 192, getPotfoliooPixel);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
console.log('✓ Generated public/pwa-192x192.png (' + png192.length + ' bytes)');

// 2. pwa-512x512.png
const png512 = createPng(512, 512, getPotfoliooPixel);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
console.log('✓ Generated public/pwa-512x512.png (' + png512.length + ' bytes)');

// 3. apple-touch-icon.png (180x180)
const pngApple = createPng(180, 180, getPotfoliooPixel);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);
console.log('✓ Generated public/apple-touch-icon.png (' + pngApple.length + ' bytes)');

console.log('All PWA icons generated successfully!');
