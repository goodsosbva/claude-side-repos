CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT           NOT NULL,
  price       INTEGER        NOT NULL CHECK (price >= 0),
  stock       INTEGER        NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id          TEXT PRIMARY KEY,
  status      TEXT           NOT NULL DEFAULT 'PENDING',
  total       INTEGER        NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  order_id    TEXT    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  TEXT    NOT NULL REFERENCES products(id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (order_id, product_id)
);

INSERT INTO products (id, name, price, stock) VALUES
  ('p1', '샘플 상품 A', 19900, 10),
  ('p2', '샘플 상품 B', 34900, 4)
ON CONFLICT (id) DO NOTHING;
