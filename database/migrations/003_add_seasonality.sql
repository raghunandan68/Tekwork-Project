-- ============================================================================
-- Smart Shelf AI — Migration 003: Add seasonality column to products
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- Add seasonality column with default 'Year-Round'
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS seasonality VARCHAR(50) NOT NULL DEFAULT 'Year-Round';

-- Backfill any existing rows
UPDATE products SET seasonality = 'Year-Round' WHERE seasonality IS NULL;

-- ============================================================================
-- Migration complete ✅
-- ============================================================================
