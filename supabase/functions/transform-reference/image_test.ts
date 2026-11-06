import assert from "node:assert/strict";
// @ts-types="npm:@types/pngjs@6.0.5"
import { PNG } from "npm:pngjs@7.0.0";
import jpeg from "npm:jpeg-js@0.4.4";
import { decodeReference } from "./image.ts";
function data() {
  const image = new PNG({ width: 32, height: 24 });
  image.data.fill(255);
  return image;
}
Deno.test("real PNG decoder verifies bytes and dimensions", () => {
  assert.deepEqual(decodeReference(PNG.sync.write(data())), {
    width: 32,
    height: 24,
  });
});
Deno.test("real JPEG decoder verifies bytes and dimensions", () => {
  assert.deepEqual(decodeReference(jpeg.encode(data(), 80).data), {
    width: 32,
    height: 24,
  });
});
Deno.test("malformed/truncated header-valid PNG never passes full decoding", () => {
  const bytes = PNG.sync.write(data());
  assert.throws(() => decodeReference(bytes.subarray(0, 45)));
});
Deno.test("PNG CRC tampering is rejected", () => {
  const bytes = PNG.sync.write(data());
  bytes[40] ^= 255;
  assert.throws(() => decodeReference(bytes));
});
Deno.test("overlarge dimensions fail before decoder allocation", () => {
  const bytes = PNG.sync.write(data());
  bytes.writeUInt32BE(0x7fffffff, 16);
  assert.throws(() => decodeReference(bytes));
});
Deno.test("truncated JPEG is rejected", () => {
  assert.throws(() =>
    decodeReference(jpeg.encode(data(), 80).data.subarray(0, 100))
  );
});
