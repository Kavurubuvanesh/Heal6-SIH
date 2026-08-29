import React from 'react'

export default function ReportFooter({ data }) {
  // Use today's dynamic date for the signature line
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="px-10 pb-10 mt-10 border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-end gap-6 no-print-break">

      {/* Dynamic Model Architecture Details */}
      <div className="w-full md:w-1/2">
        <h3 className="font-extrabold text-gray-900 text-lg">Heal6 Unified Risk Index Engine</h3>
        <p className="text-xs text-gray-500 mt-1">Ensemble Deep Learning Diagnostic Model (SOTA UNet++ & ConvNeXt)</p>
        <p className="text-[10px] text-gray-400 mt-4 leading-relaxed pr-4 border-l-2 border-teal-500 pl-3">
          <strong>Medical Disclaimer:</strong> This Diabetic Foot Risk Analysis report utilizes the Heal6 Edge AI framework to estimate
          probabilities of ulceration, ischemia, and infection spread based on the IWGDF SINBAD classification system. While reviewed by a physician,
          the AI estimations (including sub-tissue mapping and healing timelines) are based on visual data and statistical modeling.
          If you experience sudden severe pain, fever, or notice red streaks spreading from the wound, seek emergency medical care immediately.
        </p>
      </div>

      {/* Dynamic Doctor Signature Block */}
      <div className="w-full md:w-1/3 text-right">
        <div className="inline-block border-b-2 border-gray-300 pb-2 mb-2 min-w-[200px]">
          <span className="font-signature text-3xl text-gray-800 opacity-80">Dr. S. Sharma</span>
        </div>
        <p className="font-bold text-gray-900 text-sm">Dr. S. Sharma, MD, Podiatry</p>
        <p className="text-xs text-gray-500">Reviewing Physician • {today}</p>
      </div>

    </div>
  )
}