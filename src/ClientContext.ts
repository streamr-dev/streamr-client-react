import { createContext } from 'react'
import StreamrClient from 'streamr-client'

const ClientContext = createContext<typeof StreamrClient>(undefined)

export default ClientContext
