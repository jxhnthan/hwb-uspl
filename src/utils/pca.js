import { dot, normalize } from './stats'

// ─── Matrix × vector ─────────────────────────────────────────────────────────
function matVecMul(A, v) {
  return A.map((row) => dot(row, v))
}

// ─── Symmetric matrix deflation ──────────────────────────────────────────────
function deflate(A, lambda, v) {
  return A.map((row, i) => row.map((val, j) => val - lambda * v[i] * v[j]))
}

// ─── Power iteration for the dominant eigenpair ──────────────────────────────
function powerIter(A, seed = 1, maxIter = 400) {
  const n = A.length
  // Reproducible, non-trivial starting vector
  let b = Array.from({ length: n }, (_, i) => Math.cos(i * 2.3 + seed))
  normalize(b)

  for (let it = 0; it < maxIter; it++) {
    const bNext = matVecMul(A, b)
    normalize(bNext)
    const diff = Math.sqrt(b.reduce((s, v, i) => s + (v - bNext[i]) ** 2, 0))
    b = bNext
    if (diff < 1e-12) break
  }

  const Ab = matVecMul(A, b)
  const eigenvalue = dot(b, Ab)
  return { vector: b, value: eigenvalue }
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Project an already-standardised n×d matrix onto the first 2 principal
 * components using power iteration on the covariance matrix.
 *
 * @param {number[][]} matrix  n×d standardised data
 * @returns {{ scores: number[][], varExplained: number[] }}
 */
export function computePCA2D(matrix) {
  const n = matrix.length
  const d = matrix[0]?.length ?? 0

  if (n < 2 || d === 0) return { scores: matrix.map(() => [0, 0]), varExplained: [0, 0] }
  if (d === 1) {
    return { scores: matrix.map((r) => [r[0], 0]), varExplained: [100, 0] }
  }

  // Build d×d covariance matrix  C = (1/(n-1)) * Xᵀ X
  const cov = Array.from({ length: d }, (_, i) =>
    Array.from({ length: d }, (_, j) => {
      let s = 0
      for (let r = 0; r < n; r++) s += matrix[r][i] * matrix[r][j]
      return s / (n - 1)
    })
  )

  const totalVar = cov.reduce((s, row, i) => s + row[i], 0) || 1

  // PC1
  const { vector: pc1, value: ev1 } = powerIter(cov, 1)

  // Deflate and get PC2
  const cov2 = deflate(cov, ev1, pc1)
  const { vector: pc2, value: ev2 } = powerIter(cov2, 2)

  const scores = matrix.map((row) => [dot(row, pc1), dot(row, pc2)])

  // loadings[j] = [pc1[j], pc2[j]] — biplot coordinates for variable j
  const pcLoadings = Array.from({ length: d }, (_, j) => [pc1[j], pc2[j]])

  return {
    scores,
    pcLoadings,
    varExplained: [
      Math.round((Math.abs(ev1) / totalVar) * 1000) / 10,
      Math.round((Math.abs(ev2) / totalVar) * 1000) / 10,
    ],
  }
}
