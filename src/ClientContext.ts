import { createContext } from 'react'
import StreamrClient from 'streamr-client'

const ClientContext = createContext<StreamrClient | undefined>(undefined)

export default ClientContext
