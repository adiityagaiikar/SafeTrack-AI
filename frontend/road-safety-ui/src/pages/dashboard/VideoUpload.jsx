import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, FileVideo, CheckCircle2, X, AlertCircle } from "lucide-react";

export default function VideoUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle, uploading, success, error

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
    } else {
      setStatus("error");
    }
  };

  const simulateUpload = () => {
    if (!file) return;
    setStatus("uploading");
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus("success");
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const clearSelection = () => {
    setFile(null);
    setStatus("idle");
    setUploadProgress(0);
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto h-full">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Upload Footage</h2>
        <p className="text-slate-500 mt-1">Submit recorded dashcam videos for YOLOv8 batch processing and severity analysis.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Video Ingestion</CardTitle>
          <CardDescription>Supported formats: MP4, AVI, MKV. Maximum file size: 500MB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Drag & Drop Zone */}
          {!file && (
            <div
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload").click()}
            >
              <UploadCloud className={`h-12 w-12 mb-4 ${isDragging ? "text-indigo-500" : "text-slate-400"}`} />
              <p className="text-sm font-medium text-slate-900 mb-1">
                Drag and drop your video file here
              </p>
              <p className="text-xs text-slate-500 mb-4">or click to browse your files</p>
              <Button variant="outline" className="pointer-events-none">Select File</Button>
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
            <div className="p-4 rounded-md border border-red-200 bg-red-50 flex items-center gap-3 text-red-700 text-sm">
              <AlertCircle className="h-5 w-5" />
              <span>Invalid file format. Please upload a valid video file.</span>
            </div>
          )}

          {/* File Selected / Uploading State */}
          {file && status !== "error" && (
            <div className="border rounded-xl p-6 bg-white shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <FileVideo className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                {status === "idle" && (
                  <Button variant="ghost" size="icon" onClick={clearSelection}>
                    <X className="h-4 w-4 text-slate-500" />
                  </Button>
                )}
              </div>

              {status === "uploading" && (
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Uploading to FastAPI Backend...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {status === "success" && (
                <div className="p-3 rounded-md bg-green-50 flex items-center gap-2 text-green-700 text-sm border border-green-200 mt-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Upload complete! Video is now queued for AI processing.</span>
                </div>
              )}

              {status === "idle" && (
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" onClick={clearSelection}>Cancel</Button>
                  <Button onClick={simulateUpload} className="bg-indigo-600 hover:bg-indigo-700">Begin Upload</Button>
                </div>
              )}

              {status === "success" && (
                <div className="flex justify-end mt-2">
                  <Button variant="outline" onClick={clearSelection}>Upload Another File</Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}