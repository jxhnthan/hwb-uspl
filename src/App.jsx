import { useState, useEffect } from 'react'
import CommandBar from './components/CommandBar'
import ScatterPlot from './components/ScatterPlot'
import ClusterHeatmap from './components/ClusterHeatmap'
import ClusterSummary from './components/ClusterSummary'
import ElbowCard from './components/ElbowCard'
import { useCluster } from './hooks/useCluster'

// ── Data / meta constants ─────────────────────────────────────────────────────
export const ALL_VARS = [
  { key: 'anxiety',     label: 'Anxiety',       color: '#c0533a', bg: '#fff0eb' },
  { key: 'depression',  label: 'Depression',    color: '#7c52c8', bg: '#f3effe' },
  { key: 'incivility',  label: 'Incivility',    color: '#b83535', bg: '#fef0f0' },
  { key: 'stress_home', label: 'Stress (Home)', color: '#1d6db5', bg: '#eef5ff' },
  { key: 'stress_work', label: 'Stress (Work)', color: '#0a7a6a', bg: '#edfaf5' },
]

export const ALGORITHMS = [
  {
    value: 'kmeans',
    label: 'k-Means',
    description: 'Minimises within-cluster variance via Euclidean centroids',
    color: '#2383e2',
  },
  {
    value: 'pam',
    label: 'PAM',
    description: 'Partitioning Around Medoids — robust to outliers (CLARA)',
    color: '#e07b54',
  },
  {
    value: 'ward',
    label: "Ward's",
    description: 'Agglomerative hierarchical clustering with Ward linkage',
    color: '#0f9b8e',
  },
]

export const CLUSTER_COLORS = ['#2383e2', '#e07b54', '#0f9b8e', '#d4a847', '#9b69c9', '#e74c3c', '#27ae60']

// ── Loader ────────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="min-h-screen bg-[#f7f6f3] flex flex-col items-center justify-center gap-3">
      <div
        className="w-7 h-7 rounded-full border-[3px] border-[#e8e7e4] border-t-[#37352f] animate-spin"
      />
      <p className="text-sm text-[#787774]">Loading survey data…</p>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [rawData, setRawData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [algorithm, setAlgorithm] = useState('kmeans')
  const [k, setK] = useState(3)
  const [activeVarKeys, setActiveVarKeys] = useState([
    'anxiety', 'depression', 'incivility', 'stress_home', 'stress_work',
  ])

  useEffect(() => {
    fetch('/data/hwb_data.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => { setRawData(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const toggleVar = (key) =>
    setActiveVarKeys(prev =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter(k => k !== key) : prev
        : [...prev, key]
    )

  const { clusterStats, pcaPoints, varExplained, elbowData, pcLoadings, silhouette, computing } = useCluster(
    rawData, algorithm, k, activeVarKeys
  )

  const activeVars = ALL_VARS.filter(v => activeVarKeys.includes(v.key))

  if (loading) return <Spinner />
  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-red-500 text-sm">
      Failed to load data: {error}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f7f6f3]">

      {/* ── Thin computing bar ── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-[2px] transition-opacity duration-300"
        style={{ opacity: computing ? 1 : 0 }}
      >
        <div
          className="h-full bg-[#2383e2]"
          style={{
            width: computing ? '75%' : '100%',
            transition: computing ? 'width 1.6s ease-out' : 'width 0.2s ease-in',
          }}
        />
      </div>

      {/* ── Header ── */}
      <header className="px-8 pt-8 pb-0 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#37352f]">
            HWB Clustering Explorer
          </h1>
          <p className="text-sm text-[#787774] mt-1">
            NUS Health &amp; Wellbeing Survey 2024 · Unsupervised Learning analysis
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {computing && (
            <span className="flex items-center gap-1.5 text-xs text-[#787774]">
              <span className="w-3 h-3 rounded-full border-2 border-[#d3d1cb] border-t-[#787774] animate-spin" />
              computing…
            </span>
          )}
          <span className="text-xs font-mono bg-[#f1f0ec] text-[#787774] px-2 py-1 rounded">
            n = {rawData.length.toLocaleString()}
          </span>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="px-8 pt-5 pb-10 space-y-5" style={{ maxWidth: 1440 }}>

        {/* Mad-libs command bar */}
        <CommandBar
          algorithm={algorithm}
          setAlgorithm={setAlgorithm}
          algorithms={ALGORITHMS}
          k={k}
          setK={setK}
          allVars={ALL_VARS}
          activeVarKeys={activeVarKeys}
          toggleVar={toggleVar}
          dataCount={rawData.length}
        />

        {/* Scatter (left tall) | Heatmap + Elbow (right stacked) */}
        <div className="grid gap-5" style={{ gridTemplateColumns: '55fr 45fr' }}>

          {/* Left: scatter fills all available height */}
          <div className="flex flex-col">
            <ScatterPlot
              points={pcaPoints}
              varExplained={varExplained}
              clusterColors={CLUSTER_COLORS}
              clusterCount={k}
              pcLoadings={pcLoadings}
              activeVars={activeVars}
              computing={computing}
            />
          </div>

          {/* Right: heatmap on top, elbow below */}
          <div className="flex flex-col gap-5">
            <ClusterHeatmap
              clusterStats={clusterStats}
              vars={activeVars}
              clusterColors={CLUSTER_COLORS}
              computing={computing}
            />
            <ElbowCard
              elbowData={elbowData}
              algorithm={algorithm}
              currentK={k}
              onKChange={setK}
            />
          </div>
        </div>

        {/* Full-width summary table */}
        <ClusterSummary
          clusterStats={clusterStats}
          vars={activeVars}
          clusterColors={CLUSTER_COLORS}
          silhouette={silhouette}
        />

      </main>
    </div>
  )
}
