// ── Web Worker: all heavy computation runs here, off the main thread ──────────
import { prepareMatrix, mean, computeSilhouette } from '../utils/stats'
import { runKMeans } from '../utils/kmeans'
import { computePCA2D } from '../utils/pca'
import { runPAM } from '../utils/pam'
import { runHierarchical } from '../utils/hierarchical'

const DEMO_FIELDS = ['gender', 'age_group', 'ee_cat']

// ── Per-worker caches (survive across messages) ───────────────────────────────
let prepCache = null   // { fp, matrix, scores, varExplained, pcLoadings }
let elbowCache = null  // { fp, elbowData }

self.onmessage = ({ data: { rawData, algorithm, k, varKeys } }) => {
  if (!rawData?.length || !varKeys?.length) {
    self.postMessage({ labels: [], pcaPoints: [], varExplained: [0, 0],
      clusterStats: [], elbowData: [], pcLoadings: [],
      silhouette: { perCluster: {}, overall: 0 } })
    return
  }

  // 1. Standardise + PCA — skip when only k or algorithm changes
  const prepFp = `${varKeys.join(',')}:${rawData.length}`
  let matrix, scores, varExplained, pcLoadings
  if (prepCache?.fp === prepFp) {
    ;({ matrix, scores, varExplained, pcLoadings } = prepCache)
  } else {
    ;({ matrix } = prepareMatrix(rawData, varKeys))
    ;({ scores, varExplained, pcLoadings } = computePCA2D(matrix))
    prepCache = { fp: prepFp, matrix, scores, varExplained, pcLoadings }
  }

  // 2. Cluster
  let clusterResult
  if (algorithm === 'pam')       clusterResult = runPAM(matrix, k)
  else if (algorithm === 'ward') clusterResult = runHierarchical(matrix, k)
  else                           clusterResult = runKMeans(matrix, k)
  const { labels } = clusterResult

  // 3. Sample PCA points for scatter (max 1400)
  const step = Math.max(1, Math.floor(scores.length / 1400))
  const pcaPoints = scores
    .filter((_, i) => i % step === 0)
    .map((s, si) => ({ x: s[0], y: s[1], cluster: labels[si * step] ?? 0 }))

  // 4. Per-cluster stats (z-scores, raw means, demographic counts)
  const numClusters = Math.max(...labels) + 1
  const clusterStats = Array.from({ length: numClusters }, (_, c) => {
    const idx = labels.reduce((acc, l, i) => { if (l === c) acc.push(i); return acc }, [])
    const zscores = {}, rawMeans = {}, demoCounts = {}

    varKeys.forEach((key, vi) => {
      zscores[key] = mean(idx.map(i => matrix[i][vi]))
      const rawVals = idx.map(i => rawData[i]?.[key]).filter(v => v != null && Number.isFinite(v))
      rawMeans[key] = mean(rawVals)
    })

    DEMO_FIELDS.forEach(field => {
      demoCounts[field] = {}
      idx.forEach(i => {
        const val = rawData[i]?.[field]
        if (val != null) demoCounts[field][val] = (demoCounts[field][val] || 0) + 1
      })
    })

    return { cluster: c, n: idx.length, zscores, rawMeans, demoCounts }
  })

  // 5. Silhouette (sampled — fast)
  const silhouette = computeSilhouette(matrix, labels, 500)
  clusterStats.forEach(cs => { cs.silhouette = silhouette.perCluster[cs.cluster] ?? 0 })

  // 6. Elbow (k-means only) — cached so k changes don't rerun it
  const elbowFp = `${prepFp}:${algorithm}`
  let elbowData = []
  if (algorithm === 'kmeans') {
    if (elbowCache?.fp === elbowFp) {
      elbowData = elbowCache.elbowData
    } else {
      elbowData = Array.from({ length: 6 }, (_, i) => {
        const ki = i + 2
        const { inertia } = runKMeans(matrix, ki, { nInit: 2, seed: 42 })
        return { k: ki, inertia: Math.round(inertia) }
      })
      elbowCache = { fp: elbowFp, elbowData }
    }
  }

  self.postMessage({ labels, pcaPoints, varExplained, clusterStats, elbowData, pcLoadings, silhouette })
}
