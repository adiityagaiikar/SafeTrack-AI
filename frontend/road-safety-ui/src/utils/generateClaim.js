import { jsPDF } from "jspdf";

function safeText(value, fallback = "N/A") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

async function getBase64ImageFromURL(url) {
  if (!url) return null;

  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status})`);
  }

  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function drawMetaGrid(doc, startX, startY, rowHeight, columnWidth, rows) {
  const tableWidth = columnWidth * 2;
  const tableHeight = rowHeight * rows.length;

  doc.rect(startX, startY, tableWidth, tableHeight);
  doc.line(startX + columnWidth, startY, startX + columnWidth, startY + tableHeight);

  rows.forEach((_, index) => {
    if (index > 0) {
      doc.line(startX, startY + rowHeight * index, startX + tableWidth, startY + rowHeight * index);
    }
  });
}

export const downloadInsurancePDF = async (incidentData) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  const now = new Date();
  const caseId = `CASE-${now.getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  // Header
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 78, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("ROAD SAFETY AI - FORENSIC TELEMETRY", margin, 34);
  doc.setFontSize(11);
  doc.text(caseId, margin, 56);

  doc.setTextColor(20, 20, 20);

  let y = 98;

  // Section 1 - Incident metadata
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1. Incident Meta-Data", margin, y);
  y += 14;

  const rows = [
    ["Timestamp", safeText(incidentData.timestamp)],
    ["Coordinates", safeText(incidentData.coordinates || incidentData.location)],
    ["Threat Level", safeText(incidentData.severity)],
    ["YOLO Confidence", safeText(incidentData.yoloConfidence)],
  ];

  const rowHeight = 26;
  const colWidth = (pageWidth - margin * 2) / 2;

  drawMetaGrid(doc, margin, y, rowHeight, colWidth, rows);

  rows.forEach((row, index) => {
    const rowY = y + rowHeight * index + 17;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(row[0], margin + 8, rowY);

    doc.setFont("helvetica", "normal");
    doc.text(row[1], margin + colWidth + 8, rowY);
  });

  y += rowHeight * rows.length + 28;

  // Section 2 - Visual evidence
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("2. Visual Evidence", margin, y);
  y += 12;

  const imageX = margin;
  const imageY = y + 6;
  const imageWidth = pageWidth - margin * 2;
  const imageHeight = 180;

  let imageAdded = false;
  try {
    const imageDataUrl = await getBase64ImageFromURL(incidentData.snapshotUrl);
    if (imageDataUrl) {
      doc.addImage(imageDataUrl, "JPEG", imageX, imageY, imageWidth, imageHeight);
      imageAdded = true;
    }
  } catch {
    imageAdded = false;
  }

  if (!imageAdded) {
    doc.setDrawColor(120);
    doc.rect(imageX, imageY, imageWidth, imageHeight);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text("Image unavailable (CORS or fetch restriction).", imageX + 12, imageY + 20);
  }

  doc.setDrawColor(0);
  doc.rect(imageX, imageY, imageWidth, imageHeight);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Fig 1: YOLOv8 Spatial Analysis Snapshot", imageX, imageY + imageHeight + 14);

  y = imageY + imageHeight + 36;

  // Section 3 - AI forensic analysis with pagination
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("3. AI Forensic Analysis", margin, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const reportText = safeText(incidentData.geminiReport, "No forensic AI report available.");
  const wrapped = doc.splitTextToSize(reportText, pageWidth - margin * 2);

  const lineHeight = 14;
  wrapped.forEach((line) => {
    if (y > pageHeight - 70) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });

  // Footer on the last page
  const footerY = pageHeight - 26;
  doc.setDrawColor(100);
  doc.line(margin, footerY - 12, pageWidth - margin, footerY - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Generated autonomously via Edge AI. Immutable Record.", margin, footerY);
  doc.text(new Date().toLocaleString(), pageWidth - margin, footerY, { align: "right" });

  doc.save(`${caseId}.pdf`);
};
