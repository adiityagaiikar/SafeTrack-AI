import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, FileVideo, CheckCircle2, X, AlertCircle, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { uploadVideoToCloudinary } from "@/services/cloudinary";
import { api } from "@/api";
import { queueVideoForSync } from "@/services/offlineSync";
import { useGeolocation } from "@/hooks/useGeolocation";
import EmergencyModal from "@/components/EmergencyModal";
import FirstResponderModal from "@/components/FirstResponderModal";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";

export default function VideoUpload() {
  const { getFreshToken, user } = useAuth();
  const { coordinates, locationError, requestLocation } = useGeolocation();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle, uploading, success, error
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [offlineBanner, setOfflineBanner] = useState("");
  const [locationWarning, setLocationWarning] = useState("");
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosDispatching, setSosDispatching] = useState(false);
  const [lastUploadedVideoUrl, setLastUploadedVideoUrl] = useState("");
  const [handledAnalysisId, setHandledAnalysisId] = useState(null);
  const [firstResponderOpen, setFirstResponderOpen] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    // Basic validation for video files
    if (selectedFile.type.startsWith("video/")) {
      setFile(selectedFile);
      setStatus("idle");
      setUploadProgress(0);
      setAnalysisResult(null);
      setErrorMessage("");
      setOfflineBanner("");
      setLocationWarning("");
    } else {
      setStatus("error");
      setErrorMessage("Invalid file format. Please upload a valid video file.");
    }
  };

  const normalizeAnalysis = (raw) => {
    const detected = Boolean(raw?.accident ?? raw?.accidentDetected ?? raw?.crash_detected ?? false);
    const confidenceRaw = raw?.confidence ?? raw?.yolo_confidence ?? raw?.score ?? null;
    const confidence = typeof confidenceRaw === "number"
      ? (confidenceRaw <= 1 ? confidenceRaw * 100 : confidenceRaw)
      : null;
    const report =
      raw?.report?.summary ||
      raw?.report?.recommendation ||
      raw?.gemini_report ||
      raw?.ai_summary ||
      raw?.summary ||
      raw?.message ||
      "Analysis completed, but no summary text was returned.";

    return {
      raw,
      detected,
      confidence,
      report,
      severity: raw?.severity || "UNKNOWN",
      analysisId: Date.now(),
    };
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;

    setErrorMessage("");
    setAnalysisResult(null);
    setStatus("uploading");
    setIsAnalyzing(true);
    setUploadProgress(0);
    setOfflineBanner("");

    try {
      const token = await getFreshToken();

      if (!navigator.onLine) {
        await queueVideoForSync({
          fileBlob: file,
          fileName: file.name,
          fileType: file.type,
          token,
          userId: user?.uid || null,
        });

        setStatus("success");
        setUploadProgress(100);
        setOfflineBanner("Offline Mode: Footage saved locally. Will auto-sync when connection is restored.");
        return;
      }

      setUploadProgress(15);
      if (!token) {
        throw new Error("Your session expired. Please login again.");
      }

      setUploadProgress(45);
      const cloudinaryUrl = await uploadVideoToCloudinary(file);
      setLastUploadedVideoUrl(cloudinaryUrl);

      setUploadProgress(75);
      const detectionResponse = await api.detectAccident(cloudinaryUrl, token);

      setUploadProgress(100);
      setStatus("success");
      setAnalysisResult(normalizeAnalysis(detectionResponse));
    } catch (error) {
      setStatus("error");
      setUploadProgress(0);
      setErrorMessage(error?.message || "Upload/analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearSelection = () => {
    setFile(null);
    setStatus("idle");
    setUploadProgress(0);
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setErrorMessage("");
    setOfflineBanner("");
    setLocationWarning("");
    setSosModalOpen(false);
    setLastUploadedVideoUrl("");
    setFirstResponderOpen(false);
  };

  const dispatchEmergencySOS = async (cloudinaryVideoUrl = lastUploadedVideoUrl, userCoordinates = coordinates) => {
    if (sosDispatching) return;

    try {
      setSosDispatching(true);
      const token = await getFreshToken();

      const userRef = user?.uid ? doc(db, "users", user.uid) : null;
      let emergencyContacts = [];

      if (userRef) {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          emergencyContacts = userSnap.data()?.emergencyContacts || [];
        }
      }

      if (!emergencyContacts.length) {
        setLocationWarning("No emergency contacts saved. Please add contacts in Settings before dispatching SOS.");
        setSosModalOpen(false);
        return;
      }

      await api.dispatchSOS(
        {
          userId: user?.uid || null,
          coordinates: userCoordinates || null,
          severity: analysisResult?.severity || "UNKNOWN",
          cloudinaryVideoUrl: cloudinaryVideoUrl || null,
          target_phone_numbers: emergencyContacts,
        },
        token
      );

      setSosModalOpen(false);
      setErrorMessage("");
      setOfflineBanner("Emergency SOS has been dispatched successfully.");
    } catch (error) {
      setErrorMessage(error?.message || "Failed to dispatch SOS.");
    } finally {
      setSosDispatching(false);
    }
  };

  useEffect(() => {
    if (!analysisResult) return;
    if (handledAnalysisId === analysisResult.analysisId) return;

    console.log("Backend returned exact severity string:", analysisResult.severity);

    const severityLevel = analysisResult.severity?.toUpperCase() || "";
    if (["CRITICAL", "HIGH", "SEVERE", "SEVERE RISK"].includes(severityLevel)) {
      // Show the First Responder Guide specifically for CRITICAL events
      if (severityLevel === "CRITICAL") {
        setFirstResponderOpen(true);
      }

      const fireEmergency = async () => {
        const locationData = coordinates ? { coordinates } : await requestLocation();

        if (locationData.error) {
          setLocationWarning(locationData.error);
        }

        setHandledAnalysisId(analysisResult.analysisId);
        console.log("Crash detected! Executing SOS sequence...");
        await dispatchEmergencySOS(lastUploadedVideoUrl, locationData.coordinates || coordinates || null);
      };

      fireEmergency();
    }
  }, [analysisResult, handledAnalysisId, requestLocation]);

  useEffect(() => {
    if (locationError) {
      setLocationWarning(locationError);
    }
  }, [locationError]);

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto h-full">
      <FirstResponderModal
        open={firstResponderOpen}
        onDismiss={() => setFirstResponderOpen(false)}
      />
      <EmergencyModal
        open={sosModalOpen}
        onCancel={() => setSosModalOpen(false)}
        onDispatch={() => dispatchEmergencySOS(lastUploadedVideoUrl, coordinates)}
        initialSeconds={10}
      />

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Upload Footage</h2>
        <p className="text-zinc-400 mt-1">Submit recorded dashcam videos for YOLOv8 batch processing and severity analysis.</p>
      </div>

      {offlineBanner && (
        <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          {offlineBanner}
        </div>
      )}

      {locationWarning && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {locationWarning}
        </div>
      )}

      <Card className="glass-card border border-white/10 bg-black/30">
        <CardHeader>
          <CardTitle className="text-white">Video Ingestion</CardTitle>
          <CardDescription className="text-zinc-400">Supported formats: MP4, AVI, MKV. Maximum file size: 500MB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Drag & Drop Zone */}
          {!file && (
            <div
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                isDragging ? "border-white/50 bg-white/10" : "border-white/20 bg-zinc-900/40 hover:bg-zinc-900/60"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload").click()}
            >
              <UploadCloud className={`h-12 w-12 mb-4 ${isDragging ? "text-white" : "text-zinc-400"}`} />
              <p className="text-sm font-medium text-white mb-1">
                Drag and drop your video file here
              </p>
              <p className="text-xs text-zinc-500 mb-4">or click to browse your files</p>
              <Button variant="outline" className="pointer-events-none border-white/20 text-zinc-100">Select File</Button>
              <input 
                id="file-upload" 
                type="file" 
                accept="video/*" 
                className="hidden" 
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              />
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="p-4 rounded-md border border-red-500/30 bg-red-500/10 flex items-center gap-3 text-red-300 text-sm">
              <AlertCircle className="h-5 w-5" />
              <span>{errorMessage || "Upload failed. Please try again."}</span>
            </div>
          )}

          {/* File Selected / Uploading State */}
          {file && status !== "error" && (
            <div className="border border-white/10 rounded-xl p-6 bg-zinc-900/40 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-100">
                    <FileVideo className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white truncate max-w-50 sm:max-w-xs">{file.name}</p>
                    <p className="text-xs text-zinc-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                {status === "idle" && (
                  <Button variant="ghost" size="icon" onClick={clearSelection}>
                    <X className="h-4 w-4 text-zinc-400" />
                  </Button>
                )}
              </div>

              {(status === "uploading" || isAnalyzing) && (
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-xs text-zinc-300 font-medium">
                    <span>{uploadProgress < 60 ? "Uploading to Cloudinary..." : "Analyzing with backend AI..."}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {status === "success" && (
                <div className="p-3 rounded-md bg-green-500/10 flex items-center gap-2 text-green-300 text-sm border border-green-500/30 mt-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Upload complete! Video is now queued for AI processing.</span>
                </div>
              )}

              {status === "idle" && (
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" className="border-white/20 text-zinc-100" onClick={clearSelection}>Cancel</Button>
                  <Button onClick={handleUploadAndAnalyze} className="bg-white text-zinc-950 hover:bg-zinc-200">Begin Upload</Button>
                </div>
              )}

              {status === "success" && (
                <div className="flex justify-end mt-2">
                  <Button variant="outline" className="border-white/20 text-zinc-100" onClick={clearSelection}>Upload Another File</Button>
                </div>
              )}
            </div>
          )}

          {analysisResult && (
            <Card className="border border-white/10 bg-zinc-950/60">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-2 text-zinc-100">
                  <ShieldAlert className="h-5 w-5" />
                  <CardTitle className="text-lg">Analysis Results</CardTitle>
                </div>

                {analysisResult.detected ? (
                  <div className="rounded-md border border-red-500/40 bg-linear-to-r from-red-600/25 to-orange-500/15 px-4 py-3 text-red-200 font-semibold">
                    ⚠️ CRITICAL: Accident Detected
                  </div>
                ) : (
                  <div className="rounded-md border border-green-500/40 bg-green-600/15 px-4 py-3 text-green-200 font-semibold">
                    ✅ STATUS: Safe / No Collision
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-zinc-400">YOLOv8 Confidence:</span>
                  <span className="rounded-full border border-white/20 bg-zinc-900 px-3 py-1 font-semibold text-zinc-100">
                    {typeof analysisResult.confidence === "number"
                      ? `${analysisResult.confidence.toFixed(1)}%`
                      : "N/A"}
                  </span>
                  <span className="rounded-full border border-white/20 bg-zinc-900 px-3 py-1 font-semibold text-zinc-100">
                    Severity: {analysisResult.severity}
                  </span>
                </div>

                <div className="rounded-md border border-zinc-700 bg-zinc-800/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-400 mb-2">AI Summary / Report</p>
                  <p className="text-sm leading-6 text-zinc-200 whitespace-pre-wrap">{analysisResult.report}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}