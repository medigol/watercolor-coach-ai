const fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
const root = path.resolve(__dirname, "../.."),
  cache = new Map();
function load(file) {
  const resolved = path.resolve(root, file);
  if (!resolved.startsWith(path.join(root, "learning") + path.sep))
    throw Error("Non-learning import blocked");
  if (cache.has(resolved)) return cache.get(resolved);
  const out = {};
  cache.set(resolved, out);
  const code = ts.transpileModule(fs.readFileSync(resolved, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("exports", "require", code)(out, (name) => {
    if (!name.startsWith("."))
      throw Error("External learning dependency blocked");
    return load(
      path.relative(
        root,
        path.resolve(
          path.dirname(resolved),
          name.endsWith(".ts") ? name : name + ".ts",
        ),
      ),
    );
  });
  return out;
}
module.exports = load;
