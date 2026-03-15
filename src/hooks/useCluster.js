import { useState, useEffect, useRef } from 'react'
import ClusterWorker from '../workers/cluster.worker.js?worker'

const EMPTY = { labels: [], pcaPoints: [], varExplained: [0, 0], clusterStats: [], elbowData: [] }

export function useCluster(rawData, algorithm, k, varKeys) {
  const workerRef  = useRef(null)
  const timerRef   = useRef(null)
  const [result, setResult]       = useState(EMPTY)
  const [computing, setComputing] = useState(false)

  // Create worker once
  useEffect(() => {
    workerRef.current = new ClusterWorker()
    workerRef.current.onmessage = ({ data }) => {
      setResult(data)
      setComputing(false)
    }
    return () => {
      workerRef.current?.terminate()
      clearTimeout(timerRef.current)
    }
  }, [])

  // Debounce: fire worker after 180 ms of no new changes
  useEffect(() => {
    if (!rawData.length || !varKeys.length) return
    clearTimeout(timerRef.current)
    setComputing(true)
    timerRef.current = setTimeout(() => {
      workerRef.current?.postMessage({ rawData, algorithm, k, varKeys })
    }, 180)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData, algorithm, k, varKeys.join(',')])

  return { ...result, computing }
}
