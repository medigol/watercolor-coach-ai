/** Offline photo preflight only. No upload, credentials or provider access. */
import { decodeReference } from "./image.ts";
import { imageHash } from "../../../shared/referenceImage.ts";
if (Deno.args.length !== 2) {
  throw Error(
    "Usage: check-acceptance-inputs.ts manifest.json local-photo-directory",
  );
}
const manifest = JSON.parse(await Deno.readTextFile(Deno.args[0]));
const categories = [
  "landscape",
  "architecture",
  "botanical",
  "people",
  "colour-landscape",
];
if (
  manifest.schema !== "reference-artistic-acceptance-set/v1" ||
  !Array.isArray(manifest.cases) || manifest.cases.length !== 5
) {
  throw Error("Expected four original cases and separate colour landscape");
}
const sources = [];
for (const category of categories) {
  const c = manifest.cases.find((entry: { category: string }) =>
    entry.category === category
  );
  if (!c) throw Error("Missing category " + category);
  const bytes = await Deno.readFile(`${Deno.args[1]}/${category}.jpg`);
  const size = decodeReference(bytes), sha256 = await imageHash(bytes);
  if (
    sha256 !== c.sha256 || bytes.length !== c.bytes ||
    size.width !== c.selectedWidth || size.height !== c.selectedHeight
  ) {
    throw Error(
      "Photo does not match approved candidate identity: " + category,
    );
  }
  sources.push({
    caseId: c.caseId,
    ...size,
    bytes: bytes.length,
    sha256,
    decodedLocally: true,
    sentToProvider: false,
  });
}
console.log(
  JSON.stringify({ status: "PASS", sources, providerRequests: 0 }, null, 2),
);
