import { motion, AnimatePresence } from 'framer-motion'

export default function ThumbnailPanel({ open, pages, activePredicate, onSelect, onClose }) {
  const n = pages.length
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-[90] bg-black/40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            aria-label="Close thumbnails"
          />
          <motion.aside
            className="fixed left-0 top-0 z-[95] flex h-full w-[160px] flex-col border-r border-white/10 bg-[rgba(10,10,10,0.92)] shadow-2xl backdrop-blur-md"
            initial={{ x: -180 }}
            animate={{ x: 0 }}
            exit={{ x: -180 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="border-b border-white/10 px-3 py-3 text-xs uppercase tracking-widest text-white/50">
              Pages
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {pages.map((name, idx) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSelect(idx)}
                  className={`relative mb-2 w-full overflow-hidden rounded-md border-2 bg-black/30 transition ${
                    activePredicate(idx) ? 'border-[#c9a84c]' : 'border-transparent hover:border-white/20'
                  }`}
                >
                  {idx === 0 ? (
                    <span className="absolute left-1 top-1 z-[2] rounded bg-[#c9a84c]/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-black">
                      Cover
                    </span>
                  ) : null}
                  {idx === n - 1 && n > 1 ? (
                    <span className="absolute right-1 top-1 z-[2] rounded bg-[#c9a84c]/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-black">
                      Back
                    </span>
                  ) : null}
                  <img
                    src={`/slides/${name}`}
                    alt=""
                    className="block h-auto w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}
