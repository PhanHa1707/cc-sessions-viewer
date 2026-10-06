import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

const sha = (data) => createHash('sha256').update(data).digest('hex')
function crc32(data) {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

test('priority screenshot: lossless pixels, color metadata, dimensions and size budget', () => {
  const png = readFileSync(new URL('../../../docs/screenshots/project-editor.png', import.meta.url))
  assert.ok(png.length <= 700000, 'revisit compression before raising the image budget')
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
  const chunks = new Map()
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset), end = offset + 12 + length
    assert.ok(end <= png.length, 'truncated PNG')
    const type = png.toString('ascii', offset + 4, offset + 8)
    assert.equal(crc32(png.subarray(offset + 4, offset + 8 + length)), png.readUInt32BE(offset + 8 + length), type + ' CRC')
    if (!chunks.has(type)) chunks.set(type, [])
    chunks.get(type).push(png.subarray(offset + 8, offset + 8 + length))
    offset = end
  }
  const header = chunks.get('IHDR')[0]
  assert.deepEqual([header.readUInt32BE(0), header.readUInt32BE(4)], [1360, 850])
  assert.deepEqual([...header.subarray(8)], [8, 6, 0, 0, 0], '8-bit RGBA, noninterlaced')
  assert.deepEqual([...Buffer.concat(chunks.get('sRGB'))], [0])
  assert.equal(sha(Buffer.concat(chunks.get('eXIf'))), 'ef4f9d40ec22f1ad36711b917b9894d7a0647602267d80fc81644c41f77ab88b')
  const stride = 1360 * 4, height = 850
  const filtered = inflateSync(Buffer.concat(chunks.get('IDAT')), { maxOutputLength: height * (stride + 1) })
  assert.equal(filtered.length, height * (stride + 1))
  const pixels = Buffer.alloc(height * stride)
  for (let row = 0; row < height; row++) {
    const start = row * (stride + 1), filter = filtered[start]
    assert.ok(filter <= 4, 'unknown PNG filter')
    for (let column = 0; column < stride; column++) {
      const pos = row * stride + column
      const a = column >= 4 ? pixels[pos - 4] : 0
      const b = row > 0 ? pixels[pos - stride] : 0
      const c = row > 0 && column >= 4 ? pixels[pos - stride - 4] : 0
      const predictor = [0, a, b, Math.floor((a + b) / 2), paeth(a, b, c)][filter]
      pixels[pos] = (filtered[start + 1 + column] + predictor) & 255
    }
  }
  // Pre-optimization fingerprint. This proves equal decoded pixels, not LCP.
  assert.equal(sha(pixels), '6046cea09f6b672154c9b13a54ff6d61859e48d089c7af2d4c6d19f92c8830ee')
})
