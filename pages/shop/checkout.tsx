import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef } from 'react'
import BackLink from '../../components/BackLink'
import PageHeading from '../../components/PageHeading'
import calculatePrice from '../../lib/calculatePrice'
import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js'
import {
  FindReferenceError,
  TransactionRequestURLFields,
  TransferRequestURLFields,
  ValidateTransferError,
  createQR,
  encodeURL,
  findReference,
  validateTransfer,
} from '@solana/pay'
import { usdcAddress, shopAddress } from '../../lib/addresses'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'

export default function Checkout() {
  const router = useRouter()

  // ref to a div where we'll show the QR code
  const qrRef = useRef<HTMLDivElement>(null)

  const amount = useMemo(() => calculatePrice(router.query), [router.query])

  // unique address that we can listen for payments to
  const reference = useMemo(() => Keypair.generate().publicKey, [])

  // read the URL query (which includes our chosen products)
  const searchParams = new URLSearchParams({ reference: reference.toString() })
  for (const [key, value] of Object.entries(router.query)) {
    if (value) {
      if (Array.isArray(value)) {
        for (const v of value) {
          searchParams.append(key, v)
        }
      } else {
        searchParams.append(key, value)
      }
    }
  }

  // get a connection to Solana devnet
  const network = WalletAdapterNetwork.Devnet
  const endpoint = clusterApiUrl(network)
  const connection = new Connection(endpoint)

  // show the QR code
  useEffect(() => {
    const { location } = window
    // this URL on localhost looks something like
    // http://localhost:3000/api/makeTransaction?reference=abc&rossa-geshe=1
    const apiUrl = `${location.protocol}//${
      location.host
    }/api/makeTransaction?${searchParams.toString()}`
    const urlParams: TransactionRequestURLFields = {
      link: new URL(apiUrl),
      label: 'Upstate Coffee Collective',
      message: 'Thanks for your order! ☕️',
    }
    const solanaUrl = encodeURL(urlParams)
    const qr = createQR(solanaUrl, 512, 'transparent')
    if (qrRef.current && amount.isGreaterThan(0)) {
      qrRef.current.innerHTML = ''
      qr.append(qrRef.current)
    }
  })

  // Check every 0.5s if the transaction is completed
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Check if there is any transaction for the reference
        const signatureInfo = await findReference(connection, reference, {
          finality: 'confirmed',
        })
        // Validate that the transaction has the expected recipient, amount and SPL token
        await validateTransfer(
          connection,
          signatureInfo.signature,
          {
            recipient: shopAddress,
            amount,
            splToken: usdcAddress,
            reference,
          },
          { commitment: 'confirmed' }
        )
        router.push('/shop/confirmed')
      } catch (e) {
        if (e instanceof FindReferenceError) {
          // No transaction found yet, ignore this error
          return
        }
        if (e instanceof ValidateTransferError) {
          // Transaction is invalid
          console.error('Transaction is invalid', e)
          return
        }
        console.error('Unknown error', e)
      }
    }, 500)
    return () => {
      clearInterval(interval)
    }
  }, [amount])

  return (
    <div className="flex flex-col items-center gap-8">
      <BackLink href="/shop">Cancel</BackLink>
      <PageHeading>Checkout ${amount.toString()}</PageHeading>

      <div ref={qrRef} />
    </div>
  )
}
