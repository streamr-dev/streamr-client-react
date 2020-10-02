import { createContext } from 'react'
import StreamrClient from 'streamr-client'

const ClientContext: React.Context<typeof StreamrClient> = createContext(null)

export default ClientContext
