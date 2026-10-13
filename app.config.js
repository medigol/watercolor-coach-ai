const { assertPublicSupabaseKey } = require("./scripts/check-public-env.cjs");

assertPublicSupabaseKey(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
const { expo } = require("./app.json");

// GitHub project Pages sites live below /repository-name. Local web runs
// keep an empty base path. This variable contains deployment metadata only.
module.exports = {
  ...expo,
  experiments: {
    ...expo.experiments,
    baseUrl: process.env.EXPO_WEB_BASE_PATH || "",
  },
};
