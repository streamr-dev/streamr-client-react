import { useEffect, useRef } from 'react'
import type { ResendOptions, StreamDefinition } from 'streamr-client'
import type { StreamMessage } from 'streamr-client-protocol'
import useClient from './useClient'
import resend from './resend'
import useOpts from './useOpts'
import type { Options } from './useSubscribe'

export default function useResend(
    streamDef: StreamDefinition,
    resendOptions: ResendOptions = { last: 1 },
    {
        cacheKey,
        disabled = false,
        ignoreUndecodedMessages = false,
        onAfterFinish,
        onBeforeStart,
        onError,
        onMessage,
        onMessageError,
    }: Options<StreamMessage> = {}
): void {
    const stream = useOpts<StreamDefinition>(streamDef)

    const opts = useOpts<ResendOptions>(resendOptions)

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

        const queue = resend(stream, opts, client, {
            onError(e) {
                onErrorRef.current?.(e)
            },
            onMessageError(e) {
                onMessageErrorRef.current?.(e)
            },
            ignoreUndecodedMessages,
        })

        void (async (q: ReturnType<typeof resend>) => {
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
    }, [stream, opts, client, disabled, ignoreUndecodedMessages, cacheKey])
}
