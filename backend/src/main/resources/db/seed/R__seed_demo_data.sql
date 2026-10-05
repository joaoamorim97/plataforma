-- =====================================================================
-- Repeatable seed migration: demo businesses in São Paulo.
-- Idempotent: only inserts when the businesses table is empty.
-- =====================================================================

INSERT INTO businesses
    (owner_id, name, category, description, phone, whatsapp, address, address_number,
     neighborhood, city, state, postal_code, latitude, longitude, cover_image_url,
     rating, total_reviews, is_active)
SELECT * FROM (
    SELECT 'seed-owner-1' AS owner_id, 'Studio Bella' AS name, 'HAIRDRESSER' AS category,
           'Salão de beleza completo com profissionais especializados em cortes, coloração e tratamentos capilares.' AS description,
           '+55 11 3000-1001' AS phone, '5511990001001' AS whatsapp,
           'Rua Augusta' AS address, '1200' AS address_number, 'Consolação' AS neighborhood,
           'São Paulo' AS city, 'SP' AS state, '01304-001' AS postal_code,
           -23.554800 AS latitude, -46.662500 AS longitude,
           'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80' AS cover_image_url,
           4.8 AS rating, 24 AS total_reviews, TRUE AS is_active
    UNION ALL SELECT 'seed-owner-2', 'Barber King', 'BARBER',
           'Barbearia moderna com ambiente descontraído. Cortes masculinos, barba e cuidados completos.',
           '+55 11 3000-1002', '5511990001002', 'Rua Oscar Freire', '850', 'Jardim Paulista',
           'São Paulo', 'SP', '01426-001', -23.561400, -46.669900,
           'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80', 4.6, 31, TRUE
    UNION ALL SELECT 'seed-owner-3', 'Hair & Co', 'HAIRDRESSER',
           'Especialistas em coloração e mechas. Produtos premium e atendimento personalizado.',
           '+55 11 3000-1003', '5511990001003', 'Avenida Paulista', '1500', 'Bela Vista',
           'São Paulo', 'SP', '01310-100', -23.561700, -46.655800,
           'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80', 4.9, 42, TRUE
    UNION ALL SELECT 'seed-owner-4', 'Barbearia Vintage', 'BARBER',
           'Clássica barbearia com toque vintage. Navalha, toalha quente e muito estilo.',
           '+55 11 3000-1004', '5511990001004', 'Rua dos Pinheiros', '400', 'Pinheiros',
           'São Paulo', 'SP', '05422-001', -23.566900, -46.681300,
           'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80', 4.5, 18, TRUE
    UNION ALL SELECT 'seed-owner-5', 'Glam Salon', 'HAIRDRESSER',
           'Salão premium na Vila Madalena. Penteados, maquiagem e dia da noiva.',
           '+55 11 3000-1005', '5511990001005', 'Rua Harmonia', '220', 'Vila Madalena',
           'São Paulo', 'SP', '05435-000', -23.554100, -46.690200,
           'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80', 4.7, 29, TRUE
    UNION ALL SELECT 'seed-owner-6', 'Corte Fino', 'BARBER',
           'Barbearia de bairro com preço justo e atendimento rápido.',
           '+55 11 3000-1006', '5511990001006', 'Rua Teodoro Sampaio', '1100', 'Pinheiros',
           'São Paulo', 'SP', '05406-050', -23.559700, -46.678400,
           'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80', 4.3, 12, TRUE
    UNION ALL SELECT 'seed-owner-7', 'Beauty Lab', 'HAIRDRESSER',
           'Laboratório de beleza com foco em tratamentos capilares e reconstrução.',
           '+55 11 3000-1007', '5511990001007', 'Avenida Rebouças', '600', 'Pinheiros',
           'São Paulo', 'SP', '05402-000', -23.566200, -46.665500,
           'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=800&q=80', 4.4, 20, TRUE
) seed
WHERE NOT EXISTS (SELECT 1 FROM businesses);

