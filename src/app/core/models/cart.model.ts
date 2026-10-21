export interface CartItem {
  product_uuid: string;
  name: string;
  slug: string;
  price: number;
  original_price: number;
  promotional_price: number | null;
  image_url: string | null;
  quantity: number;
  stock: number;
}
