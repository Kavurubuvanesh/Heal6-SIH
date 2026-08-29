import React from 'react';
import { Printer, ArrowClockwise, Camera, ShieldCheck } from '@phosphor-icons/react';

export default function TopActionBar({ onOpenReverify, onNewScan }) {
  return (
    // The "no-print" class ensures this entire bar vanishes when downloading the PDF
    <div className="w-full bg-[#111315] border-b border-[#2a2d32] px-4 md:px-8 py-3.5 flex justify-between items-center no-print sticky top-0 z-50 shadow-md">

      <div className="flex items-center gap-2.5 text-teal-400 font-extrabold tracking-widest text-xs md:text-sm">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
        </span>
        <span className="hidden sm:inline">HEAL6 SECURE PATIENT PORTAL</span>
        <span className="sm:hidden">HEAL6 PORTAL</span>
      </div>

      <div className="flex items-center gap-2.5 md:gap-4">
        {onNewScan && (
          <button
            onClick={onNewScan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-700"
          >
            <Camera weight="bold" className="text-sm text-teal-400" />
            <span className="hidden sm:inline">Scan Another Ulcer</span>
            <span className="sm:hidden">New Scan</span>
          </button>
        )}

        <button
          onClick={onOpenReverify}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer border border-slate-700"
        >
          <ArrowClockwise weight="bold" className="text-sm text-amber-400" />
          <span className="hidden md:inline">Request Re-Verification</span>
          <span className="md:hidden">Update</span>
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-3.5 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold shadow-[0_0_15px_rgba(13,148,136,0.3)] transition-all active:scale-95 cursor-pointer"
        >
          <Printer weight="bold" className="text-base"/>
          <span className="hidden sm:inline">Download Official PDF</span>
          <span className="sm:hidden">PDF</span>
        </button>
      </div>

    </div>
  )
}