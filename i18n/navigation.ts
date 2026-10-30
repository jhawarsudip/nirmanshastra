import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * Locale-aware replacements for next/link and next/navigation.
 *
 * Use these everywhere inside the page tree (app/[locale]/...). A link written as
 * href="/tools/structopro" becomes /hi/tools/structopro on a Hindi page, so a visitor
 * who chose Hindi stays in Hindi. Do NOT use them outside the page tree (the admin
 * screen, the root layout's consent banner): there is no locale there.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
