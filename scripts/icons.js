// Genera los íconos PNG de la app (bandera a cuadros sobre rojo TC, fondo oscuro).
// Uso: node scripts/icons.js  → assets/icons/icon-{180,192,512}.png
// Sin dependencias: dibuja píxeles y codifica PNG con zlib.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const BG = [0x16, 0x18, 0x1c], RED = [0xd0, 0x10, 0x2b], WHITE = [0xff, 0xff, 0xff], BLACK = [0x11, 0x11, 0x11];

function draw(size) {
  const px = Buffer.alloc(size * size * 4);
  const u = size / 512; // todo se diseña en una grilla de 512
  const redSize = 280 * u, redR = 44 * u, flag = 192 * u, cell = flag / 4;
  const c = size / 2;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let col = BG;
    // Cuadrado rojo con esquinas redondeadas (dentro de la zona segura de los íconos "maskable").
    const dx = Math.abs(x + 0.5 - c) - (redSize / 2 - redR), dy = Math.abs(y + 0.5 - c) - (redSize / 2 - redR);
    const inRed = dx <= 0 || dy <= 0 ? Math.abs(x + 0.5 - c) <= redSize / 2 && Math.abs(y + 0.5 - c) <= redSize / 2 : dx * dx + dy * dy <= redR * redR;
    if (inRed) col = RED;
    // Bandera a cuadros 4×4 en el centro.
    const fx = x + 0.5 - (c - flag / 2), fy = y + 0.5 - (c - flag / 2);
    if (fx >= 0 && fy >= 0 && fx < flag && fy < flag) col = (Math.floor(fx / cell) + Math.floor(fy / cell)) % 2 ? BLACK : WHITE;
    const i = (y * size + x) * 4;
    px[i] = col[0]; px[i + 1] = col[1]; px[i + 2] = col[2]; px[i + 3] = 255;
  }
  return png(size, px);
}

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (buf) => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, px) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8 bits, RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

mkdirSync("assets/icons", { recursive: true });
for (const s of [180, 192, 512]) writeFileSync(`assets/icons/icon-${s}.png`, draw(s));
console.log("Íconos generados en assets/icons/");
