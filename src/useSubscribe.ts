import { useEffect, useRef } from 'react'
import type { ResendOptions, StreamDefinition, StreamMessage } from 'streamr-client'
import subscribe from './subscribe'
import useClient from './useClient'
import useOpts from './useOpts'

export interface Options<T> {
    cacheKey?: number | string
    disabled?: boolean
    ignoreUndecodedMessages?: boolean
    onAfterFinish?: () => void
    onBeforeStart?: () => void
    onError?: (e: any) => void
    onMessage?: (msg: T) => void
    onMessageError?: (e: any) => void
}

interface SubscribeOptions extends Options<StreamMessage> {
    resendOptions?: ResendOptions
}

export default function useSubscribe(
    stream: StreamDefinition,
    {
        cacheKey,
        disabled = false,
        ignoreUndecodedMessages = false,
        onAfterFinish,
        onBeforeStart,
        onError,
        onMessage,
        onMessageError,
        resendOptions: resendOptionsProp,
    }: SubscribeOptions = {}
): void {
    const resendOptions = useOpts<undefined | ResendOptions>(resendOptionsProp)

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

    const onBeforeStartRef = useRef(onBeforeStart)

    useEffect(() => {
        onBeforeStartRef.current = onBeforeStart
    }, [onBeforeStart])

    const onAfterFinishRef = useRef(onAfterFinish)

    useEffect(() => {
        onAfterFinishRef.current = onAfterFinish
    }, [onAfterFinish])

    useEffect(() => {
        if (disabled || !client) {
            return () => {}
        }

        onBeforeStartRef.current?.()

        const queue = subscribe(stream, client, {
            onError(e) {
                onErrorRef.current?.(e)
            },
            onMessageError(e) {
                onMessageErrorRef.current?.(e)
            },
            ignoreUndecodedMessages,
            resendOptions,
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

            onAfterFinishRef.current?.()
        }

        fn(queue)

        return () => {
            queue?.abort()
        }
    }, [disabled, stream, client, ignoreUndecodedMessages, resendOptions, cacheKey])
}
