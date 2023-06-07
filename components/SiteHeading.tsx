import { PropsWithChildren } from 'react'

export default function SiteHeading({ children }: PropsWithChildren<{}>) {
  return (
    <h1 className="self-center text-5xl font-extrabold text-black">
      {children}
    </h1>
  )
}
