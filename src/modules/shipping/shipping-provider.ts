export type ShippingRequest = {
  orderId: string;
  recipientName: string;
  phone: string;
  address: string;
};

export type ShippingResult = {
  providerReference: string;
  status: "pending" | "created" | "failed";
};

export interface ShippingProvider {
  createShipment(request: ShippingRequest): Promise<ShippingResult>;
}
