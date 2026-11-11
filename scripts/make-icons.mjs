// Generates PNG app icons with no external dependencies.
import zlib from 'node:zlib'
import fs from 'node:fs'

const BG = [10, 18, 34], UP = [34, 197, 94], DOWN = [240, 82, 82]

function png(size, scale) {
  const px = Buffer.alloc(size * size * 4)
  const fill = (x0, y0, w, h, c) => {
    // coordinates are 0..1 around centre, scaled
    const s = (v) => 0.5 + (v - 0.5) * scale
    const X0 = Math.round(s(x0) * size), Y0 = Math.round(s(y0) * size)
    const X1 = Math.round(s(x0 + w) * size), Y1 = Math.round(s(y0 + h) * size)
    for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) {
      const i = (y * size + x) * 4
      px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255
    }
  }
  for (let i = 0; i < size * size; i++) { px[i * 4] = BG[0]; px[i * 4 + 1] = BG[1]; px[i * 4 + 2] = BG[2]; px[i * 4 + 3] = 255 }
  const candle = (cx, wickTop, bodyTop, bodyBot, wickBot, c) => {
    fill(cx - 0.012, wickTop, 0.024, wickBot - wickTop, c)
    fill(cx - 0.065, bodyTop, 0.13, bodyBot - bodyTop, c)
  }
  candle(0.3, 0.40, 0.48, 0.70, 0.78, UP)
  candle(0.5, 0.30, 0.38, 0.58, 0.66, DOWN)
  candle(0.7, 0.20, 0.27, 0.52, 0.60, UP)
  fill(0.2, 0.84, 0.6, 0.02, [79, 140, 255])
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0)
    return Buffer.concat([len, td, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

fs.writeFileSync('public/icon-192.png', png(192, 1))
fs.writeFileSync('public/icon-512.png', png(512, 1))
fs.writeFileSync('public/icon-maskable-512.png', png(512, 0.75))
fs.writeFileSync('public/icon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#0a1222"/><rect x="28.8" y="40" width="2.4" height="38" fill="#22c55e"/><rect x="23.5" y="48" width="13" height="22" fill="#22c55e"/><rect x="48.8" y="30" width="2.4" height="36" fill="#f05252"/><rect x="43.5" y="38" width="13" height="20" fill="#f05252"/><rect x="68.8" y="20" width="2.4" height="40" fill="#22c55e"/><rect x="63.5" y="27" width="13" height="25" fill="#22c55e"/></svg>`)
console.log('icons written')
