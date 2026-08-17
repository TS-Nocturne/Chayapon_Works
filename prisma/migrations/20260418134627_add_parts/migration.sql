-- CreateTable
CREATE TABLE "part" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "compatibility" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "part_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "part_productId_key" ON "part"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "part_sku_key" ON "part"("sku");

-- CreateIndex
CREATE INDEX "part_category_idx" ON "part"("category");

-- CreateIndex
CREATE INDEX "part_brand_idx" ON "part"("brand");

-- CreateIndex
CREATE INDEX "part_sku_idx" ON "part"("sku");

-- AddForeignKey
ALTER TABLE "part" ADD CONSTRAINT "part_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
