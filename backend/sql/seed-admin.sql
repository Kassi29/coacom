-- ============================================
-- COACOM SRL - Seed: Sucursales Base (branches)
-- ============================================
-- Ejecutar en Supabase SQL Editor DESPUÉS de
-- que el backend haya creado las tablas (synchronize: true)
-- ============================================

-- Crear sucursales base (branches)
INSERT INTO branches (name, city, address, phone, is_active)
VALUES
  ('Central', 'Santa Cruz', 'Av. Principal #123', '33445566', true),
  ('Zona Sur', 'La Paz', 'Calle Comercio #456', '22334455', true),
  ('El Alto', 'El Alto', 'Av. 6 de Marzo #789', '22998877', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- NOTA: Para crear el usuario admin, usa el
-- endpoint POST /api/users/admin desde Postman
-- con el body:
-- {
--   "firstName": "Admin",
--   "lastName": "Principal",
--   "email": "admin@coacom.bo",
--   "password": "Admin2026!"
-- }
-- ============================================
