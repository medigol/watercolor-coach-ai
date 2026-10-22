const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript"),
  path = require("node:path");
const { loadShared } = require("./helpers/shared-loader.cjs");
const prep = loadShared("../shared/artworkPreparation.ts", "lib/overlays.ts");
function png(w = 800, h = 600) {
  const b = new Uint8Array(32);
  b.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const d = new DataView(b.buffer);
  d.setUint32(12, 0x49484452);
  d.setUint32(16, w);
  d.setUint32(20, h);
  return b;
}
function jpeg(w, h, o = 1) {
  const b = new Uint8Array(51),
    d = new DataView(b.buffer);
  b.set([
    255,
    216,
    255,
    225,
    0,
    34,
    69,
    120,
    105,
    102,
    0,
    0,
    73,
    73,
    42,
    0,
    8,
    0,
    0,
    0,
    1,
    0,
    18,
    1,
    3,
    0,
    1,
    0,
    0,
    0,
    o,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    255,
    192,
    0,
    11,
    8,
  ]);
  d.setUint16(43, h);
  d.setUint16(45, w);
  b[49] = 255;
  b[50] = 217;
  return b;
}
for (const [w, h] of [
  [800, 600],
  [600, 1000],
  [800, 800],
  [3000, 128],
  [4096, 3000],
])
  test(`safe local dimensions retain format/aspect ${w}×${h}`, () => {
    const h1 = prep.imageHeader(png(w, h));
    assert.equal(h1.width, w);
    assert.equal(h1.height, h);
    const out = prep.outputDimensions(h1);
    assert(Math.max(out.width, out.height) <= 3072);
    assert(Math.abs(out.width / out.height - w / h) < 0.01);
  });
for (const [w, h] of [
  [0, 800],
  [800, 0],
  [64, 64],
  [16000, 1000],
  [5000, 5000],
  [999999, 999999],
])
  test(`resource guard rejects ${w}×${h} before decode`, () =>
    assert.throws(() => prep.imageHeader(png(w, h))));
for (const b of [
  new Uint8Array(),
  new Uint8Array([1, 2, 3]),
  Buffer.from("<svg>not a png</svg>"),
  new Uint8Array(11 * 1024 * 1024),
])
  test(`invalid signature/bytes rejected locally (${b.length})`, () =>
    assert.throws(() => prep.imageHeader(b)));
for (let o = 1; o <= 8; o++)
  test(`EXIF orientation ${o} yields oriented intrinsic dimensions exactly once`, () => {
    const h = prep.imageHeader(jpeg(800, 600, o));
    assert.equal(h.orientation, o);
    assert.deepEqual(
      prep.orientedDimensions(h),
      o >= 5 ? { width: 600, height: 800 } : { width: 800, height: 600 },
    );
  });
for (const r of [
  { x: 0.1, y: 0.2, width: 0.7, height: 0.6 },
  { x: 0, y: 0, width: 1, height: 1 },
  { x: 0.123, y: 0.234, width: 0.456, height: 0.543 },
])
  test(`crop clamps rounded edges to submitted pixels ${JSON.stringify(r)}`, () => {
    const p = prep.cropPixels(r, { width: 800, height: 1000 });
    assert(
      p.originX >= 0 &&
        p.originY >= 0 &&
        p.originX + p.width <= 800 &&
        p.originY + p.height <= 1000,
    );
    assert.equal(p.originX, Math.round(r.x * 800));
    assert.equal(p.height, Math.round((r.y + r.height) * 1000) - p.originY);
  });
for (const r of [
  { x: -0.1, y: 0, width: 0.5, height: 0.5 },
  { x: 0.8, y: 0, width: 0.5, height: 0.5 },
  { x: 0, y: 0, width: 0.01, height: 0.01 },
])
  test("invalid/tiny crop cannot export", () =>
    assert.throws(() => prep.cropPixels(r, { width: 800, height: 600 })));
function pixels(rect = true, noise = false) {
  const w = 96,
    h = 96,
    a = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      const inside = rect && x >= 12 && x < 84 && y >= 12 && y < 84;
      const color = inside ? [220, 215, 200] : [40, 50, 60];
      a.set([...color, 255], p);
    }
  if (noise) a.set([220, 215, 200, 255], (6 * 96 + 88) * 4);
  return a;
}
test("distinct uniform surround produces suggestion, never an applied crop", () => {
  const r = prep.boundaryProposal(pixels(), 96, 96);
  assert(r);
  assert(r.x < 12 / 96 && r.x + r.width > 84 / 96);
});
test("uniform white/blank/minimal/dark images get no destructive crop", () => {
  for (const v of [0, 32, 128, 255]) {
    const a = new Uint8ClampedArray(96 * 96 * 4).fill(v);
    for (let p = 3; p < a.length; p += 4) a[p] = 255;
    assert.equal(prep.boundaryProposal(a, 96, 96), null);
  }
});
test("nonrectangular paint on paper or surrounding brush is not confidently bounded", () => {
  const a = pixels(true, true);
  assert.equal(prep.boundaryProposal(a, 96, 96), null);
});
test("complete artwork fills frame: no crop suggestion", () =>
  assert.equal(prep.boundaryProposal(pixels(false), 96, 96), null));
