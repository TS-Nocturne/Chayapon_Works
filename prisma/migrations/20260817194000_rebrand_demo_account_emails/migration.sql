UPDATE "user"
SET "email" = CASE "email"
    WHEN 'admin.demo@hybridmarket.example' THEN 'admin.demo@chayaponworks.example'
    WHEN 'staff.demo@hybridmarket.example' THEN 'staff.demo@chayaponworks.example'
    WHEN 'customer.demo@hybridmarket.example' THEN 'customer.demo@chayaponworks.example'
    WHEN 'admin@hybrid.com' THEN 'admin@chayaponworks.com'
    ELSE "email"
END
WHERE "email" IN (
    'admin.demo@hybridmarket.example',
    'staff.demo@hybridmarket.example',
    'customer.demo@hybridmarket.example',
    'admin@hybrid.com'
);
