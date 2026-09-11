import { ItemDefinition, StockRecord } from '../types';

// Default patient list (starts clean)
export const DEFAULT_PERSONS: string[] = [];

export const DEFAULT_ITEMS: ItemDefinition[] = [
  { name: 'แพมเพิส', unit: 'ชิ้น', threshold: 20 },
  { name: 'แผ่นรองซับ', unit: 'แผ่น', threshold: 20 },
  { name: 'ทิชชู่เปียก', unit: 'ห่อ', threshold: 2 },
  { name: 'ทิชชู่แห้ง', unit: 'ห่อ/ม้วน', threshold: 2 },
  { name: 'ถุงมือ', unit: 'กล่อง', threshold: 1 },
  { name: 'แป้ง', unit: 'กระป๋อง', threshold: 1 },
  { name: 'ครีมทาผิว', unit: 'ขวด', threshold: 1 },
  { name: 'ยาสีฟัน', unit: 'หลอด', threshold: 1 },
  { name: 'แปรงสีฟัน', unit: 'ด้าม', threshold: 1 },
  { name: 'ครีมอาบน้ำ/สบู่', unit: 'ขวด/ก้อน', threshold: 1 },
  { name: 'แชมพูสระผม', unit: 'ขวด', threshold: 1 },
  { name: 'ครีมนวดผม', unit: 'ขวด', threshold: 1 },
  { name: 'ชุด feed อาหาร', unit: 'ถุง+สาย', threshold: 10 },
  { name: 'น้ำยาบ้วนปาก', unit: 'ขวด', threshold: 1 },
  { name: 'สายยางกระเพาะอาหารแบบซิลิโคน', unit: 'เส้น', threshold: 1 },
  { name: 'ผงหนืด', unit: 'กระป๋อง', threshold: 2 },
  { name: 'หลอด', unit: 'แพ็ค', threshold: 1 },
  { name: 'นม', unit: 'กระป๋อง', threshold: 1 },
  { name: 'หน้ากากอนามัย', unit: 'กล่อง', threshold: 1 },
  { name: 'สำลี', unit: 'แพ็ค', threshold: 1 }
];

export const BEDSIDE_ITEMS: string[] = [
  'ทิชชู่เปียก',
  'ทิชชู่แห้ง',
  'ถุงมือ',
  'แป้ง',
  'ครีมทาผิว',
  'ยาสีฟัน',
  'ครีมอาบน้ำ/สบู่',
  'แชมพูสระผม',
  'ครีมนวดผม',
  'น้ำยาบ้วนปาก',
  'ผงหนืด',
  'นม',
  'หน้ากากอนามัย',
  'สำลี'
];

export const PROCEDURE_CATEGORIES = [
  { id: 'oxygen', label: 'การให้ออกซิเจน', icon: 'Wind' },
  { id: 'ng', label: 'ใส่สายยาง NG', icon: 'Activity' },
  { id: 'suction', label: 'การดูดเสมหะ (Suction)', icon: 'Sparkles' },
  { id: 'wound', label: 'ทำแผล', icon: 'HeartPulse' },
  { id: 'catheter', label: 'ใส่สายสวนปัสสาวะ (F/C)', icon: 'ShieldAlert' },
  { id: 'bronchodilator', label: 'พ่นยาขยายหลอดลม (ใช้ออกซิเจนติดผนัง)', icon: 'Stethoscope' },
  { id: 'injection', label: 'ฉีดยา (IV/IM/SC)', icon: 'Syringe' }
];

// Initial records (clean slate since all demo patients have been removed)
export const INITIAL_SEED_RECORDS: StockRecord[] = [];

