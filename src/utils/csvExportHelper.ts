import { StockRecord, ItemDefinition } from '../types';

/**
 * Determine the physical unit for hospital ward procedure equipment & supplies
 */
export const getSupplyUnit = (supplyName: string): string => {
  const name = (supplyName || '').toLowerCase();
  if (name.includes('gauze') || name.includes('top gauze') || name.includes('ก๊อซ')) return 'ชิ้น';
  if (name.includes('bactigras')) return 'แผ่น';
  if (name.includes('5ml') || name.includes('5 ml')) return 'หลอด';
  if (name.includes('100ml') || name.includes('1000ml') || name.includes('nss') || name.includes('swi 1000')) return 'ขวด';
  if (name.includes('swi 10')) return 'อัน';
  if (name.includes('ng') || name.includes('เสมหะ') || name.includes('foley') || name.includes('สาย')) return 'เส้น';
  if (name.includes('oral airway')) return 'อัน';
  if (name.includes('glove') || name.includes('ถุงมือ')) return 'คู่';
  if (name.includes('bag') || name.includes('ถุง')) return 'ใบ';
  if (name.includes('เข็ม')) return 'เล่ม';
  if (name.includes('syringe')) return 'อัน';
  return 'ชิ้น';
};

/**
 * Parse supplies_used from procedure records safely
 */
export const parseSupplies = (
  suppliesUsed?: string
): { name: string; quantity: number; unit: string }[] => {
  if (!suppliesUsed || !suppliesUsed.trim()) return [];
  try {
    const obj = JSON.parse(suppliesUsed);
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj)
        .map(([name, qty]) => {
          const num = typeof qty === 'number' ? qty : parseInt(String(qty), 10) || 0;
          return {
            name: name.trim(),
            quantity: num,
            unit: getSupplyUnit(name),
          };
        })
        .filter((item) => item.quantity > 0);
    }
  } catch {
    // If string format like "NSS 100ml: 2; Gauze: 5"
    const parts = suppliesUsed.split(';');
    const results: { name: string; quantity: number; unit: string }[] = [];
    parts.forEach((p) => {
      const match = p.match(/(.+?)(?:\s*[:(x]\s*(\d+)\s*\)?)?$/);
      if (match) {
        const name = match[1].trim();
        const num = match[2] ? parseInt(match[2], 10) : 1;
        if (name) {
          results.push({
            name,
            quantity: num,
            unit: getSupplyUnit(name),
          });
        }
      }
    });
    return results;
  }
  return [];
};

/**
 * Generate CSV for History Log with itemized supplies so Excel SUM formulas work accurately.
 * Each procedure's supplies are itemized into dedicated rows with pure numeric quantities.
 */
