import {
  editPrompt,
  outputSize,
  referenceModel,
  type StudioRequest,
} from "../../../shared/referenceStudio.ts";
export async function editReference(
  input: StudioRequest,
  bytes: Uint8Array,
  key: string,
  fetcher: typeof fetch = fetch,
): Promise<Uint8Array> {
  const form = new FormData();
  form.set("model", referenceModel);
  form.set("prompt", editPrompt(input));
  form.set(
    "image",
    new Blob([new Uint8Array(bytes).buffer], { type: "image/png" }),
    "reference.png",
  );
  form.set("n", "1");
  form.set("quality", "medium");
  form.set("size", outputSize(input));
  form.set("output_format", "png");
  // No input_fidelity (unsupported by GPT Image 2), response_format, URLs,
  // mask precision claim, second model call, fallback or automatic retry.
  const response = await fetcher("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
    signal: AbortSignal.timeout(105000),
  });
  if (!response.ok || !response.body) {
    throw Error("Provider completion uncertain");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16 * 1024 * 1024) {
        throw Error("Provider response exceeds limit");
      }
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const joined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.length;
  }
  const payload: unknown = JSON.parse(new TextDecoder().decode(joined));
  if (!payload || typeof payload !== "object") {
    throw Error("Invalid provider response");
  }
  const data = (payload as { data?: unknown }).data;
  if (
    !Array.isArray(data) || data.length !== 1 || !data[0] ||
    typeof data[0].b64_json !== "string" ||
    data[0].b64_json.length > 14 * 1024 * 1024 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(data[0].b64_json)
  ) throw Error("Invalid provider image");
  return Uint8Array.from(atob(data[0].b64_json), (c) => c.charCodeAt(0));
}
