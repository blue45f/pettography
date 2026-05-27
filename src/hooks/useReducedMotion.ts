import useMediaQuery from './useMediaQuery'

function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

export default useReducedMotion
