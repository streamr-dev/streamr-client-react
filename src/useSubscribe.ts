import { useEffect, useRef } from 'react'
import type { StreamMessage } from 'streamr-client'
import subscribe from './subscribe'
import useClient from './useClient'

export interface Options<T> {
    disabled?: boolean
    onMessage?: (msg: T) => void
    onError?: (e: any) => void
    onMessageError?: (e: any) => void
    ignoreUndecodedMessages?: boolean
}

export default function useSubscribe(
    streamId: string,
    {
        disabled = false,
        ignoreUndecodedMessages = false,
        onError,
        onMessage,
        onMessageError,
    }: Options<StreamMessage> = {}
): void {
    const client = useClient()

    const onMessageRef = useRef(onMessage)

    useEffect(() => {
        onMessageRef.current = onMessage
    }, [onMessage])

    const onErrorRef = useRef(onError)

    useEffect(() => {
        onErrorRef.current = onError
    }, [onError])

    const onMessageErrorRef = useRef(onMessageError)

    useEffect(() => {
        onMessageErrorRef.current = onMessageError
    }, [onMessageError])

    useEffect(() => {
        if (disabled || !client) {
            return () => {}
        }

        const queue = subscribe(streamId, client, {
            onError(e) {
                onErrorRef.current?.(e)
            },
            onMessageError(e) {
                onMessageErrorRef.current?.(e)
            },
            ignoreUndecodedMessages,
        })

        async function fn(q: ReturnType<typeof subscribe>) {
            while (true) {
                const { value, done } = await q.next()

                if (value) {
                    onMessageRef.current?.(value)
                }

                if (done) {
                    break
                }
            }
        }

        fn(queue)

        return () => {
            queue?.abort()
        }
    }, [disabled, streamId, client, ignoreUndecodedMessages])
}
