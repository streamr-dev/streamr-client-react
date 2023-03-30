import * as React from 'react'
import { StreamrClient, CONFIG_TEST, StreamrClientConfig } from 'streamr-client'
import useClient from '~/useClient'
import { renderHook } from '@testing-library/react-hooks'
import Provider from '~/Provider'

function defaultFn() {
    return useClient()
}

interface WrapperProps extends StreamrClientConfig {
    children?: React.ReactNode
}

async function ourRenderHook(fn: () => any = defaultFn, initialProps: StreamrClientConfig = {}) {
    const wrapper: React.FC<WrapperProps> = ({ children, ...props }: WrapperProps) => {
        return <Provider {...CONFIG_TEST} {...props}>{children}</Provider>
    }

    const { result, unmount, rerender, waitForValueToChange } = renderHook(fn, {
        wrapper,
        initialProps,
    })

    await waitForValueToChange(() => !!result.current)

    return {
        result,
        unmount,
        rerender,
        waitForValueToChange,
    }
}

describe('useClient', () => {
    it('creates a client', async () => {
        const { result, unmount } = await ourRenderHook()

        try {
            expect(result.current).toBeInstanceOf(StreamrClient)
        } finally {
            unmount()
        }
    })

    it('destroys client on unmount', async () => {
        const { result, unmount } = await ourRenderHook()

        try {
            expect(result.current).toBeInstanceOf(StreamrClient)
            const client = result.current!

            unmount()

            expect(client.destroySignal.isDestroyed()).toBe(true)
        } finally {
            unmount()
        }
    })

    it('uses same client when options unchanged', async () => {
        const { result, rerender, unmount } = await ourRenderHook()

        try {
            expect(result.current).toBeInstanceOf(StreamrClient)
            const prev = result.current
            rerender()
            expect(result.current).toBe(prev)
        } finally {
            unmount()
        }
    })

    it('creates a new client when provider options change', async () => {
        const { result, rerender, unmount, waitForValueToChange } = await ourRenderHook(undefined, {
            gapFill: true,
        })

        try {
            expect(result.current).toBeInstanceOf(StreamrClient)

            const prev = result.current

            rerender({ gapFill: false })

            await waitForValueToChange(() => !!result.current && prev !== result.current)
        } finally {
            unmount()
        }
    })

    it('creates a new client when hook arguments are present', async () => {
        const result0 = await ourRenderHook()

        const result1 = await ourRenderHook(() => useClient({}))

        try {
            expect(result0.result.current).toBeInstanceOf(StreamrClient)
            expect(result1.result.current).toBeInstanceOf(StreamrClient)
            expect(result0.result).not.toBe(result1.result)
        } finally {
            result0.unmount()
            result1.unmount()
        }
    })
})
