import { euclidean } from './stats'

// ─── Seeded PRNG (LCG) ───────────────────────────────────────────────────────
function seededRng(seed) {
  let s = seed >>> 0
  return () => {
    s = Math.imul(1664525, s) + 1013904223
    return (s >>> 0) / 0x100000000
  }
}

// ─── K-Means++ initialisation ────────────────────────────────────────────────
function initKpp(data, k, rng) {
  const n = data.length
  const centroids = [[...data[Math.floor(rng() * n)]]]

  for (let c = 1; c < k; c++) {
    const dists = data.map((p) => {
      let minD = Infinity
      for (const cen of centroids) {
        const d = euclidean(p, cen)
        if (d < minD) minD = d
      }
      return minD * minD
    })

    const total = dists.reduce((s, d) => s + d, 0) || 1
    let rand = rng() * total
    let picked = n - 1
    for (let i = 0; i < n; i++) {
      rand -= dists[i]
      if (rand <= 0) {
        picked = i
        break
      }
    }
    centroids.push([...data[picked]])
  }
  return centroids
}

// ─── Single K-Means run ──────────────────────────────────────────────────────
function runOnce(data, k, rng) {
  const n = data.length
  const d = data[0].length
  let centroids = initKpp(data, k, rng)
  let labels = new Array(n).fill(0)

  for (let iter = 0; iter < 150; iter++) {
    let changed = false

    // Assignment
    for (let i = 0; i < n; i++) {
      let minD = Infinity
      let minC = 0
      for (let c = 0; c < k; c++) {
        const dist = euclidean(data[i], centroids[c])
        if (dist < minD) {
          minD = dist
          minC = c
        }
      }
      if (labels[i] !== minC) {
        labels[i] = minC
        changed = true
      }
    }

    if (!changed) break

    // Update centroids
    const sums = Array.from({ length: k }, () => new Array(d).fill(0))
    const counts = new Array(k).fill(0)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < d; j++) sums[labels[i]][j] += data[i][j]
      counts[labels[i]]++
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centroids[c] = sums[c].map((v) => v / counts[c])
      }
    }
  }

  // Compute inertia
  let inertia = 0
  for (let i = 0; i < n; i++) {
    inertia += euclidean(data[i], centroids[labels[i]]) ** 2
  }

  return { labels, centroids, inertia }
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Run K-Means multiple times and keep the best result (lowest inertia).
 * @param {number[][]} matrix  Standardised n×d data matrix
 * @param {number}     k
 * @param {object}     opts   { seed, nInit }
 * @returns {{ labels: number[], centroids: number[][], inertia: number }}
 */
export function runKMeans(matrix, k, { seed = 42, nInit = 8 } = {}) {
  if (matrix.length === 0 || k < 1) return { labels: [], centroids: [], inertia: 0 }
  const safeK = Math.min(k, matrix.length)

  let best = null
  for (let i = 0; i < nInit; i++) {
    const rng = seededRng(seed + i * 6367)
    const result = runOnce(matrix, safeK, rng)
    if (best === null || result.inertia < best.inertia) best = result
  }
  return best
}
