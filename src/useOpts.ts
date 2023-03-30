import eq from 'react-fast-compare'
import { useEffect, useRef, useState } from 'react'

export default function useOpts<T = any>(arg: T): T {
    const argRef = useRef<T>(arg)

    const [result, setResult] = useState<T>(arg)

    useEffect(() => {
        if (eq(arg, argRef.current)) {
            return
        }

        setResult(arg)

        argRef.current = arg
    }, [arg])

    return result
}
