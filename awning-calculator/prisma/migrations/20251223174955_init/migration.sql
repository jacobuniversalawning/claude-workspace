-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CostSheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "inquiryDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "customer" TEXT,
    "salesRep" TEXT,
    "project" TEXT,
    "jobSite" TEXT,
    "width" REAL,
    "projection" REAL,
    "height" REAL,
    "valance" REAL,
    "canopySqFt" REAL,
    "awningLinFt" REAL,
    "miscQty" REAL,
    "miscPrice" REAL,
    "salesTax" REAL NOT NULL DEFAULT 0.0975,
    "laborRate" REAL NOT NULL DEFAULT 95.00,
    "totalMaterials" REAL NOT NULL DEFAULT 0,
    "totalFabric" REAL NOT NULL DEFAULT 0,
    "totalFabricationLabor" REAL NOT NULL DEFAULT 0,
    "totalInstallationLabor" REAL NOT NULL DEFAULT 0,
    "totalLabor" REAL NOT NULL DEFAULT 0,
    "subtotalBeforeMarkup" REAL NOT NULL DEFAULT 0,
    "markup" REAL NOT NULL DEFAULT 0.8,
    "totalWithMarkup" REAL NOT NULL DEFAULT 0,
    "permitCost" REAL,
    "engineeringCost" REAL,
    "equipmentCost" REAL,
    "driveTimeTrips" INTEGER,
    "driveTimeHours" REAL,
    "driveTimePeople" INTEGER,
    "driveTimeRate" REAL NOT NULL DEFAULT 75.00,
    "driveTimeTotal" REAL NOT NULL DEFAULT 0,
    "roundtripMiles" REAL,
    "roundtripTrips" INTEGER,
    "mileageRate" REAL NOT NULL DEFAULT 0.75,
    "mileageTotal" REAL NOT NULL DEFAULT 0,
    "hotelNights" INTEGER,
    "hotelPeople" INTEGER,
    "hotelRate" REAL,
    "hotelTotal" REAL NOT NULL DEFAULT 0,
    "foodCost" REAL,
    "totalOtherRequirements" REAL NOT NULL DEFAULT 0,
    "totalWithOtherReqs" REAL NOT NULL DEFAULT 0,
    "grandTotal" REAL NOT NULL DEFAULT 0,
    "discountIncrease" REAL NOT NULL DEFAULT 0,
    "totalPriceToClient" REAL NOT NULL DEFAULT 0,
    "pricePerSqFt" REAL,
    "pricePerLinFt" REAL,
    "pricePerSqFtPreDelivery" REAL,
    "pricePerLinFtPreDelivery" REAL,
    "outcome" TEXT NOT NULL DEFAULT 'Unknown',
    "userId" TEXT NOT NULL,
    CONSTRAINT "CostSheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "costSheetId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qty" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "salesTax" REAL NOT NULL DEFAULT 0.0975,
    "freight" REAL,
    "total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialLine_costSheetId_fkey" FOREIGN KEY ("costSheetId") REFERENCES "CostSheet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FabricLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "costSheetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "yards" REAL NOT NULL,
    "pricePerYard" REAL NOT NULL,
    "salesTax" REAL NOT NULL DEFAULT 0.0975,
    "freight" REAL,
    "total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FabricLine_costSheetId_fkey" FOREIGN KEY ("costSheetId") REFERENCES "CostSheet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LaborLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "costSheetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "hours" REAL NOT NULL,
    "people" INTEGER NOT NULL DEFAULT 1,
    "rate" REAL NOT NULL,
    "total" REAL NOT NULL,
    "isFabrication" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LaborLine_costSheetId_fkey" FOREIGN KEY ("costSheetId") REFERENCES "CostSheet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecapLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "costSheetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "width" REAL,
    "length" REAL,
    "fabricYard" REAL,
    "linearFt" REAL,
    "sqFt" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecapLine_costSheetId_fkey" FOREIGN KEY ("costSheetId") REFERENCES "CostSheet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
