import React from "react";

export default function UserUpload() {
  return (
    <section className="max-w-3xl rounded-xl border border-gray-800 bg-black p-6">
      <h2 className="text-xl font-bold text-white">User Upload</h2>
      <p className="text-sm text-gray-400 mt-2">Upload dashcam footage for incident analysis.</p>
      <div className="mt-5 rounded-lg border border-dashed border-gray-700 p-10 text-center text-gray-500">
        Drag and drop video here
      </div>
      <button className="mt-4 px-4 py-2 rounded-md bg-orange-500 text-black font-semibold hover:bg-orange-400">Select File</button>
    </section>
  );
}
