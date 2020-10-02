import { useEffect, useRef, useState } from 'react'
import eq from 'deep-equal'
import useClient from '../hooks/useClient'

const defaultErrorHandler = (error: any) => {
    console.log(error)
}

const useSubscription = (subscriptionParams: object, onMessage: (message: any) => void, onError?: (error: any) => void) => {
    const client = useClient()

    const onMessageRef = useRef(onMessage)

    useEffect(() => {
        onMessageRef.current = onMessage
    }, [onMessage])

    const onErrorRef = useRef(onError || defaultErrorHandler)

    useEffect(() => {
        onErrorRef.current = onError || defaultErrorHandler
    }, [onError])

    const [params, setParams] = useState(subscriptionParams)

    useEffect(() => {
        if (!eq(params, subscriptionParams)) {
            // Change current params only if – according to `eq` – they changed.
            setParams(subscriptionParams)
        }
    }, [subscriptionParams])

    useEffect(() => {
        if (!client) {
            return () => {
                // No client -> no unsubbing.
            }
        }

        const sub = (() => {
            try {
                return client.subscribe(params, (message: object) => {
                    onMessageRef.current(message)
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
    }, [client, params])
}

export default useSubscription
