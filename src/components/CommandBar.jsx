import { useState, useRef, useEffect } from 'react'

// ── Inline icons ─────────────────────────────────────────────────────────────
const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)
const DragGrip = () => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" opacity="0.4">
    <circle cx="3" cy="2.5" r="1.2" /><circle cx="7" cy="2.5" r="1.2" />
    <circle cx="3" cy="7"   r="1.2" /><circle cx="7" cy="7"   r="1.2" />
    <circle cx="3" cy="11.5" r="1.2" /><circle cx="7" cy="11.5" r="1.2" />
  </svg>
)

// ── Algorithm drop slot ───────────────────────────────────────────────────────
function AlgorithmSlot({ algorithm, algorithms, setAlgorithm }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = algorithms.find(a => a.value === algorithm)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      {/* The slot itself */}
      <button
        onClick={() => setOpen(v => !v)}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          const val = e.dataTransfer.getData('algorithm')
          if (algorithms.find(a => a.value === val)) setAlgorithm(val)
          setIsDragOver(false)
          setOpen(false)
        }}
        className={[
          'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[15px] font-semibold',
          'border-2 transition-all duration-150 select-none cursor-pointer',
          isDragOver
            ? 'border-dashed scale-105 shadow-md'
            : 'border-solid hover:shadow-sm',
        ].join(' ')}
        style={{
          borderColor: isDragOver ? current?.color : current?.color + '55',
          backgroundColor: isDragOver ? current?.color + '18' : current?.color + '0d',
          color: current?.color,
        }}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0 transition-transform"
          style={{ backgroundColor: current?.color, transform: isDragOver ? 'scale(1.4)' : 'scale(1)' }}
        />
        {isDragOver ? 'Drop here' : current?.label}
        <ChevronDown />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-xl border border-[#e8e7e4] shadow-xl z-50 overflow-hidden py-1">
          {algorithms.map(algo => (
            <button
              key={algo.value}
              onClick={() => { setAlgorithm(algo.value); setOpen(false) }}
              className={[
                'w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors',
                algorithm === algo.value ? 'bg-[#f1f0ec]' : 'hover:bg-[#f7f6f3]',
              ].join(' ')}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: algo.color }} />
              <div>
                <div className="text-sm font-medium text-[#37352f]">{algo.label}</div>
                <div className="text-xs text-[#787774] mt-0.5">{algo.description}</div>
              </div>
              {algorithm === algo.value && (
                <span className="ml-auto text-xs text-[#787774]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── K stepper ─────────────────────────────────────────────────────────────────
function KStepper({ k, setK }) {
  return (
    <div className="flex items-center gap-1.5 px-1">
      <button
        onClick={() => setK(v => Math.max(2, v - 1))}
        className="w-6 h-6 rounded border border-[#e8e7e4] text-base leading-none flex items-center justify-center text-[#787774] hover:bg-[#f1f0ec] hover:text-[#37352f] transition-colors"
      >−</button>
      <span className="w-5 text-center font-bold text-[17px] text-[#37352f]">{k}</span>
      <button
        onClick={() => setK(v => Math.min(7, v + 1))}
        className="w-6 h-6 rounded border border-[#e8e7e4] text-base leading-none flex items-center justify-center text-[#787774] hover:bg-[#f1f0ec] hover:text-[#37352f] transition-colors"
      >+</button>
    </div>
  )
}

// ── Variable chip ─────────────────────────────────────────────────────────────
function VarChip({ v, active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={active ? `Remove ${v.label}` : `Add ${v.label}`}
      className={[
        'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150',
        active
          ? 'border-transparent'
          : 'border-[#e8e7e4] bg-[#f7f6f3] text-[#aba9a2]',
      ].join(' ')}
      style={active ? { backgroundColor: v.bg, color: v.color, borderColor: v.color + '40' } : {}}
    >
      {active
        ? <span style={{ opacity: 0.5, fontSize: 9 }}>✕</span>
        : <span style={{ opacity: 0.4, fontSize: 9 }}>+</span>}
      {v.label}
    </button>
  )
}

// ── Draggable method chip ─────────────────────────────────────────────────────
function MethodChip({ algo, isCurrent, onClick }) {
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('algorithm', algo.value) }}
      onClick={onClick}
      title={algo.description}
      className={[
        'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium',
        'cursor-grab active:cursor-grabbing select-none transition-all duration-150',
        'hover:-translate-y-0.5 hover:shadow-md',
        isCurrent ? 'shadow-sm' : '',
      ].join(' ')}
      style={{
        borderColor: isCurrent ? algo.color : algo.color + '50',
        backgroundColor: isCurrent ? algo.color + '18' : algo.color + '0a',
        color: algo.color,
        outline: isCurrent ? `2px solid ${algo.color}30` : 'none',
        outlineOffset: 2,
      }}
    >
      <DragGrip />
      {algo.label}
    </div>
  )
}

// ── Main CommandBar ────────────────────────────────────────────────────────────
export default function CommandBar({
  algorithm, setAlgorithm, algorithms,
  k, setK,
  allVars, activeVarKeys, toggleVar,
  dataCount,
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e8e7e4] px-7 py-5 shadow-sm">

      {/* ── Row 1: Mad-libs sentence ── */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[17px] text-[#37352f] font-light">

        <span className="font-medium text-[#37352f]">Cluster</span>

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#f1f0ec] rounded-md font-mono text-sm font-semibold text-[#37352f]">
          {dataCount.toLocaleString()}
          <span className="font-normal font-sans text-[#787774]">staff</span>
        </span>

        <span className="text-[#aba9a2]">using</span>

        <AlgorithmSlot algorithm={algorithm} algorithms={algorithms} setAlgorithm={setAlgorithm} />

        <span className="text-[#aba9a2]">into</span>

        <KStepper k={k} setK={setK} />

        <span className="text-[#aba9a2]">groups based on</span>
      </div>

      {/* ── Row 2: Variable chips ── */}
      <div className="flex flex-wrap gap-1.5 mt-3.5 items-center">
        <span className="text-xs font-medium text-[#c7c5bf] uppercase tracking-widest mr-0.5">Variables</span>
        {allVars.map(v => (
          <VarChip key={v.key} v={v} active={activeVarKeys.includes(v.key)} onToggle={() => toggleVar(v.key)} />
        ))}
      </div>

      {/* ── Row 3: Method palette ── */}
      <div className="flex flex-wrap items-center gap-2 mt-4 pt-3.5 border-t border-[#f1f0ec]">
        <div className="flex flex-col mr-2">
          <span className="text-[11px] font-semibold text-[#aba9a2] uppercase tracking-widest">Methods</span>
          <span className="text-[10px] text-[#c7c5bf] mt-0.5">drag to slot above</span>
        </div>
        {algorithms.map(algo => (
          <MethodChip
            key={algo.value}
            algo={algo}
            isCurrent={algorithm === algo.value}
            onClick={() => setAlgorithm(algo.value)}
          />
        ))}
      </div>
    </div>
  )
}
