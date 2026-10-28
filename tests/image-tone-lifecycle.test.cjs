const test = require("node:test"),
  assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
const { loadShared } = require("./helpers/shared-loader.cjs");
function fixture({ platform = "web", tainted = false } = {}) {
  let index = 0,
    jobs = [],
    values = new Map(),
    source = "blob:original-a";
  const decodes = [],
    draws = [],
    canvasSizes = [];
  const react = {
    useState(initial) {
      const at = index++;
      if (!values.has(at)) values.set(at, initial);
      return [
        values.get(at),
        (v) => values.set(at, typeof v === "function" ? v(values.get(at)) : v),
      ];
    },
    useEffect(effect, deps) {
      const at = index++,
        old = values.get(at);
      if (!old || deps.some((v, i) => v !== old.deps[i]))
        jobs.push(() => {
          old?.cleanup?.();
          values.set(at, { deps, cleanup: effect() });
        });
    },
  };
  class Image {
    naturalWidth = 800;
    naturalHeight = 600;
    decode() {
      return new Promise((resolve, reject) =>
        decodes.push({ resolve, reject, image: this }),
      );
    }
  }
  const document = {
    createElement(tag) {
      assert.equal(tag, "canvas");
      const c = {
        width: 0,
        height: 0,
        getContext() {
          return {
            drawImage(im) {
              draws.push(im.src);
              canvasSizes.push([c.width, c.height]);
            },
            getImageData() {
              if (tainted) throw Error("tainted");
              return { data: new Uint8ClampedArray(c.width * c.height * 4) };
            },
          };
        },
      };
      return c;
    },
  };
  const output = {};
  const code = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../lib/useImageTone.ts"), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  new Function("exports", "require", "window", "document", code)(
    output,
    (n) => {
      if (n === "react") return react;
      if (n === "react-native") return { Platform: { OS: platform } };
      return loadShared(n, "lib/useImageTone.ts");
    },
    { Image },
    document,
  );
  return {
    decodes,
    draws,
    canvasSizes,
    setSource(s) {
      source = s;
    },
    render(size = { width: 800, height: 600 }) {
      index = 0;
      return output.useImageTone(source, size);
    },
    async settle() {
      const todo = jobs;
      jobs = [];
      todo.forEach((f) => f());
      await new Promise((r) => setImmediate(r));
    },
    unmount() {
      for (const v of values.values()) v?.cleanup?.();
    },
  };
}
test("one source produces one bounded raster, repeated result interactions do not decode again", async () => {
  const f = fixture();
  assert.equal(f.render(), null);
  await f.settle();
  assert.equal(f.decodes.length, 1);
  f.decodes[0].resolve();
  await f.settle();
  const sample = f.render();
  assert(sample);
  assert.deepEqual(f.canvasSizes, [[256, 192]]);
  f.render();
  await f.settle();
  assert.equal(f.decodes.length, 1);
  f.unmount();
});
test("late decode for an old saved artwork cannot replace current tonal evidence", async () => {
  const f = fixture();
  f.render();
  await f.settle();
  f.setSource("blob:original-b");
  f.render();
  await f.settle();
  f.decodes[1].resolve();
  await f.settle();
  assert(f.render());
  f.decodes[0].resolve();
  await f.settle();
  assert.deepEqual(f.draws, ["blob:original-b"]);
  f.unmount();
});
test("missing/tainted source degrades to original rendering, not invented measurements", async () => {
  const f = fixture({ tainted: true });
  f.render();
  await f.settle();
  f.decodes[0].resolve();
  await f.settle();
  assert.equal(f.render(), null);
  f.unmount();
});
test("decoding failure never retries or invokes a different service", async () => {
  const f = fixture();
  f.render();
  await f.settle();
  f.decodes[0].reject(Error("expired"));
  await f.settle();
  f.render();
  await f.settle();
  assert.equal(f.decodes.length, 1);
  assert.equal(f.draws.length, 0);
  f.unmount();
});
test("native and oversized saved inputs do not start a raster pipeline", async () => {
  const native = fixture({ platform: "ios" });
  native.render();
  await native.settle();
  assert.equal(native.decodes.length, 0);
  const large = fixture();
  large.render({ width: 8000, height: 4000 });
  await large.settle();
  assert.equal(large.decodes.length, 0);
});
test("source dimension mismatch never samples a different coordinate frame", async () => {
  const f = fixture();
  f.render({ width: 600, height: 800 });
  await f.settle();
  f.decodes[0].resolve();
  await f.settle();
  assert.equal(f.draws.length, 0);
  f.unmount();
});
