-- Insert animal species with CUID-compatible IDs
-- The IDs start with 'c' and are 25 characters long to satisfy strict CUID validation if needed.
INSERT INTO "animal_species" ("id", "name", "slug", "description", "updatedAt")
VALUES (
        'cjl1v8w5u0000015848291001',
        'Chicken',
        'chicken',
        'Poultry - chickens for egg or meat production',
        NOW()
    ),
    (
        'cjl1v8w5u0000015848291002',
        'Cattle',
        'cattle',
        'Livestock - cows for milk or meat production',
        NOW()
    ),
    (
        'cjl1v8w5u0000015848291003',
        'Sheep',
        'sheep',
        'Livestock - sheep for wool or meat production',
        NOW()
    ),
    (
        'cjl1v8w5u0000015848291004',
        'Goat',
        'goat',
        'Livestock - goats for milk or meat production',
        NOW()
    ),
    (
        'cjl1v8w5u0000015848291005',
        'Pig',
        'pig',
        'Livestock - pigs for meat production',
        NOW()
    ) ON CONFLICT ("slug") DO
UPDATE
SET "id" = EXCLUDED."id";