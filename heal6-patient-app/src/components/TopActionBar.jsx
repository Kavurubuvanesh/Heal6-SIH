import React from 'react';
import { Printer, ArrowClockwise, Camera, ShieldCheck, Lightning, CloudCheck, CloudWarning, CloudArrowUp } from '@phosphor-icons/react';

export default function TopActionBar({
  onOpenReverify,
  onNewScan,
  isOfflineEdge,
  pendingSyncCount = 0,
  onSyncNow,
  onExportFhir,
  pdfUrl,
  reportNumber,
  onDownloadPdf
}) {
  const handlePdfClick = () => {
    if (onDownloadPdf) {
      onDownloadPdf();
      return;
    }
    const targetUrl = pdfUrl || (reportNumber ? `http://127.0.0.1:8000/api/v1/reports/${reportNumber}/pdf` : null);
    if (targetUrl) {
      const fullUrl = targetUrl.startsWith('http') ? targetUrl : `http://127.0.0.1:8000${targetUrl}`;
      window.open(fullUrl, '_blank');
    } else {
      window.print();
    }
  };

  return (
    // The "no-print" class ensures this entire bar vanishes when downloading the PDF
    <div className="w-full bg-[#111315] border-b border-[#2a2d32] px-4 md:px-8 py-3.5 flex justify-between items-center no-print sticky top-0 z-50 shadow-md">

      {/* Brand & Sync Telemetry */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onNewScan}
          className="flex items-center gap-2 text-slate-300 hover:text-teal-400 font-bold text-xs md:text-sm tracking-wide transition-colors cursor-pointer group"
          title="Return to Camera Intake"
        >
          <Camera weight="bold" className="text-base group-hover:scale-110 transition-transform" />
          <span>Intake Portal</span>
        </button>

        <span className="text-slate-600">/</span>

        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
          <ShieldCheck weight="fill" className="text-teal-500 text-sm" />
          <span className="hidden sm:inline">IWGDF 2023 Clinical SINBAD Protocol</span>
          <span className="sm:hidden">IWGDF Verified</span>
        </span>

        {/* Dynamic Edge vs Cloud Sync Status Badge */}
        {isOfflineEdge ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1 animate-pulse">
              <Lightning weight="fill" className="text-xs" />
              <span>Edge (Offline)</span>
            </span>
            {pendingSyncCount > 0 && (
              <button
                onClick={onSyncNow}
                className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-teal-400 px-2 py-0.5 rounded border border-teal-500/30 flex items-center gap-1 cursor-pointer transition-all"
                title="Click to sync offline reports to cloud database"
              >
                <CloudArrowUp weight="bold" className="text-xs" />
                <span>Sync {pendingSyncCount}</span>
              </button>
            )}
          </div>
        ) : (
          <span className="hidden lg:flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/40">
            <CloudCheck weight="fill" className="text-xs" />
            <span>Cloud Connected (FastAPI)</span>
          </span>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {onExportFhir && (
          <button
            onClick={onExportFhir}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950/40 hover:bg-teal-900/60 text-teal-300 hover:text-white text-xs font-bold transition-all cursor-pointer border border-teal-700/50"
            title="Download Standards-Compliant HL7 FHIR R4 Bundle"
          >
            <span className="hidden md:inline">HL7 / FHIR R4</span>
            <span className="md:hidden">FHIR</span>
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
          onClick={handlePdfClick}
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