test("malformed or huge pixel arrays cannot run candidate detector", () => {
  assert.equal(prep.boundaryProposal(new Uint8ClampedArray(4), 96, 96), null);
  assert.equal(
    prep.boundaryProposal(new Uint8ClampedArray(4), 1000, 1000),
    null,
  );
});
// Execute native adapter with SDK boundary mocked. These prove coordinate and
// upload contracts, not actual Android/iOS decoders or photo-library permission.
function nativeFixture(options = {}) {
  const calls = [];
  const api = {};
  const code = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../lib/prepareArtwork.ts"), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  new Function("exports", "require", "fetch", code)(
    api,
    (n) =>
      n === "react-native"
        ? { Platform: { OS: "ios" } }
        : n === "expo-image-manipulator"
          ? {
              SaveFormat: { PNG: "png" },
              manipulateAsync: async (uri, actions, settings) => {
                calls.push({ uri, actions, settings });
                const size = actions.length
                  ? { width: 400, height: 400 }
                  : { width: 800, height: 600 };
                return {
                  uri: `file:///prepared-${calls.length}.png`,
                  ...size,
                  base64: Buffer.from(png(size.width, size.height)).toString(
                    "base64",
                  ),
                };
              },
            }
          : loadShared(n, "lib/prepareArtwork.ts"),
    async () => new Response(options.bytes ?? png()),
  );
  return { api, calls };
}
test("native crop exports only selected normalized artwork, supplied bytes ready for upload", async () => {
  const f = nativeFixture(),
    source = await f.api.prepareArtwork({ uri: "file:///photo.png" });
  assert.equal(source.proposal, null);
  const out = await source.export({
    x: 0.25,
    y: 1 / 6,
    width: 0.5,
    height: 2 / 3,
  });
  assert.deepEqual(f.calls[1].actions, [
    { crop: { originX: 200, originY: 100, width: 400, height: 400 } },
  ]);
  assert.equal(out.width, 400);
  assert(out.bytes instanceof Uint8Array);
  assert.equal(out.mimeType, "image/png");
});
test("native decode failure/orientation mismatch stops preparation", async () => {
  const f = nativeFixture({ bytes: jpeg(800, 600, 6) });
  await assert.rejects(
    f.api.prepareArtwork({ uri: "file:///rotated.jpg" }),
    /orientation/,
  );
});
test("native oversized dimensions rejected before native decoder", async () => {
  const f = nativeFixture({ bytes: png(5000, 5000) });
  await assert.rejects(f.api.prepareArtwork({ uri: "file:///huge.png" }));
  assert.equal(f.calls.length, 0);
});
test("crop/native adapter has no provider, storage or DB path", () => {
  const src = fs.readFileSync(
    path.join(__dirname, "../lib/prepareArtwork.ts"),
    "utf8",
  );
  assert(!/supabase|functions\.invoke|\.upload\(|\.rpc\(/.test(src));
  assert(!/api\.openai|images\/generations/.test(src));
});

for(const size of [{width:12000,height:64},{width:8000,height:128}])test('panoramic artwork is not made invalid by proportional output sizing',()=>{prep.validateDimensions(size);const out=prep.outputDimensions(size);assert.doesNotThrow(()=>prep.validateDimensions(out));assert(out.width<=size.width&&out.height<=size.height);assert(Math.abs(out.width/out.height-size.width/size.height)<.01);});

test('Improve Painting web picker obtains bytes without decoding Expo metadata first',()=>{
 const s=fs.readFileSync(path.join(__dirname,'../lib/prepareArtwork.ts'),'utf8');const start=s.indexOf('export function pickWebArtwork');const picker=s.slice(start);assert(picker.includes('URL.createObjectURL(file)'));assert(picker.includes('file.size'));assert(!/new (?:window\.)?Image|\.decode\(|launchImageLibrary/.test(picker));
});

// Real web adapter with deterministic DOM decode/export boundaries. A pending
// encoder must never allocate another private blob URI after source disposal.
function webFixture() {
 const created=[],revoked=[],pending=[];
 const output={};
 const dom={createElement(){return {width:0,height:0,getContext(){return {fillRect(){},drawImage(){},getImageData(){return {data:new Uint8ClampedArray(96*96*4)}}}},toBlob(done){pending.push(()=>done(new Blob([png(800,600)],{type:'image/png'})))}}}};
 const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/prepareArtwork.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('exports','require','fetch','document','window','URL',code)(output,n=>n==='react-native'?{Platform:{OS:'web'}}:n==='expo-image-manipulator'?{}:loadShared(n,'lib/prepareArtwork.ts'),async()=>new Response(png()),dom,{Image:class{naturalWidth=800;naturalHeight=600;async decode(){}}},{createObjectURL(){const uri='blob:technical-'+created.length;created.push(uri);return uri},revokeObjectURL(uri){revoked.push(uri)}});
 return {api:output,created,revoked,pending};
}
test('disposing an artwork while crop encoding is pending creates no orphan blob',async()=>{
 const f=webFixture(),source=await f.api.prepareArtwork({uri:'blob:input'});
 const pending=source.export({...prep.fullArtwork});source.dispose();f.pending.shift()();
 await assert.rejects(pending,/no longer|disposed|choose/i);assert.equal(f.created.length,1);assert.deepEqual(f.revoked,[f.created[0]]);
});
test('a disposed artwork cannot begin another export',async()=>{
 const f=webFixture(),source=await f.api.prepareArtwork({uri:'blob:input'});source.dispose();
 await assert.rejects(source.export({...prep.fullArtwork}),/no longer|disposed|choose/i);assert.equal(f.pending.length,0);
});
