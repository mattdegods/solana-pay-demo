import Products from '../../components/Products'
import SiteHeading from '../../components/SiteHeading'

export default function ShopPage() {
  return (
    <div className="m-auto flex max-w-4xl flex-col items-stretch gap-8">
      <div className="mx-auto w-fit">
        <img src="/upcc.jpg" width={100} height={100} alt="upcc icon" />
      </div>
      <SiteHeading>Upstate Coffee Collective</SiteHeading>
      <Products submitTarget="/shop/checkout" enabled={true} />{' '}
    </div>
  )
}
