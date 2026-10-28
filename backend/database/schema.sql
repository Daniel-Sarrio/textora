-- TEXORA: esquema de usuarios y pedidos.
-- Ejecutar conectado exclusivamente a la base de datos texora_db.
-- El catálogo de ES-TELA no se almacena en PostgreSQL.

BEGIN;

CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_name_not_blank CHECK (BTRIM(name) <> ''),
    CONSTRAINT users_email_not_blank CHECK (BTRIM(email) <> ''),
    CONSTRAINT users_email_trimmed CHECK (email = BTRIM(email)),
    CONSTRAINT users_password_hash_not_blank CHECK (
        LENGTH(BTRIM(password_hash)) >= 20
    )
);

CREATE UNIQUE INDEX users_email_unique_ci ON users (LOWER(email));

CREATE TABLE orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orders_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT orders_total_non_negative CHECK (total >= 0),
    CONSTRAINT orders_status_allowed CHECK (
        status IN ('pending', 'completed', 'cancelled')
    )
);

CREATE INDEX orders_user_id_idx ON orders (user_id);

CREATE TABLE order_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id BIGINT NOT NULL,
    external_product_id VARCHAR(100) NOT NULL,
    external_article_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    size VARCHAR(100) NOT NULL,
    color VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    CONSTRAINT order_items_order_fk
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT order_items_external_product_not_blank CHECK (
        BTRIM(external_product_id) <> ''
    ),
    CONSTRAINT order_items_external_article_not_blank CHECK (
        BTRIM(external_article_id) <> ''
    ),
    CONSTRAINT order_items_product_name_not_blank CHECK (
        BTRIM(product_name) <> ''
    ),
    CONSTRAINT order_items_size_not_blank CHECK (BTRIM(size) <> ''),
    CONSTRAINT order_items_color_not_blank CHECK (BTRIM(color) <> ''),
    CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT order_items_unit_price_non_negative CHECK (unit_price >= 0)
);

CREATE INDEX order_items_order_id_idx ON order_items (order_id);

COMMIT;
