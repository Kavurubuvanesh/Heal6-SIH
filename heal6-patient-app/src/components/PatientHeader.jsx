import React from 'react'

export default function PatientHeader({ data }) {
  return (
    <>
      {/* 1. Changed items-start to items-center here to lock them on the same horizontal axis */}
      <header className="px-10 pt-10 pb-6 flex justify-between items-center">

        {/* 2. Removed the -mt-4 negative margin so it doesn't push artificially high */}
        <div className="w-80 sm:w-96 flex items-center -ml-4">
            <img
              src="/logo.jpeg"
              alt="Heal6 - Diabetic Foot Risk Analysis"
              className="w-full h-auto object-contain mix-blend-multiply"
            />
        </div>

        <div className="text-right flex flex-col items-end justify-center">
            <h1 className="text-2xl font-bold text-heal6-dark tracking-tight">Diabetic Foot Risk Analysis</h1>
            <p className="text-sm text-gray-500 mt-1">Automated AI Assessment & Physician Review</p>
            <div className="mt-3 inline-flex items-center gap-2 bg-heal6-light px-3 py-1.5 rounded-md border border-heal6-teal/20">
                <span className="text-sm font-semibold text-heal6-dark">Report Date: <span className="font-normal text-gray-700">{data?.reportDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Report ID: {data?.reportId || data?.id || 'H6-DFU-LIVE'}</p>
        </div>
      </header>

      <div className="px-10 mb-8">
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Patient Name</p>
                <p className="font-bold text-gray-900">{data.name}</p>
            </div>
            <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Patient ID</p>
                <p className="font-medium text-gray-800">{data.id}</p>
            </div>
            <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Age / Gender</p>
                <p className="font-medium text-gray-800">{data.age} Y / {data.gender}</p>
            </div>
            <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Diabetes History</p>
                <p className="font-medium text-gray-800">{data.diabetesType}</p>
            </div>
        </div>
      </div>
    </>
  )
}