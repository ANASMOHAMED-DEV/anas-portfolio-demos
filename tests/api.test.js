import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server.js";

const tempDirectory = mkdtempSync(join(tmpdir(), "portfolio-demo-tests-"));
const { server, database } = createApp({
  dbPath: join(tempDirectory, "test.sqlite"),
});
let baseUrl;

before(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  database.close();
  rmSync(tempDirectory, { recursive: true, force: true });
});

function headers(session = "session-test-aaaaaaaa") {
  return { "x-demo-session": session };
}

async function getTransactions(session) {
  const response = await fetch(
    `${baseUrl}/api/projects/orbit-finance/transactions`,
    { headers: headers(session) },
  );
  return { response, body: await response.json() };
}

test("health endpoint and all nine concepts are registered", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", projects: 9 });
});

test("collections seed independently per demo session", async () => {
  const first = await getTransactions("session-test-aaaaaaaa");
  const second = await getTransactions("session-test-bbbbbbbb");
  assert.equal(first.response.status, 200);
  assert.equal(first.body.records.length, 4);
  assert.equal(second.body.records.length, 4);

  await fetch(`${baseUrl}/api/projects/orbit-finance/transactions`, {
    method: "POST",
    headers: {
      ...headers("session-test-aaaaaaaa"),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      title: "Private local row",
      amount: 10,
      type: "expense",
    }),
  });
  assert.equal(
    (await getTransactions("session-test-aaaaaaaa")).body.records.length,
    5,
  );
  assert.equal(
    (await getTransactions("session-test-bbbbbbbb")).body.records.length,
    4,
  );
});

test("create, update, and delete records", async () => {
  const session = "session-crud-aaaaaaaaaa";
  const createResponse = await fetch(`${baseUrl}/api/projects/taskline/tasks`, {
    method: "POST",
    headers: { ...headers(session), "content-type": "application/json" },
    body: JSON.stringify({
      title: "Test a board action",
      status: "To do",
      priority: "Low",
    }),
  });
  assert.equal(createResponse.status, 201);
  const { record } = await createResponse.json();
  assert.ok(record.id);

  const updateResponse = await fetch(
    `${baseUrl}/api/projects/taskline/tasks/${record.id}`,
    {
      method: "PUT",
      headers: { ...headers(session), "content-type": "application/json" },
      body: JSON.stringify({
        title: "Updated board action",
        status: "Done",
        priority: "High",
      }),
    },
  );
  assert.equal(updateResponse.status, 200);
  assert.equal((await updateResponse.json()).record.status, "Done");

  const deleteResponse = await fetch(
    `${baseUrl}/api/projects/taskline/tasks/${record.id}`,
    { method: "DELETE", headers: headers(session) },
  );
  assert.equal(deleteResponse.status, 204);
  const listResponse = await fetch(`${baseUrl}/api/projects/taskline/tasks`, {
    headers: headers(session),
  });
  const listBody = await listResponse.json();
  assert.equal(
    listBody.records.some((item) => item.id === record.id),
    false,
  );
});

test("deleting every seeded row preserves an intentionally empty collection", async () => {
  const session = "session-empty-aaaaaaaaaa";
  const seeded = await getTransactions(session);
  for (const record of seeded.body.records) {
    const response = await fetch(
      `${baseUrl}/api/projects/orbit-finance/transactions/${record.id}`,
      { method: "DELETE", headers: headers(session) },
    );
    assert.equal(response.status, 204);
  }
  const empty = await getTransactions(session);
  assert.deepEqual(empty.body.records, []);
});

test("reset restores sample data for only the active session", async () => {
  const session = "session-reset-aaaaaaaaaa";
  await fetch(`${baseUrl}/api/projects/orbit-finance/transactions`, {
    method: "POST",
    headers: { ...headers(session), "content-type": "application/json" },
    body: JSON.stringify({
      title: "Remove on reset",
      amount: 1,
      type: "expense",
    }),
  });
  const reset = await fetch(`${baseUrl}/api/projects/orbit-finance/reset`, {
    method: "POST",
    headers: headers(session),
  });
  assert.equal(reset.status, 200);
  assert.equal((await getTransactions(session)).body.records.length, 4);
  assert.equal(
    (await getTransactions("session-test-aaaaaaaa")).body.records.length,
    5,
  );
});

test("reject missing sessions, unknown collections, and oversized fields", async () => {
  const missingSession = await fetch(
    `${baseUrl}/api/projects/orbit-finance/transactions`,
  );
  assert.equal(missingSession.status, 400);

  const unknownCollection = await fetch(
    `${baseUrl}/api/projects/orbit-finance/secrets`,
    { headers: headers() },
  );
  assert.equal(unknownCollection.status, 404);

  const oversized = await fetch(
    `${baseUrl}/api/projects/orbit-finance/transactions`,
    {
      method: "POST",
      headers: { ...headers(), "content-type": "application/json" },
      body: JSON.stringify({ title: "x".repeat(2500) }),
    },
  );
  assert.equal(oversized.status, 400);

  const clientId = await fetch(
    `${baseUrl}/api/projects/orbit-finance/transactions`,
    {
      method: "POST",
      headers: { ...headers(), "content-type": "application/json" },
      body: JSON.stringify({ id: "client-controlled", title: "Not allowed" }),
    },
  );
  assert.equal(clientId.status, 400);
});

test("unknown projects cannot access demo data", async () => {
  const response = await fetch(`${baseUrl}/api/projects/not-a-demo/items`, {
    headers: headers(),
  });
  assert.equal(response.status, 404);
});
