import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuth } from "@/context/AuthContext";

const SEVERITY_SCORE = {
  Minor: 1,
  Moderate: 2,
  Severe: 3,
};

function normalizeSeverity(rawSeverity, accidentDetected) {
  const value = String(rawSeverity || "").toUpperCase();

  if (value === "SEVERE" || value === "HIGH" || value === "CRITICAL") return "Severe";
  if (value === "MODERATE" || value === "MEDIUM") return "Moderate";
  if (value === "MINOR" || value === "LOW") return "Minor";

  return accidentDetected ? "Severe" : "Minor";
}

function toDate(timestamp) {
  if (!timestamp) return null;
  if (typeof timestamp?.toDate === "function") return timestamp.toDate();

  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function mapIncident(docItem) {
  const raw = docItem.data();
  const accidentDetected = Boolean(raw.accidentDetected ?? raw.accident ?? raw.crash_detected ?? false);
  const severity = normalizeSeverity(raw.severity, accidentDetected);
  const timestampDate = toDate(raw.timestamp ?? raw.created_at);

  return {
    id: docItem.id,
    timestampDate,
    date: timestampDate ? timestampDate.toLocaleDateString("en-CA") : "N/A",
    time: timestampDate
      ? timestampDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "N/A",
    location: raw.location || raw.geo_location || "Unknown",
    plate: raw.plate || raw.vehiclePlate || "UNKNOWN",
    type: raw.type || raw.classification || (accidentDetected ? "Collision Detected" : "No Collision"),
    severity,
    severityScore: SEVERITY_SCORE[severity] || 0,
    accidentDetected,
    lat: raw.lat ?? raw.latitude ?? null,
    lng: raw.lng ?? raw.longitude ?? null,
    status: raw.status || "pending_review",
    raw,
  };
}

/**
 * Real-time Firestore incident listener with optional tenant isolation.
 *
 * @param {string}  collectionName - Firestore collection (default "accidents")
 * @param {object}  opts
 * @param {boolean} opts.scoped    - When true, only fetch incidents belonging to the current user
 */
export function useIncidents(collectionName = "accidents", { scoped = false } = {}) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError("");

    const incidentsRef = collection(db, collectionName);

    // Build query — with optional tenant scoping
    const constraints = [orderBy("timestamp", "desc")];
    if (scoped && currentUser?.uid) {
      constraints.unshift(where("userId", "==", currentUser.uid));
    }
    const incidentsQuery = query(incidentsRef, ...constraints);

    const unsubscribe = onSnapshot(
      incidentsQuery,
      (snapshot) => {
        setIncidents(snapshot.docs.map(mapIncident));
        setLoading(false);
      },
      (err) => {
        setError(err?.message || "Database connection failed.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, scoped, currentUser?.uid]);

  // ── Delete an incident ──────────────────────────────────────────────────────
  const deleteIncident = async (incidentId) => {
    try {
      await deleteDoc(doc(db, collectionName, incidentId));
    } catch (err) {
      console.error("[useIncidents] Delete failed:", err);
      throw err;
    }
  };

  // ── Update an incident's status ─────────────────────────────────────────────
  const updateIncidentStatus = async (incidentId, status) => {
    try {
      await updateDoc(doc(db, collectionName, incidentId), { status });
    } catch (err) {
      console.error("[useIncidents] Status update failed:", err);
      throw err;
    }
  };

  const metrics = useMemo(() => {
    const now = Date.now();
    const inLast24h = incidents.filter(
      (incident) => incident.timestampDate && now - incident.timestampDate.getTime() <= 24 * 60 * 60 * 1000
    );

    const collisions24h = inLast24h.filter((incident) => incident.accidentDetected).length;
    const avgSeverity =
      incidents.length > 0
        ? incidents.reduce((sum, item) => sum + item.severityScore, 0) / incidents.length
        : 0;

    const activeFeeds = new Set(
      inLast24h
        .map((item) => item.raw.userId || item.raw.cameraId || item.location)
        .filter(Boolean)
    ).size;

    const inferenceSamples = incidents
      .map((item) => item.raw.inferenceMs || item.raw.inference_ms || item.raw.processingMs || item.raw.processing_ms)
      .filter((value) => typeof value === "number" && Number.isFinite(value));

    const avgInferenceMs =
      inferenceSamples.length > 0
        ? inferenceSamples.reduce((sum, value) => sum + value, 0) / inferenceSamples.length
        : null;

    const recentIncidents = incidents.slice(0, 4);

    return {
      activeFeeds,
      collisions24h,
      avgSeverity,
      avgInferenceMs,
      recentIncidents,
    };
  }, [incidents]);

  return { incidents, loading, error, metrics, deleteIncident, updateIncidentStatus };
}
