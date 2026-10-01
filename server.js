import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { projects } from "./src/demo-data.js";

const rootDirectory = dirname(fileURLToPath(import.meta.url));
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};
const MAX_BODY_BYTES = 16_384;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES)
      throw Object.assign(new Error("Request body is too large."), {
        status: 413,
      });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Request body must be valid JSON."), {
      status: 400,
    });
  }
}

function validateRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw Object.assign(new Error("Record must be a JSON object."), {
      status: 400,
    });
  }
  const entries = Object.entries(value);
  if (!entries.length || entries.length > 24) {
    throw Object.assign(
      new Error("Record must contain between 1 and 24 fields."),
      { status: 400 },
    );
  }
  for (const [key, field] of entries) {
    if (key === "id") {
      throw Object.assign(new Error("Record IDs are assigned by the server."), {
        status: 400,
      });
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(key)) {
      throw Object.assign(new Error("Record contains an invalid field name."), {
        status: 400,
      });
    }
    if (typeof field === "string" && field.length > 2000) {
      throw Object.assign(
        new Error("Text fields must be 2,000 characters or fewer."),
        { status: 400 },
      );
    }
    if (
      typeof field === "number" &&
      (!Number.isFinite(field) || Math.abs(field) > 1_000_000_000)
    ) {
      throw Object.assign(
        new Error("Numeric fields are outside the supported range."),
        { status: 400 },
      );
    }
    if (
      field !== null &&
      !["string", "number", "boolean"].includes(typeof field)
    ) {
      throw Object.assign(new Error("Fields must be simple JSON values."), {
        status: 400,
      });
    }
  }
  return value;
}

