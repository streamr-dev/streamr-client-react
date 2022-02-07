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

    const [params, setParams] = useState<SubscriptionOptions | undefined>(subscriptionParams)

    const client = useClient()

    useEffect(() => {
        if (eq(params, subscriptionParams)) {
            // Subscription params haven't changed. Skipping the rest.
            return
        }

        setParams(subscriptionParams)
    }, [params, subscriptionParams])

    const isMounted = useIsMounted()

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

        let sub: ResendSubscription<T> | Subscription<T> | undefined = undefined

        function unsub() {
            sub?.unsubscribe().catch(() => {})
            sub = undefined
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

    }, [isActive, params, client, isMounted])

    useEffect(() => {
        if (!subscription) {
            return
        }

        if (typeof onSubscribedRef.current === 'function') {
            onSubscribedRef.current()
        }
    }, [subscription])

    useEffect(() => {
        if (!subscription) {
            return () => {}
        }

        if ('onResent' in subscription && typeof subscription?.onResent.listen === 'function') {
            subscription.onResent.listen(onResent)
        }

        if ('onFinally' in subscription && typeof subscription?.onFinally.listen === 'function') {
            subscription.onFinally.listen(onUnsubscribed)
        }

        if ('onError' in subscription && typeof subscription?.onError.listen === 'function') {
            subscription.onError.listen(onError)
        }

        return () => {
            if ('onResent' in subscription && typeof (subscription as any)?.onResent.unlisten === 'function') {
                (subscription as any).onResent.unlisten(onResent)
            }

            if ('onFinally' in subscription && typeof subscription?.onFinally.unlisten === 'function') {
                subscription.onFinally.unlisten(onUnsubscribed)
            }

            if ('onError' in subscription && typeof subscription?.onError.unlisten === 'function') {
                subscription.onError.unlisten(onError)
            }
        }
    }, [subscription, onResent, onUnsubscribed, onError])
}

export default useSubscription
