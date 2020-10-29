import { useEffect, useReducer, useRef, useState } from 'react'
import eq from 'deep-equal'
import useClient from '../hooks/useClient'
import useIsMounted from '../hooks/useIsMounted'

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

const useSubscription = (subscriptionParams: object, onMessage: (message: object, metadata: object) => void, onError?: (error: any) => void) => {
    const client = useClient()

    const onMessageRef = useRef(onMessage)

    useEffect(() => {
        onMessageRef.current = onMessage
    }, [onMessage])

    const onErrorRef = useRef(onError || defaultErrorHandler)

    useEffect(() => {
        onErrorRef.current = onError || defaultErrorHandler
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
            if (isMounted()) {
                dispatch({
                    type: REQUEST_RESUBSCRIBE,
                })
            }
        }

        client.on('disconnected', onDisconnected)

        return () => {
            client.off('disconnected', onDisconnected)
        }
    }, [client])

    useEffect(() => {
        if (!client) {
            return () => {
                // No client -> no unsubbing.
            }
        }

        const sub = (() => {
            try {
                return client.subscribe(params, (message: object, metadata: object) => {
                    onMessageRef.current(message, metadata)
                })
            } catch (e) {
                onErrorRef.current(e)
            }

            return null
        })()

        return () => {
            if (sub) {
                client.unsubscribe(sub)
            }
        }
    }, [client, params, resubscribeCount])
}

export default useSubscription
