import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { removeUpload, saveUpload } from "../../src/lib/uploads";

const SUPABASE = "https://example.supabase.co";
const realFetch = globalThis.fetch;

function useStorage() {
  process.env.SUPABASE_URL = `${SUPABASE}/`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
}

/** Replaces fetch; `reply` answers each call and every call is recorded. */
function stubFetch(reply: (url: string, init: RequestInit) => Response) {
  const calls: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = (async (input: string, init: RequestInit) => {
    calls.push({ url: input, init });
    return reply(input, init);
  }) as typeof fetch;
  return calls;
}

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.VERCEL;
});

test("saves to the bucket and returns its public address", async () => {
  useStorage();
  const calls = stubFetch(() => new Response("{}"));
  const url = await saveUpload("gallery", "a.png", Buffer.from("x"));

  assert.equal(url, `${SUPABASE}/storage/v1/object/public/uploads/gallery/a.png`);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${SUPABASE}/storage/v1/object/uploads/gallery/a.png`);
  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Bearer test-key");
  assert.equal(headers["Content-Type"], "image/png");
});

test("a newer secret key travels in apikey alone", async () => {
  useStorage();
  process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";
  const calls = stubFetch(() => new Response("{}"));
  await saveUpload("gallery", "a.png", Buffer.from("x"));

  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(headers.apikey, "sb_secret_test");
  assert.equal(headers.Authorization, undefined);
});

test("creates the bucket on the first upload, then retries", async () => {
  useStorage();
  let uploads = 0;
  const calls = stubFetch((url) => {
    if (url.endsWith("/storage/v1/bucket")) return new Response("{}");
    uploads += 1;
    return uploads === 1 ? new Response('{"error":"Bucket not found"}', { status: 400 }) : new Response("{}");
  });

  await saveUpload("logos", "a.jpg", Buffer.from("x"));
  assert.deepEqual(calls.map((c) => c.url.replace(SUPABASE, "")), [
    "/storage/v1/object/uploads/logos/a.jpg",
    "/storage/v1/bucket",
    "/storage/v1/object/uploads/logos/a.jpg",
  ]);
  assert.equal(JSON.parse(calls[1].init.body as string).public, true);
});

test("a failed upload throws instead of returning a dead address", async () => {
  useStorage();
  stubFetch(() => new Response('{"error":"Unauthorized"}', { status: 403 }));
  await assert.rejects(saveUpload("logos", "a.jpg", Buffer.from("x")), /Upload failed \(403\)/);
});

test("on Vercel without storage settings it fails clearly", async () => {
  process.env.VERCEL = "1";
  await assert.rejects(saveUpload("logos", "a.jpg", Buffer.from("x")), /not configured/);
});

test("removes only files from its own bucket", async () => {
  useStorage();
  const calls = stubFetch(() => new Response("{}"));

  await removeUpload(`${SUPABASE}/storage/v1/object/public/uploads/staff/a.png`);
  await removeUpload("https://images.unsplash.com/photo-1?w=800");
  await removeUpload(`${SUPABASE}/storage/v1/object/public/other/a.png`);
  await removeUpload("/uploads/../../secret");
  await removeUpload(null);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, "DELETE");
  assert.equal(calls[0].url, `${SUPABASE}/storage/v1/object/uploads/staff/a.png`);
});
