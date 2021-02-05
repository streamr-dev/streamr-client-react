import type { EventEmitter } from 'events'
import { useEffect, useReducer, useRef, useState } from 'react'
import eq from 'deep-equal'
import useClient from './useClient'
import useIsMounted from './useIsMounted'

const defaultErrorHandler = (error: any) => {
    console.log(error)
}

type State = {
    params: object,
    resubscribeCount: number,
}

const initialState = {
    params: {},
    resubscribeCount: 0,
}

type Action = {
    type: string,
    payload?: any,
}

const REQUEST_RESUBSCRIBE = 'request resubscribe'

const SET_PARAMS = 'set params'

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case SET_PARAMS:
            return {
                ...state,
                params: action.payload,
            }
        case REQUEST_RESUBSCRIBE:
            return {
                ...state,
                resubscribeCount: state.resubscribeCount + 1,
            }
        default:
            return state
    }
}

type Options = {
    isActive?: boolean
    onMessage?: (message: object, metadata: object) => void
    onUnsubscribed?: () => void
    onSubscribed?: () => void
    onError?: (error: any) => void
}

const noop = () => {}

const useSubscription = (subscriptionParams: object, options: Options = {}) => {
    const client = useClient()
    const {
        isActive = true,
        onMessage = noop,
        onSubscribed = noop,
        onUnsubscribed = noop,
        onError = defaultErrorHandler,
    } = options

    const onMessageRef = useRef(onMessage)

    useEffect(() => {
        onMessageRef.current = onMessage
    }, [onMessage])

    const onErrorRef = useRef(onError)

    useEffect(() => {
        onErrorRef.current = onError
    }, [onError])

    const [{ params, resubscribeCount }, dispatch] = useReducer(reducer, {
        ...initialState,
        params: subscriptionParams,
    })

    useEffect(() => {
        if (!eq(params, subscriptionParams)) {
            // Change current params only if – according to `eq` – they changed.
            dispatch({
                type: SET_PARAMS,
                payload: subscriptionParams,
            })
        }
    }, [subscriptionParams])

    const isMounted = useIsMounted()

    useEffect(() => {
        if (!client) {
            return () => {}
        }

        const onDisconnected = () => {
            if (isMounted() && isActive) {
                dispatch({
                    type: REQUEST_RESUBSCRIBE,
                })
            }
        }

        client.on('disconnected', onDisconnected)

        return () => {
            client.off('disconnected', onDisconnected)
        }
    }, [client, isActive])

    const [sub, setSub] = useState<EventEmitter | undefined>()

    useEffect(() => {
        if (!isActive || !client) {
            return // No client -> no unsubbing.
        }

        const s = (() => {
            try {
                return client.subscribe(params, (message: object, metadata: object) => {
                    onMessageRef.current(message, metadata)
                })
            } catch (e) {
                onErrorRef.current(e)
            }

            return null
        })()

        if (s) {
            setSub(s)
        }

        return () => {
            if (s) {
                setSub(undefined)
                client.unsubscribe(s)
            }
        }
    }, [client, params, isActive, resubscribeCount])

    useEffect(() => {
        if (!sub || !isActive) { return }

        sub!.on('subscribed', onSubscribed)
        sub!.on('unsubscribed', onUnsubscribed)

        return () => {
            sub!.off('subscribed', onSubscribed)
            sub!.off('unsubscribed', onUnsubscribed)
        }
    }, [sub, isActive, onSubscribed, onUnsubscribed])
}

export default useSubscription
