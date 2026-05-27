import { useState } from 'react'

function usePrevious<T>(value: T): T | undefined {
  const [state, setState] = useState<{ current: T; previous: T | undefined }>(() => ({
    current: value,
    previous: undefined,
  }))

  if (!Object.is(state.current, value)) {
    setState({ current: value, previous: state.current })
  }

  return state.previous
}

export default usePrevious
