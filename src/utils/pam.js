import { euclidean } from './stats'

function seededRng(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5
    return (s >>> 0) / 0x100000000
  }
}

function getDist(D, i, j) {
  return i === j ? 0 : i < j ? D[i][j] : D[j][i]
}

function totalCost(D, medoids, n) {
  let cost = 0
  for (let i = 0; i < n; i++) {
    if (medoids.includes(i)) continue
    let minD = Infinity
    for (const m of medoids) {
      const d = getDist(D, i, m)
      if (d < minD) minD = d
    }
    cost += minD
  }
  return cost
}

function pamOnSub(sub, k) {
  const n = sub.length
  const safeK = Math.min(k, n)
  // Build upper-triangle distance matrix
  const D = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i < j ? euclidean(sub[i], sub[j]) : 0))
  )

  // BUILD: first medoid = min sum of distances
  let minSum = Infinity, first = 0
  for (let i = 0; i < n; i++) {
    let s = 0
    for (let j = 0; j < n; j++) s += getDist(D, i, j)
    if (s < minSum) { minSum = s; first = i }
  }

  const medoids = [first]
  while (medoids.length < safeK) {
    let bestGain = -Infinity, bestCand = 0
    for (let cand = 0; cand < n; cand++) {
      if (medoids.includes(cand)) continue
      let gain = 0
      for (let i = 0; i < n; i++) {
        if (medoids.includes(i)) continue
        const oldMin = Math.min(...medoids.map(m => getDist(D, i, m)))
        gain += Math.max(0, oldMin - getDist(D, i, cand))
      }
      if (gain > bestGain) { bestGain = gain; bestCand = cand }
    }
    medoids.push(bestCand)
  }

  // SWAP phase
  let current = [...medoids]
  let bestCost = totalCost(D, current, n)
  for (let iter = 0; iter < 50; iter++) {
    let improved = false
    for (let mi = 0; mi < safeK; mi++) {
      for (let cand = 0; cand < n; cand++) {
        if (current.includes(cand)) continue
        const trial = current.map((v, i) => (i === mi ? cand : v))
        const c = totalCost(D, trial, n)
        if (c < bestCost) { bestCost = c; current = trial; improved = true }
      }
    }
    if (!improved) break
  }
  return current
}

/**
 * CLARA-based PAM: run PAM on multiple random samples, pick best result.
 */
export function runPAM(matrix, k, { seed = 42, nSamples = 5, sampleSize = 180 } = {}) {
  const n = matrix.length
  if (n === 0 || k < 1) return { labels: [], centroids: [], inertia: 0 }
  const safeK = Math.min(k, n)
  const rng = seededRng(seed)

  let bestCost = Infinity
  let bestMedoidPts = null

  for (let s = 0; s < nSamples; s++) {
    const pool = Array.from({ length: n }, (_, i) => i)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const sampleIdx = pool.slice(0, Math.min(sampleSize, n))
    const sub = sampleIdx.map(i => matrix[i])

    const medSubIdx = pamOnSub(sub, safeK)
    const medoidPts = medSubIdx.map(mi => matrix[sampleIdx[mi]])

    // Evaluate on full dataset
    let cost = 0
    for (let i = 0; i < n; i++) {
      let minD = Infinity
      for (const mp of medoidPts) {
        const d = euclidean(matrix[i], mp)
        if (d < minD) minD = d
      }
      cost += minD
    }
    if (cost < bestCost) { bestCost = cost; bestMedoidPts = medoidPts }
  }

  const labels = matrix.map(p => {
    let minD = Infinity, label = 0
    bestMedoidPts.forEach((m, c) => {
      const d = euclidean(p, m)
      if (d < minD) { minD = d; label = c }
    })
    return label
  })

  return { labels, centroids: bestMedoidPts, inertia: bestCost }
}
