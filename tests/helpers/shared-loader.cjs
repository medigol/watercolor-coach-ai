const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "../..");
const sharedRoot = path.join(root, "shared") + path.sep;
const cache = new Map();
// Existing strict module stubs may load only pure shared helpers automatically.
// Browser/server imports and all other dependencies remain explicitly stubbed.
function loadShared(name, from) {
  const source = path.resolve(root, from);
  let file = path.resolve(path.dirname(source), name);
  if (!path.extname(file)) file += ".ts";
  if (!file.startsWith(sharedRoot) || path.extname(file) !== ".ts")
    throw new Error(`Unexpected non-shared import: ${name} from ${from}`);
  if (cache.has(file)) return cache.get(file);
  const output = {};
  cache.set(file, output);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("exports", "require", code)(output, (dependency) =>
    loadShared(dependency, file),
  );
  return output;
}
module.exports = { loadShared };
