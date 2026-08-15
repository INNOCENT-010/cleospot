export function orderConfirmationHtml({
  customerName,
  orderId,
  items,
  total,
  deliveryFee,
  address,
  pin,
  hasAccount,
}: {
  customerName: string;
  orderId: string;
  items: { meal_name: string; quantity: number; unit_price: number }[];
  total: number;
  deliveryFee: number;
  address: string;
  pin: string;
  hasAccount: boolean;
}) {
  const orderUrl = `https://cleospot.vercel.app/order/${orderId}`;
  const signupUrl = `https://cleospot.vercel.app/account/signup`;

  const itemsHtml = items.map((i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f5ede4;font-size:14px;color:#1a0a00;">
        ${i.quantity}× ${i.meal_name}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f5ede4;font-size:14px;color:#1a0a00;text-align:right;font-weight:600;">
        ₦${(i.unit_price * i.quantity).toLocaleString()}
      </td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fdf8f3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f3;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1a0a00;padding:32px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:#e8a87c;text-transform:uppercase;">CLeo's Pot</p>
            <h1 style="margin:0;font-size:36px;color:#ffffff;font-family:Georgia,serif;font-style:italic;">Today's Plates</h1>
            <p style="margin:8px 0 0;font-size:13px;color:#c9a98a;">Your order is confirmed 🎉</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 24px;font-size:15px;color:#1a0a00;">Hi <strong>${customerName.split(" ")[0]}</strong>,</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b4f3a;line-height:1.6;">
              We've received your order and it's being prepared with care. We'll have it with you soon.
            </p>

            <!-- Order items -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td colspan="2" style="padding-bottom:8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#b07040;font-weight:600;">Your order</td>
              </tr>
              ${itemsHtml}
              <tr>
                <td style="padding:12px 0 4px;font-size:13px;color:#6b4f3a;">Delivery</td>
                <td style="padding:12px 0 4px;font-size:13px;color:#6b4f3a;text-align:right;">₦${deliveryFee.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:16px;font-weight:700;color:#1a0a00;">Total</td>
                <td style="padding:4px 0;font-size:16px;font-weight:700;color:#E30613;text-align:right;">₦${total.toLocaleString()}</td>
              </tr>
            </table>

            <!-- Delivery address -->
            <div style="background:#fdf8f3;border-radius:10px;padding:16px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#b07040;font-weight:600;">Delivering to</p>
              <p style="margin:0;font-size:14px;color:#1a0a00;">${address}</p>
            </div>

            <!-- PIN -->
            <div style="background:#fff0f0;border:1px solid #fecaca;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#E30613;font-weight:600;">Delivery PIN</p>
              <p style="margin:0;font-size:36px;font-weight:800;color:#E30613;letter-spacing:8px;font-family:monospace;">${pin}</p>
              <p style="margin:6px 0 0;font-size:12px;color:#6b4f3a;">Give this to your rider to confirm delivery</p>
            </div>

            <!-- Track button -->
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${orderUrl}" style="display:inline-block;background:#E30613;color:#ffffff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.5px;">
                Track my order →
              </a>
            </div>

            <!-- Account upsell for guests -->
            ${!hasAccount ? `
            <div style="background:#fdf8f3;border:1px solid #e8c4a0;border-radius:10px;padding:16px;margin-bottom:24px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#1a0a00;">💡 Save time next time</p>
              <p style="margin:0 0 12px;font-size:13px;color:#6b4f3a;line-height:1.5;">
                Create a free account to track orders in real time, save your address, and reorder in one tap.
              </p>
              <a href="${signupUrl}" style="display:inline-block;border:1.5px solid #E30613;color:#E30613;font-size:13px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none;">
                Create free account
              </a>
            </div>
            ` : ""}

            <p style="margin:0;font-size:13px;color:#6b4f3a;line-height:1.6;">
              Questions? Reply to this email or reach us on WhatsApp anytime.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#fdf8f3;padding:20px 32px;text-align:center;border-top:1px solid #f0e4d4;">
            <p style="margin:0;font-size:12px;color:#b07040;">CLeo's Pot · Made with love in Lagos 🇳🇬</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}