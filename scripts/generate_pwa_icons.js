import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([len, typeAndData, crcBuf]);
}

function generatePNG(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter byte 0 at start of each scanline
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const bgR = 0x58, bgG = 0x65, bgF = 0xF2; // #5865F2 Blurple
  const whiteR = 255, whiteG = 255, whiteB = 255;
  const darkR = 0x1e, darkG = 0x1f, darkB = 0x22;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width * 0.44;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const dx = (x - centerX);
      const dy = (y - centerY);
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background
      let r = bgR, g = bgG, b = bgF, a = 255;

      if (!isMaskable) {
        // Rounded corner badge
        const cornerRadius = width * 0.22;
        const boxLeft = cornerRadius;
        const boxRight = width - cornerRadius;
        const boxTop = cornerRadius;
        const boxBottom = height - cornerRadius;

        let inBox = true;
        if (x < boxLeft && y < boxTop) {
          inBox = Math.hypot(x - boxLeft, y - boxTop) <= cornerRadius;
        } else if (x > boxRight && y < boxTop) {
          inBox = Math.hypot(x - boxRight, y - boxTop) <= cornerRadius;
        } else if (x < boxLeft && y > boxBottom) {
          inBox = Math.hypot(x - boxLeft, y - boxBottom) <= cornerRadius;
        } else if (x > boxRight && y > boxBottom) {
          inBox = Math.hypot(x - boxRight, y - boxBottom) <= cornerRadius;
        }

        if (!inBox) {
          a = 0;
        }
      }

      // Draw stylized Accord controller/bubble silhouette inside safe zone
      const safeScale = isMaskable ? 0.65 : 0.78;
      const nx = (x - centerX) / (width * safeScale * 0.5);
      const ny = (y - centerY) / (height * safeScale * 0.5);

      if (a > 0 && Math.abs(nx) < 1.0 && Math.abs(ny) < 0.75) {
        // Main controller body
        const inMainBody = (nx * nx + ny * ny * 1.5 < 0.85) && (ny > -0.65 && ny < 0.7);
        // "Ears" / controller handles
        const inLeftHandle = Math.hypot(nx + 0.6, ny - 0.25) < 0.38;
        const inRightHandle = Math.hypot(nx - 0.6, ny - 0.25) < 0.38;
        // Central cutout
        const inBottomCutout = Math.hypot(nx, ny - 0.7) < 0.35;
        // Eye holes
        const inLeftEye = Math.hypot(nx + 0.35, ny + 0.05) < 0.16;
        const inRightEye = Math.hypot(nx - 0.35, ny + 0.05) < 0.16;

        if ((inMainBody || inLeftHandle || inRightHandle) && !inBottomCutout) {
          if (inLeftEye || inRightEye) {
            r = bgR; g = bgG; b = bgF; // eye holes
          } else {
            r = whiteR; g = whiteG; b = whiteB; // white emblem
          }
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePNG(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePNG(64, 64, false));

console.log('Successfully generated all PWA icon assets in /public');
