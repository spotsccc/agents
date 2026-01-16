import { useMediaQuery } from '@vueuse/core'

export function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return { isMobile }
}
