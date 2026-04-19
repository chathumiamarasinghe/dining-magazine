import { motion } from 'framer-motion'

export default function LoadingScreen({ loaded, total }) {
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0
  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0a0a0a]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55 }}
    >
      <div
        className="book-loader mb-10 h-20 w-28 rounded-md border border-[#2a2418] bg-gradient-to-br from-[#1c1812] to-[#0d0b09] shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
        aria-hidden
      />
      <p className="text-sm tracking-wide text-[#c9a84c]">Loading pages...</p>
      <p className="mt-2 text-xs text-white/70">
        {total > 0 ? `${loaded} of ${total}` : 'Reading manifest'}
      </p>
      <div className="mt-6 h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-[#c9a84c]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        />
      </div>
    </motion.div>
  )
}
