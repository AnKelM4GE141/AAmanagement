import SigningView from './SigningView'

interface SignPageProps {
  params: Promise<{ token: string }>
}

export default async function SignPage({ params }: SignPageProps) {
  const { token } = await params
  return <SigningView token={token} />
}
