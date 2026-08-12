const PAYSTACK_BASE = "https://api.paystack.co";

export async function paystackInitializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callback_url: string;
  metadata?: Record<string, unknown>;
}) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callback_url,
      metadata: params.metadata
    })
  });
  if (!res.ok) throw new Error(`Paystack initialize failed: ${res.status}`);
  return res.json();
}

export async function paystackVerifyTransaction(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
  });
  if (!res.ok) throw new Error(`Paystack verify failed: ${res.status}`);
  return res.json();
}
