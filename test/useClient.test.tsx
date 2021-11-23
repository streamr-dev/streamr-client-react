import * as React from 'react'
import { StreamrClient, ConfigTest } from 'streamr-client'
import useClient from '~/useClient'
import { renderHook, act } from '@testing-library/react-hooks'
import Provider from '~/Provider'

describe('useClient', () => {
    const wrapper = ({ children }: { children: React.ReactNode }): JSX.Element => (
        <Provider {...ConfigTest}>{children}</Provider>
    )
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
        const onDestroy = jest.fn()
        try {
            expect(result.current).toBeInstanceOf(StreamrClient)
            const client = result.current!
            client.onDestroy(onDestroy)
            const onDestroyTask = client.onDestroy()
            unmount()
            // immediately destroyed
            expect(client.isDestroyed()).toBe(true)
            await onDestroyTask
            expect(onDestroy).toHaveBeenCalledTimes(1)
        } finally {
            unmount()
        }
    })

    it('uses same client when options unchanged', () => {
        let { result, rerender, unmount } = renderHook(() => useClient(), { wrapper })
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
            <Provider {...ConfigTest} gapFill={gapFill}>{children}</Provider>
        )
        let { result, rerender, unmount } = renderHook(() => useClient(), { wrapper: wrapperWithOptions })
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
})
