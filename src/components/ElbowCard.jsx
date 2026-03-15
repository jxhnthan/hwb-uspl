import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'

function findElbow(data) {
  if (data.length < 3) return data[0]?.k ?? 3
  const diffs = data.map((d, i) => (i === 0 ? 0 : data[i - 1].inertia - d.inertia))
  const diffs2 = diffs.map((d, i) => (i < 2 ? 0 : diffs[i - 1] - d))
  const maxI = diffs2.reduce((best, v, i) => (v > diffs2[best] ? i : best), 2)
  return data[maxI]?.k ?? 3
}

const ElbowTooltip = ({ active, payload, elbowK }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-white border border-[#e8e7e4] rounded-lg px-3 py-2 shadow-lg text-xs">
      <div className="font-semibold text-[#37352f]">k = {d.k}</div>
      <div className="text-[#787774]">Inertia: {d.inertia.toLocaleString()}</div>
      {d.k === elbowK && <div className="text-[#e07b54] mt-1 font-medium">← suggested elbow</div>}
    </div>
  )
}

export default function ElbowCard({ elbowData, algorithm, currentK, onKChange }) {
  const elbowK = elbowData.length ? findElbow(elbowData) : null

  return (
    <div className="bg-white rounded-xl border border-[#e8e7e4] p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[#37352f]">Elbow Method</h3>
        <p className="text-xs text-[#787774] mt-0.5">
          {algorithm === 'kmeans'
            ? `Suggested k = ${elbowK ?? '—'} · click a point to select`
            : 'Switch to k-Means to see elbow'}
        </p>
      </div>

      {algorithm !== 'kmeans' || !elbowData.length ? (
        <div className="flex items-center justify-center text-xs text-[#aba9a2]" style={{ height: 160 }}>
          Only available for k-Means
        </div>
      ) : (
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={elbowData}
              margin={{ top: 8, right: 16, bottom: 24, left: 10 }}
              onClick={e => {
                const k = e?.activePayload?.[0]?.payload?.k
                if (k) onKChange(k)
              }}
              style={{ cursor: 'pointer' }}
            >
              <CartesianGrid stroke="#f1f0ec" strokeDasharray="3 3" />
              <XAxis
                dataKey="k"
                tick={{ fontSize: 10, fill: '#aba9a2' }}
                tickLine={false}
                axisLine={{ stroke: '#e8e7e4' }}
                label={{ value: 'k', position: 'bottom', offset: 12, style: { fontSize: 11, fill: '#787774' } }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#aba9a2' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <Tooltip content={<ElbowTooltip elbowK={elbowK} />} />
              {elbowK && (
                <ReferenceLine x={elbowK} stroke="#e07b54" strokeDasharray="4 3" strokeWidth={1.5} />
              )}
              <Line
                type="monotone"
                dataKey="inertia"
                stroke="#37352f"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, payload } = props
                  const isElbow = payload.k === elbowK
                  const isCurrent = payload.k === currentK
                  if (isElbow) {
                    return <circle key={payload.k} cx={cx} cy={cy} r={6} fill="#e07b54" stroke="#fff" strokeWidth={2} />
                  }
                  return (
                    <circle
                      key={payload.k} cx={cx} cy={cy}
                      r={isCurrent ? 5 : 3.5}
                      fill={isCurrent ? '#37352f' : '#fff'}
                      stroke="#37352f" strokeWidth={1.5}
                    />
                  )
                }}
                activeDot={{ r: 5, fill: '#2383e2' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
