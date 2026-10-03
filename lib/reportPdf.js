// Builds the inspection report PDF (US Letter) with pdf-lib. Server-side only.
// Input is the object returned by getInspectionReportById().
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { TIMEZONE } from "./schema.js";

const W = 612, H = 792, M = 48, CW = W - M * 2; // content width 516
const BOTTOM = 62;
const TEAL = rgb(0.122, 0.306, 0.373);
const GREY = rgb(0.35, 0.38, 0.42);
const LIGHT = rgb(0.85, 0.87, 0.89);
const BLACK = rgb(0.1, 0.1, 0.1);
const WHITE = rgb(1, 1, 1);
const SEV = { Critical: rgb(0.725, 0.11, 0.11), High: rgb(0.918, 0.345, 0.047), Medium: rgb(0.792, 0.541, 0.016), Low: rgb(0.145, 0.388, 0.922) };
const STATUS = { Ready: rgb(0.082, 0.502, 0.239), "Needs Attention": rgb(0.792, 0.541, 0.016), "At Risk": rgb(0.725, 0.11, 0.11) };

const fmtDT = (iso) => iso ? new Date(iso).toLocaleString("en-US", { timeZone: TIMEZONE, month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "";
const fmtD = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export async function buildInspectionPdf(report) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const supported = new Set(font.getCharacterSet());

  // Standard PDF fonts only cover Latin-1-ish text: map common symbols, drop the rest (emoji etc.).
  const SWAP = { "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"', "\u2013": "-", "\u2026": "...", "\u00a0": " ", "\u2192": "->" };
  const clean = (str) => {
    let out = "";
    for (const ch of String(str ?? "").replace(/\r\n?/g, "\n").replace(/\t/g, " ")) {
      const c = SWAP[ch] ?? ch;
      for (const d of c) if (d === "\n" || supported.has(d.codePointAt(0))) out += d;
    }
    return out;
  };

  let page, y;
  const newPage = () => { page = pdf.addPage([W, H]); y = H - M; };
  const ensure = (h) => { if (y - h < BOTTOM) { newPage(); return true; } return false; };

  function wrap(str, f, size, maxW) {
    const lines = [];
    for (const para of clean(str).split("\n")) {
      if (!para.trim()) { lines.push(""); continue; }
      let line = "";
      for (const word of para.split(/ +/)) {
        let w = word;
        while (f.widthOfTextAtSize(w, size) > maxW) { // hard-break very long tokens
          let n = w.length;
          while (n > 1 && f.widthOfTextAtSize(w.slice(0, n), size) > maxW) n--;
          if (line) { lines.push(line); line = ""; }
          lines.push(w.slice(0, n));
          w = w.slice(n);
        }
        const trial = line ? line + " " + w : w;
        if (f.widthOfTextAtSize(trial, size) <= maxW) line = trial;
        else { lines.push(line); line = w; }
      }
      lines.push(line);
    }
    return lines;
  }

  const drawText = (str, x, baseline, { size = 10, f = font, color = BLACK } = {}) =>
    page.drawText(clean(str), { x, y: baseline, size, font: f, color });

  function paragraph(str, { size = 10, f = font, color = BLACK, lh = size * 1.35, x = M, width = CW } = {}) {
    for (const line of wrap(str, f, size, width)) {
      ensure(lh);
      drawText(line, x, y - size, { size, f, color });
      y -= lh;
    }
  }

  function heading(str) {
    ensure(50);
    y -= 8;
    drawText(str, M, y - 12, { size: 12, f: bold, color: TEAL });
    y -= 18;
    page.drawLine({ start: { x: M, y }, end: { x: M + CW, y }, thickness: 0.75, color: TEAL });
    y -= 10;
  }

  // cols: [{label, w}]; rows: [[cell,...]] where cell = { segs:[{text,bold,color,size}], chip:{text,color} }
  function table(cols, rows) {
    const PAD = 5, SIZE = 8.5, LH = 11;
    const header = () => {
      ensure(24);
      page.drawRectangle({ x: M, y: y - 16, width: CW, height: 16, color: TEAL });
      let x = M;
      for (const c of cols) { drawText(c.label, x + PAD, y - 11.5, { size: 8, f: bold, color: WHITE }); x += c.w; }
      y -= 16;
    };
    header();
    for (const row of rows) {
      const laid = row.map((cell, i) => {
        if (cell.chip) return { chip: cell.chip, lines: [] };
        const lines = [];
        for (const seg of cell.segs) {
          const f = seg.bold ? bold : font;
          for (const l of wrap(seg.text, f, SIZE, cols[i].w - PAD * 2)) lines.push({ text: l, f, color: seg.color || BLACK });
        }
        return { lines };
      });
      const h = Math.max(18, Math.max(...laid.map((c) => c.lines.length)) * LH + PAD * 2 - 2);
      if (ensure(h)) header();
      let x = M;
      laid.forEach((c, i) => {
        if (c.chip) {
          const tw = bold.widthOfTextAtSize(c.chip.text, 7.5);
          page.drawRectangle({ x: x + PAD, y: y - 15, width: tw + 8, height: 12, color: c.chip.color });
          drawText(c.chip.text, x + PAD + 4, y - 12, { size: 7.5, f: bold, color: WHITE });
        } else {
          c.lines.forEach((l, k) => drawText(l.text, x + PAD, y - PAD - 7 - k * LH, { size: SIZE, f: l.f, color: l.color }));
        }
        x += cols[i].w;
      });
      y -= h;
      page.drawLine({ start: { x: M, y }, end: { x: M + CW, y }, thickness: 0.5, color: LIGHT });
    }
    y -= 6;
  }

  // ---------- page 1 ----------
  newPage();
  page.drawRectangle({ x: 0, y: H - 64, width: W, height: 64, color: TEAL });
  drawText("SafeServe", M, H - 34, { size: 20, f: bold, color: WHITE });
  drawText("Inspection Readiness Report", M, H - 52, { size: 11, color: WHITE });
  y = H - 64 - 26;

  drawText(report.restaurantName || "", M, y - 16, { size: 18, f: bold });
  y -= 26;
  const meta = [
    report.reportId ? `Report #${report.reportId}` : null,
    report.inspectionType,
    fmtD(report.reportDate),
    report.generatedBy ? `Prepared by ${report.generatedBy}` : null,
  ].filter(Boolean).join("   |   ");
  drawText(meta, M, y - 9, { size: 9.5, color: GREY });
  y -= 26;

  // metric boxes
  const status = report.overallStatus || "";
  const boxes = [
    { label: "OVERALL STATUS", value: status || "n/a", color: STATUS[status] || GREY, fill: true },
    { label: "CHECKLIST COMPLIANCE", value: `${report.complianceScore ?? 0}%`, sub: report.detail ? `${report.detail.tasksDone} of ${report.detail.tasksTotal} tasks` : "" },
    { label: "OPEN ISSUES", value: String(report.openIssues ?? 0) },
    { label: "CRITICAL / HIGH OPEN", value: String(report.criticalIssues ?? 0), color: (report.criticalIssues || 0) > 0 ? SEV.Critical : BLACK },
  ];
  const gap = 8, bw = (CW - gap * 3) / 4, bh = 62;
  boxes.forEach((b, i) => {
    const x = M + i * (bw + gap);
    page.drawRectangle({ x, y: y - bh, width: bw, height: bh, color: b.fill ? b.color : rgb(0.96, 0.97, 0.98), borderColor: LIGHT, borderWidth: b.fill ? 0 : 0.75 });
    drawText(b.label, x + 8, y - 14, { size: 6.8, f: bold, color: b.fill ? WHITE : GREY });
    drawText(b.value, x + 8, y - 40, { size: b.fill ? 14 : 22, f: bold, color: b.fill ? WHITE : b.color || BLACK });
    if (b.sub) drawText(b.sub, x + 8, y - 54, { size: 7.5, color: GREY });
  });
  y -= bh + 10;

  // inspector details
  heading("Inspector details");
  const field = (label, value) => {
    ensure(26);
    drawText(label, M, y - 8, { size: 8, f: bold, color: GREY });
    y -= 12;
    paragraph(value || "None recorded.", { size: 10, color: value ? BLACK : GREY });
    y -= 6;
  };
  field("INSPECTOR", report.inspectorName);
  field("INSPECTOR NOTES", report.inspectorNotes);
  field("ACTION PLAN", report.actionPlan);

  // open issues
  heading(`Open issues at time of report${report.detail ? ` (${report.detail.issuesTotal})` : ""}`);
  if (!report.detail) {
    paragraph("Issue detail was not recorded for this report (it was created before PDF support was added). The counts above are as saved.", { size: 9.5, color: GREY });
  } else if (report.detail.issues.length === 0) {
    paragraph("No open issues.", { size: 10, color: GREY });
  } else {
    table(
      [{ label: "SEVERITY", w: 62 }, { label: "#", w: 26 }, { label: "ISSUE", w: 232 }, { label: "AREA", w: 90 }, { label: "ASSIGNED / DUE", w: 106 }],
      report.detail.issues.map((i) => [
        { chip: { text: String(i.severity || "").toUpperCase(), color: SEV[i.severity] || GREY } },
        { segs: [{ text: String(i.n ?? "") }] },
        { segs: [{ text: i.type || "", bold: true }, ...(i.description ? [{ text: i.description }] : []), { text: `${i.status || ""}${i.reportedOn ? ` - reported ${fmtD(i.reportedOn)}` : ""}`, color: GREY }] },
        { segs: [{ text: i.area || "" }] },
        { segs: [{ text: i.assignedTo || "Unassigned" }, ...(i.dueDate ? [{ text: `Due ${fmtD(i.dueDate)}`, color: GREY }] : [])] },
      ])
    );
    const hidden = report.detail.issuesTotal - report.detail.issues.length;
    if (hidden > 0) paragraph(`+ ${hidden} more open issue${hidden === 1 ? "" : "s"} not shown.`, { size: 9, color: GREY });
  }

  // failed temperature readings
  if (report.detail) {
    heading("Failed temperature readings (7 days before report)");
    if (report.detail.failedReadings.length === 0) {
      paragraph("None recorded.", { size: 10, color: GREY });
    } else {
      table(
        [{ label: "EQUIPMENT", w: 130 }, { label: "TEMP", w: 52 }, { label: "WHEN", w: 118 }, { label: "CORRECTIVE ACTION TAKEN", w: 216 }],
        report.detail.failedReadings.map((r) => [
          { segs: [{ text: r.equipment || "", bold: true }] },
          { segs: [{ text: `${r.temperature} F` }] },
          { segs: [{ text: fmtDT(r.dateTime) }] },
          { segs: [{ text: r.correctiveAction || "None recorded", color: r.correctiveAction ? BLACK : GREY }] },
        ])
      );
    }
  }

  // footers on every page
  const pages = pdf.getPages();
  const stamp = report.detail?.generatedAt ? `Snapshot taken ${fmtDT(report.detail.generatedAt)}` : "";
  pages.forEach((p, i) => {
    const left = clean([report.restaurantName, report.reportId ? `Report #${report.reportId}` : "", stamp].filter(Boolean).join("  |  "));
    p.drawLine({ start: { x: M, y: 44 }, end: { x: M + CW, y: 44 }, thickness: 0.5, color: LIGHT });
    p.drawText(left, { x: M, y: 30, size: 7.5, font, color: GREY });
    const right = `Page ${i + 1} of ${pages.length}`;
    p.drawText(right, { x: M + CW - font.widthOfTextAtSize(right, 7.5), y: 30, size: 7.5, font, color: GREY });
  });

  pdf.setTitle(`Inspection Report${report.reportId ? ` #${report.reportId}` : ""} - ${report.restaurantName || ""}`);
  pdf.setProducer("SafeServe");
  return pdf.save();
}
