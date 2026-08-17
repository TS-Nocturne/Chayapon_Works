-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "images" TEXT[],
    "productType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "transmission" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "color" TEXT,
    "engineSize" DOUBLE PRECISION,
    "bodyType" TEXT,
    "driveType" TEXT,
    "plateProvince" TEXT,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,

    CONSTRAINT "vehicle_brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_model" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "vehicle_model_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_productType_idx" ON "product"("productType");

-- CreateIndex
CREATE INDEX "product_status_idx" ON "product"("status");

-- CreateIndex
CREATE INDEX "product_price_idx" ON "product"("price");

-- CreateIndex
CREATE INDEX "product_featured_idx" ON "product"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_productId_key" ON "vehicle"("productId");

-- CreateIndex
CREATE INDEX "vehicle_brandId_idx" ON "vehicle"("brandId");

-- CreateIndex
CREATE INDEX "vehicle_modelId_idx" ON "vehicle"("modelId");

-- CreateIndex
CREATE INDEX "vehicle_year_idx" ON "vehicle"("year");

-- CreateIndex
CREATE INDEX "vehicle_mileage_idx" ON "vehicle"("mileage");

-- CreateIndex
CREATE INDEX "vehicle_transmission_idx" ON "vehicle"("transmission");

-- CreateIndex
CREATE INDEX "vehicle_fuelType_idx" ON "vehicle"("fuelType");

-- CreateIndex
CREATE INDEX "vehicle_bodyType_idx" ON "vehicle"("bodyType");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_brand_name_key" ON "vehicle_brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_model_brandId_name_key" ON "vehicle_model"("brandId", "name");

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "vehicle_brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_model" ADD CONSTRAINT "vehicle_model_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "vehicle_brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
