// ── Web Worker: all heavy computation runs here, off the main thread ──────────
import { prepareMatrix, mean } from '../utils/stats'
import { runKMeans } from '../utils/kmeans'
import { computePCA2D } from '../utils/pca'
import { runPAM } from '../utils/pam'
import { runHierarchical } from '../utils/hierarchical'

self.onmessage = ({ data: { rawData, algorithm, k, varKeys } }) => {
  if (!rawData?.length || !varKeys?.length) {
    self.postMessage({ labels: [], pcaPoints: [], varExplained: [0, 0], clusterStats: [], elbowData: [] })
    return
  }

  // 1. Standardise matrix
  const { matrix, colMeans: _cm, colStds: _cs } = prepareMatrix(rawData, varKeys)

  // 2. PCA
  const { scores, varExplained } = computePCA2D(matrix)

  // 3. Cluster
  let clusterResult
  if (algorithm === 'pam')       clusterResult = runPAM(matrix, k)
  else if (algorithm === 'ward') clusterResult = runHierarchical(matrix, k)
  else                           clusterResult = runKMeans(matrix, k)
  const { labels } = clusterResult

  // 4. Sample PCA points for scatter (max 1400)
  const step = Math.max(1, Math.floor(scores.length / 1400))
  const pcaPoints = scores
    .filter((_, i) => i % step === 0)
    .map((s, si) => ({ x: s[0], y: s[1], cluster: labels[si * step] ?? 0 }))

  // 5. Per-cluster stats
  const numClusters = Math.max(...labels) + 1
  const clusterStats = Array.from({ length: numClusters }, (_, c) => {
    const idx = labels.reduce((acc, l, i) => { if (l === c) acc.push(i); return acc }, [])
    const zscores = {}
    const rawMeans = {}
    varKeys.forEach((key, vi) => {
      zscores[key] = mean(idx.map(i => matrix[i][vi]))
      const rawVals = idx.map(i => rawData[i]?.[key]).filter(v => v != null && Number.isFinite(v))
      rawMeans[key] = mean(rawVals)
    })
    return { cluster: c, n: idx.length, zscores, rawMeans }
  })

  // 6. Elbow (k-means only, low nInit=2 for speed)
  let elbowData = []
  if (algorithm === 'kmeans') {
    elbowData = Array.from({ length: 6 }, (_, i) => {
      const ki = i + 2
      const { inertia } = runKMeans(matrix, ki, { nInit: 2, seed: 42 })
      return { k: ki, inertia: Math.round(inertia) }
    })
  }

  self.postMessage({ labels, pcaPoints, varExplained, clusterStats, elbowData })
}
