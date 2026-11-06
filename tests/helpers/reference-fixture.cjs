// Original deterministic synthetic pixel fixtures, not photographs or AI results.
const zlib = require("node:zlib"), crypto = require("node:crypto");
function crc(b) {
  let c = 0xffffffff;
  for (const v of b) {
    c ^= v;
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(name, b) {
  const t = Buffer.from(name), out = Buffer.alloc(b.length + 12);
  out.writeUInt32BE(b.length);
  t.copy(out, 4);
  b.copy(out, 8);
  out.writeUInt32BE(crc(Buffer.concat([t, b])), b.length + 8);
  return out;
}
function png(width = 64, height = 48, kind = "landscape") {
  const h = Buffer.alloc(13);
  h.writeUInt32BE(width);
  h.writeUInt32BE(height, 4);
  h[8] = 8;
  h[9] = 6;
  const data = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * (width * 4 + 1) + 1 + x * 4;
      const middle = x > width * .35 && x < width * .65 && y > height * .25 &&
        y < height * .8;
      data[i] = kind === "portrait" && middle
        ? 175
        : Math.round(50 + 150 * x / width);
      data[i + 1] = kind === "botanical" && middle
        ? 120
        : Math.round(80 + 130 * y / height);
      data[i + 2] = kind === "urban" && middle ? 75 : 155;
      data[i + 3] = 255;
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", h),
    chunk("IDAT", zlib.deflateSync(data)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
const owner = "10000000-0000-4000-8000-000000000001",
  id = "20000000-0000-4000-8000-000000000001";
const hash = (b) => crypto.createHash("sha256").update(b).digest("hex");
function request() {
  const { defaultDirection, defaultPixels } = require("./reference-loader.cjs")(
      "shared/referenceStudio.ts",
    ),
    b = png();
  const identity = (path) => ({
    path,
    sha256: hash(b),
    width: 64,
    height: 48,
    bytes: b.length,
  });
  return {
    version: "photo-reference/v1",
    id,
    ownerId: owner,
    parentId: null,
    source: identity(`${owner}/${id}/source.png`),
    input: identity(`${owner}/${id}/input.png`),
    direction: structuredClone(defaultDirection),
    pixels: structuredClone(defaultPixels),
    paidConsent: true,
  };
}
module.exports = { png, owner, id, hash, request };
