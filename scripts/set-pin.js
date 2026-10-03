// Run this whenever you need to set or reset a user's PIN.
// It hashes the PIN with bcrypt and writes the hash into the "PIN Hash" field in
// Airtable — the plaintext PIN is never stored anywhere.
//
// Usage:
//   node scripts/set-pin.js user@example.com 1234
//
// Requires .env.local to be loaded — Node doesn't read it automatically outside
// Next.js, so this script loads it manually below.

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error(".env.local not found. Create it first (see .env.local.example).");
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    process.env[key] = value;
  }
}

async function main() {
  const [, , email, plainPin] = process.argv;
  if (!email || !plainPin) {
    console.error("Usage: node scripts/set-pin.js <email> <pin>");
    process.exit(1);
  }

  loadEnvLocal();

  const BASE_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;
  const headers = {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
  };

  const safeEmail = email.toLowerCase().replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const formula = encodeURIComponent(`LOWER({Email}) = "${safeEmail}"`);
  const findRes = await fetch(`${BASE_URL}/Users?filterByFormula=${formula}&maxRecords=1`, {
    headers,
  });
  const findData = await findRes.json();

  if (!findData.records || findData.records.length === 0) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  const record = findData.records[0];
  const hash = await bcrypt.hash(plainPin, 10);

  const updateRes = await fetch(`${BASE_URL}/Users/${record.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields: { "PIN Hash": hash } }),
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    console.error("Failed to update Airtable:", errText);
    console.error(
      'If this mentions an unknown field, make sure you created a field named exactly "PIN Hash" (Single line text) in your Users table.'
    );
    process.exit(1);
  }

  console.log(`PIN set for ${email}. They can now log in with PIN: ${plainPin}`);
}

main();
