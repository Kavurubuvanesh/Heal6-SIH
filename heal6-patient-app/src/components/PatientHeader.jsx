import React from 'react'

export default function PatientHeader({ data }) {
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <header className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-5 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl font-bold text-heal6-dark tracking-tight">DFU Analysis</h1>
          <p className="text-xs text-gray-500 mt-0.5">Automated AI Assessment</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 bg-heal6-light px-2 py-1 rounded text-[10px] font-bold text-heal6-dark">
            {today}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Patient</p>
          <p className="font-bold text-gray-900 text-sm">{data.name}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">ID</p>
          <p className="font-medium text-gray-800 text-sm">{data.id}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Demographics</p>
          <p className="font-medium text-gray-800 text-sm">{data.age} Y / {data.gender}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">History</p>
          <p className="font-medium text-gray-800 text-sm">{data.diabetesType}</p>
        </div>
      </div>
    </header>
  )
}