import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownToLine,
  ArrowRightLeft,
  Eye,
  FileText,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useSuppliers } from "../../../supplier/presentation/hooks/useSuppliers";
import { useGoodsReceive } from "../hooks/useGoodsReceive";
import { usePurchaseOrders } from "../hooks/usePurchaseOrders";

// Shared FilterBar component used for both tabs
function FilterBar({
  search,
  onSearch,
  supplierId,
  onSupplier,
  status,
  onStatus,
  statusOptions,
  dateFrom,
  onDateFrom,
  dateTo,
  onDateTo,
  onClear,
  searchPlaceholder,
  suppliers,
}: any) {
  const hasFilters = search || supplierId || status || dateFrom || dateTo;
  return (
    <div className="flex flex-wrap gap-3 items-end p-3 border rounded-lg bg-muted/10 mb-4">
      <div className="relative flex-1 min-w-[160px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => onSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
      <div className="w-44">
        <Select value={supplierId || "all"} onValueChange={(v) => onSupplier(v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="All Suppliers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers?.map((s: any) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-36">
        <Select value={status || "all"} onValueChange={(v) => onStatus(v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((opt: string) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          className="w-36"
          value={dateFrom}
          onChange={(e) => onDateFrom(e.target.value)}
          title="Date From"
        />
        <span className="text-muted-foreground text-sm">—</span>
        <Input
          type="date"
          className="w-36"
          value={dateTo}
          onChange={(e) => onDateTo(e.target.value)}
          title="Date To"
        />
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="w-3.5 h-3.5 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}

export default function PurchaseHistoryPage() {
  const { suppliers } = useSuppliers();

  // PO filters
  const [poSearch, setPoSearch] = useState("");
  const [poSupplier, setPoSupplier] = useState("");
  const [poStatus, setPoStatus] = useState("");
  const [poDateFrom, setPoDateFrom] = useState("");
  const [poDateTo, setPoDateTo] = useState("");

  const poFilters = {
    ...(poSearch ? { search: poSearch } : {}),
    ...(poSupplier ? { supplierId: poSupplier } : {}),
    ...(poStatus ? { status: poStatus } : {}),
    ...(poDateFrom ? { dateFrom: poDateFrom } : {}),
    ...(poDateTo ? { dateTo: poDateTo } : {}),
  };

  // GRN filters
  const [grnSearch, setGrnSearch] = useState("");
  const [grnSupplier, setGrnSupplier] = useState("");
  const [grnStatus, setGrnStatus] = useState("");
  const [grnDateFrom, setGrnDateFrom] = useState("");
  const [grnDateTo, setGrnDateTo] = useState("");

  const grnFilters = {
    ...(grnSearch ? { search: grnSearch } : {}),
    ...(grnSupplier ? { supplierId: grnSupplier } : {}),
    ...(grnStatus ? { status: grnStatus } : {}),
    ...(grnDateFrom ? { dateFrom: grnDateFrom } : {}),
    ...(grnDateTo ? { dateTo: grnDateTo } : {}),
  };

  const { orders, isLoading: loadingOrders } = usePurchaseOrders(poFilters);
  const { receipts, isLoading: loadingReceipts } = useGoodsReceive(grnFilters);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Purchase History &amp; Returns
        </h1>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="receipts">Goods Receipts</TabsTrigger>
        </TabsList>

        {/* ── Purchase Orders Tab ── */}
        <TabsContent value="orders" className="mt-4">
          <FilterBar
            search={poSearch}
            onSearch={setPoSearch}
            supplierId={poSupplier}
            onSupplier={setPoSupplier}
            status={poStatus}
            onStatus={setPoStatus}
            statusOptions={["Draft", "Confirmed", "Received", "Cancelled"]}
            dateFrom={poDateFrom}
            onDateFrom={setPoDateFrom}
            dateTo={poDateTo}
            onDateTo={setPoDateTo}
            onClear={() => {
              setPoSearch("");
              setPoSupplier("");
              setPoStatus("");
              setPoDateFrom("");
              setPoDateTo("");
            }}
            searchPlaceholder="Search PO number..."
            suppliers={suppliers}
          />
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingOrders ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      <Loader2 className="animate-spin w-6 h-6 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : (
                  orders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                          {order.po_number}
                        </div>
                      </TableCell>
                      {/* @ts-ignore */}
                      <TableCell>{order.suppliers?.name}</TableCell>
                      <TableCell>
                        {new Date(order.order_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-secondary">
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${order.total_amount}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/admin/purchase-orders/${order.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Order Details"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {(!orders || orders.length === 0) && !loadingOrders && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No Purchase Orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ── Goods Receipts Tab ── */}
        <TabsContent value="receipts" className="mt-4">
          <FilterBar
            search={grnSearch}
            onSearch={setGrnSearch}
            supplierId={grnSupplier}
            onSupplier={setGrnSupplier}
            status={grnStatus}
            onStatus={setGrnStatus}
            statusOptions={["Completed", "Return", "Pending"]}
            dateFrom={grnDateFrom}
            onDateFrom={setGrnDateFrom}
            dateTo={grnDateTo}
            onDateTo={setGrnDateTo}
            onClear={() => {
              setGrnSearch("");
              setGrnSupplier("");
              setGrnStatus("");
              setGrnDateFrom("");
              setGrnDateTo("");
            }}
            searchPlaceholder="Search receipt number..."
            suppliers={suppliers}
          />
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt / Return Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingReceipts ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      <Loader2 className="animate-spin w-6 h-6 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts?.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {rec.status === "Return" ? (
                            <ArrowRightLeft className="w-4 h-4 mr-2 text-orange-500" />
                          ) : (
                            <ArrowDownToLine className="w-4 h-4 mr-2 text-green-600" />
                          )}
                          {rec.receipt_number}
                        </div>
                      </TableCell>
                      {/* @ts-ignore */}
                      <TableCell>{rec.suppliers?.name}</TableCell>
                      {/* @ts-ignore */}
                      <TableCell>{rec.warehouses?.name}</TableCell>
                      <TableCell>
                        {new Date(rec.receipt_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${rec.status === "Return" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}
                        >
                          {rec.status === "Return" ? "Return" : "Receipt"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/admin/goods-receive/${rec.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Receipt Details"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {(!receipts || receipts.length === 0) && !loadingReceipts && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No receipts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
