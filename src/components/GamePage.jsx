import {
  DndContext,
  DragOverlay,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

const ITEMS = [
  { id: 'fork', emoji: '🍴', label: 'Fork' },
  { id: 'knife', emoji: '🔪', label: 'Knife' },
  { id: 'spoon', emoji: '🥄', label: 'Spoon' },
  { id: 'glass', emoji: '🥂', label: 'Glass' },
  { id: 'bread', emoji: '🍞', label: 'Bread Plate' },
  { id: 'napkin', emoji: '🧻', label: 'Napkin' },
]

const ZONES = [
  { id: 'zone-fork', x: '25%', y: '56%', label: 'Fork goes here' },
  { id: 'zone-knife', x: '73%', y: '56%', label: 'Knife goes here' },
  { id: 'zone-spoon', x: '82%', y: '56%', label: 'Spoon goes here' },
  { id: 'zone-glass', x: '73%', y: '29%', label: 'Glass goes here' },
  { id: 'zone-bread', x: '25%', y: '29%', label: 'Bread plate goes here' },
  { id: 'zone-napkin', x: '48%', y: '67%', label: 'Napkin goes here' },
]

const correctMapping = {
  fork: 'zone-fork',
  knife: 'zone-knife',
  spoon: 'zone-spoon',
  glass: 'zone-glass',
  bread: 'zone-bread',
  napkin: 'zone-napkin',
}

function ItemCard({ item, shaking = false, dragging = false }) {
  return (
    <motion.div
      animate={shaking ? { x: [0, -8, 8, -8, 8, 0], backgroundColor: ['#1f1a12', '#3a1414', '#1f1a12'] } : { x: 0 }}
      transition={{ duration: 0.35 }}
      className="relative flex h-14 w-14 items-center justify-center rounded-xl border border-[#c9a84c]/60 bg-[#1f1a12] text-3xl shadow-[0_0_15px_rgba(201,168,76,0.2)]"
      style={{
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      <span className="sr-only">{item.label}</span>
      <span aria-hidden>{item.emoji}</span>
    </motion.div>
  )
}

function DraggableItem({ item, shaking = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    touchAction: 'none',
    userSelect: 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <ItemCard item={item} shaking={shaking} dragging={isDragging} />
    </div>
  )
}

function DropZone({ zone, placedItem, correctGlow = false }) {
  const { setNodeRef, isOver } = useDroppable({
    id: zone.id,
  })
  const hasItem = Boolean(placedItem)

  return (
    <motion.div
      ref={setNodeRef}
      className="absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-2 border-dashed"
      style={{
        left: zone.x,
        top: zone.y,
        borderColor: hasItem ? '#4ade80' : isOver ? '#c9a84c' : 'rgba(201,168,76,0.55)',
        background: hasItem ? 'rgba(34, 197, 94, 0.12)' : isOver ? 'rgba(201,168,76,0.15)' : 'rgba(20,16,11,0.45)',
        boxShadow: hasItem || correctGlow ? '0 0 20px rgba(74, 222, 128, 0.55)' : 'none',
        transition: 'all 0.2s ease',
      }}
      initial={false}
      animate={correctGlow ? { scale: [1, 1.2, 1] } : { scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {placedItem ? <span className="text-3xl">{placedItem.emoji}</span> : <span className="px-1 text-center text-[10px] text-[#8d8165]">{zone.label}</span>}
      {hasItem ? <span className="absolute -right-1 -top-1 text-sm text-[#4ade80]">✓</span> : null}
    </motion.div>
  )
}

function ConfettiBurst() {
  const dots = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: `${8 + ((i * 17) % 84)}%`,
        color: ['#c9a84c', '#4ade80', '#facc15', '#f59e0b'][i % 4],
        delay: i * 0.02,
      })),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((dot) => (
        <motion.span
          key={dot.id}
          className="absolute top-0 h-2 w-2 rounded-full"
          style={{ left: dot.left, backgroundColor: dot.color }}
          initial={{ y: -10, opacity: 0, rotate: 0 }}
          animate={{ y: 360, opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{ duration: 1.35, ease: 'easeOut', delay: dot.delay }}
        />
      ))}
    </div>
  )
}

export default function GamePage() {
  const [placed, setPlaced] = useState({})
  const [correct, setCorrect] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [shaking, setShaking] = useState(null)
  const placedItemIds = useMemo(() => new Set(Object.values(placed)), [placed])
  const doneCount = Object.keys(placed).length
  const completed = doneCount === ZONES.length

  const itemsById = useMemo(
    () => Object.fromEntries(ITEMS.map((item) => [item.id, item])),
    [],
  )

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  useEffect(() => {
    if (activeId) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [activeId])

  const triggerWrongShake = (itemId) => {
    setShaking(itemId)
    window.setTimeout(() => setShaking(null), 380)
  }

  const triggerSuccess = (zoneId) => {
    setCorrect((prev) => ({ ...prev, [zoneId]: true }))
    window.setTimeout(() => {
      setCorrect((prev) => ({ ...prev, [zoneId]: false }))
    }, 520)
  }

  const handleDragStart = (event) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!active) return
    const itemId = String(active.id)
    if (!over) return

    const zoneId = String(over.id)
    if (!zoneId) return
    if (placed[zoneId]) {
      triggerWrongShake(itemId)
      return
    }

    if (correctMapping[itemId] === zoneId) {
      setPlaced((prev) => ({ ...prev, [zoneId]: itemId }))
      triggerSuccess(zoneId)
      return
    }

    triggerWrongShake(itemId)
  }

  const handleReset = () => {
    setPlaced({})
    setCorrect({})
    setShaking(null)
    setActiveId(null)
  }

  const stopFlip = (e) => {
    e.stopPropagation()
  }

  return (
    <div
      className="relative h-full w-full bg-gradient-to-b from-[#14100b] to-[#090705] p-4 text-[#f5e8c7]"
      style={{ touchAction: 'none' }}
      onPointerDown={stopFlip}
      onPointerMove={stopFlip}
      onPointerUp={stopFlip}
      onTouchStart={stopFlip}
      onTouchMove={stopFlip}
      onTouchEnd={stopFlip}
    >
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="mx-auto flex h-full w-full max-w-[450px] flex-col items-center">
          <h2 className="mt-1 text-center text-xl font-semibold tracking-wide text-[#c9a84c]">Set the Table</h2>
          <p className="mb-2 text-xs text-[#d8c79d]">Drag each item to its proper place</p>

          <div className="relative mt-2 h-[360px] w-full rounded-2xl border border-[#c9a84c]/40 bg-[#111] p-4 shadow-[0_0_30px_rgba(201,168,76,0.15)]">
            <div className="absolute inset-4 rounded-[40%] border border-[#c9a84c]/45 bg-gradient-to-b from-[#2a2117] to-[#1a140f]" />
            {ZONES.map((zone) => (
              <DropZone
                key={zone.id}
                zone={zone}
                correctGlow={Boolean(correct[zone.id])}
                placedItem={placed[zone.id] ? itemsById[placed[zone.id]] : null}
              />
            ))}
            <AnimatePresence>{completed ? <ConfettiBurst /> : null}</AnimatePresence>
          </div>

          <div className="mt-4 grid w-full grid-cols-3 gap-3">
            {ITEMS.filter((item) => !placedItemIds.has(item.id)).map((item) => (
              <div key={item.id} className="flex justify-center">
                <DraggableItem item={item} shaking={shaking === item.id} />
              </div>
            ))}
          </div>

          <motion.div
            className="mt-3 text-sm font-medium"
            animate={completed ? { color: '#4ade80', scale: [1, 1.05, 1] } : { color: '#d8c79d', scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            {completed ? 'Perfect Table! 6/6' : `Progress: ${doneCount}/6`}
          </motion.div>

          <button
            type="button"
            onClick={handleReset}
            className="mt-2 rounded-full border border-[#c9a84c]/65 bg-[#1c150e] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#f2dfb0] transition hover:bg-[#2a2016]"
          >
            Reset
          </button>
        </div>

        <DragOverlay>
          {activeId && itemsById[activeId] ? <ItemCard item={itemsById[activeId]} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
