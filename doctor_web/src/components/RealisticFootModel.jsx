import React, { useState } from 'react'
import { motion } from 'framer-motion'

export default function RealisticFootModel({ className = '' }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`relative w-full max-w-[500px] aspect-square flex items-center justify-center select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dynamic Ambient Medical Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#0d9488]/20 via-[#0284c7]/15 to-[#f43f5e]/15 rounded-full blur-3xl pointer-events-none" />

      {/* SVG Anatomical Model */}
      <svg
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain filter drop-shadow-[0_20px_45px_rgba(13,148,136,0.22)] relative z-10"
      >
        <defs>
          {/* Natural Volumetric Skin Gradient with Realistic Subsurface Scattering */}
          <radialGradient id="footSkinGrad" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fdf0e6" />
            <stop offset="25%" stopColor="#f7d8c3" />
            <stop offset="60%" stopColor="#e2b294" />
            <stop offset="85%" stopColor="#c58c6a" />
            <stop offset="100%" stopColor="#9e6648" />
          </radialGradient>

          {/* Plantar Sole Shadow & Depth */}
          <linearGradient id="plantarDepthGrad" x1="15%" y1="70%" x2="85%" y2="30%">
            <stop offset="0%" stopColor="#8d5639" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#c08563" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#f7d8c3" stopOpacity="0.1" />
          </linearGradient>

          {/* Toenail Glossy Ceramic Highlights */}
          <linearGradient id="nailGloss" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#fed7aa" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.4" />
          </linearGradient>

          {/* Medical AI Cyan Vascular Glow */}
          <linearGradient id="vascularGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Bone Matrix Glow */}
          <linearGradient id="boneMatrixGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.45" />
          </linearGradient>

          {/* Active Ulcer Erythema Thermal Gradient */}
          <radialGradient id="ulcerThermalGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#f43f5e" stopOpacity="0.75" />
            <stop offset="65%" stopColor="#f59e0b" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>

          {/* Specular Edge Caustic */}
          <linearGradient id="specularEdge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#5eead4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ========================================================= */}
        {/* 1. BACKGROUND ANATOMICAL CAST & MUSCULAR CONTOUR */}
        {/* ========================================================= */}

        {/* Lower Leg Shin / Calf Contour */}
        <path
          d="M 330 30 C 335 90, 345 150, 365 210 C 375 240, 385 260, 395 285 C 380 305, 335 340, 275 365 C 215 390, 160 410, 135 385 C 115 360, 140 300, 175 230 C 210 160, 240 90, 255 30 Z"
          fill="url(#footSkinGrad)"
          opacity="0.35"
        />

        {/* ========================================================= */}
        {/* 2. REALISTIC MAIN FOOT BODY (3/4 ANATOMICAL OBLIQUE PROFILE) */}
        {/* ========================================================= */}
        <g id="mainFootBody">
          {/* Volumetric Anatomical Foot Silhouette with Calcaneus Heel, Medial Arch, Ball of Foot, and Toes */}
          <path
            d="
              M 320 40 
              C 335 110, 355 175, 375 235 
              C 390 270, 420 305, 460 340 
              C 495 370, 530 400, 520 435 
              C 510 470, 455 490, 400 480 
              C 345 470, 290 425, 235 380 
              C 190 345, 145 315, 125 280 
              C 105 245, 110 205, 135 175 
              C 160 145, 205 125, 240 100 
              C 265 80, 285 55, 320 40 Z
            "
            fill="url(#footSkinGrad)"
            stroke="#c58c6a"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Plantar Arch Shading & Muscular Underlay */}
          <path
            d="
              M 150 215
              C 185 190, 240 210, 280 250
              C 320 290, 360 330, 420 375
              C 460 405, 490 425, 475 455
              C 455 480, 390 470, 340 440
              C 285 405, 230 350, 185 300
              C 150 260, 135 235, 150 215 Z
            "
            fill="url(#plantarDepthGrad)"
            opacity="0.8"
          />

          {/* Medial Malleolus (Ankle Bone) Realistic Prominence */}
          <ellipse
            cx="320"
            cy="165"
            rx="24"
            ry="32"
            fill="#fdf0e6"
            opacity="0.6"
            transform="rotate(-15 320 165)"
          />
          <path
            d="M 305 145 C 330 145, 345 165, 340 190"
            stroke="#b47c5a"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />

          {/* Calcaneal Heel Pad Prominence */}
          <ellipse
            cx="155"
            cy="255"
            rx="38"
            ry="46"
            fill="#fdf0e6"
            opacity="0.4"
            transform="rotate(25 155 255)"
          />
        </g>

        {/* ========================================================= */}
        {/* 3. 5 DISTINCT ANATOMICAL TOES (SCULPTED IN PERSPECTIVE) */}
        {/* ========================================================= */}
        <g id="anatomicalToes">
          {/* 1st Toe: Great Toe (Hallux) */}
          <path
            d="
              M 480 395
              C 515 385, 550 405, 555 435
              C 560 465, 530 495, 495 490
              C 465 485, 445 460, 455 430
              C 460 410, 470 400, 480 395 Z
            "
            fill="url(#footSkinGrad)"
            stroke="#b47c5a"
            strokeWidth="2"
          />
          {/* Hallux Toenail with Gloss */}
          <path
            d="M 520 425 C 540 435, 545 455, 530 470 C 515 475, 500 465, 505 445 C 508 432, 514 427, 520 425 Z"
            fill="url(#nailGloss)"
            stroke="#ea580c"
            strokeWidth="1"
            opacity="0.9"
          />
          <path
            d="M 525 430 Q 535 440 528 455"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* 2nd Toe (Longest Toe / Digitus Secundus) */}
          <path
            d="
              M 445 430
              C 470 435, 490 455, 485 480
              C 480 500, 455 510, 435 500
              C 415 490, 415 465, 425 445
              C 430 435, 438 430, 445 430 Z
            "
            fill="url(#footSkinGrad)"
            stroke="#b47c5a"
            strokeWidth="2"
          />
          {/* 2nd Toenail */}
          <ellipse cx="460" cy="480" rx="9" ry="12" fill="url(#nailGloss)" transform="rotate(30 460 480)" />

          {/* 3rd Toe (Digitus Medius) */}
          <path
            d="
              M 410 445
              C 430 455, 445 475, 440 495
              C 435 510, 415 520, 398 510
              C 382 500, 385 478, 395 460
              C 400 450, 405 445, 410 445 Z
            "
            fill="url(#footSkinGrad)"
            stroke="#b47c5a"
            strokeWidth="1.8"
          />
          {/* 3rd Toenail */}
          <ellipse cx="418" cy="492" rx="7" ry="10" fill="url(#nailGloss)" transform="rotate(25 418 492)" />

          {/* 4th Toe */}
          <path
            d="
              M 378 455
              C 395 468, 405 488, 400 505
              C 395 518, 378 525, 365 515
              C 350 505, 355 485, 365 470
              C 370 460, 374 455, 378 455 Z
            "
            fill="url(#footSkinGrad)"
            stroke="#b47c5a"
            strokeWidth="1.8"
          />
          {/* 4th Toenail */}
          <ellipse cx="382" cy="500" rx="6" ry="8" fill="url(#nailGloss)" transform="rotate(20 382 500)" />

          {/* 5th Toe (Little Toe / Pinky) */}
          <path
            d="
              M 345 450
              C 360 462, 368 480, 362 495
              C 356 508, 340 512, 330 502
              C 318 492, 322 475, 330 460
              C 335 452, 340 448, 345 450 Z
            "
            fill="url(#footSkinGrad)"
            stroke="#b47c5a"
            strokeWidth="1.8"
          />
          {/* 5th Toenail */}
          <ellipse cx="346" cy="488" rx="5" ry="6.5" fill="url(#nailGloss)" transform="rotate(15 346 488)" />

          {/* Toe Webbing / Interdigital Creases */}
          <path d="M 458 455 Q 465 470 460 485" stroke="#9e6648" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 425 470 Q 430 485 422 498" stroke="#9e6648" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 392 480 Q 396 495 388 506" stroke="#9e6648" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 358 475 Q 360 488 352 498" stroke="#9e6648" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* ========================================================= */}
        {/* 4. BIOMECHANICAL SKELETAL & VASCULAR TELEMETRY OVERLAYS */}
        {/* ========================================================= */}
        <g id="internalAnatomy" className="transition-opacity duration-300">
          {/* Metatarsal Bone Shafts (Subtle Translucent Glowing Core) */}
          <path d="M 360 280 C 400 320, 440 360, 480 400" stroke="url(#boneMatrixGrad)" strokeWidth="6" strokeLinecap="round" />
          <path d="M 340 290 C 375 330, 410 375, 445 430" stroke="url(#boneMatrixGrad)" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M 320 300 C 350 340, 380 390, 410 445" stroke="url(#boneMatrixGrad)" strokeWidth="5" strokeLinecap="round" />
          <path d="M 300 310 C 325 350, 350 400, 378 455" stroke="url(#boneMatrixGrad)" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 280 320 C 300 355, 320 405, 345 450" stroke="url(#boneMatrixGrad)" strokeWidth="4" strokeLinecap="round" />

          {/* Plantar Arterial & Nerve Tree (Neon Mint/Cyan Glowing Filaments) */}
          <path
            d="M 320 45 Q 340 120 330 180 T 300 270 T 380 360 T 480 410"
            stroke="url(#vascularGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            className="filter drop-shadow-[0_0_8px_#5eead4]"
          />
          <path d="M 300 270 Q 250 310 200 330" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
          <path d="M 380 360 Q 360 410 340 450" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          <path d="M 380 360 Q 420 410 445 440" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        </g>

        {/* ========================================================= */}
        {/* 5. CLINICAL AI DIAGNOSTICS: WOUND CONTOUR & ARUCO VISION */}
        {/* ========================================================= */}
        <g id="clinicalDiagnostics">
          {/* 1st Metatarsal Plantar Ulcer Risk Hotspot (ConvNeXt Erythema Zone) */}
          <circle
            cx="430"
            cy="365"
            r="38"
            fill="url(#ulcerThermalGlow)"
            className="filter drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]"
          />

          {/* Attention U-Net Active Contour Mask (Wound Margins) */}
          <path
            d="
              M 410 345
              C 430 335, 455 340, 460 360
              C 465 380, 445 395, 425 390
              C 405 385, 395 365, 410 345 Z
            "
            fill="#10b981"
            fillOpacity="0.25"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4 2"
          />

          {/* Deep Necrotic Slough Core */}
          <circle
            cx="430"
            cy="365"
            r="12"
            fill="#ef4444"
            fillOpacity="0.85"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="filter drop-shadow-[0_0_10px_#ef4444]"
          />

          {/* Precision Crosshair Telemetry Targeting */}
          <line x1="430" y1="315" x2="430" y2="415" stroke="#0d9488" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.85" />
          <line x1="380" y1="365" x2="480" y2="365" stroke="#0d9488" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.85" />

          {/* ArUco 25mm Calibrated Optical Tag Floating Next to Limb */}
          <g transform="translate(180, 140)">
            <rect
              x="0"
              y="0"
              width="64"
              height="64"
              rx="10"
              fill="#070e14"
              stroke="#0d9488"
              strokeWidth="2"
              className="filter drop-shadow-[0_8px_16px_rgba(13,148,136,0.35)]"
            />
            {/* ArUco Marker #42 Matrix Grid */}
            <rect x="8" y="8" width="48" height="48" fill="#ffffff" rx="4" />
            <rect x="14" y="14" width="12" height="12" fill="#070e14" />
            <rect x="38" y="14" width="12" height="12" fill="#070e14" />
            <rect x="26" y="26" width="12" height="12" fill="#070e14" />
            <rect x="14" y="38" width="12" height="12" fill="#070e14" />
            <rect x="38" y="38" width="12" height="12" fill="#070e14" />

            {/* Tag Telemetry Label */}
            <text x="32" y="78" fill="#0d9488" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              ArUco #42 (25mm)
            </text>
          </g>

          {/* Calibrated Area Readout Badge */}
          <g transform="translate(370, 280)">
            <rect
              x="0"
              y="0"
              width="120"
              height="28"
              rx="14"
              fill="#06181f"
              fillOpacity="0.9"
              stroke="#0d9488"
              strokeWidth="1.5"
              className="filter drop-shadow-[0_4px_12px_rgba(13,148,136,0.3)]"
            />
            <circle cx="14" cy="14" r="4" fill="#ef4444" className="animate-pulse" />
            <text x="26" y="18" fill="#ffffff" fontSize="10.5" fontFamily="sans-serif" fontWeight="bold">
              Area: <tspan fill="#5eead4">2.45 cm²</tspan>
            </text>
          </g>

          {/* Specular Edge Caustic Light Streak */}
          <path
            d="M 320 40 C 335 110, 355 175, 375 235 C 390 270, 420 305, 460 340"
            stroke="url(#specularEdge)"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>
      </svg>
    </div>
  )
}
