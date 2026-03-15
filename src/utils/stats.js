// ─── Basic math helpers ───────────────────────────────────────────────────────

export function mean(arr) {
  const valid = arr.filter((x) => x != null && Number.isFinite(x))
  if (valid.length === 0) return 0
  return valid.reduce((s, v) => s + v, 0) / valid.length
}

export function std(arr) {
  const valid = arr.filter((x) => x != null && Number.isFinite(x))
  if (valid.length < 2) return 1
  const m = mean(valid)
  const variance = valid.reduce((s, v) => s + (v - m) ** 2, 0) / (valid.length - 1)
  return Math.sqrt(variance) || 1
}

export function dot(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

export function euclidean(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2
  return Math.sqrt(s)
}

export function normalize(v) {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
  for (let i = 0; i < v.length; i++) v[i] /= n
}

// ─── Silhouette coefficient (sampled) ────────────────────────────────────────

/**
 * Stratified-sampled silhouette. Higher = better separation; > 0.5 is reasonable.
 * Returns { perCluster: {[clusterId]: number}, overall: number } with scores in [-1, 1].
 */
export function computeSilhouette(matrix, labels, maxSample = 500) {
  const n = matrix.length
  if (n < 2) return { perCluster: {}, overall: 0 }
  const clusterIds = [...new Set(labels)].sort((a, b) => a - b)
  if (clusterIds.length < 2) {
    return { perCluster: Object.fromEntries(clusterIds.map(c => [c, 0])), overall: 0 }
  }

  const groups = {}
  clusterIds.forEach(c => { groups[c] = [] })
  labels.forEach((l, i) => groups[l].push(i))

  // Stratified sample — proportional per cluster
  const sampleIdx = []
  clusterIds.forEach(c => {
    const members = groups[c]
    const target = Math.max(2, Math.min(members.length, Math.round(maxSample * members.length / n)))
    const step = Math.max(1, Math.floor(members.length / target))
    for (let i = 0; i < members.length && sampleIdx.length < maxSample; i += step) {
      sampleIdx.push(members[i])
    }
  })

  const m = sampleIdx.length
  const sampledLabels = sampleIdx.map(i => labels[i])

  const scores = sampleIdx.map((idx, si) => {
    const myC = sampledLabels[si]
    let aSum = 0, aCount = 0
    const bSums = {}, bCounts = {}
    for (let sj = 0; sj < m; sj++) {
      if (si === sj) continue
      const dist = euclidean(matrix[idx], matrix[sampleIdx[sj]])
      const c = sampledLabels[sj]
      if (c === myC) { aSum += dist; aCount++ }
      else { bSums[c] = (bSums[c] || 0) + dist; bCounts[c] = (bCounts[c] || 0) + 1 }
    }
    const a = aCount > 0 ? aSum / aCount : 0
    let b = Infinity
    for (const c of clusterIds) {
      if (c === myC || !bCounts[c]) continue
      const bv = bSums[c] / bCounts[c]
      if (bv < b) b = bv
    }
    if (!Number.isFinite(b)) b = 0
    const denom = Math.max(a, b)
    return denom < 1e-10 ? 0 : (b - a) / denom
  })

  const perCluster = {}
  clusterIds.forEach(c => {
    const cs = scores.filter((_, si) => sampledLabels[si] === c)
    perCluster[c] = cs.length > 0 ? mean(cs) : 0
  })
  return { perCluster, overall: mean(scores) }
}

// ─── Data preparation ─────────────────────────────────────────────────────────

/**
 * Extract selected variables from rawData, impute with column mean,
 * then return standardised matrix + per-column mean/std for back-transformation.
 */
export function prepareMatrix(rawData, varKeys) {
  if (rawData.length === 0 || varKeys.length === 0)
    return { matrix: [], colMeans: [], colStds: [] }

  // Compute per-column mean for imputation
  const colMeans = varKeys.map((key) => mean(rawData.map((r) => r[key])))
  const colStds = varKeys.map((key, j) => {
    const vals = rawData.map((r) =>
      r[key] != null && Number.isFinite(r[key]) ? r[key] : colMeans[j]
    )
    return std(vals)
  })

  const matrix = rawData.map((row) =>
    varKeys.map((key, j) => {
      const v = row[key]
      const val = v != null && Number.isFinite(v) ? v : colMeans[j]
      return (val - colMeans[j]) / (colStds[j] || 1)
    })
  )

  return { matrix, colMeans, colStds }
}
