// Pure constants + helpers (safe to import in both server and client code).
// Dropdown values here must match the Airtable single-select options EXACTLY.
// Several live options have a trailing space (e.g. "Completed ", "In Progress ").
// If you clean those up in Airtable, update the matching line here.

export const TIMEZONE = "America/New_York";

export const ISSUE_TYPES = [
  "Temperature Violation",
  "Pest / Rodent Evidence",
  "Equipment Failure",
  "Food Storage Problem",
  "Sanitation Failure",
  "Employee Hygiene Violation",
  "Expired Food / Date Label Missing",
  "Chemical Storage Violation",
  "Structural / Facility Problem",
  "Other",
];

export const AREAS = [
  "Kitchen",
  "Walk-in Cooler",
  "Walk-in Freezer",
  "Dry Storage",
  "Food Prep Station",
  "Dishwashing Area",
  "Front of House",
  "Restrooms",
  "Delivery / Receiving",
  "Bar Area",
  "Dumpster / Waste Area",
];

export const SEVERITIES = ["Critical", "High", "Medium", "Low"];

export const ISSUE_STATUS = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress ", // trailing space in Airtable
  RESOLVED: "Resolved",
};
export const ISSUE_STATUS_LIST = [ISSUE_STATUS.OPEN, ISSUE_STATUS.IN_PROGRESS, ISSUE_STATUS.RESOLVED];

export const LOG_STATUS = {
  COMPLETED: "Completed ", // trailing space in Airtable (Compliance Logs)
  FAILED: "Failed ",
  SKIPPED: "Skipped ",
};

export const CHECKLIST_STATUS = { COMPLETED: "Completed" }; // no trailing space on Checklists

export const EQUIPMENT = [
  "Walk-in Cooler",
  "Walk-in Freezer",
  "Prep Table Cooler",
  "Hot Holding Unit",
  "Steam Table",
  "Reach-in Refrigerator",
  "Dishwasher Final Rinse",
  "Food Item — Chicken",
  "Food Item — Beef",
  "Food Item — Fish",
  "Food Item — Pork",
  "Food Item — Rice / Grains",
];

export const CERT_TYPES = ["Food Handler", "Manager", "TIPS", "Other"];

export const INSPECTION_TYPES = ["Routine ", "Follow Up", "Pre-Inspection Self-Check"]; // "Routine " has a trailing space

export const OVERALL_STATUS = {
  READY: "Ready ",
  NEEDS_ATTENTION: "Needs Attention ",
  AT_RISK: "At Risk",
};

// Thresholds used when generating an inspection report snapshot.
export const REPORT_THRESHOLDS = { ready: 90, atRisk: 70 };

// Matches an input against an options list ignoring stray whitespace/case, and
// returns the EXACT Airtable value (or null if it isn't a valid option).
export function resolveOption(list, input) {
  if (typeof input !== "string") return null;
  const want = input.trim().toLowerCase();
  return list.find((o) => o.trim().toLowerCase() === want) ?? null;
}

// Temperature rules (FDA Food Code). Returns true = safe, false = unsafe,
// null = no fixed rule for this item (food items depend on the food/cook method).
export function evaluateTemp(equipment, temp) {
  if (typeof temp !== "number" || Number.isNaN(temp)) return null;
  switch (equipment) {
    case "Walk-in Freezer":
      return temp <= 0;
    case "Hot Holding Unit":
    case "Steam Table":
      return temp >= 135;
    case "Dishwasher Final Rinse":
      return temp >= 180;
    case "Walk-in Cooler":
    case "Prep Table Cooler":
    case "Reach-in Refrigerator":
      return temp <= 41;
    default:
      return null;
  }
}

export function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE }); // YYYY-MM-DD
}

// ---- Checklist completion windows (New York time) -----------------------------
// A checklist task counts as "done" only if it was completed inside its current
// window: Per Shift = this AM/PM half of the day, Daily = today, Weekly = since
// Monday, Monthly = since the 1st.

function nyOffsetMs(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const wallAsUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return wallAsUTC - Math.floor(date.getTime() / 1000) * 1000;
}

// New York wall-clock time -> real instant (handles DST). Month is 1-12; day may overflow.
function nyWallToInstant(y, m, d, h) {
  const guess = Date.UTC(y, m - 1, d, h);
  const first = guess - nyOffsetMs(new Date(guess));
  return new Date(guess - nyOffsetMs(new Date(first)));
}

function nyParts(now) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
  }).formatToParts(now);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const y = +p.year, m = +p.month, d = +p.day, h = +p.hour;
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return { y, m, d, h, dow };
}

export function windowStart(frequency, now = new Date()) {
  const { y, m, d, h, dow } = nyParts(now);
  switch (String(frequency || "").trim()) {
    case "Per Shift":
      return nyWallToInstant(y, m, d, h < 12 ? 0 : 12);
    case "Weekly":
      return nyWallToInstant(y, m, d - ((dow + 6) % 7), 0); // Monday
    case "Monthly":
      return nyWallToInstant(y, m, 1, 0);
    case "Daily":
    default:
      return nyWallToInstant(y, m, d, 0);
  }
}

// Earliest instant any window could start at (used to fetch logs in one query).
export function earliestWindowStart(now = new Date()) {
  return ["Per Shift", "Daily", "Weekly", "Monthly"]
    .map((f) => windowStart(f, now))
    .reduce((a, b) => (a < b ? a : b));
}
