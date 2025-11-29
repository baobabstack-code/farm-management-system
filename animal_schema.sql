-- Create AnimalSpecies table
CREATE TABLE "animal_species" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "animal_species_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "animal_species_slug_key" ON "animal_species"("slug");
-- Create AnimalGroup table
CREATE TABLE "animal_groups" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "farmId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "animal_groups_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "animal_groups_userId_idx" ON "animal_groups"("userId");
CREATE INDEX "animal_groups_speciesId_idx" ON "animal_groups"("speciesId");
CREATE INDEX "animal_groups_farmId_idx" ON "animal_groups"("farmId");
-- AddForeignKey
ALTER TABLE "animal_groups"
ADD CONSTRAINT "animal_groups_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "animal_species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Create AnimalProduction table
CREATE TABLE "animal_production" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "eggs" INTEGER,
    "weightKg" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "animal_production_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "animal_production_groupId_date_key" ON "animal_production"("groupId", "date");
-- AddForeignKey
ALTER TABLE "animal_production"
ADD CONSTRAINT "animal_production_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "animal_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Create AnimalFeedRecord table
CREATE TABLE "animal_feed_records" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "feedType" TEXT NOT NULL,
    "quantityKg" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "animal_feed_records_pkey" PRIMARY KEY ("id")
);
-- AddForeignKey
ALTER TABLE "animal_feed_records"
ADD CONSTRAINT "animal_feed_records_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "animal_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Create AnimalHealthRecord table
CREATE TABLE "animal_health_records" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "issue" TEXT NOT NULL,
    "treatment" TEXT,
    "cost" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "animal_health_records_pkey" PRIMARY KEY ("id")
);
-- AddForeignKey
ALTER TABLE "animal_health_records"
ADD CONSTRAINT "animal_health_records_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "animal_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Create AnimalExpense table
CREATE TABLE "animal_expenses" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "animal_expenses_pkey" PRIMARY KEY ("id")
);
-- AddForeignKey
ALTER TABLE "animal_expenses"
ADD CONSTRAINT "animal_expenses_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "animal_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Create AnimalForecast table
CREATE TABLE "animal_forecasts" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT,
    "inputJson" JSONB NOT NULL,
    "outputJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "score" DOUBLE PRECISION,
    "runAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "animal_forecasts_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "animal_forecasts_groupId_idx" ON "animal_forecasts"("groupId");
-- AddForeignKey
ALTER TABLE "animal_forecasts"
ADD CONSTRAINT "animal_forecasts_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "animal_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;