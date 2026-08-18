export interface CreateOrderItem {
  productId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  client: {
    name: string;
    phoneNumber: string;
    address: string;
    email: string;
  };

  items: CreateOrderItem[];
}