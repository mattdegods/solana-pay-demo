import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Keypair, Transaction } from '@solana/web3.js'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import BackLink from '../components/BackLink'
import Loading from '../components/Loading'
import {
  MakeTransactionInputData,
  MakeTransactionOutputData,
} from './api/makeTransaction'
import { FindReferenceError, findReference } from '@solana/pay'

export default function Checkout() {
  const router = useRouter()
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // read URL query params
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(router.query)) {
    if (value) {
      if (Array.isArray(value)) {
        // add multiple values for the same key
        for (const v of value) {
          searchParams.append(key, v)
        }
      } else {
        // only one value for the key
        searchParams.append(key, value)
      }
    }
  }

  // generate unique reference PK for this checkout session
  const reference = useMemo(() => Keypair.generate().publicKey, [])

  // add reference to the query params
  searchParams.append('reference', reference.toString())

  // use our API to fetch the transaction for the selected items
  const getTransaction = async () => {
    if (!publicKey) return

    const body: MakeTransactionInputData = {
      account: publicKey.toString(),
    }

    const response = await fetch(
      `/api/makeTransaction?${searchParams.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    const json = (await response.json()) as MakeTransactionOutputData

    if (response.status !== 200) {
      console.error(json)
      setMessage(json.message)
      return
    }

    // now that we have a txn response let's deserialize it
    const txn = Transaction.from(Buffer.from(json.transaction, 'base64'))
    setTransaction(txn)
    setMessage(json.message)
    console.log('Successful txn: ', txn)
  }

  useEffect(() => {
    getTransaction()
  }, [publicKey])

  // send the transaction to the network
  const trySendTransaction = async () => {
    if (!transaction) return
    try {
      await sendTransaction(transaction, connection)
    } catch (err) {
      console.log('Failed to send transaction: ', err)
    }
  }

  useEffect(() => {
    trySendTransaction()
  }, [transaction])

  // Check every 0.5s if the transaction is completed
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Check if there is any transaction for the reference
        const signatureInfo = await findReference(connection, reference)
        router.push('/confirmed')
      } catch (e) {
        if (e instanceof FindReferenceError) {
          // No transaction found yet, ignore this error
          return
        }
        console.error('Unknown error', e)
      }
    }, 500)
    return () => {
      clearInterval(interval)
    }
  }, [])

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center gap-8">
        <div>
          <BackLink href="/">Cancel</BackLink>
        </div>

        <WalletMultiButton />

        <p>You need to connect your wallet to make transactions</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div>
        <BackLink href="/">Cancel</BackLink>
      </div>

      <WalletMultiButton />

      {message ? (
        <p>{message} Please approve the transaction using your wallet</p>
      ) : (
        <p>
          Creating transaction... <Loading />
        </p>
      )}
    </div>
  )
}
