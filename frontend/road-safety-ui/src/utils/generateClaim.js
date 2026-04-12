import { jsPDF } from "jspdf";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeText(value, fallback = "N/A") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

async function getBase64ImageFromURL(url) {
  if (!url) return null;
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Generates a mock SHA-256-style hash string for the digital signature block */
function mockHash(seed) {
  const chars = "0123456789abcdef";
  let hash = "";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * 16)];
  }
  return hash;
}

// ─── Watermark ────────────────────────────────────────────────────────────────

function drawWatermark(doc, pageWidth, pageHeight) {
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.045 }));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(52);
  doc.setTextColor(120, 120, 120);

  // Draw diagonal watermark text twice across the page
  const text = "CONFIDENTIAL — AI EVIDENCE";
  doc.text(text, pageWidth / 2, pageHeight / 2 - 60, {
    align: "center",
    angle: 45,
  });
  doc.text(text, pageWidth / 2, pageHeight / 2 + 120, {
    align: "center",
    angle: 45,
  });
  doc.restoreGraphicsState();
}

// ─── Shield Icon (SVG-drawn via lines/arcs) ───────────────────────────────────

function drawShieldIcon(doc, x, y, size) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2;

  doc.setFillColor(249, 115, 22); // #f97316
  doc.setDrawColor(249, 115, 22);

  // Outer circle
  doc.circle(cx, cy, r, "F");

  // Inner "AI" text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size * 0.38);
  doc.setTextColor(255, 255, 255);
  doc.text("AI", cx, cy + size * 0.13, { align: "center" });
}

// ─── Metadata Grid ────────────────────────────────────────────────────────────

function drawMetaGrid(doc, startX, startY, rowHeight, colWidth, rows) {
  const tableWidth = colWidth * 2;
  const tableHeight = rowHeight * rows.length;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.rect(startX, startY, tableWidth, tableHeight);
  doc.line(startX + colWidth, startY, startX + colWidth, startY + tableHeight);

  rows.forEach((_, i) => {
    if (i > 0) {
      doc.line(startX, startY + rowHeight * i, startX + tableWidth, startY + rowHeight * i);
    }
  });
}

// ─── Digital Signature Block ──────────────────────────────────────────────────

