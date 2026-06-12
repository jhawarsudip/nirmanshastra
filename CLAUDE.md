# CLAUDE.md — NirmanShastra

## READ FIRST — EVERY SESSION
- Before any task, read docs/NirmanShastra_Build_Reference.md and docs/NirmanShastra_Design_Spec.md fully. Design Spec supersedes Section 3 of the build reference.
- IS-code values in Build Reference Section 8 are LOCKED. Never alter them from any other source.
- Calculation logic is PORTED from HTML apps in docs/ — never invented from scratch.
- PDFs use @react-pdf/renderer only. Never Puppeteer.
- Razorpay: server-side HMAC SHA256 only. Key Secret never client-side. Paid content revealed only after server verification.
- Vastu Gold #C9A84C in VastuPro only. Never in paid tools.
- IBM Plex Mono for every number, rate, IS clause, and table numeral on the site.
- One task at a time. Verify locally, then commit to GitHub.

## TECH STACK
- Next.js 15 App Router + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS)
- Razorpay payments (server-side only)
- Resend emails
- @react-pdf/renderer for all PDFs
- Claude API for AI chatbox (build last)
- Vercel deployment

## BUILD ORDER
1. Project scaffold + design system
2. Supabase schema + lead capture
3. VastuPro (free tool, no payment)
4. StructoPro (first paid tool)
5. PDFs for both
6. Homepage
7. Remaining 4 tools
8. Admin dashboard
9. AI chatbox (last)

## NEVER DO
- Never expose RAZORPAY_KEY_SECRET to client
- Never reveal paid quantities before server HMAC verification
- Never use Puppeteer
- Never change IS code values in Section 8
- Never invent calculation logic — always port from docs/ HTML files


