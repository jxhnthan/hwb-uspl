// ── Demographic breakdown helper ──────────────────────────────────────────────
const EE_COLORS = { Admin: '#2383e2', Exec: '#e07b54', Research: '#0f9b8e', Faculty: '#d4a847', Other: '#9b69c9' }
const GEN_COLORS  = { F: '#d4286a', M: '#1a6fbf' }
const AGE_COLORS  = {
  'Under 25':    '#f59e0b',
  '25 to 34':    '#10b981',
  '35 to 44':    '#2383e2',
  '45 to 54':    '#9b69c9',
  '55 to 64':    '#e07b54',
  '65 and above':'#e74c3c',
}

function getColor(field, val, idx) {
  if (field === 'ee_cat')    return EE_COLORS[val]  ?? '#c7c5bf'
  if (field === 'gender')    return GEN_COLORS[val] ?? '#c7c5bf'
  if (field === 'age_group') return AGE_COLORS[val] ?? '#c7c5bf'
  const palette = ['#6c8ebf', '#d4a847', '#82b366', '#e07b9e', '#9b69c9', '#e07b54']
  return palette[idx % palette.length]
}

function DemoBreakdown({ clusterStats, clusterColors }) {
  const fields = [
    { key: 'ee_cat',    label: 'Employee Category' },
    { key: 'gender',    label: 'Gender' },
    { key: 'age_group', label: 'Age Group' },
  ]

  return (
    <div className="mt-5 pt-4 border-t border-[#f1f0ec]">
      <div className="text-xs font-medium text-[#c7c5bf] uppercase tracking-widest mb-3">Composition</div>
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
        {fields.map(({ key, label }) => {
          const allVals = [...new Set(clusterStats.flatMap(cs => Object.keys(cs.demoCounts?.[key] ?? {})))]
          if (!allVals.length) return null
          return (
            <div key={key} className="flex-1 min-w-0">
              <div className="text-[10px] text-[#aba9a2] uppercase tracking-wider mb-2">{label}</div>
              <div className="flex flex-col gap-1.5">
                {clusterStats.map((cs, ci) => {
                  const counts = cs.demoCounts?.[key] ?? {}
                  const total = Object.values(counts).reduce((s, v) => s + v, 0)
                  return (
                    <div key={cs.cluster} className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: clusterColors[ci % clusterColors.length] }}
                      />
                      <div className="flex h-3 rounded-full overflow-hidden flex-1" style={{ minWidth: 80 }}>
                        {allVals.map((val, vi) => {
                          const pct = total > 0 ? (counts[val] ?? 0) / total * 100 : 0
                          if (pct < 0.5) return null
                          return (
                            <div
                              key={val}
                              title={`${val}: ${pct.toFixed(1)}%`}
                              style={{ width: `${pct}%`, backgroundColor: getColor(key, val, vi) }}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                {allVals.map((val, vi) => (
                  <span key={val} className="flex items-center gap-1 text-[10px] text-[#787774]">
                    <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: getColor(key, val, vi) }} />
                    {val}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ClusterSummary({ clusterStats, vars, clusterColors, silhouette }) {
  const total = clusterStats.reduce((s, c) => s + c.n, 0)

  return (
    <div className="bg-white rounded-xl border border-[#e8e7e4] p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#37352f]">Cluster Summary</h3>
          <p className="text-xs text-[#787774] mt-0.5">Raw-scale means per cluster</p>
        </div>
        <div className="flex items-start gap-3 mt-0.5">
          {/* Overall silhouette badge */}
          {silhouette?.overall != null && clusterStats.length > 0 && (
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] text-[#aba9a2] uppercase tracking-wider">Silhouette</span>
              <span
                className="font-mono text-sm font-semibold tabular-nums px-2 py-0.5 rounded"
                style={{
                  color: silhouette.overall > 0.4 ? '#166534' : silhouette.overall > 0.2 ? '#92400e' : '#7f1d1d',
                  backgroundColor: silhouette.overall > 0.4 ? '#dcfce7' : silhouette.overall > 0.2 ? '#fef3c7' : '#fee2e2',
                }}
                title="Overall mean silhouette score — higher means clusters are well-separated"
              >
                {silhouette.overall.toFixed(3)}
              </span>
            </div>
          )}
        {/* Proportion bar */}
        {clusterStats.length > 0 && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] text-[#aba9a2] uppercase tracking-wider">Composition</span>
            <div className="flex h-3 rounded-full overflow-hidden" style={{ width: 200 }}>
              {clusterStats.map((cs, ci) => (
                <div
                  key={cs.cluster}
                  title={`Cluster ${cs.cluster + 1}: ${total > 0 ? ((cs.n / total) * 100).toFixed(1) : 0}%`}
                  style={{
                    width: `${total > 0 ? (cs.n / total) * 100 : 0}%`,
                    backgroundColor: clusterColors[ci % clusterColors.length],
                    transition: 'width 0.35s ease',
                  }}
                />
              ))}
            </div>
            <div className="flex gap-3">
              {clusterStats.map((cs, ci) => (
                <span key={cs.cluster} className="flex items-center gap-1 text-[10px] text-[#787774]">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: clusterColors[ci % clusterColors.length] }}
                  />
                  C{cs.cluster + 1} {total > 0 ? ((cs.n / total) * 100).toFixed(1) : 0}%
                </span>
              ))}
            </div>
          </div>
        )}
        </div>{/* end flex gap-3 */}
      </div>{/* end justify-between */}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f1f0ec]">
              <th className="text-left text-xs font-medium text-[#aba9a2] pb-2 pr-4">Cluster</th>
              <th className="text-right text-xs font-medium text-[#aba9a2] pb-2 px-3">n</th>
              <th className="text-right text-xs font-medium text-[#aba9a2] pb-2 px-3">Share</th>
              {vars.map(v => (
                <th key={v.key} className="text-right text-xs font-medium pb-2 px-3" style={{ color: v.color }}>
                  {v.label}
                </th>
              ))}
              {/* Mini-bar column header */}
              <th className="pb-2 px-3 text-right text-[10px] font-medium text-[#aba9a2]">relative size</th>
            </tr>
          </thead>
          <tbody>
            {clusterStats.map((cs, ci) => (
              <tr key={cs.cluster} className="border-b border-[#f7f6f3] hover:bg-[#f7f6f3] transition-colors group">
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: clusterColors[ci % clusterColors.length] }}
                    />
                    <span className="font-semibold text-[#37352f]">Cluster {cs.cluster + 1}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-xs text-[#37352f]">
                  {cs.n.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-xs text-[#787774]">
                  {total > 0 ? ((cs.n / total) * 100).toFixed(1) : '—'}%
                </td>
                {vars.map(v => (
                  <td key={v.key} className="py-2.5 px-3 text-right font-mono text-xs text-[#37352f]">
                    {cs.rawMeans[v.key] != null ? cs.rawMeans[v.key].toFixed(2) : '—'}
                  </td>
                ))}
                {/* Inline bar */}
                <td className="py-2.5 pl-4 pr-2" style={{ width: 160, minWidth: 120 }}>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-2 bg-[#f1f0ec] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-350"
                        style={{
                          width: `${total > 0 ? (cs.n / total) * 100 : 0}%`,
                          backgroundColor: clusterColors[ci % clusterColors.length],
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Demographic composition breakdown */}
      {clusterStats.length > 0 && clusterStats[0].demoCounts && (
        <DemoBreakdown clusterStats={clusterStats} clusterColors={clusterColors} />
      )}
    </div>
  )
}
