export type TableShape = "ROUND" | "SQUARE" | "RECTANGLE";

export type TableStatus = "AVAILABLE" | "RESERVED" | "OCCUPIED" | "OUT_OF_SERVICE";

export interface RestaurantArea {
  id: string;
  businessId: string;
  name: string;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    tables: number;
  };
}

export interface RestaurantTable {
  id: string;
  businessId: string;
  areaId?: string | null;
  area?: RestaurantArea | null;
  name: string;
  capacity: number;
  shape: TableShape;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  imageUrl?: string | null;
  description?: string | null;
  isActive: boolean;
  status: TableStatus;
  computedStatus?: TableStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  currentAppointment?: {
    id?: string;
    startTime?: string;
    endTime?: string;
    customerName?: string;
    customerPhone?: string;
    status?: string;
  } | null;
  insufficientCapacity?: boolean;
  isAvailable?: boolean;
}
