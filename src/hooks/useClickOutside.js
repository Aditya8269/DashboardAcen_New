import { useEffect } from 'react'

// Calls `handler` when the user clicks outside `ref` or presses Escape.
export default function useClickOutside(ref, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined
    const onPointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) handler()
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') handler()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [ref, handler, enabled])
}
