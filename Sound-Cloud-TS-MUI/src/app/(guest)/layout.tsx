export const metadata = {
  title: 'DJND Music - Hear the world’s sounds',
  description: 'Sign In and enjoy with your sound',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <>
        {children}
      </>
  )
}
