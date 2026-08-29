const TITLE_KEYS = ["Title", "Name", "Item", "Type", "Category", "Subject"];

export function recordTitle(fields, index) {
  for (const key of TITLE_KEYS) {
    if (fields[key]) return String(fields[key]);
  }
  return `Entry ${index + 1}`;
}
