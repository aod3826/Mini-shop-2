-- ============================================
-- MINI SHOP - COMPLETE DATABASE SETUP
-- Security-First | Zero-Config Deployment
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. TABLES
-- ============================================

-- Profiles (User Management with Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    customer_lat DECIMAL(10,8),
    customer_lng DECIMAL(11,8),
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled', 'problem')),
    payment_slip_url TEXT,
    trans_ref TEXT,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store Settings
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
    store_name TEXT DEFAULT 'Mini Shop',
    store_phone TEXT,
    store_address TEXT,
    store_lat DECIMAL(10,8) DEFAULT 13.7563,
    store_lng DECIMAL(11,8) DEFAULT 100.5018,
    shipping_per_km DECIMAL(10,2) DEFAULT 10.00,
    flat_shipping_fee DECIMAL(10,2) DEFAULT 50.00,
    use_distance_shipping BOOLEAN DEFAULT true,
    line_channel_access_token TEXT,
    line_notify_enabled BOOLEAN DEFAULT false,
    thunder_api_key TEXT,
    payment_qr_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_trans_ref ON public.orders(trans_ref);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_order_id ON public.activity_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON public.activity_logs(type);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Products Policies (Public Read, Admin Write)
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Orders Policies
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (
    auth.uid() = customer_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Order Items Policies
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE id = order_items.order_id 
        AND (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
);

-- Store Settings Policies
CREATE POLICY "Anyone can view store settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update store settings" ON public.store_settings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Activity Logs Policies
CREATE POLICY "Admins can view activity logs" ON public.activity_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- 4. STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('payments', 'payments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policy
CREATE POLICY "Anyone can upload payment slips" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payments');
CREATE POLICY "Anyone can view payment slips" ON storage.objects FOR SELECT USING (bucket_id = 'payments');
CREATE POLICY "Admins can delete payment slips" ON storage.objects FOR DELETE USING (
    bucket_id = 'payments' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function: Create Order with Items (Atomic Transaction)
CREATE OR REPLACE FUNCTION public.create_order_with_items(
    p_order_data JSONB,
    p_items JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_item JSONB;
    v_product RECORD;
BEGIN
    -- Generate unique order number
    v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
    
    -- Create order
    INSERT INTO orders (
        order_number,
        customer_id,
        customer_name,
        customer_phone,
        customer_address,
        customer_lat,
        customer_lng,
        subtotal,
        shipping_fee,
        total,
        notes
    ) VALUES (
        v_order_number,
        (p_order_data->>'customer_id')::UUID,
        p_order_data->>'customer_name',
        p_order_data->>'customer_phone',
        p_order_data->>'customer_address',
        (p_order_data->>'customer_lat')::DECIMAL,
        (p_order_data->>'customer_lng')::DECIMAL,
        (p_order_data->>'subtotal')::DECIMAL,
        (p_order_data->>'shipping_fee')::DECIMAL,
        (p_order_data->>'total')::DECIMAL,
        p_order_data->>'notes'
    ) RETURNING id INTO v_order_id;
    
    -- Insert order items and update stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Check stock availability
        SELECT id, name, price, stock INTO v_product
        FROM products
        WHERE id = (v_item->>'product_id')::UUID
        FOR UPDATE;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found', v_item->>'product_id';
        END IF;
        
        IF v_product.stock < (v_item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock for product %', v_product.name;
        END IF;
        
        -- Insert order item
        INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            product_price,
            quantity,
            subtotal
        ) VALUES (
            v_order_id,
            v_product.id,
            v_product.name,
            v_product.price,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'subtotal')::DECIMAL
        );
        
        -- Update stock
        UPDATE products
        SET stock = stock - (v_item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE id = v_product.id;
    END LOOP;
    
    -- Log activity
    INSERT INTO activity_logs (type, order_id, message, metadata)
    VALUES ('order_created', v_order_id, 'New order created: ' || v_order_number, p_order_data);
    
    RETURN v_order_id;
END;
$$;

-- Function: Verify Payment (Thunder Solution API)
CREATE OR REPLACE FUNCTION public.verify_payment(
    p_order_id UUID,
    p_trans_ref TEXT,
    p_amount DECIMAL,
    p_status TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_duplicate_check INTEGER;
BEGIN
    -- Get order details
    SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;
    
    -- Check for duplicate transaction
    SELECT COUNT(*) INTO v_duplicate_check
    FROM orders
    WHERE trans_ref = p_trans_ref AND id != p_order_id;
    
    IF v_duplicate_check > 0 THEN
        INSERT INTO activity_logs (type, order_id, message, metadata)
        VALUES ('payment_verification_failed', p_order_id, 'Duplicate transaction reference', 
                jsonb_build_object('trans_ref', p_trans_ref, 'reason', 'duplicate'));
        RETURN FALSE;
    END IF;
    
    -- Verify amount matches
    IF p_amount != v_order.total THEN
        INSERT INTO activity_logs (type, order_id, message, metadata)
        VALUES ('payment_verification_failed', p_order_id, 'Amount mismatch', 
                jsonb_build_object('expected', v_order.total, 'received', p_amount));
        RETURN FALSE;
    END IF;
    
    -- Verify status
    IF p_status != 'success' THEN
        INSERT INTO activity_logs (type, order_id, message, metadata)
        VALUES ('payment_verification_failed', p_order_id, 'Payment status not success', 
                jsonb_build_object('status', p_status));
        RETURN FALSE;
    END IF;
    
    -- Update order as paid
    UPDATE orders
    SET payment_status = 'paid',
        order_status = 'confirmed',
        trans_ref = p_trans_ref,
        verified_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Log success
    INSERT INTO activity_logs (type, order_id, message, metadata)
    VALUES ('payment_verified', p_order_id, 'Payment verified successfully', 
            jsonb_build_object('trans_ref', p_trans_ref, 'amount', p_amount));
    
    RETURN TRUE;
END;
$$;

-- Function: Calculate Shipping Fee (Haversine Formula)
CREATE OR REPLACE FUNCTION public.calculate_shipping_fee(
    p_customer_lat DECIMAL,
    p_customer_lng DECIMAL
) RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_settings RECORD;
    v_distance DECIMAL;
    v_earth_radius DECIMAL := 6371; -- km
    v_dlat DECIMAL;
    v_dlng DECIMAL;
    v_a DECIMAL;
    v_c DECIMAL;
BEGIN
    -- Get store settings
    SELECT * INTO v_settings FROM store_settings WHERE id = '00000000-0000-0000-0000-000000000001';
    
    -- Check if coordinates are valid
    IF p_customer_lat IS NULL OR p_customer_lng IS NULL OR 
       v_settings.store_lat IS NULL OR v_settings.store_lng IS NULL OR
       NOT v_settings.use_distance_shipping THEN
        RETURN v_settings.flat_shipping_fee;
    END IF;
    
    -- Haversine Formula
    v_dlat := RADIANS(p_customer_lat - v_settings.store_lat);
    v_dlng := RADIANS(p_customer_lng - v_settings.store_lng);
    
    v_a := SIN(v_dlat/2) * SIN(v_dlat/2) + 
           COS(RADIANS(v_settings.store_lat)) * COS(RADIANS(p_customer_lat)) * 
           SIN(v_dlng/2) * SIN(v_dlng/2);
    
    v_c := 2 * ATAN2(SQRT(v_a), SQRT(1-v_a));
    v_distance := v_earth_radius * v_c;
    
    -- Calculate fee
    RETURN ROUND(v_distance * v_settings.shipping_per_km, 2);
END;
$$;

-- ============================================
-- 6. SEED DATA
-- ============================================

-- Insert default store settings
INSERT INTO public.store_settings (
    id,
    store_name,
    store_phone,
    store_address,
    store_lat,
    store_lng,
    shipping_per_km,
    flat_shipping_fee,
    use_distance_shipping,
    line_notify_enabled
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Mini Shop',
    '02-xxx-xxxx',
    'Bangkok, Thailand',
    13.7563,
    100.5018,
    10.00,
    50.00,
    true,
    false
) ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO public.products (name, description, price, stock, is_active) VALUES
('iPhone 15 Pro', 'Latest iPhone with A17 Pro chip', 39900.00, 10, true),
('MacBook Air M3', '13-inch Laptop with M3 chip', 42900.00, 5, true),
('AirPods Pro', 'Active Noise Cancellation', 8900.00, 20, true),
('iPad Air', '10.9-inch Liquid Retina display', 21900.00, 8, true),
('Apple Watch Series 9', 'Advanced health features', 14900.00, 15, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SETUP COMPLETE
-- ============================================
