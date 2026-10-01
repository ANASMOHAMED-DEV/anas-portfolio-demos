import { projects } from "../demo-data.js";

function getSessionId(demo) {
  const storageKey = `portfolio-demo-session:${demo}`;
  let sessionId = localStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(storageKey, sessionId);
  }
  return sessionId;
}

export class DemoApi {
  constructor(demo) {
    this.demo = demo;
    this.sessionId = getSessionId(demo);
  }

  get storageKey() {
    return `portfolio-demo-data:${this.demo}:${this.sessionId}`;
  }

  readState() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || "{}");
    } catch {
      throw new Error("This demo could not read its saved browser data.");
    }
  }

  writeState(state) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      throw new Error(
        "Browser storage is unavailable or full. Clear space and retry.",
      );
    }
  }

  ensureCollection(state, collection) {
    if (!Object.hasOwn(projects[this.demo].collections, collection)) {
      throw new Error("Unknown project collection.");
    }
    if (!Object.hasOwn(state, collection)) {
      state[collection] = JSON.parse(
        JSON.stringify(projects[this.demo].collections[collection] || []),
      );
    }
    return state[collection];
  }

  async list(collection) {
    const state = this.readState();
    const records = this.ensureCollection(state, collection);
    this.writeState(state);
    return JSON.parse(JSON.stringify(records));
  }

  async create(collection, record) {
    const state = this.readState();
    const records = this.ensureCollection(state, collection);
    const created = { id: crypto.randomUUID(), ...record };
    records.push(created);
    this.writeState(state);
    return created;
  }

  async update(collection, id, record) {
    const state = this.readState();
    const records = this.ensureCollection(state, collection);
    const index = records.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Record not found.");
    records[index] = { id, ...record };
    this.writeState(state);
    return records[index];
  }

  async remove(collection, id) {
    const state = this.readState();
    const records = this.ensureCollection(state, collection);
    const index = records.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Record not found.");
    records.splice(index, 1);
    this.writeState(state);
  }

  async reset() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      throw new Error(
        "Browser storage is unavailable. The demo could not reset.",
      );
    }
  }
}
