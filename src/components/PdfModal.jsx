import { motion, AnimatePresence } from 'framer-motion'

export default function PdfModal({ open, current, total }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111]/95 p-8 text-center shadow-2xl"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
          >
            <h2 className="text-lg font-medium text-white">Generating your PDF...</h2>
            <p className="mt-3 text-sm text-white/65">
              {total > 0 ? `Adding page ${current} of ${total}...` : ' '}
            </p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-[#c9a84c]"
                initial={{ width: 0 }}
                animate={{ width: total > 0 ? `${(current / total) * 100}%` : '12%' }}
                transition={{ duration: 0.25 }}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
