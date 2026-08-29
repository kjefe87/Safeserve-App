// Run this whenever you need to set or reset a user's PIN.
// It hashes the PIN with bcrypt and writes the hash into Airtable —
// the plaintext PIN is never stored anywhere.
//
// Usage:
//   node scripts/set-pin.js user@example.com 1234
//
// Requires .env.local to be loaded — Node doesn't read it automatically outside
// Next.js, so this script loads it manually below.

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

// --- minimal .env.local loader (avoids adding a dotenv dependency) ---
function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error(".env.local not found. Create it first (see .env.local.example).");
    return false;
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
  return true;
}

async function main() {
  const [, , email, plainPin] = process.argv;
  if (!email || !plainPin) {
    console.error("Usage: node scripts/set-pin.js <email> <pin>");
    process.exitCode = 1;
    return;
  }

  if (!loadEnvLocal()) {
    process.exitCode = 1;
    return;
  }

  const BASE_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;
  const headers = {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
  };

  // Find the user record by email.
  const formula = encodeURIComponent(`{Email} = "${email}"`);
  const findRes = await fetch(`${BASE_URL}/Users?filterByFormula=${formula}&maxRecords=1`, {
    headers,
  });
  const findData = await findRes.json();

  if (!findRes.ok) {
    console.error(
      "Airtable lookup failed:",
      findData.error?.message || JSON.stringify(findData)
    );
    if (findRes.status === 401 || findRes.status === 403) {
      console.error(
        "Check AIRTABLE_API_KEY in .env.local. A personal access token looks like patXXXX.YYYY (long, with a dot), not a short pat... string."
      );
    }
    process.exitCode = 1;
    return;
  }

  if (!findData.records || findData.records.length === 0) {
    console.error(`No user found with email: ${email}`);
    process.exitCode = 1;
    return;
  }

  const record = findData.records[0];
  const hash = await bcrypt.hash(plainPin, 10);

  const updateRes = await fetch(`${BASE_URL}/Users/${record.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields: { PIN: hash } }),
  });

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    console.error("Failed to update Airtable:", errText);
    process.exitCode = 1;
    return;
  }

  console.log(`PIN set for ${email}. They can now log in with PIN: ${plainPin}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
