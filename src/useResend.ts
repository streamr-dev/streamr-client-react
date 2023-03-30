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
        if (!client || disabled) {
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

        async function fn(q: ReturnType<typeof resend>) {
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
    }, [stream, opts, client, disabled, ignoreUndecodedMessages, cacheKey])
}
