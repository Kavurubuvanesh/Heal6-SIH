import React, { useState, useEffect, useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, annotationPlugin)

export default function HealingTracker({ currentArea = 0, healingEstimateText = "3 - 4 Weeks", status = "Pending" }) {
  const [isHealing, setIsHealing] = useState(true)
  const safeArea = Number(currentArea) || 0;

  // 1. FOOLPROOF REGEX TO EXTRACT WEEKS
  // If text is "8 - 12 Weeks", this extracts [8, 12] and selects 12.
  const maxWeeks = useMemo(() => {
    const matches = String(healingEstimateText).match(/\d+/g);
    if (matches && matches.length > 0) {
      return Math.max(...matches.map(Number));
    }
    return 5; // Safe Fallback
  }, [healingEstimateText]);

  // 2. GENERATE PERFECT X-AXIS LABELS (e.g., 0.0 to 12.0)
  const dynamicLabels = useMemo(() => {
    const labels = [];
    const step = maxWeeks > 10 ? 2 : 1;
    for (let i = 0; i <= maxWeeks; i += step) {
      labels.push(i.toFixed(1));
    }
    if (labels[labels.length - 1] !== maxWeeks.toFixed(1)) {
      labels.push(maxWeeks.toFixed(1));
    }
    return labels;
  }, [maxWeeks]);

  // 3. MATHEMATICAL CURVE GENERATION
  const [healingData, setHealingData] = useState([]);
  const [deterioratingData, setDeterioratingData] = useState([]);

  useEffect(() => {
    const goodCurve = [safeArea];
    const badCurve = [safeArea];

    // Calculates decay rate to hit near 0cm2 by the final week
    const decayRate = Math.pow(0.2 / Math.max(safeArea, 0.2), 1 / maxWeeks);
    const growthRate = 1.15; // 15% unchecked weekly growth

    for (let i = 1; i < dynamicLabels.length; i++) {
      const weekNum = parseFloat(dynamicLabels[i]);
      goodCurve.push(parseFloat((safeArea * Math.pow(decayRate, weekNum)).toFixed(1)));
      badCurve.push(parseFloat((safeArea * Math.pow(growthRate, weekNum)).toFixed(1)));
    }

    setHealingData(goodCurve);
    setDeterioratingData(badCurve);
  }, [safeArea, maxWeeks, dynamicLabels]);

  const currentDataset = isHealing ? healingData : deterioratingData;
  const activeColor = isHealing ? '#3b82f6' : '#FA756A';
  const statusText = isHealing ? status : '🚨 Deteriorating';
  const currentAreaText = `${safeArea.toFixed(1)} cm²`;

  // Scale the red line and the Y-Axis logically based on the wound size
  const clinicalConcernLimit = Math.max(5, parseFloat((safeArea * 1.5).toFixed(1)));
  const yAxisMax = Math.max(20, safeArea * 2);

  const data = {
    labels: dynamicLabels,
    datasets: [{
      label: 'Surface Area',
      data: currentDataset.length > 0 ? currentDataset : [0],
      borderColor: activeColor,
      borderWidth: 3,
      backgroundColor: (context) => {
        const chart = context.chart
        const { ctx, chartArea } = chart
        if (!chartArea) return null
        const gradient = ctx.createLinearGradient(0, 0, 0, 300)
        if (isHealing) {
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)')
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)')
        } else {
          gradient.addColorStop(0, 'rgba(250, 117, 106, 0.4)')
          gradient.addColorStop(1, 'rgba(250, 117, 106, 0.0)')
        }
        return gradient
      },
      fill: true,
      tension: 0.25,
      pointBackgroundColor: activeColor,
      pointBorderColor: '#111315',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#161b22',
        titleColor: '#9ca3af',
        bodyColor: '#ffffff',
        bodyFont: { size: 14, family: 'Inter' },
        titleFont: { size: 12, family: 'Inter' },
        padding: 12,
        displayColors: false,
        borderColor: '#2a2d32',
        borderWidth: 1,
        callbacks: {
          title: (items) => `Time (Weeks) ➔ ${items[0].label}`,
          label: (item) => `Surface Area (cm²) ↑ ${item.parsed.y}`
        }
      },
      annotation: {
        annotations: {
          line1: {
            type: 'line',
            yMin: clinicalConcernLimit,
            yMax: clinicalConcernLimit,
            borderColor: '#fca5a5',
            borderWidth: 1.5,
            borderDash: [5, 5],
            label: {
              display: true,
              content: `Clinical Concern (${clinicalConcernLimit} cm²)`,
              position: 'end',
              backgroundColor: 'transparent',
              color: '#fca5a5',
              font: { size: 12, family: 'Inter' },
              yAdjust: -15
            }
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
        title: { display: true, text: 'Time (Weeks) ➔', color: '#64748b', align: 'end', font: { size: 11 } }
      },
      y: {
        min: 0,
        suggestedMax: yAxisMax,
        grid: { display: false, drawBorder: false },
        ticks: { color: '#64748b', stepSize: Math.max(5, Math.floor(safeArea/2)), font: { family: 'Inter', size: 11 } },
        title: { display: true, text: 'Surface Area (cm²) ↑', color: '#64748b', align: 'end', font: { size: 11 } }
      }
    }
  }

  return (
    <div className="bg-[#111315] rounded-2xl p-8 text-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-[#2a2d32]">
      <h2 className="text-[22px] font-normal tracking-wide text-white mb-10">Wound Healing Tracker</h2>

      <div className="relative w-full h-[320px]">
        <Line data={data} options={options} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mt-12 pt-8 border-t border-[#2a2d32] gap-6">
        <div className="flex items-center gap-4">
          <span className="text-[15px] text-gray-300 font-medium tracking-wide">Healing Trajectory</span>
          <button
            onClick={() => setIsHealing(!isHealing)}
            className={`w-12 h-6 rounded-full transition-colors duration-300 flex items-center p-[2px] ${isHealing ? 'bg-white' : 'bg-[#2a2d32] border border-gray-600'}`}
          >
            <div className={`w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${isHealing ? 'bg-black translate-x-6' : 'bg-gray-400 translate-x-0'}`}></div>
          </button>
        </div>

        <div className="flex items-center gap-12">
          <div className="text-center">
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest mb-1.5">Status</p>
            <p className="text-[17px] font-bold text-white transition-colors">{statusText}</p>
          </div>
          <div className="w-px h-10 bg-[#2a2d32]"></div>
          <div className="text-center">
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest mb-1.5">Current Area</p>
            <p className="text-[17px] font-bold text-white transition-all">{currentAreaText}</p>
          </div>
        </div>
      </div>
    </div>
  )
}