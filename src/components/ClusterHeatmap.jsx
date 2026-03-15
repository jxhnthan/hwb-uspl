import { useMemo } from 'react'

// Map a z-score ∈ [-2,2] to an RGB colour: blue → white → red
function zToColor(z) {
  const t = Math.max(-2.2, Math.min(2.2, z)) / 2.2
  if (t < 0) {
    const f = -t
    return `rgb(${Math.round(255 - f * (255 - 33))},${Math.round(255 - f * (255 - 102))},${Math.round(255 - f * (255 - 172))})`
  }
  return `rgb(255,${Math.round(255 - t * (255 - 75))},${Math.round(255 - t * (255 - 75))})`
}

function zToText(z) {
  return z < -0.5 ? 'white' : z > 0.5 ? 'white' : '#37352f'
}

const SectionCard = ({ children, title, subtitle }) => (
  <div className="relative bg-white rounded-xl border border-[#e8e7e4] p-5 shadow-sm h-full flex flex-col">
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-[#37352f]">{title}</h3>
      {subtitle && <p className="text-xs text-[#787774] mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
)

export default function ClusterHeatmap({ clusterStats, vars, clusterColors, computing }) {
  const hasData = clusterStats.length > 0 && vars.length > 0

  return (
    <SectionCard
      title="Cluster Profiles — Z-Score Heatmap"
      subtitle="Mean standardised score per cluster · red = elevated · blue = suppressed"
    >
      {computing && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-xl z-10 flex items-center justify-center">
          <span className="text-xs text-[#787774] flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-[#d3d1cb] border-t-[#787774] animate-spin" />
            Recomputing…
          </span>
        </div>
      )}
      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[#aba9a2]">No data</div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-[#aba9a2] pb-2 pr-3 w-24">Cluster</th>
                {vars.map(v => (
                  <th key={v.key} className="text-center text-xs font-medium pb-2 px-1" style={{ color: v.color }}>
                    {v.label}
                  </th>
                ))}
                <th className="text-center text-xs font-medium text-[#aba9a2] pb-2 pl-2">n</th>
              </tr>
            </thead>
            <tbody>
              {clusterStats.map((cs, ci) => (
                <tr key={cs.cluster}>
                  {/* Cluster label */}
                  <td className="py-1.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: clusterColors[ci % clusterColors.length] }}
                      />
                      <span className="text-xs font-semibold text-[#37352f]">C{cs.cluster + 1}</span>
                    </div>
                  </td>
                  {/* Z-score cells */}
                  {vars.map(v => {
                    const z = cs.zscores[v.key] ?? 0
                    return (
                      <td key={v.key} className="px-1 py-1.5 text-center">
                        <div
                          className="rounded-md px-2 py-1.5 text-xs font-semibold tabular-nums transition-colors duration-200"
                          style={{ backgroundColor: zToColor(z), color: zToText(z), minWidth: 52 }}
                        >
                          {z >= 0 ? '+' : ''}{z.toFixed(2)}
                        </div>
                      </td>
                    )
                  })}
                  {/* Count */}
                  <td className="pl-2 text-center text-xs text-[#787774] font-mono tabular-nums">
                    {cs.n.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Colour scale legend */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#f1f0ec]">
            <span className="text-[10px] text-[#aba9a2] w-12 text-right">−2</span>
            <div
              className="flex-1 h-2 rounded-full"
              style={{
                background: 'linear-gradient(to right, #2166ac, #f7f6f3, #d6392b)',
              }}
            />
            <span className="text-[10px] text-[#aba9a2] w-12">+2</span>
            <span className="text-[10px] text-[#aba9a2]">z-score</span>
          </div>
        </div>
      )}
    </SectionCard>
  )
}
