import React from 'react'

export default function Heal6Logo({ className = '', size = 'normal' }) {
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Main Logo Mark & Text */}
      <div className="flex items-center gap-0.5 relative">
        {/* "Heal" Text in Primary Teal */}
        <span className="text-[#249583] font-black tracking-tight text-3xl md:text-[34px] drop-shadow-xs">
          Heal
        </span>

        {/* Custom "6" Footprint + Toes + Coral Heart with ECG */}
        <div className="relative inline-flex items-center justify-center ml-0.5">
          {/* 5 Toes above the 6 (forming the footprint arc) */}
          <div className="absolute -top-3 left-[42%] -translate-x-1/2 flex items-end gap-[3px] pointer-events-none z-10">
            {/* Big Toe */}
            <div className="w-2.5 h-3 rounded-full bg-[#249583] shadow-xs transform -rotate-12" />
            {/* Index Toe */}
            <div className="w-2 h-2.5 rounded-full bg-[#249583] shadow-xs transform -rotate-6 translate-y-[1px]" />
            {/* Middle Toe */}
            <div className="w-1.5 h-2 rounded-full bg-[#249583] shadow-xs translate-y-[2px]" />
            {/* Fourth Toe */}
            <div className="w-1.5 h-1.5 rounded-full bg-[#249583] shadow-xs rotate-6 translate-y-[3px]" />
            {/* Pinky Toe */}
            <div className="w-1 h-1.5 rounded-full bg-[#249583] shadow-xs rotate-12 translate-y-[4px]" />
          </div>

          {/* SVG 6 Footprint glyph */}
          <svg
            className="w-9 h-11 md:w-10 md:h-12 overflow-visible"
            viewBox="0 0 54 62"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* The Number 6 Body in Teal #249583 */}
            <path
              d="M 38 6 C 26 6 12 18 10 33 C 12 30 19 28 27 28 C 39 28 47 35 47 46 C 47 55 38 61 27 61 C 13 61 5 49 5 33 C 5 13 21 1 40 1 C 43.5 1 46 1.8 48 2.8 L 43 9.5 C 41.5 8.6 39.8 6 38 6 Z"
              fill="#249583"
            />

            {/* Inner bottom circle cut-out filled with Coral Heart */}
            {/* Coral Heart inside the bottom loop of the 6 */}
            <g transform="translate(16, 35) scale(0.68)">
              {/* Solid Coral #FA7373 Heart */}
              <path
                d="M 16 4.5 C 16 0.5 12 -1 9 -1 C 5 -1 3 2 0 6.5 C -3 2 -5 -1 -9 -1 C -12 -1 -16 0.5 -16 4.5 C -16 11.5 0 21.5 0 22 C 0 21.5 16 11.5 16 4.5 Z"
                fill="#FA7373"
                transform="translate(16, 4)"
              />

              {/* White ECG Pulse Line cutting through the heart */}
              <path
                d="M 2 13 L 9 13 L 12 7 L 15 19 L 18 10 L 21 16 L 24 13 L 30 13"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Subtext: "DIABETIC FOOT RISK ANALYSIS" flanked by two thin coral lines */}
      <div className="w-full flex items-center justify-center gap-1.5 mt-0.5">
        <div className="h-[1.5px] w-4.5 bg-[#FA7373] rounded-full opacity-90" />
        <span className="text-[8.5px] md:text-[9.5px] tracking-[0.22em] font-bold text-[#249583] uppercase whitespace-nowrap">
          Diabetic Foot Risk Analysis
        </span>
        <div className="h-[1.5px] w-4.5 bg-[#FA7373] rounded-full opacity-90" />
      </div>
    </div>
  )
}
