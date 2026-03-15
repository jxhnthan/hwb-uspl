import { useMemo } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts'

const OFFSET = 3

function distToColor(d, max) {
  if (max < 0.0001) return '#f1f0ec'
  const t = Math.min(1, d / max)
  const r = Math.round(224 + t * (15 - 224))
  const g = Math.round(123 + t * (155 - 123))
  const b = Math.round(84  + t * (142 - 84))
  return `rgb(${r},${g},${b})`
}

export default function ClusterRadar({ clusterStats, vars, clusterColors }) {
  const radarData = useMemo(() =>
    vars.map(v => {
      const obj = { variable: v.label }
      clusterStats.forEach(cs => {
        obj[`C${cs.cluster + 1}`] = +((cs.zscores[v.key] ?? 0) + OFFSET).toFixed(2)
      })
      return obj
    }),
    [clusterStats, vars]
  )

  const { distances, maxDist, minDist } = useMemo(() => {
    const n = clusterStats.length
    const varKeys = vars.map(v => v.key)
    const mat = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => {
        if (i === j) return 0
        return Math.sqrt(
          varKeys.reduce((s, k) =>
            s + ((clusterStats[i].zscores[k] ?? 0) - (clusterStats[j].zscores[k] ?? 0)) ** 2, 0)
        )
      })
    )
    const offDiag = mat.flat().filter(d => d > 0)
    return {
      distances: mat,
      maxDist: Math.max(...offDiag, 0.0001),
      minDist: Math.min(...offDiag, 0),
    }
  }, [clusterStats, vars])

  // Variable discrimination: range of cluster z-score means per variable
  const discData = useMemo(() =>
    vars.map(v => {
      const vals = clusterStats.map(cs => cs.zscores[v.key] ?? 0)
      const range = Math.max(...vals) - Math.min(...vals)
      return { variable: v.label, range: +range.toFixed(3), color: v.color }
    }).sort((a, b) => b.range - a.range),
    [clusterStats, vars]
  )

  if (!clusterStats.length || !vars.length) return null

  const fillOp = Math.min(0.14, 0.45 / (clusterStats.length || 1))

  return (
    <div className="bg-white rounded-xl border border-[#e8e7e4] shadow-sm"
      style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', gap: 0, alignItems: 'stretch' }}>

      {/* ── Radar ── */}
      <div className="p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-[#37352f]">Cluster Profiles</h3>
        <p className="text-xs text-[#787774] mt-0.5 mb-1">Mean z-score · ring at 0 = population mean</p>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} margin={{ top: 20, right: 44, bottom: 10, left: 44 }}>
              <PolarGrid stroke="#e8e7e4" />
              <PolarAngleAxis dataKey="variable" tick={{ fontSize: 11, fill: '#787774' }} />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 6]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fontSize: 8, fill: '#c7c5bf' }}
                tickFormatter={v =>
                  v > OFFSET ? `+${v - OFFSET}σ` : v < OFFSET ? `${v - OFFSET}σ` : '0'
                }
              />
              {clusterStats.map((cs, ci) => (
                <Radar
                  key={cs.cluster}
                  name={`C${cs.cluster + 1}`}
                  dataKey={`C${cs.cluster + 1}`}
                  stroke={clusterColors[ci % clusterColors.length]}
                  fill={clusterColors[ci % clusterColors.length]}
                  fillOpacity={fillOp}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
              <Tooltip
                formatter={(v, name) => {
                  const z = v - OFFSET
                  return [`${z >= 0 ? '+' : ''}${z.toFixed(2)}σ`, name]
                }}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e8e7e4', boxShadow: '0 4px 12px rgba(0,0,0,.06)' }}
              />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* divider */}
      <div className="bg-[#f1f0ec] self-stretch my-5" />

      {/* ── Variable Discrimination ── */}
      <div className="p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-[#37352f]">Variable Discrimination</h3>
        <p className="text-xs text-[#787774] mt-0.5 mb-4">z-score range across clusters · higher = more separating</p>
        <div className="flex flex-col gap-3">
          {(() => {
            const maxRange = Math.max(...discData.map(d => d.range), 0.001)
            return discData.map(d => (
              <div key={d.variable}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[11px] text-[#787774]">{d.variable}</span>
                  <span className="text-[11px] font-mono font-semibold" style={{ color: d.color }}>{d.range.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-[#f1f0ec] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${(d.range / maxRange) * 100}%`, backgroundColor: d.color, opacity: 0.85 }}
                  />
                </div>
              </div>
            ))
          })()}
        </div>
        <p className="text-[10px] text-[#aba9a2] mt-auto pt-4">Sorted by discriminating power</p>
      </div>

      {/* divider */}
      <div className="bg-[#f1f0ec] self-stretch my-5" />

      {/* ── Centroid Separation ── */}
      <div className="p-5 flex flex-col">
        <h3 className="text-sm font-semibold text-[#37352f]">Centroid Separation</h3>
        <p className="text-xs text-[#787774] mt-0.5 mb-4">Euclidean distance in feature space</p>
        {clusterStats.length >= 2 ? (
          <>
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="w-6" />
                  {clusterStats.map((cs, ci) => (
                    <th key={cs.cluster} className="pb-2 text-center">
                      <span className="text-[11px] font-bold" style={{ color: clusterColors[ci % clusterColors.length] }}>
                        C{cs.cluster + 1}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clusterStats.map((rcs, ri) => (
                  <tr key={rcs.cluster}>
                    <td className="pr-2 pb-1 text-[11px] font-bold text-right" style={{ color: clusterColors[ri % clusterColors.length] }}>
                      C{rcs.cluster + 1}
                    </td>
                    {clusterStats.map((ccs, ci) => {
                      const d = distances[ri]?.[ci] ?? 0
                      const isDiag = ri === ci
                      return (
                        <td key={ccs.cluster} className="p-0.5">
                          <div
                            className="rounded-md text-xs font-mono tabular-nums text-center py-1.5"
                            style={{
                              minWidth: 44,
                              backgroundColor: isDiag ? '#f7f6f3' : distToColor(d, maxDist),
                              color: isDiag ? '#c7c5bf' : '#fff',
                            }}
                            title={isDiag ? '' : `C${rcs.cluster + 1} ↔ C${ccs.cluster + 1}: ${d.toFixed(3)}`}
                          >
                            {isDiag ? '–' : d.toFixed(2)}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-[#aba9a2] mt-3 flex gap-2">
              <span><span style={{ color: '#e07b54' }}>●</span> close</span>
              <span><span style={{ color: '#0f9b8e' }}>●</span> far</span>
              <span className="ml-auto">{minDist.toFixed(2)} – {maxDist.toFixed(2)}</span>
            </p>
          </>
        ) : (
          <div className="text-xs text-[#aba9a2]">Need ≥ 2 clusters</div>
        )}
      </div>
    </div>
  )
}
