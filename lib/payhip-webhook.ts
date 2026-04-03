/**
 * Payhip "paid" webhook body (see Payhip Developer / Webhooks help).
 * price is typically in cents for the order total.
 */
export type PayhipPaidPayload = {
  type?: string;
  id?: string;
  email?: string;
  price?: number;
  currency?: string;
  items?: Array<{
    product_id?: string;
    product_name?: string;
    product_key?: string;
    product_permalink?: string;
  }>;
  signature?: string;
};

export function parsePayhipPaid(body: unknown): {
  amount_cents: number;
  description: string;
  transaction_id: string;
} | null {
  if (!body || typeof body !== "object") return null;
  const b = body as PayhipPaidPayload;
  if (b.type !== "paid") return null;
  const price = typeof b.price === "number" ? b.price : 0;
  const amount_cents = Math.max(0, Math.round(price));
  const item = b.items?.[0];
  const name = item?.product_name?.trim() || "Payhip sale";
  const id = typeof b.id === "string" ? b.id : "unknown";
  return {
    amount_cents,
    description: `Payhip: ${name} (tx ${id})`,
    transaction_id: id,
  };
}
