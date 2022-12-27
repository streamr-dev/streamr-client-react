import { useEffect, useRef } from 'react'
import type { Message, ResendOptions } from 'streamr-client'
import useClient from './useClient'
import resend from './resend'
import useOpts from './useOpts'
import type { Options as SubscribeOptions } from './useSubscribe'

interface Options<T> extends SubscribeOptions<T> {
    resendOptions?: ResendOptions
}

export default function useResend(
    streamId: string,
    {
        disabled = false,
        resendOptions = { last: 1 },
        onMessage,
        ignoreUndecodedMessages = false,
        onMessageError,
        onError,
    }: Options<Message> = {}
): void {
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

    useEffect(() => {
        if (!client || disabled) {
            return () => {}
        }

        const queue = resend(streamId, opts, client, {
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
        }

        fn(queue)

        return () => {
            queue?.abort()
        }
    }, [streamId, opts, client, disabled, ignoreUndecodedMessages])
}
