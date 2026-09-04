export type DashboardMetrics = {
  total_sales: number;
  total_purchases: number;
  total_profit: number;
  total_cogs?: number;
  inventory_value: number;
  active_customers: number;
  low_stock_items: number;
};

export type SalesChartData = {
  date: string;
  sales: number;
  profit: number;
  cost?: number;
};

export type InventoryReportItem = {
  variation_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_cost?: number;
  total_value: number; // based on FIFO cost
  warehouse_breakdown?: { warehouse_name: string; quantity: number }[];
};

export type SalesReportItem = {
  id: string;
  date: string;
  reference: string;
  customer: string;
  amount: number;
  cost: number;
  profit: number;
  status: string;
  source: 'Order' | 'Invoice' | 'POS';
  detail_url?: string;
};

