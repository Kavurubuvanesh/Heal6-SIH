import React from 'react'
import {
  Scan,
  ChartDonut,
  Translate,
  HourglassHigh,
  CaretRight,
  BookOpen,
  FilePdf,
  DownloadSimple
} from '@phosphor-icons/react'

export default function DiagnosticVisuals({ data, onOpenToolkit }) {
  // Exact SVG math for the dynamic telemetry gauges
  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  const CircularGauge = ({ value, color, label, subtitle }) => {
    // Defensive check to ensure value is a number and clamp it between 0-100
    const safeValue = Math.min(Math.max(Number(value) || 0, 0), 100);
    const strokeDashoffset = circumference - (safeValue / 100) * circumference;

    return (
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm text-center flex flex-col items-center justify-center hover:shadow-md transition-shadow">
        <div className="relative w-20 h-20 flex items-center justify-center mb-2">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle cx="40" cy="40" r="34" stroke="#f3f4f6" strokeWidth="7" fill="none" />
            <circle
              cx="40" cy="40" r="34"
              stroke={color} strokeWidth="7" fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="text-base font-extrabold text-gray-800 absolute tracking-tight">{safeValue.toFixed(1)}%</span>
        </div>
        <h4 className="text-[11px] font-extrabold text-gray-900 uppercase tracking-wide">{label}</h4>
        {subtitle && (
          <span className="text-[9px] text-gray-400 font-mono mt-0.5">{subtitle}</span>
        )}
      </div>
    );
  };

  // Fallback image in case of a highly unusual render state
  const fallbackImg = "https://placehold.co/400x400/eeeeee/999999?text=Image+Unavailable";

  return (
    <div className="space-y-8">

      {/* 1. DYNAMIC: AI Visual Overlap Analysis */}
      <section>
        <div className="flex items-center border-b-2 border-heal6-light pb-2 mb-4">
          <Scan weight="fill" className="text-heal6-teal text-xl mr-2" />
          <h2 className="text-base font-bold text-heal6-dark">AI Visual Overlap Analysis</h2>
        </div>

        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          <strong>Patient Guidance:</strong> The image on the right shows our AI's infection map overlaid on your original scan. The highlighted areas indicate where the tissue damage and infection are currently spreading. This helps visualize underlying risks that may not be noticeable to the naked eye.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {/* Original Uploaded Image */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-center text-gray-500 uppercase">Original Scan</div>
            <div className="relative w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200 overflow-hidden shadow-inner">
              <img
                src={data.originalImage || fallbackImg}
                className="w-full h-full object-cover"
                alt="Original Patient Foot Scan"
              />
            </div>
          </div>

          {/* TRUE AI Label Overlap (Base64 Render) */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-center text-heal6-coral uppercase">AI Label Overlap</div>
            <div className="relative w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-heal6-coral overflow-hidden shadow-inner">

              {/* 1. The Base Original Image */}
              <img
                src={data.originalImage || fallbackImg}
                className="absolute inset-0 w-full h-full object-cover"
                alt="Scan Base"
              />

              {/* 2. The True PyTorch Base64 Mask Overlay */}
              {data.aiMaskImage && (
                <img
                  src={data.aiMaskImage}
                  className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-90 transition-opacity duration-300"
                  alt="AI Infection Heatmap"
                  onError={(e) => {
                    console.warn("Mask overlay failed to load:", e);
                    e.target.style.display = 'none';
                  }}
                />
              )}

              <div className="absolute inset-0 border-2 border-heal6-coral rounded-lg z-10 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC: AI Diagnostics Telemetry Gauges (4-Column Layout) */}
      <section>
        <div className="flex items-center border-b-2 border-heal6-light pb-2 mb-4">
          <ChartDonut weight="fill" className="text-heal6-teal text-xl mr-2" />
          <h2 className="text-base font-bold text-heal6-dark">AI Diagnostics Telemetry</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-4">
          <CircularGauge value={data.ulcerationRisk} color="#f43f5e" label="Infection Risk" subtitle="ConvNeXt-V2" />
          <CircularGauge value={data.infectionSpread} color="#eab308" label="Slough Tissue" subtitle="UNet++ SOTA" />
          <CircularGauge value={data.tissueDamage} color="#f43f5e" label="Necrotic Tissue" subtitle="UNet++ SOTA" />
          <CircularGauge value={data.granulationTissue} color="#10b981" label="Granulation Tissue" subtitle="Healthy Regrowth" />
        </div>

        {/* Patient Translation Block */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm border-l-4 border-heal6-teal">
          <p className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <Translate weight="fill" className="text-heal6-teal text-lg" /> What does this mean for you?
          </p>
          <p className="text-gray-600 leading-relaxed">
            The AI calculated a <span className="font-semibold text-heal6-coral">{Number(data.ulcerationRisk || 0).toFixed(1)}%</span> probability of active infection. Healthy granulation tissue is currently at <span className="font-semibold text-emerald-600">{Number(data.granulationTissue || 0).toFixed(1)}%</span>, while necrotic tissue is measured at <span className="font-semibold text-heal6-coral">{Number(data.tissueDamage || 0).toFixed(1)}%</span>. This report has been logged into the central hospital registry for immediate physician verification.
          </p>
        </div>
      </section>

      {/* 3. DYNAMIC: Estimated Healing Timeline */}
      <section className="bg-heal6-light rounded-xl p-5 border border-heal6-teal/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-heal6-teal text-white p-2 rounded-lg">
            <HourglassHigh weight="regular" className="text-xl" />
          </div>
          <div>
            <h3 className="font-bold text-heal6-dark text-sm">Estimated Healing Timeline</h3>
            <p className="text-xs text-gray-600">Based on AI area mapping & IWGDF protocols</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-heal6-teal/20 pt-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Current Assessment</p>
            <p className="font-bold text-gray-900 text-sm truncate max-w-[100px]">{data.currentPhase}</p>
          </div>
          <CaretRight weight="bold" className="text-heal6-teal" />
          <div className="text-center">
            <p className="text-xs text-gray-500">Estimated Duration</p>
            <p className="font-bold text-heal6-dark text-base">{data.healingEstimate}</p>
          </div>
          <CaretRight weight="bold" className="text-heal6-teal hidden sm:block" />
          <div className="text-center hidden sm:block">
            <p className="text-xs text-gray-500">Next Review</p>
            <p className="font-bold text-gray-900 text-sm">Bi-Weekly Basis</p>
          </div>
        </div>
      </section>

      {/* 4. DYNAMIC: Guiding Toolkit Section */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between shadow-sm relative overflow-hidden group hover:border-heal6-teal transition-colors gap-4">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-heal6-teal/5 rounded-full transition-transform group-hover:scale-110 pointer-events-none"></div>
        <div className="absolute right-12 top-4 text-heal6-teal/10 rotate-12 pointer-events-none">
          <BookOpen weight="fill" className="text-6xl" />
        </div>

        <div className="relative z-10 flex gap-4 items-center w-full">
          <div className="w-12 h-12 shrink-0 bg-heal6-light rounded-lg flex items-center justify-center text-heal6-teal border border-heal6-teal/20">
            <FilePdf weight="fill" className="text-2xl" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">
              Guiding Toolkit: <span className="text-heal6-teal">{data.currentPhase} Protocol</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-snug">
              Includes specific daily dressing protocols and offloading steps based on your scan.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenToolkit}
          className="relative z-10 w-full sm:w-auto shrink-0 px-5 py-2.5 bg-white border-2 border-heal6-teal text-heal6-teal rounded-lg font-bold shadow-sm hover:bg-heal6-teal hover:text-white transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
        >
          <DownloadSimple weight="bold" className="text-lg" /> Download Guide
        </button>
      </section>

    </div>
  )
}