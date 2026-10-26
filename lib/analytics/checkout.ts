'use client'

import { itemFor } from './items'
import { trackBeginCheckout, trackPurchase } from './events'

/*
  Reports the checkout to analytics using what the SERVER says it charged (the create-order reply), never a number
  typed in the browser. Shared by every pay button: useUnlock (the five trade tools, the Grand Total and the
  Complete House Pack) and StructurePro's own checkout.
*/

interface CreatedOrder { orderId: string; amount: number; product?: string }

const orders = new Map<string, { appType: string; value: number }>()

/** The order exists on the server and the payment window is about to open: begin_checkout / InitiateCheckout */
export function orderCreated(order: CreatedOrder): void {
  try {
    const item = itemFor(order.product)
    if (!item || !order.orderId || !(order.amount > 0)) return
    const value = order.amount / 100 // paise to rupees
    orders.set(order.orderId, { appType: String(order.product), value })
    trackBeginCheckout({ ...item, price: value }, value)
  } catch { /* analytics never blocks a payment */ }
}

/** The server confirmed the payment: purchase / Purchase, once per order id */
export function paymentVerified(orderId: string): void {
  try {
    const o = orders.get(orderId)
    const item = o ? itemFor(o.appType) : null
    if (!o || !item) return
    trackPurchase(orderId, { ...item, price: o.value }, o.value)
  } catch { /* analytics never blocks a payment */ }
}
