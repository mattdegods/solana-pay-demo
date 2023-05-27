import { PropsWithChildren } from 'react'

export default function SiteHeading({ children }: PropsWithChildren<{}>) {
  return (
    <h1
      className="mt-8 mb-4 self-center bg-gradient-to-r from-fuchsia-600 
      to-pink-600 bg-clip-text text-6xl font-extrabold text-transparent"
    >
      {children}
    </h1>
  )
}
