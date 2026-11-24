import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  FileText,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { ProductImportService } from "../../application/services/product-import.service";
import {
  ImportPreviewData,
  ImportProgress,
  ImportResult,
} from "../../domain/import-types";
import { useWarehouses } from "@/modules/warehouse/presentation/hooks/useWarehouses";

interface ProductImportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void;
}

type Step = "upload" | "preview" | "importing" | "completed";

export default function ProductImportModal({
  isOpen,
  onOpenChange,
  onImportSuccess,
}: ProductImportModalProps) {
  const { warehouses = [] } = useWarehouses();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [previewTab, setPreviewTab] = useState<"valid" | "invalid">("valid");

  // Import options
  const [targetWarehouseId, setTargetWarehouseId] = useState<string>("");
  const [updateExisting, setUpdateExisting] = useState(true);
  const [autoCreateCategories, setAutoCreateCategories] = useState(true);

  // Progress & Results
  const [progress, setProgress] = useState<ImportProgress>({
    processed: 0,
    total: 0,
    percentage: 0,
  });
  const [result, setResult] = useState<ImportResult | null>(null);

  // Set default warehouse when warehouses load
  React.useEffect(() => {
    if (warehouses && warehouses.length > 0 && !targetWarehouseId) {
      setTargetWarehouseId(warehouses[0].id);
    }
  }, [warehouses, targetWarehouseId]);

  const resetState = () => {
    setStep("upload");
    setSelectedFile(null);
    setIsParsing(false);
    setPreviewData(null);
    setProgress({ processed: 0, total: 0, percentage: 0 });
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleModalClose = (open: boolean) => {
    if (!open && step === "importing") {
      if (
        !confirm(
          "An import is currently running. Closing the modal will not stop background processing. Are you sure?"
        )
      ) {
        return;
      }
    }
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  const processFile = async (file: File) => {
    try {
      setIsParsing(true);
      setSelectedFile(file);
      const parsed = await ProductImportService.parseFile(file);
      setPreviewData(parsed);

      if (parsed.validRows.length === 0) {
        setPreviewTab("invalid");
        toast.warning(
          "No valid rows found to import. Please review the errors shown."
        );
      } else {
        setPreviewTab("valid");
        toast.success(
          `Found ${parsed.validRows.length} valid items ready to import!`
        );
      }

      setStep("preview");
    } catch (error: any) {
      toast.error(error.message || "Failed to parse the file.");
      setSelectedFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleStartImport = async () => {
    if (!previewData || previewData.validRows.length === 0) {
      toast.error("There are no valid rows to import.");
      return;
    }

    try {
      setStep("importing");
      setProgress({
        processed: 0,
        total: previewData.validRows.length,
        percentage: 0,
      });

      const importResult = await ProductImportService.executeImport(
        previewData.validRows,
        {
          warehouseId: targetWarehouseId || undefined,
          updateExisting,
          autoCreateCategories,
        },
        (p) => setProgress(p)
      );

      setResult(importResult);
      setStep("completed");
      toast.success(
        `Import complete! ${importResult.insertedCount} inserted, ${importResult.updatedCount} updated.`
      );
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred during import.");
      setStep("preview");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Bulk Import Products & Inventory
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Import auto parts, prices, and stock balances from Excel
                  (.xlsx, .xls) or CSV.
                </DialogDescription>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className={`px-2 py-0.5 rounded-full font-medium ${
                  step === "upload"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                1. Upload
              </span>
              <span>&rarr;</span>
              <span
                className={`px-2 py-0.5 rounded-full font-medium ${
                  step === "preview"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                2. Preview
              </span>
              <span>&rarr;</span>
              <span
                className={`px-2 py-0.5 rounded-full font-medium ${
                  step === "importing"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                3. Import
              </span>
              <span>&rarr;</span>
              <span
                className={`px-2 py-0.5 rounded-full font-medium ${
                  step === "completed"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                4. Done
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* ── STEP 1: UPLOAD ──────────────────────────────────────────────── */}
        {step === "upload" && (
          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-muted/30 transition-all rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                {isParsing ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <UploadCloud className="w-7 h-7" />
                )}
              </div>
              <h3 className="text-base font-semibold">
                {isParsing
                  ? "Reading & validating file..."
                  : "Click to upload or drag & drop"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Supports Microsoft Excel (.xlsx, .xls) and CSV files. Large files
                are processed smoothly in batches.
              </p>
            </div>

            {/* Template Download & Guidelines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-muted/20 space-y-2">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Download Sample Template</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use our standardized template with pre-configured columns for
                  Item name, Item code, Price, Stock, and Location.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() =>
                      ProductImportService.downloadSampleTemplate("xlsx")
                    }
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Excel (.xlsx)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() =>
                      ProductImportService.downloadSampleTemplate("csv")
                    }
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" /> CSV (.csv)
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-muted/20 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>ERP Best Practices Supported</span>
                </div>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    <strong>Upsert:</strong> Existing Item Codes will be updated
                    without creating duplicates.
                  </li>
                  <li>
                    <strong>Auto-Category:</strong> New categories are
                    automatically created if missing.
                  </li>
                  <li>
                    <strong>Instant POS:</strong> Variations and barcodes are
                    automatically generated so items are immediately sellable.
                  </li>
                  <li>
                    <strong>Stock Balancing:</strong> Opening stock is directly
                    injected into your warehouse.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: PREVIEW & VALIDATION ────────────────────────────────── */}
        {step === "preview" && previewData && (
          <div className="flex-1 flex flex-col overflow-hidden py-4 space-y-4">
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="border rounded-lg p-3 bg-card flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Total Rows
                  </p>
                  <p className="text-xl font-bold">{previewData.totalRows}</p>
                </div>
                <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
              </div>

              <div
                onClick={() => setPreviewTab("valid")}
                className={`border rounded-lg p-3 cursor-pointer transition-all flex items-center justify-between ${
                  previewTab === "valid"
                    ? "border-green-600 bg-green-500/10"
                    : "hover:bg-muted/50"
                }`}
              >
                <div>
                  <p className="text-xs text-green-600 font-semibold">
                    Ready to Import
                  </p>
                  <p className="text-xl font-bold text-green-700">
                    {previewData.validRows.length}
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>

              <div
                onClick={() => setPreviewTab("invalid")}
                className={`border rounded-lg p-3 cursor-pointer transition-all flex items-center justify-between ${
                  previewTab === "invalid"
                    ? "border-destructive bg-destructive/10"
                    : "hover:bg-muted/50"
                }`}
              >
                <div>
                  <p className="text-xs text-destructive font-semibold">
                    Issues / Skipped
                  </p>
                  <p className="text-xl font-bold text-destructive">
                    {previewData.invalidRows.length}
                  </p>
                </div>
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            </div>

            {/* Import Settings Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-3 border rounded-lg bg-muted/20 text-xs shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="warehouse-select" className="text-xs font-medium">
                    Target Warehouse for Stock:
                  </Label>
                  <Select
                    value={targetWarehouseId}
                    onValueChange={setTargetWarehouseId}
                  >
                    <SelectTrigger className="h-8 w-48 text-xs">
                      <SelectValue placeholder="Select Warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id} className="text-xs">
                          {w.name} ({w.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="update-existing"
                    checked={updateExisting}
                    onCheckedChange={(c) => setUpdateExisting(!!c)}
                  />
                  <Label htmlFor="update-existing" className="text-xs cursor-pointer">
                    Update existing products (Upsert)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-categories"
                    checked={autoCreateCategories}
                    onCheckedChange={(c) => setAutoCreateCategories(!!c)}
                  />
                  <Label htmlFor="auto-categories" className="text-xs cursor-pointer">
                    Auto-create missing categories
                  </Label>
                </div>
              </div>

              <span className="text-muted-foreground font-mono">
                File: {selectedFile?.name}
              </span>
            </div>

            {/* Preview Table */}
            <div className="flex-1 border rounded-lg overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur z-10">
                  <TableRow>
                    <TableHead className="w-12 text-xs">Row</TableHead>
                    <TableHead className="text-xs">Item Code</TableHead>
                    <TableHead className="text-xs">Item Name</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Sale Price</TableHead>
                    <TableHead className="text-xs">Cost</TableHead>
                    <TableHead className="text-xs">Stock</TableHead>
                    <TableHead className="text-xs">Location</TableHead>
                    <TableHead className="text-xs text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewTab === "valid" ? (
                    previewData.validRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
                          No valid items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      previewData.validRows.map((r) => (
                        <TableRow key={`valid-${r.rowNumber}`}>
                          <TableCell className="font-mono text-xs">{r.rowNumber}</TableCell>
                          <TableCell className="font-semibold text-xs text-primary">
                            {r.itemCode}
                          </TableCell>
                          <TableCell className="text-xs font-medium max-w-xs truncate">
                            {r.itemName}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              {r.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {r.salePrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {r.purchasePrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs font-semibold">
                            {r.openingStock}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {r.location || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            <Badge className="bg-green-600 text-[10px]">Ready</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  ) : previewData.invalidRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-xs text-green-600">
                        Awesome! There are no invalid rows in this file.
                      </TableCell>
                    </TableRow>
                  ) : (
                    previewData.invalidRows.map((r) => (
                      <TableRow key={`invalid-${r.rowNumber}`} className="bg-destructive/5">
                        <TableCell className="font-mono text-xs">{r.rowNumber}</TableCell>
                        <TableCell className="font-mono text-xs text-destructive">
                          {r.itemCode || "<MISSING>"}
                        </TableCell>
                        <TableCell className="text-xs max-w-xs truncate">
                          {r.itemName || "<MISSING>"}
                        </TableCell>
                        <TableCell className="text-xs">{r.category}</TableCell>
                        <TableCell className="text-xs font-mono">{r.salePrice}</TableCell>
                        <TableCell className="text-xs font-mono">{r.purchasePrice}</TableCell>
                        <TableCell className="text-xs font-mono">{r.openingStock}</TableCell>
                        <TableCell className="text-xs font-mono">{r.location || "—"}</TableCell>
                        <TableCell className="text-xs text-right">
                          <div className="flex flex-col items-end gap-1">
                            {r.errors.map((err, idx) => (
                              <Badge key={idx} variant="destructive" className="text-[10px]">
                                {err}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between shrink-0 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("upload")}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Upload Different File
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  disabled={previewData.validRows.length === 0}
                  onClick={handleStartImport}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ArrowRight className="w-4 h-4 mr-1.5" /> Start Import ({previewData.validRows.length} Items)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: IMPORTING PROGRESS ──────────────────────────────────── */}
        {step === "importing" && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2 max-w-md w-full">
              <h3 className="text-lg font-bold">Importing Products into Database</h3>
              <p className="text-xs text-muted-foreground">
                Inserting and updating products, variations, barcodes, and inventory balances...
              </p>

              <div className="pt-4 space-y-2">
                <Progress value={progress.percentage} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>
                    Processed {progress.processed} of {progress.total} items
                  </span>
                  <span>{progress.percentage}%</span>
                </div>
              </div>

              {progress.currentItemCode && (
                <p className="text-xs font-mono text-primary bg-primary/5 py-1 px-3 rounded-full inline-block mt-2">
                  Processing: {progress.currentItemCode} — {progress.currentItemName}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4: COMPLETED SUMMARY ───────────────────────────────────── */}
        {step === "completed" && result && (
          <div className="flex-1 flex flex-col overflow-y-auto py-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Import Completed Successfully!</h3>
              <p className="text-xs text-muted-foreground">
                Your database and POS inventory have been updated with the imported data.
              </p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="border rounded-lg p-3 text-center bg-green-500/10 border-green-500/20">
                <p className="text-xs text-green-700 font-medium">New Products Created</p>
                <p className="text-2xl font-bold text-green-800">{result.insertedCount}</p>
              </div>

              <div className="border rounded-lg p-3 text-center bg-blue-500/10 border-blue-500/20">
                <p className="text-xs text-blue-700 font-medium">Existing Updated</p>
                <p className="text-2xl font-bold text-blue-800">{result.updatedCount}</p>
              </div>

              <div className="border rounded-lg p-3 text-center bg-purple-500/10 border-purple-500/20">
                <p className="text-xs text-purple-700 font-medium">Categories Auto-Created</p>
                <p className="text-2xl font-bold text-purple-800">{result.createdCategoriesCount}</p>
              </div>

              <div className="border rounded-lg p-3 text-center bg-muted">
                <p className="text-xs text-muted-foreground font-medium">Failed / Skipped</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {result.failedCount + result.skippedCount}
                </p>
              </div>
            </div>

            {/* Error Log if any failed during DB writes */}
            {result.errors.length > 0 && (
              <div className="border rounded-lg p-3 bg-destructive/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-destructive">
                  <XCircle className="w-4 h-4" />
                  <span>Failed Rows ({result.errors.length}):</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 text-xs font-mono">
                  {result.errors.map((err, i) => (
                    <div key={i} className="text-muted-foreground">
                      Row {err.rowNumber} [{err.itemCode}]: {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={resetState}
              >
                <RotateCcw className="w-4 h-4 mr-1.5" /> Import Another File
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleModalClose(false)}
                className="bg-primary"
              >
                Done & Refresh Products
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
