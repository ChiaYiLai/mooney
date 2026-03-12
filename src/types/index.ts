export interface Cost {
  id: string;
  y: string;
  m: string;
  d: string;
  name: string;
  price: number;
  tags: string[];
  userID: string;
}

export type CostForm = Omit<Cost, "id">;
export type CostItem = Omit<Cost, "userID">;