export const generateHistoryCSV = (
  records: StockRecord[],
  options: { itemizeSupplies?: boolean } = { itemizeSupplies: true }
): string => {
  const headers = [
    'วันเวลา',
    'วันที่',
    'เวลา',
    'ชื่อผู้ป่วย',
    'ประเภทรายการ',
    'รายการ/อุปกรณ์',
    'จำนวน (ตัวเลข SUM)',
    'หน่วย',
    'การกระทำ',
    'ชื่ออุปกรณ์ที่ใช้',
    'จำนวนอุปกรณ์ (ตัวเลข SUM)',
    'หน่วยอุปกรณ์',
    'รายละเอียด/ตำแหน่งแผล',
    'ผู้บันทึก',
  ];

  const rows: string[] = [];

  records.forEach((r) => {
    const dt = new Date(r.timestamp);
    const dateStr = dt.toLocaleDateString('th-TH');
    const timeStr = dt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const fullDateStr = `${dateStr} ${timeStr}`;

    if (r.record_type === 'procedure') {
      const supplies = parseSupplies(r.supplies_used);
      const totalSuppliesCount = supplies.reduce((acc, s) => acc + s.quantity, 0);
      const suppliesSummaryText = supplies.map((s) => `${s.name} x${s.quantity} ${s.unit}`).join('; ');
      const detailFull = [r.procedure_detail, r.wound_location ? `ตำแหน่งแผล: ${r.wound_location}` : '']
        .filter(Boolean)
        .join(' | ');

      // 1. Procedure Summary Row
      rows.push(
        [
          `"${fullDateStr}"`,
          `"${dateStr}"`,
          `"${timeStr}"`,
          `"${r.person_name}"`,
          `"หัตถการ"`,
          `"${r.item_name}"`,
          r.procedure_count || 1, // numeric count of procedure
          `"ครั้ง"`,
          `"ทำหัตถการ"`,
          `"${suppliesSummaryText.replace(/"/g, '""')}"`,
          totalSuppliesCount, // pure numeric total supplies count for SUM
          `"ชิ้น/ขวด"`,
          `"${detailFull.replace(/"/g, '""')}"`,
          `"${r.performed_by || ''}"`,
        ].join(',')
      );

      // 2. Itemized Equipment Rows (if requested and supplies exist)
      if (options.itemizeSupplies && supplies.length > 0) {
        supplies.forEach((sup) => {
          rows.push(
            [
              `"${fullDateStr}"`,
              `"${dateStr}"`,
              `"${timeStr}"`,
              `"${r.person_name}"`,
              `"อุปกรณ์หัตถการ"`,
              `"${sup.name}"`,
              sup.quantity, // Pure numeric quantity for SUM
              `"${sup.unit}"`,
              `"ใช้ในหัตถการ: ${r.item_name}"`,
              `"${sup.name}"`,
              sup.quantity, // Pure numeric quantity in dedicated equipment column as well
              `"${sup.unit}"`,
              `"${detailFull.replace(/"/g, '""')}"`,
              `"${r.performed_by || ''}"`,
            ].join(',')
          );
        });
      }
    } else {
      // Stock transaction row (receive or withdraw)
      const actionLabel = r.action_type === 'receive' ? 'รับเข้าสต็อก' : 'เบิกใช้';
      rows.push(
        [
          `"${fullDateStr}"`,
          `"${dateStr}"`,
          `"${timeStr}"`,
          `"${r.person_name}"`,
          `"ของใช้"`,
          `"${r.item_name}"`,
          r.quantity, // Pure numeric quantity for SUM
          `"${r.item_unit || 'ชิ้น'}"`,
          `"${actionLabel}"`,
          `""`, // No procedure supply name
          0, // 0 for equipment quantity
          `""`,
          `""`,
          `"${r.performed_by || ''}"`,
        ].join(',')
      );
    }
  });

  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
};

/**
 * Generate a dedicated Equipment Usage Summary CSV with total SUM per equipment.
 */
export const generateEquipmentSummaryCSV = (records: StockRecord[]): string => {
  const suppliesTotals: Record<
    string,
    {
      quantity: number;
      unit: string;
      procedures: Record<string, number>;
      patients: Set<string>;
    }
  > = {};

  records.forEach((r) => {
    if (r.record_type === 'procedure') {
      const supplies = parseSupplies(r.supplies_used);
      supplies.forEach((sup) => {
        if (!suppliesTotals[sup.name]) {
          suppliesTotals[sup.name] = {
            quantity: 0,
            unit: sup.unit,
            procedures: {},
            patients: new Set(),
          };
        }
        suppliesTotals[sup.name].quantity += sup.quantity;
        suppliesTotals[sup.name].procedures[r.item_name] =
          (suppliesTotals[sup.name].procedures[r.item_name] || 0) + sup.quantity;
        if (r.person_name) {
          suppliesTotals[sup.name].patients.add(r.person_name);
        }
      });
    }
  });

  const headers = [
    'ลำดับ',
    'ชื่ออุปกรณ์/เวชภัณฑ์',
    'จำนวนรวมที่ใช้ (SUM)',
    'หน่วย',
    'หัตถการที่ใช้ประกอบ',
    'รายชื่อผู้ป่วยที่ใช้',
  ];

  const sortedSupplies = Object.entries(suppliesTotals).sort((a, b) => b[1].quantity - a[1].quantity);

  let grandTotal = 0;
  const rows = sortedSupplies.map(([name, data], idx) => {
    grandTotal += data.quantity;
    const procText = Object.entries(data.procedures)
      .map(([pName, count]) => `${pName} (${count})`)
      .join('; ');
    const patientsText = Array.from(data.patients).join(', ');

    return [
      idx + 1,
      `"${name}"`,
      data.quantity, // Numeric for SUM
      `"${data.unit}"`,
      `"${procText.replace(/"/g, '""')}"`,
      `"${patientsText.replace(/"/g, '""')}"`,
    ].join(',');
  });

  // Grand total summary row at bottom
  rows.push([`""`, `"รวมยอดใช้อุปกรณ์และเวชภัณฑ์ทั้งหมด"`, grandTotal, `"ชิ้น/ขวด/อัน"`, `""`, `""`].join(','));

  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
};
