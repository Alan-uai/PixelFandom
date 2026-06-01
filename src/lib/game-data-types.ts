export interface GameTableReference {
  table: string;
  id: string;
}

export interface GameItemEmbedAttrs {
  table: string;
  itemId: string;
  itemName: string;
}

export interface TierlistAttrs {
  table: string;
  title: string;
  tiers: {
    label: string;
    color: string;
    itemIds: string[];
  }[];
}

export interface GameTableListAttrs {
  table: string;
  title: string;
  filter?: string;
  limit?: number;
}
