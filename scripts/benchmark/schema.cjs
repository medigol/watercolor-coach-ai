// Exact validation of the production schema subset, including root-local refs.
// Fail closed on future unsupported schema keywords instead of silently ignoring.
const allowed = new Set([
  "$defs",
  "$ref",
  "type",
  "properties",
  "required",
  "additionalProperties",
  "items",
  "minItems",
  "maxItems",
  "minLength",
  "maxLength",
  "minimum",
  "maximum",
  "enum",
  "pattern",
  "anyOf",
  "description",
]);
function assertSchema(s) {
  if (!s || typeof s !== "object") throw Error("Unsupported schema");
  for (const k of Object.keys(s))
    if (!allowed.has(k)) throw Error("Unsupported schema keyword: " + k);
  for (const c of Object.values(s.properties || {})) assertSchema(c);
  for (const c of Object.values(s.$defs || {})) assertSchema(c);
  if (s.items) assertSchema(s.items);
  for (const c of s.anyOf || []) assertSchema(c);
  if (s.$ref && !/^#\/\$defs\/[a-zA-Z0-9_]+$/.test(s.$ref))
    throw Error("Unsupported schema reference");
}
function validate(value, s, root = s) {
  if (s.$ref)
    return validate(value, root.$defs[s.$ref.split("/").at(-1)], root);
  if (s.anyOf && !s.anyOf.some((c) => validate(value, c, root))) return false;
  if (
    s.enum &&
    !s.enum.some((v) => JSON.stringify(value) === JSON.stringify(v))
  )
    return false;
  const types = Array.isArray(s.type) ? s.type : s.type ? [s.type] : [];
  const isType = (t) =>
    t === "null"
      ? value === null
      : t === "object"
        ? !!value && typeof value === "object" && !Array.isArray(value)
        : t === "array"
          ? Array.isArray(value)
          : t === "integer"
            ? Number.isInteger(value)
            : t === "number"
              ? typeof value === "number" && Number.isFinite(value)
              : typeof value === t;
  if (types.length && !types.some(isType)) return false;
  if (value === null) return true;
  if (
    typeof value === "string" &&
    ((s.minLength != null && [...value].length < s.minLength) ||
      (s.maxLength != null && [...value].length > s.maxLength) ||
      (s.pattern && !new RegExp(s.pattern).test(value)))
  )
    return false;
  if (
    typeof value === "number" &&
    ((s.minimum != null && value < s.minimum) ||
      (s.maximum != null && value > s.maximum))
  )
    return false;
  if (
    Array.isArray(value) &&
    ((s.minItems != null && value.length < s.minItems) ||
      (s.maxItems != null && value.length > s.maxItems) ||
      value.some((v) => s.items && !validate(v, s.items, root)))
  )
    return false;
  if (typeof value === "object" && !Array.isArray(value)) {
    if ((s.required || []).some((k) => !Object.hasOwn(value, k))) return false;
    for (const [k, v] of Object.entries(value)) {
      if (!Object.hasOwn(s.properties || {}, k)) {
        if (s.additionalProperties === false) return false;
      } else if (!validate(v, s.properties[k], root)) return false;
    }
  }
  return true;
}
module.exports = { assertSchema, validate };
