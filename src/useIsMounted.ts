import { useRef, useEffect, useCallback } from 'react'

export default (): (() => boolean) => {
    const ref = useRef<boolean>(true)

    useEffect(() => (): void => {
        ref.current = false
    }, [])

    return useCallback((): boolean => (
        ref.current
    ), [])
}
