# Guía de Migración para Entidades de Planificación

## Resumen
Esta migración crea las nuevas tablas para el sistema de planificaciones:
- `Plannings` - Planificaciones principales
- `Periods` - Períodos opcionales para agrupación
- `Mesocycles` - Mesociclos dentro de planificaciones
- `Microcycles` - Microciclos dentro de mesociclos
- `PlanningAthletes` - Relación muchos a muchos entre planificaciones y atletas
- También actualiza `TrainingSessions` para agregar relaciones con `Planning` y `Microcycle`

## Comandos para crear y aplicar la migración

### 1. Crear la migración
```bash
dotnet ef migrations add AddPlanningEntities --project <TuProyectoDeDatos> --startup-project <TuProyectoWeb>
```

### 2. Revisar la migración generada
Antes de aplicarla, revisa el archivo generado en `Migrations/` para asegurarte de que:
- Todas las tablas se crean correctamente
- Las relaciones foreign key están bien definidas
- Los índices se crean correctamente
- Los tipos de datos son correctos

### 3. Aplicar la migración
```bash
dotnet ef database update --project <TuProyectoDeDatos> --startup-project <TuProyectoWeb>
```

## Cambios en tablas existentes

### TrainingSessions
La tabla `TrainingSessions` se actualiza para agregar:
- `PlanningId` (int, NOT NULL) - Foreign key a `Plannings`
- `MicrocycleId` (int, NOT NULL) - Foreign key a `Microcycles`
- Índice en `PlanningId`
- Índice en `MicrocycleId`

## Notas importantes

1. **Datos existentes**: Si ya tienes `TrainingSessions` en la base de datos, necesitarás:
   - Crear una planificación por defecto para las sesiones existentes O
   - Hacer que `PlanningId` y `MicrocycleId` sean nullable temporalmente, migrar los datos, y luego hacerlos NOT NULL

2. **Cascadas**: 
   - Al eliminar un `Planning`, se eliminan en cascada sus `Mesocycles`, `Microcycles`, y `TrainingSessions`
   - Al eliminar un `Microcycle`, se eliminan en cascada sus `TrainingSessions`
   - Al eliminar un `Period`, se establece `NULL` en los `Mesocycles` y `Microcycles` relacionados (si son opcionales)

3. **Índices únicos**:
   - `PlanningAthletes`: (`PlanningId`, `AthleteId`) - evita duplicados
   - Otros índices para mejorar el rendimiento de consultas

## Script de migración manual (si es necesario)

Si necesitas hacer una migración manual o ajustar los datos existentes, puedes usar este script SQL como referencia:

```sql
-- Ejemplo: Asignar una planificación por defecto a sesiones existentes
-- (ajusta según tus necesidades)

-- 1. Crear una planificación por defecto para sesiones existentes
INSERT INTO Plannings (Name, Description, StartDate, EndDate, Status, CoachId, CreatedAt, UpdatedAt)
SELECT 
    'Planificación por defecto',
    'Planificación creada automáticamente para sesiones existentes',
    MIN(Date) as StartDate,
    MAX(Date) as EndDate,
    1 as Status, -- PlanningStatus.Active
    MIN(CreatedByUserId) as CoachId, -- Asumir que todas las sesiones tienen el mismo coach
    GETUTCDATE(),
    GETUTCDATE()
FROM TrainingSessions;

-- 2. Actualizar las sesiones existentes con la planificación por defecto
UPDATE TrainingSessions
SET PlanningId = (SELECT TOP 1 Id FROM Plannings WHERE Name = 'Planificación por defecto')
WHERE PlanningId IS NULL;

-- 3. Crear microciclos por defecto para las sesiones
-- (esto es más complejo y depende de tus necesidades)
```

## Verificación después de la migración

Después de aplicar la migración, verifica:

1. **Tablas creadas**:
   ```sql
   SELECT name FROM sys.tables WHERE name IN (
       'Plannings', 'Periods', 'Mesocycles', 'Microcycles', 
       'PlanningAthletes'
   );
   ```

2. **Foreign keys**:
   ```sql
   SELECT 
       fk.name AS ForeignKeyName,
       tp.name AS ParentTable,
       cp.name AS ParentColumn,
       tr.name AS ReferencedTable,
       cr.name AS ReferencedColumn
   FROM sys.foreign_keys fk
   INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
   INNER JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
   INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
   INNER JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
   INNER JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
   WHERE tp.name IN ('Plannings', 'Periods', 'Mesocycles', 'Microcycles', 'TrainingSessions')
   ORDER BY tp.name, fk.name;
   ```

3. **Índices**:
   ```sql
   SELECT 
       t.name AS TableName,
       i.name AS IndexName,
       i.is_unique,
       i.is_primary_key
   FROM sys.indexes i
   INNER JOIN sys.tables t ON i.object_id = t.object_id
   WHERE t.name IN ('Plannings', 'Periods', 'Mesocycles', 'Microcycles', 'PlanningAthletes', 'TrainingSessions')
   AND i.name IS NOT NULL
   ORDER BY t.name, i.name;
   ```

## Rollback (si es necesario)

Si necesitas revertir la migración:

```bash
dotnet ef database update <NombreDeMigracionAnterior> --project <TuProyectoDeDatos> --startup-project <TuProyectoWeb>
```

O eliminar la migración completamente:

```bash
dotnet ef migrations remove --project <TuProyectoDeDatos> --startup-project <TuProyectoWeb>
```

