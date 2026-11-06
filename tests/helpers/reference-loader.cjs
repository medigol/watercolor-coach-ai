const fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
const root = path.resolve(__dirname, "../..");
module.exports = function loader(file) {
  const cache = new Map();
  function load(file) {
    const full = path.resolve(root, file);
    if (
      !full.startsWith(root + "/shared/") &&
      !/^supabase\/functions\/transform-reference\/(handler|provider)\.ts$/
        .test(path.relative(root, full))
    ) throw Error("Non-pure reference import");
    if (cache.has(full)) return cache.get(full);
    const out = {};
    cache.set(full, out);
    const code = ts.transpileModule(fs.readFileSync(full, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    new Function("exports", "require", code)(out, (name) => {
      const next = path.resolve(path.dirname(full), name);
      return load(
        path.relative(root, path.extname(next) ? next : next + ".ts"),
      );
    });
    return out;
  }
  return load(file);
};
