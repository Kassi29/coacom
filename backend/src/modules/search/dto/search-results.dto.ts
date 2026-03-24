export interface ClientSearchResult {
  id: string;
  code: string;
  type: 'person' | 'company';
  displayName: string;
  nit: string | null;
  ci: string | null;
  branch: { id: string; name: string } | null;
  equipmentCount: number;
  isActive: boolean;
}

export interface EquipmentSearchResult {
  id: string;
  serialNumber: string;
  brand: string;
  model: string;
  equipmentType: string;
  clientName: string;
  clientId: string;
  isActive: boolean;
}

export interface SearchResponse {
  clients: ClientSearchResult[];
  equipment: EquipmentSearchResult[];
  meta: {
    totalClients: number;
    totalEquipment: number;
    searchTime: number;
  };
}
