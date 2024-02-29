import { createContext } from 'react'
import type { StreamrClient } from '@streamr/sdk'

const ClientContext = createContext<StreamrClient | undefined>(undefined)

export default ClientContext