-- Services for each seeded business
INSERT INTO business_services (business_id, name, description, price, duration_minutes)
SELECT b.id, s.name, s.description, s.price, s.duration_minutes
FROM businesses b
JOIN (
    SELECT 'HAIRDRESSER' AS cat, 'Corte feminino' AS name, 'Corte e finalização' AS description, 50.00 AS price, 45 AS duration_minutes
    UNION ALL SELECT 'HAIRDRESSER', 'Coloração', 'Coloração completa', 180.00, 120
    UNION ALL SELECT 'HAIRDRESSER', 'Escova', 'Escova modeladora', 45.00, 40
    UNION ALL SELECT 'HAIRDRESSER', 'Hidratação', 'Tratamento de hidratação profunda', 90.00, 60
    UNION ALL SELECT 'BARBER', 'Corte masculino', 'Corte na máquina e tesoura', 50.00, 30
    UNION ALL SELECT 'BARBER', 'Corte + barba', 'Combo corte e barba', 80.00, 60
    UNION ALL SELECT 'BARBER', 'Barba', 'Barba na navalha com toalha quente', 40.00, 30
    UNION ALL SELECT 'BARBER', 'Sobrancelha', 'Design de sobrancelha', 20.00, 15
) s ON s.cat = b.category
WHERE NOT EXISTS (SELECT 1 FROM business_services);

-- Business hours (Mon-Sat open, Sunday closed) for all seeded businesses
INSERT INTO business_hours (business_id, day_of_week, opening_time, closing_time, is_open)
SELECT b.id, d.day_of_week, d.opening_time, d.closing_time, d.is_open
FROM businesses b
JOIN (
    SELECT 0 AS day_of_week, CAST(NULL AS VARCHAR(5)) AS opening_time, CAST(NULL AS VARCHAR(5)) AS closing_time, FALSE AS is_open
    UNION ALL SELECT 1, '09:00', '19:00', TRUE
    UNION ALL SELECT 2, '09:00', '19:00', TRUE
    UNION ALL SELECT 3, '09:00', '19:00', TRUE
    UNION ALL SELECT 4, '09:00', '20:00', TRUE
    UNION ALL SELECT 5, '09:00', '20:00', TRUE
    UNION ALL SELECT 6, '09:00', '18:00', TRUE
) d ON TRUE
WHERE NOT EXISTS (SELECT 1 FROM business_hours);

-- Gallery images
INSERT INTO business_images (business_id, image_url, is_cover)
SELECT b.id, b.cover_image_url, TRUE FROM businesses b
WHERE NOT EXISTS (SELECT 1 FROM business_images);

INSERT INTO business_images (business_id, image_url, is_cover)
SELECT b.id, i.image_url, FALSE
FROM businesses b
JOIN (
    SELECT 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80' AS image_url
    UNION ALL SELECT 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&q=80'
    UNION ALL SELECT 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80'
) i ON TRUE
WHERE EXISTS (SELECT 1 FROM business_images WHERE is_cover = TRUE)
  AND (SELECT COUNT(*) FROM business_images) <= (SELECT COUNT(*) FROM businesses);

-- ---------------------------------------------------------------------
-- Management layer demo data (providers, resources, inventory).
-- Only inserted when the respective tables are empty.
-- ---------------------------------------------------------------------

INSERT INTO providers (business_id, name, role, active)
SELECT b.id, p.name, p.role, TRUE
FROM businesses b
JOIN (
    SELECT 'Ana Souza' AS name, 'Cabeleireira' AS role
    UNION ALL SELECT 'Carlos Lima', 'Barbeiro'
    UNION ALL SELECT 'Marina Dias', 'Coloforista'
) p ON TRUE
WHERE NOT EXISTS (SELECT 1 FROM providers);

INSERT INTO resources (business_id, name, kind, active)
SELECT b.id, r.name, r.kind, TRUE
FROM businesses b
JOIN (
    SELECT 'Cadeira 1' AS name, 'Cadeira' AS kind
    UNION ALL SELECT 'Cadeira 2', 'Cadeira'
    UNION ALL SELECT 'Lavatório', 'Estação'
) r ON TRUE
WHERE NOT EXISTS (SELECT 1 FROM resources);

INSERT INTO inventory_items (business_id, name, kind, quantity, min_quantity, unit_price)
SELECT b.id, i.name, i.kind, i.quantity, i.min_quantity, i.unit_price
FROM businesses b
JOIN (
    SELECT 'Shampoo Profissional' AS name, 'SUPPLY' AS kind, 10 AS quantity, 3 AS min_quantity, CAST(45.00 AS NUMERIC(10,2)) AS unit_price
    UNION ALL SELECT 'Tintura Loira', 'SUPPLY', 2, 3, 60.00
    UNION ALL SELECT 'Pomada Modeladora', 'RESALE', 15, 5, 35.00
) i ON TRUE
WHERE NOT EXISTS (SELECT 1 FROM inventory_items);
