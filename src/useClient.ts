import { useContext } from 'react'
import ClientContext from './ClientContext'

const useClient = () => (
    useContext(ClientContext)
)

export default useClient
