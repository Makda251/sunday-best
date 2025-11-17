export type UserRole = 'buyer' | 'seller' | 'admin'
export type OrderStatus = 'pending_payment' | 'payment_verified' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentMethod = 'zelle'
export type PaymentStatus = 'pending' | 'verified' | 'rejected'
export type ProductCondition = 'new' | 'like_new' | 'excellent' | 'good' | 'fair'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  seller_id: string
  title: string
  description: string | null
  price: number
  condition: ProductCondition
  size: string | null
  images: string[]
  tags: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  seller?: Profile
}

export interface Order {
  id: string
  buyer_id: string
  seller_id: string
  subtotal: number
  shipping_cost: number
  platform_fee: number
  total: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  payment_screenshot_url: string | null
  payment_verified_at: string | null
  shipping_address_line1: string
  shipping_address_line2: string | null
  shipping_city: string
  shipping_state: string
  shipping_zip: string
  shipping_country: string
  status: OrderStatus
  tracking_number: string | null
  shipped_at: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
  buyer?: Profile
  seller?: Profile
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_title: string
  product_price: number
  product_image: string | null
  quantity: number
  created_at: string
  product?: Product
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Favorite {
  id: string
  user_id: string
  product_id: string
  created_at: string
  product?: Product
}
