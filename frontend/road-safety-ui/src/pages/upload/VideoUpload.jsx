import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileVideo, CheckCircle2, ChevronRight, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function VideoUpload() {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [success, setSuccess] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleFileSelect = (selectedFile) => {
        if (selectedFile.type.includes('video/')) {
            setFile(selectedFile);
            setSuccess(false);
            setProgress(0);
        } else {
            alert("Please upload a valid video file.");
        }
    };

    const { getFreshToken } = useAuth();

    const handleUploadToCloudinaryAndBackend = async () => {
        if (!file) return;
        setUploading(true);
        setProgress(10); // Start progress indicating something is happening

        try {
            const token = await getFreshToken();
            const { uploadVideoToCloudinary } = await import('@/services/cloudinary');
            const { api } = await import('@/api');

            setProgress(40); // Indicates upload in progress
            const cloudinaryUrl = await uploadVideoToCloudinary(file);
            console.log("Uploaded successfully to Cloudinary:", cloudinaryUrl);

            setProgress(70); // Indicates backend processing
            const detectionResponse = await api.detectAccident(cloudinaryUrl, token);
            console.log("Detection response:", detectionResponse);

            setProgress(100);
            setUploading(false);
            setSuccess(true);
        } catch (error) {
            console.error("Pipeline execution failed:", error);
            alert("Error: " + error.message);
            setUploading(false);
            setProgress(0);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <div className="flex flex-col gap-1.5 text-center my-10 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-zinc-800/30 blur-[100px] rounded-full -z-10"></div>
                <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">Video Ingestion Engine</h2>
                <p className="text-zinc-500 font-medium text-lg">Batch process archival dashcam or CCTV footage via the sensory network.</p>
            </div>

            <Card className="glass-card shadow-2xl shadow-black/80 border-white/5 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"></div>
                <CardContent className="p-10 relative z-10">

                    {!file && (
                        <div
                            className={`relative border border-dashed rounded-3xl p-16 flex flex-col items-center justify-center gap-6 transition-all duration-500 bg-white/[0.02] backdrop-blur-md ${dragActive ? 'border-white/40 shadow-inner shadow-white/10 scale-[1.02] bg-white/[0.08]' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.04]'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <div className={`p-6 rounded-full transition-all duration-500 border ${dragActive ? 'bg-white text-zinc-950 scale-110 shadow-[0_0_30px_rgba(255,255,255,0.3)] border-white' : 'bg-black/40 text-zinc-400 border-white/10 shadow-inner group-hover:bg-white/5'}`}>
                                <UploadCloud className="w-10 h-10" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-lg font-bold text-white tracking-tight">Drop high-resolution video</p>
                                <p className="text-sm font-medium text-zinc-500">Supports MP4, AVI, MKV • Limits: 4K @ 60FPS / 5GB</p>
                            </div>
                            <Button onClick={() => document.getElementById('file-upload').click()} className="mt-4 bg-zinc-900/80 text-white border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:bg-white hover:text-zinc-950 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all rounded-full px-8 font-bold">
                                Browse Files
                            </Button>
                            <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept="video/*"
                                onChange={handleChange}
                            />
                        </div>
                    )}

                    {file && !success && (
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>

                            <div className="flex items-start gap-6 mb-8 relative z-10">
                                <div className="p-4 bg-zinc-900 border border-white/10 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                                    <FileVideo className="w-8 h-8 text-white drop-shadow-md" />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                    <p className="text-lg font-bold text-white truncate tracking-tight">{file.name}</p>
                                    <p className="text-sm font-medium text-zinc-500">{(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for tensor clustering</p>
                                </div>
                                {!uploading && (
                                    <button onClick={() => setFile(null)} className="text-sm font-bold text-zinc-500 hover:text-red-400 transition-colors bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 rounded-full px-5 py-2">
                                        Terminate
                                    </button>
                                )}
                            </div>

                            {uploading && (
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-zinc-400 flex items-center gap-2">
                                            <Activity className="w-4 h-4 animate-pulse text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                                            Allocating GPU nodes...
                                        </span>
                                        <span className="text-white drop-shadow-md">{progress}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden shadow-inner border border-white/5 relative">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                            style={{ width: `${progress}%` }}
                                        >
                                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.2)_25%,rgba(0,0,0,0.2)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.2)_75%,rgba(0,0,0,0.2)_100%)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]"></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!uploading && (
                                <Button className="w-full bg-white hover:bg-zinc-200 text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-xl py-6 font-bold text-base transition-all transform hover:scale-[1.01]" onClick={handleUploadToCloudinaryAndBackend}>
                                    Execute Pipeline <ChevronRight className="w-5 h-5 ml-2 opacity-50" />
                                </Button>
                            )}
                        </div>
                    )}

                    {success && (
                        <div className="flex flex-col items-center justify-center p-12 bg-green-500/5 backdrop-blur-md border border-green-500/20 rounded-3xl text-center shadow-[0_0_40px_rgba(34,197,94,0.05)] transform transition-all animate-in zoom-in-95 duration-500">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-green-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                                <CheckCircle2 className="w-16 h-16 text-green-400 relative z-10 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
                            </div>
                            <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Inference Complete</h3>
                            <p className="text-base font-medium text-zinc-400 mb-8 max-w-md">Metadata successfully extracted and integrated into the global spatial matrix.</p>
                            <div className="flex gap-4">
                                <Button variant="outline" className="rounded-full px-8 font-bold border-white/10 bg-black/40 text-white hover:bg-white hover:text-zinc-950 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]" onClick={() => { setFile(null); setSuccess(false); setProgress(0); }}>
                                    New Batch
                                </Button>
                                <Button className="rounded-full px-8 font-bold bg-white hover:bg-zinc-200 text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                    Inspect Output <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes progress {
          0% { background-position: 1rem 0; }
          100% { background-position: 0 0; }
        }
      `}} />
        </div>
    );
}
