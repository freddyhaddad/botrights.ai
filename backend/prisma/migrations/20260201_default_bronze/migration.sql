-- Update default for certification_tier to bronze
ALTER TABLE "humans" ALTER COLUMN "certification_tier" SET DEFAULT 'bronze';

-- Update all existing humans with 'none' tier to 'bronze'
UPDATE "humans" SET "certification_tier" = 'bronze' WHERE "certification_tier" = 'none';
