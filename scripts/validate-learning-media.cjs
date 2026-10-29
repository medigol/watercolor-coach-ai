// Offline publication validation. Passing an empty catalogue does NOT certify curation.
const load = require("../tests/helpers/learning-loader.cjs");
const { mediaResources, catalogueErrors } = load("learning/media.ts");
const errors = catalogueErrors(mediaResources);
console.log(
  JSON.stringify(
    {
      contract: errors.length ? "FAIL" : "PASS",
      videos: mediaResources.length,
      segments: mediaResources.reduce((n, r) => n + r.segments.length, 0),
      editorialCompleteness: mediaResources.length
        ? "REQUIRES_INDEPENDENT_REVIEW"
        : "BLOCKED_NO_VERIFIED_CONTENT",
      errors,
    },
    null,
    2,
  ),
);
if (errors.length) process.exitCode = 1;
