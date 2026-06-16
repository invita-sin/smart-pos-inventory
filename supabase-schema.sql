-- SmartPOS Inventory - Supabase Schema

-- 1. TABLES

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'kasir' CHECK (role IN ('owner', 'kasir', 'gudang')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  name TEXT NOT NULL,
  purchase_price DECIMAL(12,2) DEFAULT 0,
  selling_price DECIMAL(12,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stock_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  qty INTEGER NOT NULL,
  purchase_price DECIMAL(12,2) DEFAULT 0,
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stock_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL,
  reason TEXT,
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  total DECIMAL(12,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'tunai' CHECK (payment_method IN ('tunai', 'transfer', 'qris')),
  amount_paid DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL,
  price DECIMAL(12,2) NOT NULL
);

-- 2. AUTO-INCREMENT INVOICE (using a sequence)

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  seq_num TEXT;
  date_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYMMDD');
  seq_num := LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
  RETURN 'INV-' || date_part || '-' || seq_num;
END;
$$ LANGUAGE plpgsql;

-- 3. RPC: stock_in (atomically insert stock_in + update product stock)

CREATE OR REPLACE FUNCTION stock_in(
  p_product_id UUID,
  p_qty INTEGER,
  p_purchase_price DECIMAL DEFAULT 0,
  p_supplier_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_stock_in_id UUID;
  v_product products%ROWTYPE;
BEGIN
  INSERT INTO stock_ins (product_id, supplier_id, qty, purchase_price)
  VALUES (p_product_id, p_supplier_id, p_qty, p_purchase_price)
  RETURNING id INTO v_stock_in_id;

  UPDATE products
  SET stock = stock + p_qty,
      purchase_price = CASE WHEN p_purchase_price > 0 THEN p_purchase_price ELSE purchase_price END,
      updated_at = NOW()
  WHERE id = p_product_id
  RETURNING * INTO v_product;

  RETURN json_build_object(
    'stock_in_id', v_stock_in_id,
    'product_id', v_product.id,
    'new_stock', v_product.stock
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: stock_out (atomically insert stock_out + update product stock)

CREATE OR REPLACE FUNCTION stock_out(
  p_product_id UUID,
  p_qty INTEGER,
  p_reason TEXT DEFAULT ''
) RETURNS JSON AS $$
DECLARE
  v_stock_out_id UUID;
  v_product products%ROWTYPE;
BEGIN
  SELECT * INTO v_product FROM products WHERE id = p_product_id FOR UPDATE;

  IF v_product.stock < p_qty THEN
    RAISE EXCEPTION 'Stok tidak mencukupi. Tersedia: %, diminta: %', v_product.stock, p_qty;
  END IF;

  INSERT INTO stock_outs (product_id, qty, reason)
  VALUES (p_product_id, p_qty, p_reason)
  RETURNING id INTO v_stock_out_id;

  UPDATE products
  SET stock = stock - p_qty,
      updated_at = NOW()
  WHERE id = p_product_id
  RETURNING * INTO v_product;

  RETURN json_build_object(
    'stock_out_id', v_stock_out_id,
    'product_id', v_product.id,
    'new_stock', v_product.stock
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: create_transaction

CREATE OR REPLACE FUNCTION create_transaction(
  p_items JSONB,
  p_total DECIMAL,
  p_payment_method TEXT,
  p_amount_paid DECIMAL DEFAULT 0
) RETURNS JSON AS $$
DECLARE
  v_transaction_id UUID;
  v_invoice TEXT;
  v_item JSONB;
BEGIN
  v_invoice := generate_invoice_number();

  INSERT INTO transactions (invoice_number, total, payment_method, amount_paid)
  VALUES (v_invoice, p_total, p_payment_method, p_amount_paid)
  RETURNING id INTO v_transaction_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO transaction_items (transaction_id, product_id, qty, price)
    VALUES (
      v_transaction_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'qty')::INTEGER,
      (v_item->>'price')::DECIMAL
    );

    UPDATE products
    SET stock = stock - (v_item->>'qty')::INTEGER,
        updated_at = NOW()
    WHERE id = (v_item->>'product_id')::UUID;
  END LOOP;

  RETURN json_build_object(
    'id', v_transaction_id,
    'invoice_number', v_invoice
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: get_sales_report

CREATE OR REPLACE FUNCTION get_sales_report(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS TABLE(
  id UUID,
  invoice_number TEXT,
  created_at TIMESTAMPTZ,
  total DECIMAL,
  profit DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.invoice_number,
    t.created_at,
    t.total,
    t.total - COALESCE(SUM(ti.qty * p.purchase_price), 0) AS profit
  FROM transactions t
  JOIN transaction_items ti ON ti.transaction_id = t.id
  JOIN products p ON p.id = ti.product_id
  WHERE t.created_at BETWEEN start_date AND end_date
  GROUP BY t.id, t.invoice_number, t.created_at, t.total
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: get_dashboard_stats

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  v_today_sales DECIMAL;
  v_tx_count INTEGER;
  v_product_count INTEGER;
  v_low_stock INTEGER;
BEGIN
  SELECT COALESCE(SUM(total), 0) INTO v_today_sales
  FROM transactions
  WHERE created_at >= CURRENT_DATE;

  SELECT COUNT(*) INTO v_tx_count FROM transactions;
  SELECT COUNT(*) INTO v_product_count FROM products;
  SELECT COUNT(*) INTO v_low_stock FROM products WHERE stock <= 10;

  RETURN json_build_object(
    'today_sales', v_today_sales,
    'transaction_count', v_tx_count,
    'product_count', v_product_count,
    'low_stock_count', v_low_stock
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Enable Row Level Security (RLS)

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- RLS policies (allow authenticated users full access)

CREATE POLICY "Allow all for authenticated" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON suppliers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON stock_ins FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON stock_outs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON transaction_items FOR ALL USING (auth.role() = 'authenticated');

-- 9. Auto-create profile on signup

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'kasir')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
