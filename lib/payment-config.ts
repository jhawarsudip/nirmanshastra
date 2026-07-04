// Central payment bypass flag. Controls whether payment verification is skipped.
// Set PAYMENT_BYPASS=false and NEXT_PUBLIC_PAYMENT_BYPASS=false in .env.local before real launch.
// Client components read NEXT_PUBLIC_PAYMENT_BYPASS; server routes read PAYMENT_BYPASS.
export const PAYMENT_BYPASS =
  process.env.NEXT_PUBLIC_PAYMENT_BYPASS === 'true' ||
  process.env.PAYMENT_BYPASS === 'true'
