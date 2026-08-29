// Thin wrapper around the Airtable REST API.
// Keeps every fetch call in one place so rate limits / caching are easy to manage later.
// Table and field names below match the SafeServe base as of the June 2026 handoff note —
// update TABLES/FIELDS if you've renamed anything in Airtable since.

const BASE_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;

const TABLES = {
  USERS: "Users",
  CHECKLISTS: "Checklists",
  COMPLIANCE_LOGS: "Compliance Logs",
  ISSUES_LOG: "Issues Log",
  TEMP_LOGS: "Temperature Logs",
  INSPECTION_REPORTS: "Inspection Reports",
  STAFF_CERTS: "Staff Certifications",
};

async function airtableRequest(path, options = {}) {
  const res = await fetch(`${BASE_URL}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable request failed (${res.status}): ${body}`);
  }

  return res.json();
}

// --- Users / auth -----------------------------------------------------

// Looks up a user by email only — no PIN in the query, since the PIN is now stored
// as a bcrypt hash and can't be matched via Airtable's filterByFormula (you can't
// compare a plaintext value against a hash server-side; that comparison has to
// happen in code after fetching the record). Returns null if not found/inactive.
export async function findUserByEmail(email) {
  const formula = encodeURIComponent(
    `AND({Email} = "${email}", {Active} = TRUE())`
  );
  const data = await airtableRequest(
    `${TABLES.USERS}?filterByFormula=${formula}&maxRecords=1`
  );
  if (!data.records || data.records.length === 0) return null;

  const record = data.records[0];
  return {
    id: record.id,
    name: record.fields["Name"],
    email: record.fields["Email"],
    pinHash: record.fields["PIN"], // now holds a bcrypt hash, not plaintext
    role: record.fields["Role"], // "Owner" | "Manager" | "Staff"
    restaurantName: record.fields["Restaurant Name"],
  };
}

// Overwrites a user's PIN field with a new bcrypt hash — used by the
// scripts/set-pin.js helper script (and later, a "reset PIN" admin flow if you build one).
export async function setUserPinHash(recordId, pinHash) {
  await airtableRequest(`${TABLES.USERS}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: { PIN: pinHash } }),
  });
}

// --- Checklists ---------------------------------------------------------

// Fetches the 18 shared FDA checklist tasks (not restaurant-specific).
export async function getChecklists() {
  const data = await airtableRequest(`${TABLES.CHECKLISTS}?pageSize=100`);
  return data.records.map((r) => ({
    id: r.id,
    taskName: r.fields["Task Name"],
    section: r.fields["Section"],
    frequency: r.fields["Frequency"],
    area: r.fields["Area"],
    critical: r.fields["Critical"],
    fdaReference: r.fields["FDA Reference"],
    status: r.fields["Status"],
  }));
}

// Marks a checklist task complete AND writes an audit record to Compliance Logs.
// Doing both in one call fixes the gap flagged in the handoff note (3.3) where
// Mark Complete only updated Checklists and Compliance Logs stayed empty.
export async function markTaskComplete({ taskId, taskName, completedByName, restaurantName }) {
  await airtableRequest(`${TABLES.CHECKLISTS}/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: { Status: "Completed" } }),
  });

  await airtableRequest(TABLES.COMPLIANCE_LOGS, {
    method: "POST",
    body: JSON.stringify({
      fields: {
        Task: taskName,
        "Completed By": completedByName,
        "Date Completed": new Date().toISOString(),
        Status: "Completed",
        "Restaurant Name": restaurantName,
      },
    }),
  });
}

// --- Restaurant-scoped reads ---------------------------------------------

// Generic helper: fetch records from a table filtered to one restaurant.
async function getRestaurantScoped(table, restaurantName) {
  const formula = encodeURIComponent(`{Restaurant Name} = "${restaurantName}"`);
  const data = await airtableRequest(`${table}?filterByFormula=${formula}&pageSize=100`);
  return data.records;
}

export async function getComplianceLogs(restaurantName) {
  return getRestaurantScoped(TABLES.COMPLIANCE_LOGS, restaurantName);
}

export async function getIssuesLog(restaurantName) {
  return getRestaurantScoped(TABLES.ISSUES_LOG, restaurantName);
}

export async function getTempLogs(restaurantName) {
  return getRestaurantScoped(TABLES.TEMP_LOGS, restaurantName);
}

export async function getStaffCertifications(restaurantName) {
  return getRestaurantScoped(TABLES.STAFF_CERTS, restaurantName);
}

export async function getInspectionReports(restaurantName) {
  return getRestaurantScoped(TABLES.INSPECTION_REPORTS, restaurantName);
}

export { TABLES };
