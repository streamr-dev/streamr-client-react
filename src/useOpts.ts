import eq from 'react-fast-compare'
import { useRef } from 'react'

export default function useOpts<T = unknown>(arg: T): T {
    const argRef = useRef<T>(arg)

    if (!eq(arg, argRef.current)) {
        argRef.current = arg
    }

    return argRef.current
}
