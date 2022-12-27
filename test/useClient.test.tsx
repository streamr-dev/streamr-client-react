import * as React from 'react'
import { StreamrClient, CONFIG_TEST } from 'streamr-client'
import useClient from '~/useClient'
import { renderHook } from '@testing-library/react-hooks'
import Provider from '~/Provider'

const wrapper = ({ children }: { children: React.ReactNode }): JSX.Element => (
    <Provider {...CONFIG_TEST}>{children}</Provider>
)

describe('useClient', () => {
    it('creates a client', () => {
        const { result, unmount } = renderHook(() => useClient(), { wrapper })

        try {
            expect(result.current).toBeInstanceOf(StreamrClient)
        } finally {
            unmount()
        }
    })

    it('destroys client on unmount', async () => {
        const { result, unmount } = renderHook(() => useClient(), { wrapper })

        try {
            expect(result.current).toBeInstanceOf(StreamrClient)
            const client = result.current!

            unmount()
            // @ts-expect-error `destroySignal` is private.
            expect(client.destroySignal.isDestroyed()).toBe(true)
        } finally {
            unmount()
        }
    })

    it('uses same client when options unchanged', () => {
        const { result, rerender, unmount } = renderHook(() => useClient(), { wrapper })

        try {
            expect(result.current).toBeInstanceOf(StreamrClient)
            const prev = result.current
            rerender()
            expect(result.current).toBe(prev)
        } finally {
            unmount()
        }
    })

    it('creates a new client when provider options change', () => {
        let gapFill = true

        const wrapperWithOptions = ({ children }: { children: React.ReactNode }): JSX.Element => (
            <Provider {...CONFIG_TEST} gapFill={gapFill}>{children}</Provider>
        )

        const { result, rerender, unmount } = renderHook(() => useClient(), { wrapper: wrapperWithOptions })

        try {
            expect(result.current).toBeInstanceOf(StreamrClient)
            const prev = result.current
            gapFill = false
            rerender()
            expect(result.current).not.toBe(prev)
        } finally {
            unmount()
        }
    })

    it('creates a new client when hook arguments are present', () => {
        const result0 = renderHook(() => useClient(), { wrapper })

        const result1 = renderHook(() => useClient({}), { wrapper })

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
