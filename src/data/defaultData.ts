import { ItemDefinition, StockRecord } from '../types';

export const DEFAULT_PERSONS: string[] = [
  'กิมกี',
  'พุฒิพงษ์',
  'สุมนา',
  'สมจิตร',
  'เชวง',
  'ศรีอรุณ',
  'เกลา',
  'สุนันท์',
  'อุดม',
  'จำเริญ',
  'จิณณ์ณิชา',
  'สุคนธ์'
];

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

// Initial realistic seed records for demonstration and immediate functionality
export const INITIAL_SEED_RECORDS: StockRecord[] = [
  {
    id: 'seed-1',
    person_name: 'กิมกี',
    item_name: 'แพมเพิส',
    item_unit: 'ชิ้น',
    quantity: 30,
    action_type: 'receive',
    performed_by: 'พว. สมหญิง',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    record_type: 'transaction'
  },
  {
    id: 'seed-2',
    person_name: 'กิมกี',
    item_name: 'แพมเพิส',
    item_unit: 'ชิ้น',
    quantity: 4,
    action_type: 'withdraw',
    performed_by: 'พว. สมหญิง',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    record_type: 'transaction'
  },
  {
    id: 'seed-3',
    person_name: 'กิมกี',
    item_name: 'แพมเพิส',
    item_unit: 'ชิ้น',
    quantity: 5,
    action_type: 'withdraw',
    performed_by: 'ผช. วรพงษ์',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    record_type: 'transaction'
  },
  {
    id: 'seed-4',
    person_name: 'กิมกี',
    item_name: 'แผ่นรองซับ',
    item_unit: 'แผ่น',
    quantity: 25,
    action_type: 'receive',
    performed_by: 'พว. สมหญิง',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    record_type: 'transaction'
  },
  {
    id: 'seed-5',
    person_name: 'กิมกี',
    item_name: 'แผ่นรองซับ',
    item_unit: 'แผ่น',
    quantity: 3,
    action_type: 'withdraw',
    performed_by: 'ผช. วรพงษ์',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    record_type: 'transaction'
  },
  {
    id: 'seed-6',
    person_name: 'กิมกี',
    item_name: 'ทิชชู่เปียก',
    item_unit: 'ห่อ',
    quantity: 1,
    action_type: 'receive',
    performed_by: 'พว. สมหญิง',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    record_type: 'transaction'
  },
  {
    id: 'seed-7',
    person_name: 'กิมกี',
    item_name: 'ทิชชู่เปียก',
    item_unit: 'ห่อ',
    quantity: 1,
    action_type: 'withdraw',
    performed_by: 'ผช. วรพงษ์',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    record_type: 'transaction'
  },
  {
    id: 'seed-8',
    person_name: 'พุฒิพงษ์',
    item_name: 'ถุงมือ',
    item_unit: 'กล่อง',
    quantity: 2,
    action_type: 'withdraw',
    performed_by: 'พว. รัตนา',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    record_type: 'transaction'
  },
  {
    id: 'seed-9',
    person_name: 'กิมกี',
    item_name: 'ทำแผล',
    item_unit: '',
    quantity: 0,
    action_type: 'procedure',
    performed_by: 'พว. สมหญิง',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    record_type: 'procedure',
    procedure_category: 'wound',
    procedure_detail: 'แผลแห้ง x1',
    wound_location: 'ก้นกบ (Sacrum)',
    procedure_count: 1,
    supplies_used: JSON.stringify({ 'Gauze ปลอดเชื้อ 3*3': 2, 'NSS 5ml': 1, 'Top gauze': 1 })
  }
];
