import { euclidean } from './stats'

function seededRng(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5
    return (s >>> 0) / 0x100000000
  }
}

/**
 * Agglomerative hierarchical clustering with Ward's linkage.
 * Capped at maxPoints — remaining points are assigned to nearest centroid.
 */
export function runHierarchical(matrix, k, { seed = 42, maxPoints = 450 } = {}) {
  const n = matrix.length
  if (n === 0 || k < 1) return { labels: [], centroids: [], inertia: 0 }
  const safeK = Math.min(k, n)
  const rng = seededRng(seed)

  // Sample if needed
  let sub, sampleIdx
  if (n > maxPoints) {
    sampleIdx = Array.from({ length: n }, (_, i) => i)
    for (let i = sampleIdx.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [sampleIdx[i], sampleIdx[j]] = [sampleIdx[j], sampleIdx[i]]
    }
    sampleIdx = sampleIdx.slice(0, maxPoints)
    sub = sampleIdx.map(i => matrix[i])
  } else {
    sub = matrix
    sampleIdx = null
  }

  const m = sub.length
  const d = sub[0].length

  // Ward's: D[i][j] = 0.5 * ||ci - cj||^2 * (ni*nj)/(ni+nj)
  // Since we start with singletons (ni=nj=1): D[i][j] = 0.5 * ||xi-xj||^2
  const D = Array.from({ length: m }, (_, i) =>
    Array.from({ length: m }, (_, j) => {
      if (i >= j) return 0
      const e = euclidean(sub[i], sub[j])
      return 0.5 * e * e
    })
  )

  const sizes = new Array(m).fill(1)
  const centroids = sub.map(v => [...v])
  const clusterOf = Array.from({ length: m }, (_, i) => i)
  const active = new Set(clusterOf)

  const getDW = (i, j) => (i < j ? D[i][j] : D[j][i])

  while (active.size > safeK) {
    const arr = [...active]
    let minD = Infinity, ai = -1, aj = -1
    for (let a = 0; a < arr.length; a++) {
      for (let b = a + 1; b < arr.length; b++) {
        const d = getDW(arr[a], arr[b])
        if (d < minD) { minD = d; ai = arr[a]; aj = arr[b] }
      }
    }
    if (ai === -1) break

    const ni = sizes[ai], nj = sizes[aj], nij = ni + nj

    // Update centroid of ai
    for (let dim = 0; dim < d; dim++) {
      centroids[ai][dim] = (centroids[ai][dim] * ni + centroids[aj][dim] * nj) / nij
    }
    sizes[ai] = nij

    // Lance-Williams update for Ward's
    arr.forEach(k2 => {
      if (k2 === ai || k2 === aj) return
      const nk = sizes[k2]
      const dik = getDW(ai, k2)
      const djk = getDW(aj, k2)
      const dij = getDW(ai, aj)
      const newD = ((ni + nk) * dik + (nj + nk) * djk - nk * dij) / (ni + nj + nk)
      if (ai < k2) D[ai][k2] = newD; else D[k2][ai] = newD
    })

    // Merge: relabel all aj → ai
    active.delete(aj)
    for (let p = 0; p < m; p++) {
      if (clusterOf[p] === aj) clusterOf[p] = ai
    }
  }

  // Remap cluster IDs 0..k-1
  const ids = [...new Set(clusterOf)].sort((a, b) => a - b)
  const idMap = {}
  ids.forEach((id, i) => { idMap[id] = i })
  const subLabels = clusterOf.map(c => idMap[c])
  const finalCentroids = ids.map(id => centroids[id])

  if (!sampleIdx) {
    let inertia = 0
    sub.forEach((p, i) => { inertia += euclidean(p, finalCentroids[subLabels[i]]) ** 2 })
    return { labels: subLabels, centroids: finalCentroids, inertia }
  }

  // Assign all n points to nearest centroid
  const labels = new Array(n).fill(0)
  sampleIdx.forEach((origIdx, si) => { labels[origIdx] = subLabels[si] })

  const notSampled = new Set(Array.from({ length: n }, (_, i) => i))
  sampleIdx.forEach(i => notSampled.delete(i))
  notSampled.forEach(i => {
    let minD = Infinity, label = 0
    finalCentroids.forEach((c, ci) => {
      const dist = euclidean(matrix[i], c)
      if (dist < minD) { minD = dist; label = ci }
    })
    labels[i] = label
  })

  let inertia = 0
  matrix.forEach((p, i) => { inertia += euclidean(p, finalCentroids[labels[i]]) ** 2 })

  return { labels, centroids: finalCentroids, inertia }
}
