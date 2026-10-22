const fs = require("node:fs"),
  path = require("node:path");
const { ROOT } = require("./production.cjs");
function external(file, mustExist = false) {
  const absolute = path.resolve(file);
  let ancestor = absolute;
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  const resolved = path.join(
    fs.realpathSync(ancestor),
    path.relative(ancestor, absolute),
  );
  if (resolved === ROOT || resolved.startsWith(ROOT + path.sep))
    throw Error("Private benchmark files must be outside the checkout");
  for (
    let p =
      fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()
        ? resolved
        : path.dirname(resolved);
    ;
    p = path.dirname(p)
  ) {
    const marker = path.join(p, ".git");
    // Cloud sandboxes can reserve an empty read-only .git guard directory in
    // /tmp. It is not a checkout. Real repositories have HEAD (or a gitdir file).
    if (
      fs.existsSync(path.join(marker, "HEAD")) ||
      (fs.existsSync(marker) && fs.statSync(marker).isFile())
    )
      throw Error(
        "Private benchmark files must be outside every Git repository",
      );
    if (p === path.dirname(p)) break;
  }
  if (mustExist && !fs.existsSync(resolved))
    throw Error("Required private local file is missing");
  return resolved;
}
function privateDir(dir) {
  dir = external(dir);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.chmodSync(dir, 0o700);
  return dir;
}
function writePrivate(file, value, exclusive = false) {
  external(file);
  if (fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink())
    throw Error("Symlink output blocked");
  fs.writeFileSync(
    file,
    typeof value === "string" || Buffer.isBuffer(value)
      ? value
      : JSON.stringify(value, null, 2) + "\n",
    { mode: 0o600, flag: exclusive ? "wx" : "w" },
  );
  fs.chmodSync(file, 0o600);
}
function localFile(root, file) {
  if (
    typeof file !== "string" ||
    !file ||
    path.isAbsolute(file) ||
    file.split(/[\\/]/).includes("..") ||
    /[?:#\x00]/.test(file)
  )
    throw Error("Images must be relative private local paths");
  const resolved = external(path.join(root, file), true);
  if (
    !resolved.startsWith(fs.realpathSync(root) + path.sep) ||
    !fs.statSync(resolved).isFile()
  )
    throw Error("Image escaped private dataset root");
  return resolved;
}
const safeID = (v) => typeof v === "string" && /^[A-Za-z0-9_-]{1,48}$/.test(v);
function excerpt(value, limit = 500) {
  return String(value || "")
    .replace(
      /\bgpt-[a-z0-9.-]+|\b(?:baseline_low|baseline_high|candidate_mini|candidate_luna)\b/gi,
      "[model masked]",
    )
    .replace(/data:[^\s]+/gi, "[redacted]")
    .replace(/https?:\/\/\S+/gi, "[link removed]")
    .replace(/\bsk-[\w-]+/gi, "[redacted]")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[identity removed]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, "[id removed]")
    .replace(/[\x00-\x08\x0b-\x1f\x7f]/g, " ")
    .slice(0, limit);
}
module.exports = {
  external,
  privateDir,
  writePrivate,
  localFile,
  safeID,
  excerpt,
};
