import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import {
  ParsedImportRow,
  ImportPreviewData,
  ImportOptions,
  ImportProgress,
  ImportResult,
} from "../../domain/import-types";

// Helper to normalize header keys: remove special characters, spaces, and make lowercase
function normalizeHeaderKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Clean and parse numerical values safely
function parseNumeric(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === "") return fallback;
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? fallback : num;
}

export class ProductImportService {
  /**
   * Parse an uploaded Excel (.xlsx, .xls) or CSV file and return a pre-flight validation preview.
   */
  static async parseFile(file: File): Promise<ImportPreviewData> {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error("No sheet found in the uploaded file.");
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    });

    if (rawRows.length === 0) {
      throw new Error("The uploaded file contains no data rows.");
    }

    const validRows: ParsedImportRow[] = [];
    const invalidRows: ParsedImportRow[] = [];
    const detectedCategories = new Set<string>();
    const detectedLocations = new Set<string>();

    rawRows.forEach((row, index) => {
      const rowNumber = index + 2; // 1-based, accounting for header row

      // Build key-normalized map for flexible header matching
      const rowMap = new Map<string, any>();
      for (const [key, value] of Object.entries(row)) {
        rowMap.set(normalizeHeaderKey(key), value);
      }

      const findVal = (possibleHeaders: string[]): any => {
        for (const h of possibleHeaders) {
          const norm = normalizeHeaderKey(h);
          if (rowMap.has(norm) && rowMap.get(norm) !== undefined) {
            return rowMap.get(norm);
          }
        }
        return "";
      };

      const rawItemName = String(
        findVal([
          "Item name*",
          "Item name",
          "Item Name",
          "Product Name",
          "Product",
          "Name",
          "Title",
        ]) || ""
      ).trim();

      const rawItemCode = String(
        findVal([
          "Item code",
          "Item Code",
          "Part No",
          "Part Number",
          "Code",
          "SKU",
          "item_code",
        ]) || ""
      ).trim();

      const description = String(
        findVal(["Description", "Desc", "Product Description"]) || ""
      ).trim();

      const category = String(
        findVal(["Category", "Category Name", "Item Category", "Group"]) || ""
      ).trim();

      const salePrice = parseNumeric(
        findVal(["Sale price", "Sale Price", "Selling Price", "Price", "Retail Price"])
      );

      const purchasePrice = parseNumeric(
        findVal([
          "Purchase price",
          "Purchase Price",
          "Cost Price",
          "Cost",
          "Unit Cost",
        ])
      );

      const openingStock = parseNumeric(
        findVal([
          "Opening stock quantity",
          "Opening stock",
          "Stock Quantity",
          "Stock",
          "Quantity",
          "Qty",
        ]),
        0
      );

      const minStock = parseNumeric(
        findVal(["Minimum stock quantity", "Minimum stock", "Min Stock", "Min Qty"]),
        0
      );

      const location = String(
        findVal(["Item Location", "Location", "Bin", "Shelf", "Rack"]) || ""
      ).trim();

      const baseUnit = String(
        findVal(["Base Unit (x)", "Base Unit", "Unit", "UOM", "Measure"]) || ""
      ).trim();

      // Completely empty row check (ignore trailing blank lines in Excel)
      const hasAnyContent =
        rawItemName ||
        rawItemCode ||
        category ||
        salePrice > 0 ||
        purchasePrice > 0 ||
        location;

      if (!hasAnyContent) {
        return; // Ignore completely blank rows
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Validation Rules
      if (!rawItemName) {
        errors.push("Missing Item Name (Item name is required).");
      }

      if (!rawItemCode) {
        errors.push("Missing Item Code (Item code/part number is required).");
      }

      if (salePrice < 0) {
        errors.push("Sale Price cannot be negative.");
      }

      if (purchasePrice < 0) {
        errors.push("Purchase Price cannot be negative.");
      }

      if (openingStock < 0) {
        errors.push("Stock quantity cannot be negative.");
      }

      if (!category) {
        warnings.push("No category specified. Will assign to 'General'.");
      }

      if (salePrice === 0) {
        warnings.push("Sale price is 0.00.");
      }

      if (category) {
        detectedCategories.add(category);
      }

      if (location) {
        detectedLocations.add(location);
      }

      const parsedRow: ParsedImportRow = {
        rowNumber,
        itemName: rawItemName,
        itemCode: rawItemCode,
        description,
        category: category || "General",
        salePrice,
        purchasePrice,
        openingStock,
        minStock,
        location,
        baseUnit: baseUnit || "pcs",
        isValid: errors.length === 0,
        errors,
        warnings,
      };

      if (parsedRow.isValid) {
        validRows.push(parsedRow);
      } else {
        invalidRows.push(parsedRow);
      }
    });

    return {
      totalRows: validRows.length + invalidRows.length,
      validRows,
      invalidRows,
      detectedCategories: Array.from(detectedCategories),
      detectedLocations: Array.from(detectedLocations),
    };
  }

  /**
   * Execute the enterprise bulk import with caching, auto-provisioning, and upsert logic.
   */
  static async executeImport(
    rows: ParsedImportRow[],
    options: ImportOptions,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const result: ImportResult = {
      totalProcessed: 0,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      createdCategoriesCount: 0,
      errors: [],
    };

    if (rows.length === 0) {
      return result;
    }

    // ── 1. In-memory Master Entity Cache ─────────────────────────────────────
    // Fetch all categories once
    const { data: dbCategories, error: catFetchErr } = await supabase
      .from("categories")
      .select("id, name, slug");
    if (catFetchErr) throw catFetchErr;

    const categoryMap = new Map<string, string>(); // lowercase name -> UUID
    dbCategories?.forEach((c) => {
      categoryMap.set(c.name.trim().toLowerCase(), c.id);
      if (c.slug) categoryMap.set(c.slug.trim().toLowerCase(), c.id);
    });

    // Fetch all UOMs once
    const { data: dbUoms } = await supabase
      .from("units_of_measure")
      .select("id, name, abbreviation");
    const uomMap = new Map<string, string>(); // lowercase name/abbr -> UUID
    let fallbackUomId = options.defaultUomId || dbUoms?.[0]?.id || "";

    dbUoms?.forEach((u) => {
      uomMap.set(u.name.trim().toLowerCase(), u.id);
      uomMap.set(u.abbreviation.trim().toLowerCase(), u.id);
      if (
        !fallbackUomId &&
        (u.abbreviation.toLowerCase() === "pcs" ||
          u.name.toLowerCase().includes("piece"))
      ) {
        fallbackUomId = u.id;
      }
    });

    // If still no UOM exists in DB, auto-create a default 'Piece' UOM
    if (!fallbackUomId) {
      const { data: newUom } = await supabase
        .from("units_of_measure")
        .insert({ name: "Piece", abbreviation: "pcs" })
        .select("id")
        .single();
      if (newUom) {
        fallbackUomId = newUom.id;
        uomMap.set("piece", newUom.id);
        uomMap.set("pcs", newUom.id);
      }
    }

    // Fetch Warehouses & Price Lists
    let targetWarehouseId = options.warehouseId;
    if (!targetWarehouseId) {
      const { data: dbWarehouses } = await supabase
        .from("warehouses")
        .select("id")
        .limit(1);
      targetWarehouseId = dbWarehouses?.[0]?.id;
    }

    const { data: priceLists } = await supabase
      .from("price_lists")
      .select("id, name");
    const retailPriceListId = priceLists?.find((pl) =>
      pl.name.toLowerCase().includes("retail")
    )?.id;

    // ── 2. Auto-provision Missing Categories ────────────────────────────────
    if (options.autoCreateCategories) {
      const uniqueCats = Array.from(
        new Set(rows.map((r) => r.category.trim()))
      ).filter(Boolean);

      for (const catName of uniqueCats) {
        const lower = catName.toLowerCase();
        if (!categoryMap.has(lower)) {
          const slug = lower
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          const { data: createdCat, error: createCatErr } = await supabase
            .from("categories")
            .insert({
              name: catName,
              slug: slug || `cat-${Date.now()}`,
              is_active: true,
            })
            .select("id")
            .single();

          if (!createCatErr && createdCat) {
            categoryMap.set(lower, createdCat.id);
            result.createdCategoriesCount++;
          }
        }
      }
    }

    // Default category fallback
    let defaultCategoryId = categoryMap.get("general");
    if (!defaultCategoryId) {
      defaultCategoryId = categoryMap.values().next().value;
    }

    // ── 3. Bulk Lookup Existing Products ────────────────────────────────────
    const itemCodes = rows.map((r) => r.itemCode);
    const existingProductsMap = new Map<string, { id: string; name: string }>();

    // Chunk lookup by 100 codes
    for (let i = 0; i < itemCodes.length; i += 100) {
      const slice = itemCodes.slice(i, i + 100);
      const { data: existingBatch } = await supabase
        .from("products")
        .select("id, item_code, name")
        .in("item_code", slice);

      existingBatch?.forEach((p) => {
        existingProductsMap.set(p.item_code.trim().toLowerCase(), {
          id: p.id,
          name: p.name,
        });
      });
    }

    // ── 4. Process Rows in Batches ──────────────────────────────────────────
    const BATCH_SIZE = 15;
    const total = rows.length;

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (row) => {
          try {
            const codeKey = row.itemCode.toLowerCase();
            const existing = existingProductsMap.get(codeKey);

            if (existing && !options.updateExisting) {
              result.skippedCount++;
              result.totalProcessed++;
              return;
            }

            // Resolve Category
            const catId =
              categoryMap.get(row.category.toLowerCase()) ||
              defaultCategoryId ||
              "";

            // Resolve UOM
            const uomId =
              uomMap.get(row.baseUnit.toLowerCase()) || fallbackUomId;

            // Product Payload
            const productData: any = {
              item_code: row.itemCode,
              name: row.itemName,
              description: row.description || null,
              category_id: catId,
              base_uom_id: uomId,
              price: row.salePrice,
              original_price: row.purchasePrice || row.salePrice,
              location: row.location || "",
              category: row.category, // for legacy column compatibility
              is_active: true,
              stock: row.openingStock,
            };

            let savedProductId = "";

            if (existing) {
              // Update existing product
              const { data: updated, error: updateErr } = await supabase
                .from("products")
                .update(productData)
                .eq("id", existing.id)
                .select("id")
                .single();

              if (updateErr) throw updateErr;
              savedProductId = updated?.id || existing.id;
              result.updatedCount++;
            } else {
              // Insert new product
              const { data: inserted, error: insertErr } = await supabase
                .from("products")
                .insert(productData)
                .select("id")
                .single();

              if (insertErr) throw insertErr;
              savedProductId = inserted.id;
              result.insertedCount++;
            }

            // Ensure Product Variation exists (Essential for POS & barcode scans)
            let variationId = "";
            const { data: existingVar } = await supabase
              .from("product_variations")
              .select("id")
              .eq("product_id", savedProductId)
              .maybeSingle();

            if (existingVar) {
              variationId = existingVar.id;
            } else {
              const { data: newVar, error: varErr } = await supabase
                .from("product_variations")
                .insert({
                  product_id: savedProductId,
                  sku: row.itemCode,
                  barcode: row.itemCode,
                  is_active: true,
                })
                .select("id")
                .maybeSingle();

              if (!varErr && newVar) {
                variationId = newVar.id;
              } else {
                // Unique fallback SKU
                const fallbackSku = `${row.itemCode}-${Math.random()
                  .toString(36)
                  .substring(2, 6)
                  .toUpperCase()}`;
                const { data: fbVar } = await supabase
                  .from("product_variations")
                  .insert({
                    product_id: savedProductId,
                    sku: fallbackSku,
                    barcode: row.itemCode,
                    is_active: true,
                  })
                  .select("id")
                  .maybeSingle();
                variationId = fbVar?.id || "";
              }
            }

            // Sync Price List item if price list exists
            if (variationId && retailPriceListId && row.salePrice > 0 && uomId) {
              await supabase.from("price_list_items").upsert(
                {
                  price_list_id: retailPriceListId,
                  variation_id: variationId,
                  uom_id: uomId,
                  price: row.salePrice,
                },
                { onConflict: "price_list_id,variation_id,uom_id" }
              );
            }

            // Set Initial Stock Balance if specified and warehouse exists
            if (
              variationId &&
              targetWarehouseId &&
              row.openingStock > 0
            ) {
              await supabase.from("stock_balances").upsert(
                {
                  variation_id: variationId,
                  warehouse_id: targetWarehouseId,
                  quantity: row.openingStock,
                },
                { onConflict: "variation_id,warehouse_id,bin_id,batch_number" }
              );
            }

            result.totalProcessed++;
          } catch (rowError: any) {
            result.failedCount++;
            result.totalProcessed++;
            result.errors.push({
              rowNumber: row.rowNumber,
              itemCode: row.itemCode,
              itemName: row.itemName,
              message: rowError?.message || "Unknown database error.",
            });
          }
        })
      );

      // Report progress
      if (onProgress) {
        const processed = Math.min(i + batch.length, total);
        onProgress({
          processed,
          total,
          percentage: Math.round((processed / total) * 100),
          currentItemName: batch[batch.length - 1]?.itemName,
          currentItemCode: batch[batch.length - 1]?.itemCode,
        });
      }
    }

    return result;
  }

  /**
   * Generates and downloads a pre-formatted clean sample Excel/CSV template.
   */
  static downloadSampleTemplate(type: "xlsx" | "csv" = "xlsx"): void {
    const sampleData = [
      {
        "Item name": "WATER PUMP COROLLA 2002 UP 1ZZ",
        "Item code": "GWT-98",
        Category: "WATER PUMP",
        "Sale price": 15.0,
        "Purchase price": 8.5,
        "Opening stock quantity": 5,
        "Item Location": "B01",
        "Base Unit": "pcs",
        Description: "Engine cooling water pump for Toyota Corolla 1ZZ",
      },
      {
        "Item name": "WATER PUMP COROLLA 2012 UP 1ZR 2ZR",
        "Item code": "GWT-144",
        Category: "WATER PUMP",
        "Sale price": 15.0,
        "Purchase price": 10.0,
        "Opening stock quantity": 10,
        "Item Location": "B01",
        "Base Unit": "pcs",
        Description: "Water pump for 1ZR / 2ZR engines",
      },
      {
        "Item name": "WATER PUMP CAMRY LEXUS 2000UP 1MZ",
        "Item code": "GWT-92",
        Category: "WATER PUMP",
        "Sale price": 15.0,
        "Purchase price": 9.0,
        "Opening stock quantity": 3,
        "Item Location": "B01",
        "Base Unit": "pcs",
        Description: "Engine cooling water pump for Camry Lexus 1MZ",
      },
      {
        "Item name": "BRAKE PADS FRONT COROLLA 2015",
        "Item code": "BP-COR-01",
        Category: "BRAKE SYSTEM",
        "Sale price": 22.5,
        "Purchase price": 14.0,
        "Opening stock quantity": 8,
        "Item Location": "A04",
        "Base Unit": "set",
        Description: "Ceramic front brake pads",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    // Auto column width for readability
    const colWidths = [
      { wch: 38 }, // Item name
      { wch: 15 }, // Item code
      { wch: 18 }, // Category
      { wch: 12 }, // Sale price
      { wch: 15 }, // Purchase price
      { wch: 22 }, // Opening stock
      { wch: 14 }, // Item Location
      { wch: 12 }, // Base Unit
      { wch: 45 }, // Description
    ];
    worksheet["!cols"] = colWidths;

    if (type === "csv") {
      XLSX.writeFile(workbook, "products_import_template.csv", {
        bookType: "csv",
      });
    } else {
      XLSX.writeFile(workbook, "products_import_template.xlsx", {
        bookType: "xlsx",
      });
    }
  }
}
