import { Filter, Search, Warehouse } from "lucide-react";
import React from "react";

interface DashboardFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedWarehouse: string;
  setSelectedWarehouse: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  warehouses: any[];
  categoriesData: any[];
  productCount: number;
}

export function DashboardFilters({
  searchTerm,
  setSearchTerm,
  selectedWarehouse,
  setSelectedWarehouse,
  selectedCategory,
  setSelectedCategory,
  warehouses,
  categoriesData,
  productCount,
}: DashboardFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by part name, brand, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-body focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Warehouse Filter */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl w-full sm:w-auto">
          <Warehouse className="w-4 h-4 text-primary shrink-0" />
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="bg-transparent text-sm font-body font-bold text-gray-800 focus:outline-none cursor-pointer w-full"
          >
            <option value="all">All Warehouses</option>
            {Array.isArray(warehouses) &&
              warehouses.map((wh: any) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} {wh.code ? `(${wh.code})` : ""}
                </option>
              ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent text-sm font-body font-semibold text-gray-700 focus:outline-none cursor-pointer w-full"
          >
            <option value="all">All Categories</option>
            {categoriesData.map((cat: any) => (
              <option key={cat.id || cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-gray-500 font-medium whitespace-nowrap hidden sm:block">
          <strong className="text-gray-900">{productCount}</strong> Products
        </p>
      </div>
    </div>
  );
}
