-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostSheet" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inquiryDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "customer" TEXT,
    "salesRep" TEXT,
    "project" TEXT,
    "jobSite" TEXT,
    "width" DOUBLE PRECISION,
    "projection" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "valance" DOUBLE PRECISION,
    "canopySqFt" DOUBLE PRECISION,
    "awningLinFt" DOUBLE PRECISION,
    "miscQty" DOUBLE PRECISION,
    "miscPrice" DOUBLE PRECISION,
    "salesTax" DOUBLE PRECISION NOT NULL DEFAULT 0.0975,
    "laborRate" DOUBLE PRECISION NOT NULL DEFAULT 95.00,
    "totalMaterials" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFabric" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFabricationLabor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalInstallationLabor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLabor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotalBeforeMarkup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "markup" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "totalWithMarkup" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "permitCost" DOUBLE PRECISION,
    "engineeringCost" DOUBLE PRECISION,
    "equipmentCost" DOUBLE PRECISION,
    "driveTimeTrips" INTEGER,
    "driveTimeHours" DOUBLE PRECISION,
    "driveTimePeople" INTEGER,
    "driveTimeRate" DOUBLE PRECISION NOT NULL DEFAULT 75.00,
    "driveTimeTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roundtripMiles" DOUBLE PRECISION,
    "roundtripTrips" INTEGER,
    "mileageRate" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "mileageTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hotelNights" INTEGER,
    "hotelPeople" INTEGER,
    "hotelRate" DOUBLE PRECISION,
    "hotelTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "foodCost" DOUBLE PRECISION,
    "totalOtherRequirements" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWithOtherReqs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountIncrease" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPriceToClient" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerSqFt" DOUBLE PRECISION,
    "pricePerLinFt" DOUBLE PRECISION,
    "pricePerSqFtPreDelivery" DOUBLE PRECISION,
    "pricePerLinFtPreDelivery" DOUBLE PRECISION,
    "outcome" TEXT NOT NULL DEFAULT 'Unknown',
    "userId" TEXT NOT NULL,

    CONSTRAINT "CostSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialLine" (
    "id" TEXT NOT NULL,
    "costSheetId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "salesTax" DOUBLE PRECISION NOT NULL DEFAULT 0.0975,
    "freight" DOUBLE PRECISION,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FabricLine" (
    "id" TEXT NOT NULL,
    "costSheetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "yards" DOUBLE PRECISION NOT NULL,
    "pricePerYard" DOUBLE PRECISION NOT NULL,
    "salesTax" DOUBLE PRECISION NOT NULL DEFAULT 0.0975,
    "freight" DOUBLE PRECISION,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FabricLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaborLine" (
    "id" TEXT NOT NULL,
    "costSheetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "people" INTEGER NOT NULL DEFAULT 1,
    "rate" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "isFabrication" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LaborLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecapLine" (
    "id" TEXT NOT NULL,
    "costSheetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "width" DOUBLE PRECISION,
    "length" DOUBLE PRECISION,
    "fabricYard" DOUBLE PRECISION,
    "linearFt" DOUBLE PRECISION,
    "sqFt" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecapLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "CostSheet" ADD CONSTRAINT "CostSheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialLine" ADD CONSTRAINT "MaterialLine_costSheetId_fkey" FOREIGN KEY ("costSheetId") REFERENCES "CostSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FabricLine" ADD CONSTRAINT "FabricLine_costSheetId_fkey" FOREIGN KEY ("costSheetId") REFERENCES "CostSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaborLine" ADD CONSTRAINT "LaborLine_costSheetId_fkey" FOREIGN KEY ("costSheetId") REFERENCES "CostSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecapLine" ADD CONSTRAINT "RecapLine_costSheetId_fkey" FOREIGN KEY ("costSheetId") REFERENCES "CostSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