export function createApp({
  dbPath = resolve(rootDirectory, ".data/demo.sqlite"),
  staticRoot = rootDirectory,
} = {}) {
  mkdirSync(dirname(dbPath), { recursive: true });
  const database = new DatabaseSync(dbPath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS demo_records (
      demo TEXT NOT NULL,
      session TEXT NOT NULL,
      collection TEXT NOT NULL,
      record_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (demo, session, collection, record_id)
    );
    CREATE TABLE IF NOT EXISTS demo_collections (
      demo TEXT NOT NULL,
      session TEXT NOT NULL,
      collection TEXT NOT NULL,
      PRIMARY KEY (demo, session, collection)
    );
    CREATE INDEX IF NOT EXISTS demo_records_lookup
      ON demo_records (demo, session, collection, created_at);
  `);

  const selectRecords = database.prepare(
    "SELECT record_id, body FROM demo_records WHERE demo = ? AND session = ? AND collection = ? ORDER BY created_at, record_id",
  );
  const insertRecord = database.prepare(
    "INSERT INTO demo_records (demo, session, collection, record_id, body) VALUES (?, ?, ?, ?, ?)",
  );
  const updateRecord = database.prepare(
    "UPDATE demo_records SET body = ?, updated_at = CURRENT_TIMESTAMP WHERE demo = ? AND session = ? AND collection = ? AND record_id = ?",
  );
  const deleteRecord = database.prepare(
    "DELETE FROM demo_records WHERE demo = ? AND session = ? AND collection = ? AND record_id = ?",
  );
  const resetDemoRecords = database.prepare(
    "DELETE FROM demo_records WHERE demo = ? AND session = ?",
  );
  const resetDemoCollections = database.prepare(
    "DELETE FROM demo_collections WHERE demo = ? AND session = ?",
  );
  const markCollectionSeeded = database.prepare(
    "INSERT OR IGNORE INTO demo_collections (demo, session, collection) VALUES (?, ?, ?)",
  );

  function ensureSeeded(demo, session, collection) {
    const seedRecords = projects[demo].collections[collection] || [];
    const transaction = database.prepare(
      "INSERT OR IGNORE INTO demo_records (demo, session, collection, record_id, body) VALUES (?, ?, ?, ?, ?)",
    );
    database.exec("BEGIN IMMEDIATE");
    try {
      const initialized = markCollectionSeeded.run(demo, session, collection);
      const existing = selectRecords.all(demo, session, collection);
      if (initialized.changes && !existing.length) {
        for (const record of seedRecords)
          transaction.run(
            demo,
            session,
            collection,
            record.id,
            JSON.stringify(record),
          );
      }
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
    return selectRecords.all(demo, session, collection);
  }

  async function serveStatic(request, response, pathname) {
    let relativePath = decodeURIComponent(pathname);
    if (relativePath === "/") relativePath = "/index.html";
    if (relativePath.endsWith("/")) relativePath += "index.html";
    const filePath = resolve(staticRoot, `.${relativePath}`);
    if (
      !filePath.startsWith(`${resolve(staticRoot)}${sep}`) &&
      filePath !== resolve(staticRoot, "index.html")
    ) {
      sendJson(response, 403, { error: "Forbidden." });
      return;
    }
    try {
      const fileInfo = await stat(filePath);
      if (!fileInfo.isFile()) throw new Error("Not a file.");
      const body = await readFile(filePath);
      response.writeHead(200, {
        "content-type":
          MIME_TYPES[extname(filePath)] || "application/octet-stream",
        "content-length": body.length,
        "x-content-type-options": "nosniff",
        "cache-control": "no-cache",
      });
      if (request.method === "HEAD") response.end();
      else response.end(body);
    } catch {
      sendJson(response, 404, { error: "Not found." });
    }
  }

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      if (url.pathname === "/api/health" && request.method === "GET") {
        sendJson(response, 200, {
          status: "ok",
          projects: Object.keys(projects).length,
        });
        return;
      }
      const apiMatch = url.pathname.match(
        /^\/api\/projects\/([a-z0-9-]+)(?:\/([a-zA-Z0-9-]+)(?:\/([a-zA-Z0-9-]+))?)?$/,
      );
      if (!apiMatch) {
        if (request.method === "GET" || request.method === "HEAD")
          await serveStatic(request, response, url.pathname);
        else sendJson(response, 405, { error: "Method not allowed." });
        return;
      }
      const [, demo, collection, recordId] = apiMatch;
      if (!projects[demo]) {
        sendJson(response, 404, { error: "Unknown demo project." });
        return;
      }
      const session = request.headers["x-demo-session"];
      if (
        typeof session !== "string" ||
        !/^[a-zA-Z0-9-]{16,64}$/.test(session)
      ) {
        sendJson(response, 400, { error: "A valid demo session is required." });
        return;
      }
      if (collection === "reset" && !recordId && request.method === "POST") {
        database.exec("BEGIN IMMEDIATE");
        try {
          resetDemoRecords.run(demo, session);
          resetDemoCollections.run(demo, session);
          database.exec("COMMIT");
        } catch (error) {
          database.exec("ROLLBACK");
          throw error;
        }
        sendJson(response, 200, { status: "reset" });
        return;
      }
      if (
        !collection ||
        !Object.hasOwn(projects[demo].collections, collection)
      ) {
        sendJson(response, 404, { error: "Unknown project collection." });
        return;
      }
      if (!recordId && request.method === "GET") {
        const records = ensureSeeded(demo, session, collection).map(
          ({ record_id, body }) => ({ id: record_id, ...JSON.parse(body) }),
        );
        sendJson(response, 200, { records });
        return;
      }
      if (!recordId && request.method === "POST") {
        const body = validateRecord(await readJson(request));
        const id = randomUUID();
        insertRecord.run(demo, session, collection, id, JSON.stringify(body));
        sendJson(response, 201, { record: { id, ...body } });
        return;
      }
      if (recordId && request.method === "PUT") {
        const body = validateRecord(await readJson(request));
        const result = updateRecord.run(
          JSON.stringify(body),
          demo,
          session,
          collection,
          recordId,
        );
        if (!result.changes) {
          sendJson(response, 404, { error: "Record not found." });
          return;
        }
        sendJson(response, 200, { record: { id: recordId, ...body } });
        return;
      }
      if (recordId && request.method === "DELETE") {
        const result = deleteRecord.run(demo, session, collection, recordId);
        if (!result.changes) {
          sendJson(response, 404, { error: "Record not found." });
          return;
        }
        response.writeHead(204, { "cache-control": "no-store" });
        response.end();
        return;
      }
      sendJson(response, 405, { error: "Method not allowed." });
    } catch (error) {
      sendJson(response, error.status || 500, {
        error: error.status
          ? error.message
          : "The server could not complete that request.",
      });
    }
  });

  return { server, database };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const { server } = createApp();
  const port = Number(process.env.PORT) || 4173;
  server.listen(port, "0.0.0.0", () =>
    console.log(`Portfolio demos running at http://localhost:${port}`),
  );
}
