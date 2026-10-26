'use client'

import { usePathname } from 'next/navigation'
import { WHATSAPP_NUMBER, whatsappMessageFor, whatsappUrl } from '@/lib/site-contact'
import { WhatsAppIcon } from './SocialIcons'
import './whatsapp.css'

/**
 * The floating WhatsApp button, bottom-left (the "Ask NirmanShastra" chat is bottom-right).
 * The message it pre-fills depends on the page: "Hi, I have a question about StructurePro." on the StructurePro page.
 * Not shown on the admin screens, or when no WhatsApp number is configured.
 */
export default function WhatsAppButton() {
  const pathname = usePathname() || '/'
  if (!WHATSAPP_NUMBER || pathname.startsWith('/admin')) return null
  const hi = pathname === '/hi' || pathname.startsWith('/hi/')
  const label = hi ? 'WhatsApp पर पूछें' : 'Chat on WhatsApp'
  return (
    <a
      className="ns-wa"
      href={whatsappUrl(whatsappMessageFor(pathname))}
      target="_blank"
      rel="noopener"
      aria-label={`${label} ${hi ? '(नए टैब में खुलता है)' : '(opens in a new tab)'}`}
      data-ns-where="floating_button"
    >
      <WhatsAppIcon width={24} height={24} />
      <span className="ns-wa__label">{label}</span>
    </a>
  )
}
