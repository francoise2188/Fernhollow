import ExcelJS from "exceljs";

/**
 * A minimal but real .xlsx: line items, subtotal, optional tax, grand total (formulas).
 */
export async function buildPhotoBoothPricingCalculatorBuffer(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Fernhollow";
  const ws = wb.addWorksheet("Pricing", {
    views: [{ state: "frozen", ySplit: 3 }],
  });

  ws.getColumn(1).width = 30;
  ws.getColumn(2).width = 16;

  ws.getCell("A1").value = "Photo booth pricing calculator";
  ws.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF2D4A1E" } };
  ws.mergeCells("A1:B1");

  ws.getCell("A2").value =
    "Edit the cream-colored amount cells. Subtotal and total use formulas.";
  ws.getCell("A2").font = { italic: true, size: 10, color: { argb: "FF7A6A5A" } };
  ws.mergeCells("A2:B2");

  const header = ws.getRow(4);
  header.values = ["Line item", "Amount ($)"];
  header.font = { bold: true };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8F0E0" },
  };

  const lineLabels = [
    "Base package",
    "Extra hours (per hour)",
    "Travel / delivery",
    "Backdrop upgrade",
    "Prints / duplicates",
  ];

  const cream = {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FFFFFDE7" },
  };

  let r = 5;
  for (const label of lineLabels) {
    ws.getCell(r, 1).value = label;
    const c = ws.getCell(r, 2);
    c.value = 0;
    c.numFmt = "$#,##0.00";
    c.fill = cream;
    r++;
  }

  // r is now 10
  ws.getCell(10, 1).value = "Subtotal";
  ws.getCell(10, 1).font = { bold: true };
  ws.getCell(10, 2).value = { formula: "SUM(B5:B9)", date1904: false };
  ws.getCell(10, 2).numFmt = "$#,##0.00";
  ws.getCell(10, 2).font = { bold: true };

  ws.getCell(11, 1).value = "Tax rate (decimal, e.g. 0.0825 for 8.25%)";
  ws.getCell(11, 2).value = 0;
  ws.getCell(11, 2).numFmt = "0.0000";
  ws.getCell(11, 2).fill = cream;

  ws.getCell(12, 1).value = "Tax amount";
  ws.getCell(12, 2).value = { formula: "B10*B11", date1904: false };
  ws.getCell(12, 2).numFmt = "$#,##0.00";

  ws.getCell(13, 1).value = "Grand total";
  ws.getCell(13, 1).font = { bold: true };
  ws.getCell(13, 2).value = { formula: "B10+B12", date1904: false };
  ws.getCell(13, 2).numFmt = "$#,##0.00";
  ws.getCell(13, 2).font = { bold: true };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
