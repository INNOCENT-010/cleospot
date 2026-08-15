export function menuUpdateHtml({
  meals,
  promoText,
}: {
  meals: { name: string; price: number; image_url?: string | null; description?: string | null }[];
  promoText?: string;
}) {
  const menuUrl = "https://cleospot.vercel.app";

  const mealsHtml = meals.slice(0, 6).map((m) => `
    <td width="50%" style="padding:8px;vertical-align:top;">
      <div style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #f0e4d4;">
        ${m.image_url ? `<img src="${m.image_url}" width="100%" style="display:block;height:140px;object-fit:cover;" alt="${m.name}">` : `<div style="height:100px;background:#fdf8f3;"></div>`}
        <div style="padding:12px;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1a0a00;">${m.name}</p>
          ${m.description ? `<p style="margin:0 0 6px;font-size:11px;color:#6b4f3a;line-height:1.4;">${m.description.slice(0, 60)}…</p>` : ""}
          <p style="margin:0;font-size:14px;font-weight:800;color:#E30613;">₦${m.price.toLocaleString()}</p>
        </div>
      </div>
    </td>
  `).join("");

  const rows = [];
  for (let i = 0; i < meals.slice(0, 6).length; i += 2) {
    rows.push(`<tr>${mealsHtml.split("</td>").filter(Boolean).slice(i, i + 2).join("</td>")}</td></tr>`);
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fdf8f3;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f3;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1a0a00;padding:40px 32px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:#e8a87c;text-transform:uppercase;">CLeo's Pot</p>
            <h1 style="margin:0 0 8px;font-size:32px;color:#ffffff;font-family:Georgia,serif;font-style:italic;">Today's Menu is Live</h1>
            <p style="margin:0;font-size:13px;color:#c9a98a;">Fresh · Home-cooked · Ready now 🍲</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${promoText ? `
            <div style="background:#fff0f0;border:1px solid #fecaca;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center;">
              <p style="margin:0;font-size:15px;font-weight:700;color:#E30613;">${promoText}</p>
            </div>
            ` : ""}

            <p style="margin:0 0 20px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#b07040;font-weight:600;">On the menu today</p>

            <!-- Meals grid -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              ${rows.join("")}
            </table>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${menuUrl}" style="display:inline-block;background:#E30613;color:#ffffff;font-size:14px;font-weight:700;padding:14px 40px;border-radius:10px;text-decoration:none;letter-spacing:0.5px;">
                Order now →
              </a>
            </div>

            <p style="margin:0;font-size:12px;color:#b07040;text-align:center;line-height:1.6;">
              You're receiving this because you ordered from CLeo's Pot.<br>
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