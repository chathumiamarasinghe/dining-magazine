import { motion, AnimatePresence } from 'framer-motion'

export default function CoverHint({ visible, mode }) {
  const isBack = mode === 'back'
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="pointer-events-none mt-6 flex flex-col items-center gap-2 text-center"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <motion.p
            className="text-sm font-medium tracking-wide text-[#c9a84c]"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {isBack ? 'The End' : ''}
          </motion.p>
          {!isBack ? (
            <motion.span
              className="text-2xl text-[#c9a84c]/90"
              animate={{ x: [0, 4, 0], y: [0, 2, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden
            >
              ↘
            </motion.span>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
