// Developer-only source/geometry audit. No inference, network or new retention.
const { excerpt } = require("./safety.cjs");
const esc = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function mask(v) {
  if (typeof v === "string") return excerpt(v, v.length);
  if (Array.isArray(v)) return v.map(mask);
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v).map(([k, value]) => [excerpt(k, k.length), mask(value)]),
    );
  return v;
}
function fullReview(payload, p, image, size) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.length > 250000)
    throw Error("Complete review content unavailable or exceeds local bound");
  const value = JSON.parse(content);
  const gate = p.eligibility(value);
  const normalized =
    gate.status === "accepted" ? p.normalize(gate.analysis) : null;
  const canonical = normalized?.ok
    ? p.contract.cleanFeedback(normalized.result, "improve_painting")
    : null;
  const analysis = canonical?.canonicalAnalysis;
  const g = p.geometry,
    w = size.width,
    h = size.height;
  if (![w, h].every((n) => Number.isSafeInteger(n) && n > 0))
    throw Error("Invalid source size");
  const sections = [];
  const rect = (r) =>
    g.validRect(r)
      ? `<rect x="${r.x * w}" y="${r.y * h}" width="${r.width * w}" height="${r.height * h}"/>`
      : "";
  const point = (a) =>
    g.validPoint(a)
      ? `<circle cx="${a.x * w}" cy="${a.y * h}" r="${Math.max(w, h) * 0.008}"/>`
      : "";
  const line = (ps, closed = false) =>
    (closed ? g.validPolygon(ps) : g.validPath(ps))
      ? `<${closed ? "polygon" : "polyline"} points="${ps.map((a) => `${a.x * w},${a.y * h}`).join(" ")}"/>`
      : "";
  function figure(label, supplied, drawing) {
    sections.push(
      `<section><h2>${esc(mask(label))}</h2>${drawing ? `<svg role="img" aria-label="${esc(mask(label))}: supplied geometry on exact source" viewBox="0 0 ${w} ${h}"><image href="${esc(image)}" width="${w}" height="${h}"/><g fill="none" stroke="#a64123" stroke-width="${Math.max(w, h) * 0.003}" stroke-dasharray="8 5">${drawing}</g></svg>` : "<p>No defensible located geometry; text-only. Do not invent a replacement.</p>"}<pre>${esc(JSON.stringify(mask(supplied), null, 2))}</pre><p>Reviewer: exact claim / source region / agreement or error / severity / uncertainty: __________________</p></section>`,
    );
  }
  for (const r of analysis?.visualRoles || [])
    figure(
      `Role: ${r.role} · ${r.area}`,
      r,
      r.confidence >= 0.65 ? rect(r.region) : "",
    );
  for (const e of analysis?.visualEvidence || []) {
    const i = analysis.insights.find((i) => i.id === e.insightId);
    figure(
      `Note: ${e.note.label}`,
      {
        evidence: e,
        insight: i,
        facts: analysis.facts.filter((f) => i?.factIds.includes(f.id)),
      },
      g.noteRegions(e.note).map(rect).join("") +
        g.noteAnchors(e.note).map(point).join(""),
    );
  }
  for (const key of ["primary", "secondary"]) {
    const c = analysis?.composition?.[key];
    if (c)
      figure(
        `Composition: ${key} · ${c.type}`,
        c,
        (c.paths || []).map((ps) => line(ps)).join("") +
          (c.masses || []).map((m) => line(m.points, true)).join("") +
          point(c.focalPoint),
      );
  }
  for (const c of analysis?.colourAnalysis?.visibleColours || []) {
    const role = analysis.visualRoles.find((r) => r.id === c.roleId);
    figure(
      `Colour source: ${c.label}`,
      c,
      c.regionConfidence >= 0.65
        ? rect(c.region)
        : role?.confidence >= 0.65
          ? rect(role.region)
          : "",
    );
  }
  return `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file:; style-src 'unsafe-inline'"><title>Complete blind critique and geometry audit</title><style>body{font:16px system-ui;max-width:900px;margin:auto;padding:16px}img,svg{width:100%;max-height:650px;object-fit:contain}pre{white-space:pre-wrap;overflow-wrap:anywhere}section{border-top:1px solid #bbb;padding:16px 0}</style><h1>Complete blind critique and geometry audit</h1><p>Exact prepared source; all content below is assessment output, not independent truth. Dashed marks audit supplied coordinates. This is not a reproduction of app styling or a trace of object boundaries. Production may suppress aids; compare every visible app mark and every omitted audit item before final acceptance. No source geometry is inferred from labels.</p><img alt="Exact prepared artwork" src="${esc(image)}"><details open><summary>Complete model analysis before cleaning (identity/link redaction only)</summary><pre>${esc(JSON.stringify(mask(value), null, 2))}</pre></details><details><summary>Complete production-cleaned canonical analysis</summary><pre>${esc(JSON.stringify(mask(canonical), null, 2))}</pre></details>${sections.join("")}<h2>Independent review</h2><p>Apply all sixteen rubric dimensions. Review actual app Original/Notes/Composition/Roles, evidence crops and grayscale in a local, network-blocked replay before sign-off. These geometry audit diagrams alone do not certify app presentation or artistic correctness. Missing context/geometry is unverified, never a pass.</p>`;
}
module.exports = { fullReview };
