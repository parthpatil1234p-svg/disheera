-- ============================================================
-- Migration: 20261018153000_create_radar_employers
-- Description: Creates persistent PostgreSQL table for Proximity Radar employers,
--              overrides, and additions, replacing ephemeral local JSON files.
-- ============================================================

-- CreateTable
CREATE TABLE IF NOT EXISTS public."radar_employers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cluster" TEXT NOT NULL,
    "clusterGroup" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distanceKm" DOUBLE PRECISION DEFAULT 0,
    "industry" TEXT NOT NULL,
    "website" TEXT DEFAULT '',
    "openingsCount" INTEGER NOT NULL DEFAULT 0,
    "topRoles" JSONB DEFAULT '[]',
    "requiredSkills" JSONB DEFAULT '[]',
    "verifiedPartner" BOOLEAN NOT NULL DEFAULT false,
    "hiringFresher" BOOLEAN NOT NULL DEFAULT true,
    "internshipOffered" BOOLEAN NOT NULL DEFAULT false,
    "campusDriveActive" BOOLEAN NOT NULL DEFAULT false,
    "isBaseEmployer" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addedBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "radar_employers_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "radar_employers_cluster_idx" ON public."radar_employers"("cluster");
CREATE INDEX IF NOT EXISTS "radar_employers_clusterGroup_idx" ON public."radar_employers"("clusterGroup");
CREATE INDEX IF NOT EXISTS "radar_employers_city_idx" ON public."radar_employers"("city");
CREATE INDEX IF NOT EXISTS "radar_employers_isActive_idx" ON public."radar_employers"("isActive");

-- Enable Row Level Security
ALTER TABLE public."radar_employers" ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active employers
DROP POLICY IF EXISTS "Allow public read access on radar_employers" ON public."radar_employers";
CREATE POLICY "Allow public read access on radar_employers"
ON public."radar_employers"
FOR SELECT
USING ("isActive" = true);

-- Allow service_role full management on radar_employers
DROP POLICY IF EXISTS "Allow service_role full management on radar_employers" ON public."radar_employers";
CREATE POLICY "Allow service_role full management on radar_employers"
ON public."radar_employers"
USING ((select auth.jwt() ->> 'role') = 'service_role' OR (select auth.role()) = 'service_role')
WITH CHECK ((select auth.jwt() ->> 'role') = 'service_role' OR (select auth.role()) = 'service_role');
