import { useContext } from 'react'
import ClientContext from '../contexts/Client'

const useClient = () => (
    useContext(ClientContext)
)

export default useClient
