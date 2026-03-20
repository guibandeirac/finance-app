import type { Metadata } from 'next'
import { ConfigClient } from './ConfigClient'

export const metadata: Metadata = {
  title: 'Configurações',
}

export default function ConfigPage() {
  return <ConfigClient />
}
