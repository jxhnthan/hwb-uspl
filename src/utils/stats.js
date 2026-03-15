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
