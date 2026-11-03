/**
 * JS mirror of the motion tokens in `tokens.css` and MOTION.md.
 * Interactive motion uses the one ease. Do not add a second curve here.
 */
export const ease = [0.2, 0.8, 0.2, 1] as const

export const motion = {
  color: { duration: 0.2, ease },
  lift: { duration: 0.35, ease },
  morph: { duration: 0.4, ease },
  progress: { duration: 0.3, ease },
  rise: { duration: 0.7, ease },
} as const
