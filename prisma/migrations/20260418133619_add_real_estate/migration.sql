-- CreateTable
CREATE TABLE "real_estate" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "areaSqm" DOUBLE PRECISION NOT NULL,
    "landSqw" DOUBLE PRECISION,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "floors" INTEGER,
    "location" TEXT NOT NULL,
    "district" TEXT,
    "nearbyPlaces" TEXT,
    "furnished" TEXT,
    "parking" INTEGER,
    "yearBuilt" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "real_estate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "real_estate_productId_key" ON "real_estate"("productId");

-- CreateIndex
CREATE INDEX "real_estate_propertyType_idx" ON "real_estate"("propertyType");

-- CreateIndex
CREATE INDEX "real_estate_location_idx" ON "real_estate"("location");

-- CreateIndex
CREATE INDEX "real_estate_bedrooms_idx" ON "real_estate"("bedrooms");

-- CreateIndex
CREATE INDEX "real_estate_areaSqm_idx" ON "real_estate"("areaSqm");

-- AddForeignKey
ALTER TABLE "real_estate" ADD CONSTRAINT "real_estate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
