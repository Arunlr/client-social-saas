const fs = require('fs');
const path = require('path');

// Lightweight JSON persistence for the first zero-dependency deployment.
// The API can later swap this adapter for SQLite/Postgres without changing routes.
const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');
const FILE = path.join(DATA_DIR, 'state.json');

function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) return { users: [], clients: [], memberships: [], jobs: [], sessions: [] };
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch { return { users: [], clients: [], memberships: [], jobs: [], sessions: [] }; }
}

const db = load();
let writeTimer = null;
function persist() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => fs.writeFileSync(FILE, JSON.stringify(db, null, 2)), 20);
}

function find(collection, predicate) { return db[collection].find(predicate); }
function insert(collection, value) { db[collection].push(value); persist(); return value; }
function update(collection, predicate, updater) {
  const item = find(collection, predicate);
  if (item) { updater(item); persist(); }
  return item;
}

module.exports = { db, persist, find, insert, update };
