import { SOCIAL_LINKS } from '@/lib/site-contact'
import { FacebookIcon, InstagramIcon, YouTubeIcon } from './SocialIcons'
import './social.css'

/**
 * Instagram, YouTube, Facebook: always in that order. Each opens in a new tab.
 */
export default function SocialLinks({ hi = false, className = '', where }: { hi?: boolean; className?: string; where: string }) {
  const tab = hi ? '(नए टैब में खुलता है)' : '(opens in a new tab)'
  const items = [
    { key: 'instagram', label: 'Instagram', href: SOCIAL_LINKS.instagram, icon: <InstagramIcon /> },
    { key: 'youtube', label: 'YouTube', href: SOCIAL_LINKS.youtube, icon: <YouTubeIcon /> },
    { key: 'facebook', label: 'Facebook', href: SOCIAL_LINKS.facebook, icon: <FacebookIcon /> },
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
