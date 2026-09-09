export interface ItemDefinition {
  name: string;
  unit: string;
  threshold: number;
  alert_enabled?: boolean;
}

export type ActionType = 'receive' | 'withdraw' | 'procedure';
export type RecordType = 'transaction' | 'procedure';

export type ProcedureCategory = 
  | 'oxygen'
  | 'ng'
  | 'suction'
  | 'wound'
  | 'catheter'
  | 'bronchodilator'
  | 'injection';

export interface StockRecord {
  id: string;
  person_name: string;
  item_name: string;
  item_unit: string;
  quantity: number;
  action_type: ActionType;
  performed_by: string;
  timestamp: string; // ISO string
  record_type: RecordType;
  procedure_category?: string;
  procedure_detail?: string;
  procedure_count?: number;
  supplies_used?: string; // JSON string of supplies map
  wound_location?: string;
  notes?: string;
}

export interface BedSummaryItem {
  name: string;
  unit: string;
  quantity: number;
  threshold: number;
  isBorrowed: boolean;
  isLow: boolean;
  isBedsideActive: boolean;
  isCustom?: boolean;
}
