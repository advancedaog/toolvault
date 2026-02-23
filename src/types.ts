// ─── Type Definitions ───

export interface User {
  id: string;
  name: string;
  password: string;
  isAdmin: boolean;
}

export interface InventoryItem {
  id: string;           // e.g. "INV-00001"
  name: string;
  description: string;
  photoUri: string | null;
  certificates: Certificate[];
  isCheckedOut: boolean;
  createdAt: string;    // ISO date
}

export interface Certificate {
  id: string;
  itemId: string;
  certificateNo: string;
  instrumentId: string;
  calibrationDate: string;
  nextDueDate: string;
  status: 'Pass' | 'Fail' | 'N/A';
  fileUri: string | null;  // local file URI for the uploaded PDF
  uploadedAt: string;
}

export interface CheckoutRecord {
  id: string;
  itemId: string;
  userId: string;
  userName: string;
  checkoutTime: string;
  checkinTime: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type RootTabParamList = {
  Scan: undefined;
  Admin: undefined;
};

export type AdminStackParamList = {
  AdminHome: undefined;
  AddItem: undefined;
  AddCertificate: undefined;
};
