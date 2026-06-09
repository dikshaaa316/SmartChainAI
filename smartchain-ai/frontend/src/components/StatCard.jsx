import React from 'react'

// ------------------------------------------------------------------------------
// STATCARD COMPONENT
// ------------------------------------------------------------------------------
// Reusable card component displaying a key system metric.
// Accepts:
// - title: Description of the metric
// - value: Numeric or status value of the metric
// - color: Tailwind class for left-border color styling (e.g. 'border-green-500')
function StatCard({ title, value, color }) {
  return (
    <div className={`bg-gray-800 p-6 rounded-lg border-l-4 ${color || 'border-gray-600'} shadow-md transition-all hover:scale-[1.02]`}>
      {/* Metric Title Label */}
      <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
        {title}
      </h3>
      {/* Metric Numeric/Text Value */}
      <p className="text-white text-3xl font-extrabold mt-2 font-mono">
        {value}
      </p>
    </div>
  )
}

export default StatCard
