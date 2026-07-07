export type RecordType = 'formula' | 'breastmilk' | 'pee' | 'poop';

export interface FeedingRecord {
  id: number;
  type: RecordType;
  amount?: number;
  duration?: number;
  diaper?: number;
  note?: string;
  createdAt: string;
}

export interface CreateRecordInput {
  type: RecordType;
  amount?: number;
  duration?: number;
  diaper?: number;
  note?: string;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface DailyStats {
  date: string;
  formulaAmount: number;
  breastmilkAmount: number;
  poopCount: number;
  diaperCount: number;
}
