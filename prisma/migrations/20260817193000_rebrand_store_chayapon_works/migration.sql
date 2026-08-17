ALTER TABLE "store_settings"
ALTER COLUMN "storeName" SET DEFAULT 'Chayapon Works';

UPDATE "store_settings"
SET "storeName" = 'Chayapon Works';

UPDATE "part"
SET "brand" = 'Chayapon Works Select'
WHERE "brand" = 'HYBRID Select';
