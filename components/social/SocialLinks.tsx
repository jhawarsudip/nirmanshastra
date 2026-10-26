import { SOCIAL_LINKS, WHATSAPP_NUMBER, whatsappUrl } from '@/lib/site-contact'
import { FacebookIcon, InstagramIcon, WhatsAppIcon, YouTubeIcon } from './SocialIcons'

/**
 * Instagram, YouTube, Facebook, WhatsApp: always in that order. Each opens in a new tab.
 * The WhatsApp link is left out when no number is configured.
 */
export default function SocialLinks({ hi = false, className = '', where }: { hi?: boolean; className?: string; where: string }) {
  const tab = hi ? '(नए टैब में खुलता है)' : '(opens in a new tab)'
  const items = [
    { key: 'instagram', label: 'Instagram', href: SOCIAL_LINKS.instagram, icon: <InstagramIcon /> },
    { key: 'youtube', label: 'YouTube', href: SOCIAL_LINKS.youtube, icon: <YouTubeIcon /> },
    { key: 'facebook', label: 'Facebook', href: SOCIAL_LINKS.facebook, icon: <FacebookIcon /> },
    ...(WHATSAPP_NUMBER ? [{ key: 'whatsapp', label: 'WhatsApp', href: whatsappUrl(), icon: <WhatsAppIcon /> }] : []),
  ]
  return (
    <ul className={`ns-social${className ? ` ${className}` : ''}`} data-ns-where={where} aria-label={hi ? 'हमें यहाँ ढूँढें' : 'Find us on'}>
      {items.map(it => (
        <li key={it.key}>
          <a href={it.href} target="_blank" rel="noopener" aria-label={`${it.label} ${tab}`} title={it.label}>
            {it.icon}
          </a>
        </li>
      ))}
    </ul>
  )
}
