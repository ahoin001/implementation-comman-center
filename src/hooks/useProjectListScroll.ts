import { useLayoutEffect } from 'react'
import { useStore } from '@/store/useStore'

/** Remembers the projects scroller so a shared open/close lands on the same card. */
export function useProjectListScroll(key: string) {
  const setProjectListScroll = useStore((s) => s.setProjectListScroll)

  useLayoutEffect(() => {
    const main = document.querySelector('main.main')
    if (!(main instanceof HTMLElement)) return
    main.scrollTop = useStore.getState().projectListScroll[key] ?? 0
    return () => {
      setProjectListScroll(key, main.scrollTop)
    }
  }, [key, setProjectListScroll])
}
