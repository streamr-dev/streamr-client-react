import { useEffect, useRef, useState } from 'react'
import eq from 'deep-equal'
import useClient from './useClient'
import useIsMounted from './useIsMounted'
import StreamrClient from 'streamr-client'
import type { ResendSubscription } from 'streamr-client/types/src/ResendSubscribe'
import type { Subscription } from 'streamr-client'
import type { StreamMessage } from 'streamr-client-protocol'

const defaultErrorHandler = (error: any) => {
    console.error(error)
}

type Options<T> = {
    isActive?: boolean
    isRealtime?: boolean
    onMessage?: (message: T, metadata: StreamMessage<T>) => void
    onUnsubscribed?: () => void
    onSubscribed?: () => void
    onResent?: () => void
    onError?: (error: any) => void
}

const noop = () => {}

type SubscriptionOptions = (
    Parameters<StreamrClient['subscriber']['subscribe']>[0]
    | Parameters<StreamrClient['resendSubscriber']['resendSubscribe']>[0]
)

function useSubscription<T extends object = object>(subscriptionParams: SubscriptionOptions, options: Options<T> = {}): void {
    const client = useClient()
    const {
        isActive = true,
        onMessage = noop,
        onSubscribed = noop,
        onResent = noop,
        onUnsubscribed = noop,
        onError = defaultErrorHandler,
    } = options
    const onMessageRef = useRef(onMessage)
    onMessageRef.current = onMessage

    const onErrorRef = useRef(onError)
    onErrorRef.current = onError

    const [params, setParams] = useState(subscriptionParams)
    const subscriptionParamsChanged = !eq(params, subscriptionParams)
    useEffect(() => {
        if (subscriptionParamsChanged) {
            setParams(subscriptionParams)
        }
    }, [subscriptionParams, subscriptionParamsChanged])

    const isMounted = useIsMounted()

    const [sub, setSub] = useState<ResendSubscription<T> | Subscription<T>>()
    const shouldSubscribe = !!(isActive && !client?.isDestroyed())

    useEffect(() => {
        if (!shouldSubscribe || !client) {
            return // No client -> no unsubbing.
        }

        let cancelled = false

        ;(async () => {
            if (!subscriptionParamsChanged) {
                return
            }

            try {
                const s = await client.resendSubscriber.subscribe<T>(params, (message: T, metadata: StreamMessage<T>) => {
                    onMessageRef.current(message, metadata)
                })

                if (!cancelled && isMounted()) {
                    setSub(s)
                }
            } catch (e) {
                onErrorRef.current(e)
            }
        })()

        return () => {
            cancelled = true
            setSub(undefined)
        }
    }, [client, params, shouldSubscribe, isMounted])

    useEffect(() => {
        if (!sub || !isActive) { return }
        onSubscribed()
    }, [sub, isActive, onSubscribed])

    useEffect(() => () => {
        sub?.unsubscribe().catch(() => {})
    }, [sub])

    useEffect(() => {
        if (!sub || !shouldSubscribe) { return }

        if ('onResent' in sub) {
            sub.onResent.listen(onResent)
        }

        sub.onFinally.listen(onUnsubscribed)
        sub.onError.listen(onError)

        return () => {
            if ('onResent' in sub) {
                sub.onResent.unlisten(onResent)
            }

            sub.onFinally.unlisten(onUnsubscribed)
            sub.onError.unlisten(onError)
        }
    }, [sub, shouldSubscribe, onSubscribed, onUnsubscribed, onError])
}

export default useSubscription
