import RiderShareLocation from "@/components/RiderShareLocation";

// The rider opens this link on their phone (sent via WhatsApp/SMS when assigned).
// No app install needed — it's just a mobile web page that shares GPS while open.
export default function RiderPage({ params }: { params: { orderId: string } }) {
  return <RiderShareLocation orderId={params.orderId} />;
}
