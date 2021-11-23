import { useContext } from 'react'
import ClientContext from './ClientContext'
import type { StreamrClient } from 'streamr-client'

export default function useClient(): StreamrClient | undefined {
    return useContext(ClientContext)
}
