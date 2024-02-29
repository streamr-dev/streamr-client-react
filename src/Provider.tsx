import React, { type ReactNode, type ReactElement } from 'react'
import ClientContext from './ClientContext'
import type { StreamrClientConfig } from '@streamr/sdk'
import useClient from './useClient'

export interface Props extends StreamrClientConfig {
    children: ReactNode
    cacheKey?: string | number | undefined
}

export default function Provider({ children, cacheKey, ...props }: Props): ReactElement | null {
    const client = useClient(props, cacheKey)

    return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
}
