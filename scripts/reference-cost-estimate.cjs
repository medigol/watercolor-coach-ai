// Offline estimate from the official GPT Image token calculator inspected
// 2026-11-06. No API call, credentials, price guarantee or billing measurement.
function mediumOutputTokens(width, height) {
  if (
    !Number.isInteger(width) || !Number.isInteger(height) || width % 16 ||
    height % 16 || Math.min(width, height) <= 0 ||
    Math.max(width, height) > 3840 || width * height < 655360 ||
    width * height > 8294400 ||
    Math.max(width, height) / Math.min(width, height) > 3
  ) throw Error("Unsupported output dimensions");
  const ratio = Math.max(width, height) / Math.min(width, height),
    short = 48 / ratio,
    floor = Math.floor(short);
  const rounded = short - floor === .5 ? floor + floor % 2 : Math.round(short);
  return Math.ceil(48 * rounded * (2000000 + width * height) / 4000000);
}
function estimate(width, height, imageInputTokens, textInputTokens) {
  const outputTokens = mediumOutputTokens(width, height);
  for (const n of [imageInputTokens, textInputTokens]) {
    if (n !== undefined && (!Number.isInteger(n) || n < 0 || n > 1e9)) {
      throw Error("Input tokens must be explicit nonnegative assumptions");
    }
  }
  const scenario = (imageInputRate, imageOutputRate, textInputRate) => ({
    ratesPerMillion: { imageInputRate, imageOutputRate, textInputRate },
    outputOnlyUSD: outputTokens * imageOutputRate / 1e6,
    totalUSD: imageInputTokens === undefined || textInputTokens === undefined
      ? null
      : (imageInputTokens * imageInputRate + outputTokens * imageOutputRate +
        textInputTokens * textInputRate) / 1e6,
  });
  return {
    model: "gpt-image-2-2026-04-21",
    quality: "medium",
    width,
    height,
    estimatedOutputTokens: outputTokens,
    imageInputTokensAssumed: imageInputTokens ?? null,
    textInputTokensAssumed: textInputTokens ?? null,
    developerDocsStandard: scenario(8, 30, 5),
    ownerQuotedLowerRatesNotConfirmedForSynchronousEdits: scenario(4, 15, 2.5),
    pricingConflictUnresolved: true,
    actualBill: false,
    providerRequests: 0,
  };
}
if (require.main === module) {
  const args = process.argv.slice(2);
  if (![2, 4].includes(args.length)) {
    throw Error(
      "Usage: node scripts/reference-cost-estimate.cjs width height [assumed-image-input-tokens assumed-text-input-tokens]",
    );
  }
  console.log(JSON.stringify(estimate(...args.map(Number)), null, 2));
}
module.exports = { mediumOutputTokens, estimate };
