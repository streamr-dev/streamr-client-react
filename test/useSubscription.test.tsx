import * as React from 'react'
import { StreamrClient, Stream } from 'streamr-client'
import useClient from '~/useClient'
import useSubscription from '~/useSubscription'
import { renderHook } from '@testing-library/react-hooks'
import Provider from '~/Provider'

describe('useSubscription', () => {
    let stream: Stream
    let client: StreamrClient
    let cleanup: () => void

    // Use a fixed throwaway account for auth because StreamrClient.generateEthereumAccount
    // sometimes hangs Jest execution
    const auth = {
        address: '0x1a2eF67199a150D5C2E1A6BD62F46027C0574970',
        privateKey: 'df23b47ac6aaf10df08d6b89b05236c256a63036cee0e36b72e88cc647ff740b',
    }
    const wrapper = ({ children }: { children: React.ReactNode }): JSX.Element => (
        <Provider auth={auth}>{children}</Provider>
    )
    let isSetup = false
    beforeEach(async () => {
        // async beforeAll behaves strangely
        if (isSetup) {
            return
        }
        isSetup = true

        const { result, unmount } = renderHook(() => useClient(), { wrapper })
        cleanup = unmount
        client = result.current!
        stream = await client.createStream('/test-stream')
    }, 20000)

    afterAll(() => {
        cleanup()
    })

    // We have to figure out how to make it work in an environment in which you cannot do anything
    // if you ran out of gas.
    xit('creates a subscription', async () => {
        type Msg = { value: number }

        function useUseSubscription() {
            const [isActive, setIsActive] = React.useState(true)
            useSubscription<Msg>(stream, {
                onMessage(msg) {
                    received.push(msg)
                    if (received.length === NUM_MSGS) {
                        setIsActive(false)
                    }
                },
                onUnsubscribed,
                onError,
                isActive
            })
        }

        const received: Msg[] = []
        const published: Msg[] = []
        const NUM_MSGS = 3
        let onUnsubscribed: () => void
        let onError: (err: Error) => void
        const waitForUnsubscribe = new Promise((resolve, reject) => {
            onUnsubscribed = () => resolve(undefined)
            onError = reject
        })

        const { result, unmount } = renderHook(() =>  useUseSubscription(), { wrapper })

        for (let i = 0; i < NUM_MSGS; i += 1) {
            const msg: Msg = { value: i }
            published.push(msg)
            await client.publish(stream, msg)
        }

        await waitForUnsubscribe

        try {
            expect(result.current).toBeInstanceOf(StreamrClient)
            expect(received).toEqual(published)
        } finally {
            unmount()
        }
    })
})
