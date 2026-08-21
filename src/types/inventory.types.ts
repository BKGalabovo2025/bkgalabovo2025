export type AllocationType = "per_child" | "per_station" | "ratio";

export interface InventoryItem {
  id: string;
  name: string;
  totalQuantity: number;
  allocationType: AllocationType;
  ratioValue?: number; // E.g., 0.5 for 1 ball per 2 kids; or 4 for 4 cones per station
  siteId: string;
  createdAt?: string;
  updatedAt?: string;
}
