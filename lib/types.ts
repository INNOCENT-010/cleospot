export type Meal = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  discount_percent: number;
  discount_active: boolean;
  is_available: boolean;
};

export type StoreSettings = {
  brand_name: string;
  logo_url: string | null;
  color_primary: string;
  color_secondary: string;
  whatsapp_number: string | null;
};

export type CartItem = {
  meal_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
};

export type OrderStatus =
  | "pending" | "paid" | "preparing" | "picked_up" | "on_the_way" | "delivered" | "cancelled";

export type OrderItem = {
  meal_name: string;
  quantity: number;
  unit_price: number;
};

export type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_city?: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  subtotal: number;
  discount_total: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  delivery_pin: string;
  rider_id: string | null;
  created_at: string;
  paystack_reference: string;
  paid_at?: string | null;
  delivered_at?: string | null;
  order_items?: OrderItem[];
};

export type RiderLocation = {
  order_id: string;
  rider_id: string | null;
  lat: number;
  lng: number;
  updated_at: string;
};