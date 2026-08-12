import Link from "next/link";

export default function AdminOverview() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome back</h1>
      <p className="text-gray-500 mb-8">Manage meals, discounts, orders, riders and store settings.</p>
      <div className="grid grid-cols-2 gap-4">
        <Link href="/admin/meals" className="border rounded-xl p-4 hover:border-brand-red">
          <p className="font-semibold">Meals</p>
          <p className="text-sm text-gray-500">Add, edit, price & discount meals</p>
        </Link>
        <Link href="/admin/orders" className="border rounded-xl p-4 hover:border-brand-red">
          <p className="font-semibold">Orders</p>
          <p className="text-sm text-gray-500">View orders & update status</p>
        </Link>
        <Link href="/admin/riders" className="border rounded-xl p-4 hover:border-brand-red">
          <p className="font-semibold">Riders</p>
          <p className="text-sm text-gray-500">Manage delivery riders</p>
        </Link>
        <Link href="/admin/settings" className="border rounded-xl p-4 hover:border-brand-red">
          <p className="font-semibold">Settings</p>
          <p className="text-sm text-gray-500">Logo, colors, WhatsApp number</p>
        </Link>
      </div>
    </div>
  );
}
