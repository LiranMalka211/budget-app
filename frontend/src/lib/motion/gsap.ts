import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Registered once here; every component imports gsap from this module.
gsap.registerPlugin(useGSAP, ScrollTrigger)

/** True when the visitor asked the OS for less motion; every animation hook returns early on it. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Shared easing for entrances: quick start, soft landing, no overshoot. */
export const ENTER_EASE = 'power3.out'

export { gsap, ScrollTrigger, useGSAP }
