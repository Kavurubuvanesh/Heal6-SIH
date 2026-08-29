import React, { useState } from 'react';

export default function IntakeScreen({ onSubmit, isAnalyzing }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [clinicalData, setClinicalData] = useState({
    isHindfoot: false,
    hasIschemia: false,
    hasNeuropathy: false,
    isDeep: false
  });

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCheckboxChange = (e) => {
    setClinicalData({ ...clinicalData, [e.target.name]: e.target.checked });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!imageFile) {
      alert("A clinical image capture is required.");
      return;
    }
    // Pass the payload up to the parent router
    onSubmit(imageFile, clinicalData);
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00e5ff] mb-4 shadow-[0_0_15px_#00e5ff]"></div>
        <h2 className="text-xl font-semibold text-white tracking-wide">Processing Telemetry...</h2>
        <p className="text-[#00e5ff] mt-2 opacity-80">Executing UNet++ Inference</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Clinical Intake Portal</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="mx-auto max-h-48 rounded-lg mb-4 shadow-md" />
            ) : (
              <div className="text-slate-500 mb-4 font-medium">Capture wound with ArUco marker</div>
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"/>
          </div>

          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <label className="flex items-center space-x-3 text-slate-700 font-medium cursor-pointer">
              <input type="checkbox" name="isHindfoot" checked={clinicalData.isHindfoot} onChange={handleCheckboxChange} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
              <span>Ulcer is on midfoot or hindfoot</span>
            </label>
            <label className="flex items-center space-x-3 text-slate-700 font-medium cursor-pointer">
              <input type="checkbox" name="hasIschemia" checked={clinicalData.hasIschemia} onChange={handleCheckboxChange} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
              <span>Reduced pedal pulses (Ischemia)</span>
            </label>
            <label className="flex items-center space-x-3 text-slate-700 font-medium cursor-pointer">
              <input type="checkbox" name="hasNeuropathy" checked={clinicalData.hasNeuropathy} onChange={handleCheckboxChange} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
              <span>Loss of protective sensation (Neuropathy)</span>
            </label>
            <label className="flex items-center space-x-3 text-slate-700 font-medium cursor-pointer">
              <input type="checkbox" name="isDeep" checked={clinicalData.isDeep} onChange={handleCheckboxChange} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
              <span>Deep ulcer (probing to bone/tendon)</span>
            </label>
          </div>

          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5">
            Run AI Diagnostic Scan
          </button>
        </form>
      </div>
    </div>
  );
}