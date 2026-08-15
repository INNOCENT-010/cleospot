// POST /api/orders — creates a pending order + line items, applies a discount code
// if provided, then kicks off a Paystack transaction and returns the checkout URL.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { paystackInitializeTransaction } from "@/lib/paystack";

function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateReference() {
  return `CLPOT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customer_name, customer_phone, customer_email, customer_address, delivery_city, items, discount_code } = body;
    const deliveryFee = Number(body.delivery_fee) || 0;
    const deliveryLat = body.delivery_lat || null;
    const deliveryLng = body.delivery_lng || null;

    if (!customer_name || !customer_phone || !customer_email || !customer_address || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Resolve customer_id if this email matches a registered user
    let customerId: string | null = null;
    const { data: authUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", customer_email)
      .maybeSingle();
    if (authUser?.id) customerId = authUser.id;

    // Fallback: check auth.users directly
    if (!customerId) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const match = users.find((u) => u.email === customer_email);
      if (match) customerId = match.id;
    }

    const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

    let discountTotal = 0;
    let discountCodeId: string | null = null;

    if (discount_code) {
      const { data: codeRow } = await supabaseAdmin
        .from("discount_codes")
        .select("*")
        .eq("code", discount_code)
        .eq("is_active", true)
        .single();

      if (codeRow) {
        const notExpired = !codeRow.expires_at || new Date(codeRow.expires_at) > new Date();
        const underLimit = !codeRow.max_uses || codeRow.used_count < codeRow.max_uses;
        if (notExpired && underLimit) {
          discountTotal = codeRow.percent_off
            ? (subtotal * codeRow.percent_off) / 100
            : codeRow.amount_off || 0;
          discountCodeId = codeRow.id;
        }
      }
    }

    const total = Math.max(subtotal - discountTotal + deliveryFee, 0);
    const reference = generateReference();

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name,
        customer_phone,
        customer_email,
        customer_address,
        delivery_city,
        delivery_lat: deliveryLat,
        delivery_lng: deliveryLng,
        customer_id: customerId,
        subtotal,
        discount_total: discountTotal,
        discount_code_id: discountCodeId,
        delivery_fee: deliveryFee,
        total,
        status: "pending",
        delivery_pin: generatePin(),
        paystack_reference: reference
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || "Could not create order" }, { status: 500 });
    }

    const orderItems = items.map((i: any) => ({
      order_id: order.id,
      meal_id: i.meal_id,
      meal_name: i.name,
      unit_price: i.price,
      quantity: i.quantity
    }));
    await supabaseAdmin.from("order_items").insert(orderItems);

    if (discountCodeId) {
      try {
        await supabaseAdmin.rpc("increment_discount_usage", { code_id: discountCodeId });
      } catch {
        // Non-fatal
      }
    }

    const paystackRes = await paystackInitializeTransaction({
      email: customer_email,
      amountKobo: Math.round(total * 100),
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order/${order.id}`,
      metadata: { order_id: order.id }
    });

    if (!paystackRes.status) {
      return NextResponse.json({ error: paystackRes.message || "Payment initialization failed" }, { status: 500 });
    }

    return NextResponse.json({
      order_id: order.id,
      authorization_url: paystackRes.data.authorization_url
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unexpected error" }, { status: 500 });
  }
}