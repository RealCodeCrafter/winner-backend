-- Winner backend — birinchi marta bazani yaratish
-- ISPmanager → PostgreSQL → SQL konsolida ishga tushiring

CREATE TABLE IF NOT EXISTS superadmin (
  id SERIAL PRIMARY KEY,
  username VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  title JSONB NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  "sortOrder" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name JSONB NOT NULL,
  tag JSONB,
  description JSONB,
  volumes TEXT[] NOT NULL DEFAULT '{}',
  images TEXT[] NOT NULL DEFAULT '{}',
  viscosity VARCHAR,
  "apiStandard" VARCHAR,
  "aceaStandard" VARCHAR,
  "manufacturedIn" JSONB,
  "categoryId" INTEGER NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "FK_products_category"
    FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE RESTRICT
);
