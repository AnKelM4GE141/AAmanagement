'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

export default function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <Button variant="ghost" onClick={handleSignOut}>
      Sign Out
    </Button>
  )
}
