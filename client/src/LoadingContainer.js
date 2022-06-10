import React, { useState, useEffect } from "react"
import { getWeb3, getContracts } from "./utils.js"
import App from "./App.js"

function LoadingContainer() {
    const [web3, setWeb3] = useState(undefined)
    const [accounts, setAccounts] = useState([])
    const [contracts, setContracts] = useState(undefined)

    const isReady = () => {
        return (
            typeof web3 !== "undefined"
            && typeof contracts !== "undefined"
            && accounts.length > 0
        )
    }

    useEffect(() => {
        const init = async () => {
            const web3 = await getWeb3()
            const contracts = await getContracts(web3)
            const accounts = await web3.eth.getAccounts()

            setWeb3(web3)
            setContracts(contracts)
            setAccounts(accounts)
        }

        init()
    }, [])

    if (!isReady()) {
        return (
            <div>Loading...</div>
        )
    } else {
        return (
            <App web3={web3} contracts={contracts} accounts={accounts} />
        )
    }
}

export default LoadingContainer