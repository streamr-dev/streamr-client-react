import { useEffect, useRef, useState } from 'react'
import eq from 'deep-equal'
import useClient from './useClient'
import useIsMounted from './useIsMounted'
import StreamrClient from 'streamr-client'
import type { ResendSubscription, Subscription } from 'streamr-client'

const defaultErrorHandler = (error: any) => {
    console.error(error)
}

type Options<T> = {
    isActive?: boolean
    isRealtime?: boolean
    // FIXME: Better type annotation for `streamMessage`.
    onMessage?: (msg: T, streamMessage: any) => void
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
    const {
        isActive = true,
        onMessage = noop,
        onSubscribed = noop,
        onResent = noop,
        onUnsubscribed = noop,
        onError = defaultErrorHandler,
    } = options

    const client = useClient()

    const onMessageRef = useRef(onMessage)

    useEffect(() => {
        onMessageRef.current = onMessage
    }, [onMessage])

    const onErrorRef = useRef(onError)

    useEffect(() => {
        onErrorRef.current = onError
    }, [onError])

    const onSubscribedRef = useRef(onSubscribed)

    useEffect(() => {
        onSubscribedRef.current = onSubscribed
    }, [onSubscribed])

    const isMounted = useIsMounted()

    const subscriptionParamsRef = useRef(subscriptionParams)

    const [subscription, setSubscription] = useState<ResendSubscription<T> | Subscription<T>>()

    useEffect(() => {
        let cancelled = false

        if (!client || client.isDestroyed()) {
            // Unusable client instance. Nothing to do.
            return
        }

        if (!isActive) {
            // Inactive = free to skip.
            return
        }

        if (eq(subscriptionParamsRef.current, subscriptionParams)) {
            // Subscription params haven't changed. Skipping the rest.
            return
        }

        subscriptionParamsRef.current = subscriptionParams

        let sub: ResendSubscription<T> | Subscription<T> | undefined = undefined

        function unsub() {
            sub?.unsubscribe().catch(() => {})
            sub = undefined
            setSubscription(undefined)
        }

        function shouldSub() {
            return !cancelled && isMounted() && !client!.isDestroyed()
        }

        async function subscribe() {
            try {
                if (!shouldSub()) {
                    return
                }

                sub = await client!.subscribe<T>(subscriptionParams, (message, raw): void => {
                    if (typeof onMessageRef.current === 'function') {
                        onMessageRef.current(message, raw)
                    }
                })

                if (!shouldSub()) {
                    unsub()
                    return
                }

                if (typeof onSubscribedRef.current === 'function') {
                    onSubscribedRef.current()
                }

                setSubscription(sub!)
            } catch (e) {
                onErrorRef.current(e)
            }
        }

        subscribe()

        return () => {
            cancelled = true
            unsub()
        }
    }, [client, subscriptionParams, isMounted, isActive])

    useEffect(() => {
        if (!subscription) {
            return () => {}
        }

        if ('onResent' in subscription) {
            subscription.onResent.listen(onResent)
        }

        subscription.onFinally.listen(onUnsubscribed)

        subscription.onError.listen(onError)

        return () => {
            subscription.onError.unlisten(onError)

            subscription.onFinally.unlisten(onUnsubscribed)

            if ('onResent' in subscription) {
                subscription.onResent.unlisten(onResent)
            }
        }
    }, [subscription, onResent, onUnsubscribed, onError])
}

export default useSubscription
