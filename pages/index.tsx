import Products from '../components/Products'
import SiteHeading from '../components/SiteHeading'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

export default function HomePage() {
  const { publicKey } = useWallet()

  return (
    <div className="m-auto flex max-w-4xl flex-col items-stretch gap-8">
      <SiteHeading>Cookies Inc</SiteHeading>

      {/* We add the Solana wallet connect button */}
      <div className="mx-auto w-fit">
        <WalletMultiButton className="!bg-gray-900 transition-transform duration-300 ease-in-out hover:scale-105" />
      </div>

      {/* We disable checking out without a connected wallet */}
      <Products submitTarget="/checkout" enabled={publicKey !== null} />
    </div>
  )
}
