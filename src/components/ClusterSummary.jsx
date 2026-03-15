export default function ClusterSummary({ clusterStats, vars, clusterColors }) {
  const total = clusterStats.reduce((s, c) => s + c.n, 0)

  return (
    <div className="bg-white rounded-xl border border-[#e8e7e4] p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#37352f]">Cluster Summary</h3>
          <p className="text-xs text-[#787774] mt-0.5">Raw-scale means per cluster</p>
        </div>
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
      </div>

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
    </div>
  )
}
