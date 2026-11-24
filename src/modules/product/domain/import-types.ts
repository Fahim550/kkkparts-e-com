export interface ParsedImportRow {
  rowNumber: number;
  itemName: string;
  itemCode: string;
  description: string;
  category: string;
  salePrice: number;
  purchasePrice: number;
  openingStock: number;
  minStock: number;
  location: string;
  baseUnit: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImportPreviewData {
  totalRows: number;
  validRows: ParsedImportRow[];
  invalidRows: ParsedImportRow[];
  detectedCategories: string[];
  detectedLocations: string[];
}

export interface ImportOptions {
  warehouseId?: string;
  updateExisting: boolean;
  autoCreateCategories: boolean;
  autoCreateLocations: boolean;
  defaultUomId?: string;
}

export interface ImportProgress {
  processed: number;
  total: number;
  percentage: number;
  currentItemName?: string;
  currentItemCode?: string;
}

export interface ImportResult {
  totalProcessed: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  createdCategoriesCount: number;
  errors: Array<{
    rowNumber: number;
    itemCode?: string;
    itemName?: string;
    message: string;
  }>;
}
