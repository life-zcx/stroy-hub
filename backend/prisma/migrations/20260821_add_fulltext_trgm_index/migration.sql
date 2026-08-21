-- Enable pg_trgm extension for fuzzy search and similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN trigram indexes on Product name, description, and article for fast fuzzy search
CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx" ON "Product" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Product_description_trgm_idx" ON "Product" USING gin ("description" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Product_article_trgm_idx" ON "Product" USING gin ("article" gin_trgm_ops);
