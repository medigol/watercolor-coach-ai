import assert from "node:assert/strict";
// @ts-types="npm:@types/pngjs@6.0.5"
import { PNG } from "npm:pngjs@7.0.0";
import {
  defaultDirection,
  defaultPixels,
  referenceModel,
  referenceVersion,
} from "../../../shared/referenceStudio.ts";
import { imageHash } from "../../../shared/referenceImage.ts";
const owner = "10000000-0000-4000-8000-000000000001",
  id = "20000000-0000-4000-8000-000000000001";
const tempRoot =
  new URL("../../../tests/.reference-operator-tmp/", import.meta.url).pathname;
async function fixture() {
  await Deno.mkdir(tempRoot, { recursive: true });
  const dir = await Deno.makeTempDir({
      dir: tempRoot,
      prefix: "reference-operator-",
    }),
    png = new PNG({ width: 1024, height: 1024 });
  png.data.fill(255);
  const bytes = PNG.sync.write(png), hash = await imageHash(bytes);
  await Deno.writeFile(dir + "/output.png", bytes);
  const identity = (path: string) => ({
    path,
    sha256: hash,
    width: 1024,
    height: 1024,
    bytes: bytes.length,
  });
  const record = {
    id,
    user_id: owner,
    status: "uncertain",
    dispatch_phase: "dispatched",
    updated_at: "2026-11-06T12:00:00Z",
    created_at: "2026-11-06T11:00:00Z",
    output_path: null,
    output_metadata: null,
    request_json: {
      version: referenceVersion,
      id,
      ownerId: owner,
      parentId: null,
      source: identity(`${owner}/${id}/source.png`),
      input: identity(`${owner}/${id}/input.png`),
      direction: defaultDirection,
      pixels: defaultPixels,
      paidConsent: true,
    },
  };
  await Deno.writeTextFile(dir + "/record.json", JSON.stringify(record));
  return { dir, hash, record };
}
async function plan(dir: string, extra: string[] = []) {
  return await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--cached-only",
      "--allow-read",
      new URL("./reconcile-plan.ts", import.meta.url).pathname,
      "--record",
      dir + "/record.json",
      "--owner",
      owner,
      "--operation",
      "30000000-0000-4000-8000-000000000001",
      "--resolution",
      "completed",
      "--operator",
      "isolated-test",
      "--evidence",
      "Verified local fixture only; no provider call",
      "--workers-drained",
      "true",
      "--provider-terminal",
      "true",
      "--output",
      dir + "/output.png",
      ...extra,
    ],
    stdout: "piped",
    stderr: "piped",
  }).output();
}
Deno.test("offline recovery plan fully decodes/hashes existing PNG and emits only bounded RPC parameters", async () => {
  const f = await fixture();
  try {
    const r = await plan(f.dir);
    assert.equal(r.code, 0, new TextDecoder().decode(r.stderr));
    const p = JSON.parse(new TextDecoder().decode(r.stdout));
    assert.equal(p.p_metadata.sha256, f.hash);
    assert.equal(p.p_metadata.model, referenceModel);
    assert.equal(p.p_expected_updated_at, f.record.updated_at);
    assert(!JSON.stringify(p).includes("request_json"));
  } finally {
    await Deno.remove(f.dir, { recursive: true });
  }
});
Deno.test("offline recovery plan refuses malformed image bytes", async () => {
  const f = await fixture();
  try {
    await Deno.writeFile(f.dir + "/output.png", new Uint8Array(50));
    assert.notEqual((await plan(f.dir)).code, 0);
  } finally {
    await Deno.remove(f.dir, { recursive: true });
  }
});
Deno.test("offline recovery plan refuses unresolved upstream work", async () => {
  const f = await fixture();
  try {
    const r = await new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--cached-only",
        "--allow-read",
        new URL("./reconcile-plan.ts", import.meta.url).pathname,
        "--record",
        f.dir + "/record.json",
        "--owner",
        owner,
        "--operation",
        crypto.randomUUID(),
        "--resolution",
        "failed",
        "--operator",
        "isolated-test",
        "--evidence",
        "Fixture with no terminal provider evidence",
        "--workers-drained",
        "true",
        "--provider-terminal",
        "false",
      ],
      stdout: "piped",
      stderr: "piped",
    }).output();
    assert.notEqual(r.code, 0);
  } finally {
    await Deno.remove(f.dir, { recursive: true });
  }
});
