-- Disable notices
SET client_min_messages TO WARNING;

-- 1. Brands
INSERT INTO brands (name, description, is_active) VALUES
('Toyota Genuine Parts', 'Original equipment manufacturer parts for Toyota', true),
('Bosch', 'Premium automotive parts and systems', true),
('NGK', 'Leading spark plug manufacturer', true),
('Mobil 1', 'Synthetic motor oil', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Categories
INSERT INTO categories (name, slug, is_active) VALUES
('Engine Parts', 'engine-parts', true),
('Brakes & Suspension', 'brakes-suspension', true),
('Oils & Fluids', 'oils-fluids', true),
('Electrical & Lighting', 'electrical-lighting', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert Subcategories
INSERT INTO categories (parent_id, name, slug, is_active) VALUES
((SELECT id FROM categories WHERE slug = 'engine-parts'), 'Spark Plugs', 'spark-plugs', true),
((SELECT id FROM categories WHERE slug = 'brakes-suspension'), 'Brake Pads', 'brake-pads', true),
((SELECT id FROM categories WHERE slug = 'oils-fluids'), 'Engine Oil', 'engine-oil', true)
ON CONFLICT (slug) DO NOTHING;

-- 3. Units of Measure
INSERT INTO units_of_measure (name, abbreviation) VALUES
('Piece', 'pcs'),
('Set', 'set'),
('Liter', 'L'),
('Gallon', 'gal'),
('Kilogram', 'kg')
ON CONFLICT (name) DO NOTHING;

-- 4. Attributes
INSERT INTO attributes (name, display_type) VALUES
('Size', 'text'),
('Material', 'text'),
('Viscosity', 'text'),
('Vehicle Fitment', 'text')
ON CONFLICT (name) DO NOTHING;

INSERT INTO attribute_values (attribute_id, value) VALUES
((SELECT id FROM attributes WHERE name = 'Viscosity'), '5W-30'),
((SELECT id FROM attributes WHERE name = 'Viscosity'), '10W-40'),
((SELECT id FROM attributes WHERE name = 'Material'), 'Ceramic'),
((SELECT id FROM attributes WHERE name = 'Material'), 'Semi-Metallic')
ON CONFLICT (attribute_id, value) DO NOTHING;

-- 5. Warehouses
INSERT INTO warehouses (name, code, address, is_active) VALUES
('Main Distribution Center', 'MDC-01', '123 Industrial Park, Dhaka', true),
('Gulshan Retail Store', 'RET-01', '45 Gulshan Ave, Dhaka', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO warehouse_zones (warehouse_id, name, code) VALUES
((SELECT id FROM warehouses WHERE code = 'MDC-01'), 'Bulk Storage', 'Z-BLK'),
((SELECT id FROM warehouses WHERE code = 'MDC-01'), 'Picking Zone', 'Z-PCK'),
((SELECT id FROM warehouses WHERE code = 'RET-01'), 'Store Front', 'Z-STR')
ON CONFLICT (warehouse_id, code) DO NOTHING;

INSERT INTO warehouse_bins (zone_id, name, code) VALUES
((SELECT id FROM warehouse_zones WHERE code = 'Z-BLK' AND warehouse_id = (SELECT id FROM warehouses WHERE code = 'MDC-01')), 'A1', 'A1'),
((SELECT id FROM warehouse_zones WHERE code = 'Z-BLK' AND warehouse_id = (SELECT id FROM warehouses WHERE code = 'MDC-01')), 'A2', 'A2'),
((SELECT id FROM warehouse_zones WHERE code = 'Z-STR' AND warehouse_id = (SELECT id FROM warehouses WHERE code = 'RET-01')), 'Shelf 1', 'S1')
ON CONFLICT (zone_id, code) DO NOTHING;

-- 6. Chart of Accounts
INSERT INTO chart_of_accounts (account_number, name, account_type, is_group, is_active) VALUES
('1000', 'Assets', 'Asset', true, true),
('2000', 'Liabilities', 'Liability', true, true),
('3000', 'Equity', 'Equity', true, true),
('4000', 'Revenue', 'Revenue', true, true),
('5000', 'Expenses', 'Expense', true, true)
ON CONFLICT (account_number) DO NOTHING;

INSERT INTO chart_of_accounts (parent_id, account_number, name, account_type, is_active) VALUES
((SELECT id FROM chart_of_accounts WHERE account_number = '1000'), '1100', 'Cash', 'Asset', true),
((SELECT id FROM chart_of_accounts WHERE account_number = '1000'), '1200', 'Accounts Receivable', 'Asset', true),
((SELECT id FROM chart_of_accounts WHERE account_number = '1000'), '1300', 'Inventory', 'Asset', true),
((SELECT id FROM chart_of_accounts WHERE account_number = '2000'), '2100', 'Accounts Payable', 'Liability', true),
((SELECT id FROM chart_of_accounts WHERE account_number = '4000'), '4100', 'Sales Revenue', 'Revenue', true),
((SELECT id FROM chart_of_accounts WHERE account_number = '5000'), '5100', 'Cost of Goods Sold', 'Expense', true),
((SELECT id FROM chart_of_accounts WHERE account_number = '5000'), '5200', 'Operating Expenses', 'Expense', true)
ON CONFLICT (account_number) DO NOTHING;

-- 7. Fiscal Years
INSERT INTO fiscal_years (name, start_date, end_date, is_closed) VALUES
('FY2026', '2026-01-01', '2026-12-31', false),
('FY2025', '2025-01-01', '2025-12-31', true)
ON CONFLICT (name) DO NOTHING;

-- 8. Suppliers and Customers
INSERT INTO suppliers (name, contact_email, contact_phone, payable_account_id, is_active) VALUES
('Global Auto Parts Ltd', 'sales@globalauto.com', '+8801700000001', (SELECT id FROM chart_of_accounts WHERE account_number = '2100'), true),
('Bosch Bangladesh', 'contact@bosch.com.bd', '+8801700000002', (SELECT id FROM chart_of_accounts WHERE account_number = '2100'), true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO customers (name, contact_email, contact_phone, receivable_account_id, is_active, customer_group) VALUES
('Rahim Auto Shop', 'rahim@autoshop.com', '+8801800000001', (SELECT id FROM chart_of_accounts WHERE account_number = '1200'), true, 'Dealer'),
('Walk-in Customer', 'walkin@example.com', 'N/A', (SELECT id FROM chart_of_accounts WHERE account_number = '1200'), true, 'Retail')
ON CONFLICT (name) DO NOTHING;

-- 9. Products & Variations
INSERT INTO products (item_code, name, description, category_id, brand_id, base_uom_id, has_variants)
VALUES (
    'BP-001', 'Toyota Corolla Brake Pads', 'Premium Ceramic Brake Pads for Toyota Corolla (2015-2023)',
    (SELECT id FROM categories WHERE slug = 'brake-pads'),
    (SELECT id FROM brands WHERE name = 'Toyota Genuine Parts'),
    (SELECT id FROM units_of_measure WHERE abbreviation = 'set'),
    false
) ON CONFLICT (item_code) DO NOTHING;

INSERT INTO product_variations (product_id, sku, barcode, weight)
VALUES (
    (SELECT id FROM products WHERE item_code = 'BP-001'),
    'SKU-BP-001', '7891011121314', 1.5
) ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (item_code, name, description, category_id, brand_id, base_uom_id, has_variants)
VALUES (
    'SP-NGK-01', 'NGK Iridium Spark Plug', 'High performance iridium spark plug',
    (SELECT id FROM categories WHERE slug = 'spark-plugs'),
    (SELECT id FROM brands WHERE name = 'NGK'),
    (SELECT id FROM units_of_measure WHERE abbreviation = 'pcs'),
    false
) ON CONFLICT (item_code) DO NOTHING;

INSERT INTO product_variations (product_id, sku, barcode, weight)
VALUES (
    (SELECT id FROM products WHERE item_code = 'SP-NGK-01'),
    'SKU-SP-NGK-01', '1234567890123', 0.1
) ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (item_code, name, description, category_id, brand_id, base_uom_id, has_variants)
VALUES (
    'OIL-M1-5W30', 'Mobil 1 Full Synthetic 5W-30', 'Advanced full synthetic motor oil',
    (SELECT id FROM categories WHERE slug = 'engine-oil'),
    (SELECT id FROM brands WHERE name = 'Mobil 1'),
    (SELECT id FROM units_of_measure WHERE abbreviation = 'L'),
    false
) ON CONFLICT (item_code) DO NOTHING;

INSERT INTO product_variations (product_id, sku, barcode, weight)
VALUES (
    (SELECT id FROM products WHERE item_code = 'OIL-M1-5W30'),
    'SKU-OIL-M1-5W30-4L', '4567890123456', 3.8
) ON CONFLICT (sku) DO NOTHING;

-- 10. Initial Stock Balances
INSERT INTO stock_balances (variation_id, warehouse_id, bin_id, quantity)
VALUES (
    (SELECT id FROM product_variations WHERE sku = 'SKU-BP-001'),
    (SELECT id FROM warehouses WHERE code = 'MDC-01'),
    (SELECT id FROM warehouse_bins WHERE code = 'A1'),
    150
) ON CONFLICT (variation_id, warehouse_id, bin_id, batch_number) DO NOTHING;

INSERT INTO stock_balances (variation_id, warehouse_id, bin_id, quantity)
VALUES (
    (SELECT id FROM product_variations WHERE sku = 'SKU-SP-NGK-01'),
    (SELECT id FROM warehouses WHERE code = 'RET-01'),
    (SELECT id FROM warehouse_bins WHERE code = 'S1'),
    500
) ON CONFLICT (variation_id, warehouse_id, bin_id, batch_number) DO NOTHING;

INSERT INTO stock_balances (variation_id, warehouse_id, bin_id, quantity)
VALUES (
    (SELECT id FROM product_variations WHERE sku = 'SKU-OIL-M1-5W30-4L'),
    (SELECT id FROM warehouses WHERE code = 'MDC-01'),
    (SELECT id FROM warehouse_bins WHERE code = 'A2'),
    200
) ON CONFLICT (variation_id, warehouse_id, bin_id, batch_number) DO NOTHING;

-- 11. Price Lists
INSERT INTO price_lists (name, currency, is_tax_included, is_active) VALUES
('Standard Retail Price', 'BDT', true, true),
('Wholesale Dealer Price', 'BDT', false, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO price_list_items (price_list_id, variation_id, uom_id, price) VALUES
((SELECT id FROM price_lists WHERE name = 'Standard Retail Price'), (SELECT id FROM product_variations WHERE sku = 'SKU-BP-001'), (SELECT id FROM units_of_measure WHERE abbreviation = 'set'), 4500),
((SELECT id FROM price_lists WHERE name = 'Standard Retail Price'), (SELECT id FROM product_variations WHERE sku = 'SKU-SP-NGK-01'), (SELECT id FROM units_of_measure WHERE abbreviation = 'pcs'), 1200),
((SELECT id FROM price_lists WHERE name = 'Standard Retail Price'), (SELECT id FROM product_variations WHERE sku = 'SKU-OIL-M1-5W30-4L'), (SELECT id FROM units_of_measure WHERE abbreviation = 'L'), 5500)
ON CONFLICT (price_list_id, variation_id, uom_id) DO NOTHING;

INSERT INTO price_list_items (price_list_id, variation_id, uom_id, price) VALUES
((SELECT id FROM price_lists WHERE name = 'Wholesale Dealer Price'), (SELECT id FROM product_variations WHERE sku = 'SKU-BP-001'), (SELECT id FROM units_of_measure WHERE abbreviation = 'set'), 3800),
((SELECT id FROM price_lists WHERE name = 'Wholesale Dealer Price'), (SELECT id FROM product_variations WHERE sku = 'SKU-SP-NGK-01'), (SELECT id FROM units_of_measure WHERE abbreviation = 'pcs'), 900),
((SELECT id FROM price_lists WHERE name = 'Wholesale Dealer Price'), (SELECT id FROM product_variations WHERE sku = 'SKU-OIL-M1-5W30-4L'), (SELECT id FROM units_of_measure WHERE abbreviation = 'L'), 4800)
ON CONFLICT (price_list_id, variation_id, uom_id) DO NOTHING;

-- 12. POS Registers
INSERT INTO pos_registers (name, warehouse_id, default_cash_account_id, is_active) VALUES
('Main Cash Register 1', 
 (SELECT id FROM warehouses WHERE code = 'RET-01'), 
 (SELECT id FROM chart_of_accounts WHERE account_number = '1100'), 
 true)
ON CONFLICT (name) DO NOTHING;
