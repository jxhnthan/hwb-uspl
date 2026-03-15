import { useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Label,
} from 'recharts'

const SectionCard = ({ children, title, subtitle }) => (
  <div className="relative bg-white rounded-xl border border-[#e8e7e4] p-5 shadow-sm h-full flex flex-col">
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-[#37352f]">{title}</h3>
      {subtitle && <p className="text-xs text-[#787774] mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
)

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-white border border-[#e8e7e4] rounded-lg px-3 py-2 shadow-lg text-xs">
      <div className="font-semibold text-[#37352f] mb-1">Cluster {d.cluster + 1}</div>
      <div className="text-[#787774]">PC1: {d.x?.toFixed(2)}</div>
      <div className="text-[#787774]">PC2: {d.y?.toFixed(2)}</div>
    </div>
  )
}

export default function ScatterPlot({ points, varExplained, clusterColors, clusterCount, computing }) {
  // Group points by cluster
  const grouped = useMemo(() => {
    const groups = {}
    points.forEach(p => {
      if (!groups[p.cluster]) groups[p.cluster] = []
      groups[p.cluster].push(p)
    })
    return groups
  }, [points])

  const clusterIds = Object.keys(grouped).map(Number).sort((a, b) => a - b)

  return (
    <SectionCard
      title="PCA Scatter — Cluster Projection"
      subtitle={`2D projection via principal components · ${points.length.toLocaleString()} points shown`}
    >
      {/* Computing overlay */}
      {computing && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-xl z-10 flex items-center justify-center">
          <span className="text-xs text-[#787774] flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-[#d3d1cb] border-t-[#787774] animate-spin" />
            Recomputing…
          </span>
        </div>
      )}
      <div className="flex-1 min-h-0" style={{ height: 420 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 32, left: 20 }}>
            <CartesianGrid stroke="#f1f0ec" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              tick={{ fontSize: 10, fill: '#aba9a2' }}
              tickLine={false}
              axisLine={{ stroke: '#e8e7e4' }}
            >
              <Label
                value={`PC1 (${varExplained[0]}% var.)`}
                position="bottom"
                offset={16}
                style={{ fontSize: 11, fill: '#787774' }}
              />
            </XAxis>
            <YAxis
              type="number"
              dataKey="y"
              tick={{ fontSize: 10, fill: '#aba9a2' }}
              tickLine={false}
              axisLine={{ stroke: '#e8e7e4' }}
            >
              <Label
                value={`PC2 (${varExplained[1]}% var.)`}
                angle={-90}
                position="insideLeft"
                offset={10}
                style={{ fontSize: 11, fill: '#787774' }}
              />
            </YAxis>
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#e8e7e4' }} />
            {clusterIds.map(c => (
              <Scatter
                key={c}
                name={`Cluster ${c + 1}`}
                data={grouped[c]}
                fill={clusterColors[c % clusterColors.length]}
                opacity={0.65}
                r={3}
              />
            ))}

          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-[#f1f0ec]">
        {clusterIds.map(c => (
          <div key={c} className="flex items-center gap-1.5 text-xs text-[#787774]">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: clusterColors[c % clusterColors.length] }}
            />
            Cluster {c + 1}
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
