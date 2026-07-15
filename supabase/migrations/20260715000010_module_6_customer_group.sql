-- MODULE 6: Customer Groups

ALTER TABLE customers
ADD COLUMN customer_group VARCHAR DEFAULT 'General';