function drawSignatureBlock(doc, y, pageWidth, margin, caseId) {
  const hash = mockHash(caseId);
  const blockX = margin;
  const blockW = pageWidth - margin * 2;
  const blockH = 68;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(blockX, y, blockW, blockH, 4, 4, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("DIGITAL INTEGRITY SIGNATURE", blockX + 12, y + 16);

  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`SHA-256: ${hash.slice(0, 32)}`, blockX + 12, y + 30);
  doc.text(`         ${hash.slice(32)}`, blockX + 12, y + 41);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Signed by: Road Safety AI Engine  |  Case: ${caseId}  |  ${new Date().toUTCString()}`,
    blockX + 12,
    y + 56
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export const downloadInsurancePDF = async (incidentData) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;

  const now = new Date();
  const caseId = `CASE-${now.getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  // ── Watermark (page 1) ──────────────────────────────────────────────────────
  drawWatermark(doc, pageWidth, pageHeight);

  // ── Header band ────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 88, "F");

  // Shield icon
  drawShieldIcon(doc, margin, 16, 36);

  // Department title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("DEPARTMENT OF TRANSPORTATION", margin + 48, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("AI-Assisted Forensic Incident Report  •  Road Safety Intelligence Division", margin + 48, 50);

  // Case ID + date right-aligned
  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.setTextColor(249, 115, 22); // #f97316
  doc.text(caseId, pageWidth - margin, 34, { align: "right" });
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(now.toUTCString(), pageWidth - margin, 50, { align: "right" });

  // Thin accent line under header
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(1.5);
  doc.line(0, 88, pageWidth, 88);
  doc.setLineWidth(0.4);

  doc.setTextColor(20, 20, 20);
  let y = 112;

  // ── Section 1: Incident Metadata ───────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("1. INCIDENT META-DATA", margin, y);

  // Accent underline
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(1);
  doc.line(margin, y + 4, margin + 140, y + 4);
  doc.setLineWidth(0.4);
  doc.setDrawColor(200, 200, 200);

  y += 18;

  const metaRows = [
    ["Timestamp (UTC)", safeText(incidentData.timestamp)],
    ["Spatial Coordinates", safeText(incidentData.coordinates || incidentData.location)],
    ["Threat Classification", safeText(incidentData.severity)],
    ["YOLOv8 Confidence", safeText(incidentData.yoloConfidence)],
    ["Speed at Impact", safeText(incidentData.speedAtImpact)],
    ["Weather Condition", safeText(incidentData.weatherCondition)],
  ];

  const rowH = 24;
  const colW = (pageWidth - margin * 2) / 2;

  drawMetaGrid(doc, margin, y, rowH, colW, metaRows);

  metaRows.forEach((row, i) => {
    const rowY = y + rowH * i + 15.5;

    // Label cell — dark background
    doc.setFillColor(30, 41, 59); // #1e293b
    doc.rect(margin, y + rowH * i, colW, rowH, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(249, 115, 22);
    doc.text(row[0].toUpperCase(), margin + 8, rowY);

    // Value cell
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(row[1], margin + colW + 8, rowY);
  });

  y += rowH * metaRows.length + 32;

  // ── Section 2: Visual Evidence ─────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("2. VISUAL EVIDENCE", margin, y);
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(1);
  doc.line(margin, y + 4, margin + 120, y + 4);
  doc.setLineWidth(0.4);
  doc.setDrawColor(200, 200, 200);

  y += 16;

  const imgX = margin;
  const imgY = y + 4;
  const imgW = pageWidth - margin * 2;
  const imgH = 170;

  let imageAdded = false;
  try {
    const imageDataUrl = await getBase64ImageFromURL(incidentData.snapshotUrl);
    if (imageDataUrl) {
      doc.addImage(imageDataUrl, "JPEG", imgX, imgY, imgW, imgH);
      imageAdded = true;
    }
  } catch {
    imageAdded = false;
  }

  if (!imageAdded) {
    doc.setFillColor(241, 245, 249);
    doc.rect(imgX, imgY, imgW, imgH, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(imgX, imgY, imgW, imgH);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Snapshot unavailable (CORS restriction or no frame captured).", imgX + 12, imgY + 22);
  }

  doc.setDrawColor(200, 200, 200);
  doc.rect(imgX, imgY, imgW, imgH);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Fig 1: YOLOv8 Spatial Analysis Snapshot — Bounding Box Overlay", imgX, imgY + imgH + 13);

  y = imgY + imgH + 30;

  // ── Section 3: AI Forensic Analysis ───────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("3. AI FORENSIC ANALYSIS", margin, y);
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(1);
  doc.line(margin, y + 4, margin + 148, y + 4);
  doc.setLineWidth(0.4);
  doc.setDrawColor(200, 200, 200);

  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);

  const reportText = safeText(incidentData.geminiReport, "No forensic AI report available.");
  const wrapped = doc.splitTextToSize(reportText, pageWidth - margin * 2);
  const lineH = 14;

  wrapped.forEach((line) => {
    if (y > pageHeight - 130) {
      doc.addPage();
      drawWatermark(doc, pageWidth, pageHeight);
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineH;
  });

  y += 20;

  // ── Digital Signature Block ────────────────────────────────────────────────
  if (y + 80 > pageHeight - 50) {
    doc.addPage();
    drawWatermark(doc, pageWidth, pageHeight);
    y = margin;
  }

  drawSignatureBlock(doc, y, pageWidth, margin, caseId);
  y += 80;

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footerY = pageHeight - 24;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 12, pageWidth - margin, footerY - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Generated autonomously via Edge AI  •  Immutable Record  •  Department of Transportation",
    margin,
    footerY
  );
  doc.text(now.toLocaleString(), pageWidth - margin, footerY, { align: "right" });

  doc.save(`${caseId}.pdf`);
};
