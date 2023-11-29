import { useEffect, useRef } from 'react'
import type { ResendOptions, StreamDefinition } from 'streamr-client'
import type { StreamMessage } from 'streamr-client-protocol'
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
    streamDef: StreamDefinition,
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
    const stream = useOpts<StreamDefinition>(streamDef)

    const resendOptions = useOpts<undefined | ResendOptions>(resendOptionsProp)

    const client = useClient()

    const onMessageRef = useRef(onMessage)

    if (onMessageRef.current !== onMessage) {
        onMessageRef.current = onMessage
    }

    const onErrorRef = useRef(onError)

    if (onErrorRef.current !== onError) {
        onErrorRef.current = onError
    }

    const onMessageErrorRef = useRef(onMessageError)

    if (onMessageErrorRef.current !== onMessageError) {
        onMessageErrorRef.current = onMessageError
    }

    const onBeforeStartRef = useRef(onBeforeStart)

    if (onBeforeStartRef.current !== onBeforeStart) {
        onBeforeStartRef.current = onBeforeStart
    }

    const onAfterFinishRef = useRef(onAfterFinish)

    if (onAfterFinishRef.current !== onAfterFinish) {
        onAfterFinishRef.current = onAfterFinish
    }

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

        void (async (q: ReturnType<typeof subscribe>) => {
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
        })(queue)

        return () => {
            queue?.abort()
        }
    }, [disabled, stream, client, ignoreUndecodedMessages, resendOptions, cacheKey])
}
