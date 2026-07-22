import { useEffect, useState } from 'react'
import { load, save } from '../lib/storage'

// Deliberately local only, not part of the synced workspace doc: each
// person's name belongs to their own device/browser, not the shared data.
export function useUserName() {
  const [name, setName] = useState(() => load('userName', ''))

  useEffect(() => {
    save('userName', name || null)
  }, [name])

  return [name, setName] as const
}
