import { useEffect, useRef } from 'react'

function useDocumentTitle(title: string, restoreOnUnmount = true) {
  const previousTitle = useRef(document.title)

  useEffect(() => {
    document.title = title
  }, [title])

  useEffect(() => {
    if (restoreOnUnmount) {
      const prevTitle = previousTitle.current
      return () => {
        document.title = prevTitle
      }
    }
  }, [restoreOnUnmount])
}

export default useDocumentTitle
