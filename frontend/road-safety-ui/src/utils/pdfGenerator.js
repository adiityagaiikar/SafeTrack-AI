import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateIncidentPDF = (reportData) => {
  if (!reportData) return;

  const doc = new jsPDF();
  
  // Custom font setup (Helvetica is default, we stick to it for reliability)
  
  // Helper functions
  const addTitle = (text, y) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20, 30, 40);
    doc.text(text, 14, y);
    doc.line(14, y + 2, 196, y + 2); // Underline
  };

  const addField = (label, value, x, y) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`${label}: `, x, y);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.text(String(value || "N/A"), x + labelWidth, y);
  };

  // Header Section
  doc.setFillColor(25, 33, 44);
  doc.rect(0, 0, 210, 30, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MOTOR VEHICLE ACCIDENT", 105, 15, { align: "center" });
  doc.setFontSize(14);
  doc.text("INCIDENT INVESTIGATION REPORT", 105, 23, { align: "center" });
  
  let currentY = 40;

  // 1. Report Identification
  addTitle("1. REPORT IDENTIFICATION & FILING DETAILS", currentY);
  currentY += 10;
  
  const idData = reportData.report_identification || {};
  doc.autoTable({
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    body: [
      ["Report Number", idData.report_number, "Date of Report", idData.date_of_report],
      ["Time of Incident", idData.time_of_incident, "Date of Incident", idData.date_of_incident],
      ["Reported By", idData.reported_by, "Prepared By", idData.report_prepared_by],
      ["Status", idData.report_status, "Severity", idData.severity]
    ],
    margin: { left: 14, right: 14 }
  });
  currentY = doc.lastAutoTable.finalY + 15;

  // 2. Incident Location
  addTitle("2. INCIDENT LOCATION & SCENE DETAILS", currentY);
  currentY += 10;
  const locData = reportData.incident_location || {};
  doc.autoTable({
    startY: currentY,
    theme: 'grid',
    body: Object.entries(locData).map(([k, v]) => {
      // capitalize key
      const key = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return [key, v];
    }),
    margin: { left: 14, right: 14 }
  });
  currentY = doc.lastAutoTable.finalY + 15;

  // 3. Parties Involved
  if (currentY > 250) { doc.addPage(); currentY = 20; }
  addTitle("3. PARTIES INVOLVED", currentY);
  currentY += 10;

  const parties = reportData.parties_involved || [];
  parties.forEach(party => {
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 80, 150);
    doc.text(party.role || "Vehicle", 14, currentY);
    currentY += 5;

    doc.autoTable({
      startY: currentY,
      theme: 'grid',
      body: [
        ["Driver Name", party.driver_name, "Age / Gender", party.age_gender],
        ["DL Number", party.dl_number, "Contact", party.contact],
        ["Vehicle No.", party.vehicle_no, "Vehicle Type", party.vehicle_type],
        ["Insurance Policy No.", party.insurance_policy, "Injuries", party.injuries],
        ["Action Taken", party.action_taken, "", ""]
      ],
      margin: { left: 14, right: 14 }
    });
    currentY = doc.lastAutoTable.finalY + 10;
  });

  // 4. Cause of Accident
  if (currentY > 240) { doc.addPage(); currentY = 20; }
  addTitle("4. CAUSE OF ACCIDENT - INVESTIGATION FINDINGS", currentY);
  currentY += 10;
  const causeData = reportData.cause_of_accident || {};

  doc.autoTable({
    startY: currentY,
    theme: 'grid',
    body: [
      ["Primary Cause", causeData.primary_cause],
      ["Cause Category", causeData.cause_category],
      ["Estimated Impact Speed", causeData.estimated_impact_speed],
      ["Evasive Action Taken", causeData.evasive_action_taken],
      ["Contributing Factors", (causeData.contributing_factors || []).join("\n")],
    ],
    margin: { left: 14, right: 14 }
  });
  currentY = doc.lastAutoTable.finalY + 5;

  const env = causeData.environmental_factors || {};
  doc.autoTable({
    startY: currentY,
    theme: 'grid',
    head: [["Environmental Factors", ""]],
    body: [
      ["Weather", env.weather],
      ["Road Surface", env.road_surface],
      ["Traffic Volume", env.traffic_volume],
      ["Signal / Signage", env.signal_signage],
      ["CCTV Coverage", env.cctv_coverage]
    ],
    margin: { left: 14, right: 14 }
  });
  currentY = doc.lastAutoTable.finalY + 15;

  // 5. Risk Analysis
  if (currentY > 230) { doc.addPage(); currentY = 20; }
  addTitle("5. RISK ANALYSIS & ACCIDENT PROBABILITY FACTORS", currentY);
  currentY += 10;
  
  const riskData = reportData.risk_analysis || [];
  doc.autoTable({
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [40, 50, 60], textColor: [255, 255, 255] },
    head: [["Risk Factor", "Likelihood", "Recommended Mitigation"]],
    body: riskData.map(r => [r.risk_factor, r.likelihood, r.recommended_mitigation]),
    margin: { left: 14, right: 14 }
  });

  // Save the document
  const fileName = `ERS_Report_${reportData?.report_identification?.report_number || Date.now()}.pdf`;
  doc.save(fileName);
};
