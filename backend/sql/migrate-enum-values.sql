-- ============================================
-- COACOM SRL - Migración de valores de enum rol
-- ============================================
-- Ejecutar con el backend APAGADO
-- ============================================

-- Paso 1: Convertir la columna a varchar temporalmente
ALTER TABLE usuarios ALTER COLUMN rol TYPE VARCHAR(50);

-- Paso 2: Actualizar los valores
UPDATE usuarios SET rol = 'general_manager' WHERE rol = 'gerente_general';
UPDATE usuarios SET rol = 'branch_manager'  WHERE rol = 'gerente_sucursal';
UPDATE usuarios SET rol = 'technician'      WHERE rol = 'tecnico';
UPDATE usuarios SET rol = 'client'          WHERE rol = 'cliente';
-- 'admin' no cambia

-- Paso 3: Eliminar el enum viejo
DROP TYPE IF EXISTS usuarios_rol_enum;

-- Paso 4: Crear el enum con los nuevos valores
CREATE TYPE usuarios_rol_enum AS ENUM ('admin', 'general_manager', 'branch_manager', 'technician', 'client');

-- Paso 5: Volver a usar el enum en la columna
ALTER TABLE usuarios ALTER COLUMN rol TYPE usuarios_rol_enum USING rol::usuarios_rol_enum;

-- Paso 6: Verificar
SELECT rol, COUNT(*) FROM usuarios GROUP BY rol;
