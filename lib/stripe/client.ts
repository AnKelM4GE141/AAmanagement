// Server-side Stripe client and utility functions
// IMPORTANT: This file should only be used on the server (API routes, server components)

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import type { SavedPaymentMethod } from '@/lib/types/payment'

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
})

// Stripe fee constants
const STRIPE_ACH_FEE_PERCENT = 0.008 // 0.8%
const STRIPE_ACH_FEE_CAP = 500 // $5.00 in cents
const STRIPE_CARD_FEE_PERCENT = 0.029 // 2.9%
const STRIPE_CARD_FEE_FIXED = 30 // $0.30 in cents

/**
 * Get or create a Stripe customer for a user
 * @param userId - User ID from users_profile table
 * @param email - User's email address
 * @param name - User's full name
 * @returns Stripe customer ID
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<string> {
  const supabase = await createClient()

  // Check if user already has saved payment methods (which means they have a customer ID)
  const { data: existingMethod } = await supabase
    .from('payment_methods')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (existingMethod?.stripe_customer_id) {
    return existingMethod.stripe_customer_id
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      user_id: userId,
    },
  })

  return customer.id
}

/**
 * Calculate Stripe fee based on payment method
 * @param amountCents - Amount in cents
 * @param method - Payment method type ('ach' or 'card')
 * @returns Fee amount in cents
 */
export function calculateStripeFee(
  amountCents: number,
  method: 'ach' | 'card'
): number {
  if (method === 'ach') {
    // ACH: 0.8% capped at $5
    const fee = Math.round(amountCents * STRIPE_ACH_FEE_PERCENT)
    return Math.min(fee, STRIPE_ACH_FEE_CAP)
  } else {
    // Card: 2.9% + $0.30
    return Math.round(amountCents * STRIPE_CARD_FEE_PERCENT) + STRIPE_CARD_FEE_FIXED
  }
}

/**
 * Convert dollars to cents for Stripe
 * @param dollars - Amount in dollars
 * @returns Amount in cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

/**
 * Convert cents to dollars
 * @param cents - Amount in cents
 * @returns Amount in dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100
}

/**
 * Create a Payment Intent for a one-time payment
 * @param customerId - Stripe customer ID
 * @param amountCents - Amount in cents
 * @param paymentMethodId - Optional: Stripe payment method ID to use
 * @param metadata - Additional metadata to attach
 * @returns Stripe Payment Intent
 */
export async function createPaymentIntent(
  customerId: string,
  amountCents: number,
  paymentMethodId?: string,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent> {
  const intentParams: Stripe.PaymentIntentCreateParams = {
    amount: amountCents,
    currency: 'usd',
    customer: customerId,
    metadata: metadata || {},
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never', // Don't allow redirect-based payment methods
    },
  }

  // If payment method is provided, attach it
  if (paymentMethodId) {
    intentParams.payment_method = paymentMethodId
    intentParams.confirm = false // Don't auto-confirm, let client handle
  }

  const paymentIntent = await stripe.paymentIntents.create(intentParams)
  return paymentIntent
}

/**
 * Retrieve payment method details from Stripe
 * @param paymentMethodId - Stripe payment method ID
 * @returns Payment method object
 */
export async function getPaymentMethodDetails(
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  return await stripe.paymentMethods.retrieve(paymentMethodId)
}

/**
 * Attach a payment method to a customer
 * @param paymentMethodId - Stripe payment method ID
 * @param customerId - Stripe customer ID
 * @returns Updated payment method
 */
export async function attachPaymentMethodToCustomer(
  paymentMethodId: string,
  customerId: string
): Promise<Stripe.PaymentMethod> {
  return await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  })
}

/**
 * Detach a payment method from a customer
 * @param paymentMethodId - Stripe payment method ID
 */
export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<void> {
  await stripe.paymentMethods.detach(paymentMethodId)
}

/**
 * Save payment method details to database
 * @param userId - User ID
 * @param stripePaymentMethod - Stripe payment method object
 * @param customerId - Stripe customer ID
 * @param isDefault - Whether this is the default payment method
 * @returns Saved payment method record
 */
export async function savePaymentMethodToDatabase(
  userId: string,
  stripePaymentMethod: Stripe.PaymentMethod,
  customerId: string,
  isDefault: boolean = false
): Promise<SavedPaymentMethod> {
  const supabase = await createClient()

  // Determine payment method type
  let type: 'ach' | 'card'
  let last4: string | null = null
  let bankName: string | null = null
  let cardBrand: string | null = null
  let expMonth: number | null = null
  let expYear: number | null = null

  if (stripePaymentMethod.type === 'us_bank_account') {
    type = 'ach'
    last4 = stripePaymentMethod.us_bank_account?.last4 || null
    bankName = stripePaymentMethod.us_bank_account?.bank_name || null
  } else if (stripePaymentMethod.type === 'card') {
    type = 'card'
    last4 = stripePaymentMethod.card?.last4 || null
    cardBrand = stripePaymentMethod.card?.brand || null
    expMonth = stripePaymentMethod.card?.exp_month || null
    expYear = stripePaymentMethod.card?.exp_year || null
  } else {
    throw new Error(`Unsupported payment method type: ${stripePaymentMethod.type}`)
  }

  // If this is set as default, unset any existing defaults
  if (isDefault) {
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true)
  }

  // Insert payment method
  const { data, error } = await supabase
    .from('payment_methods')
    .insert({
      user_id: userId,
      stripe_payment_method_id: stripePaymentMethod.id,
      stripe_customer_id: customerId,
      type,
      is_default: isDefault,
      last4,
      bank_name: bankName,
      card_brand: cardBrand,
      exp_month: expMonth,
      exp_year: expYear,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save payment method: ${error.message}`)
  }

  return data
}

/**
 * Refund a payment
 * @param paymentIntentId - Stripe payment intent ID
 * @param amountCents - Optional: Amount to refund in cents (for partial refund)
 * @param reason - Optional: Reason for refund
 * @returns Stripe refund object
 */
export async function refundPayment(
  paymentIntentId: string,
  amountCents?: number,
  reason?: string
): Promise<Stripe.Refund> {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  }

  if (amountCents) {
    refundParams.amount = amountCents
  }

  if (reason) {
    refundParams.reason = reason as Stripe.RefundCreateParams.Reason
  }

  return await stripe.refunds.create(refundParams)
}

/**
 * Construct and verify Stripe webhook event
 * @param payload - Raw request body
 * @param signature - Stripe signature header
 * @returns Verified Stripe event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
