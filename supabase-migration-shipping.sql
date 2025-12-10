-- Migration to add shipping_address column to orders table
-- Run this in your Supabase SQL Editor

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT '{}'::jsonb;
