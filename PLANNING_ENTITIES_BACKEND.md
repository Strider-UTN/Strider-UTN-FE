# Entidades de Dominio para Planificaciones - Backend

## Resumen de Cambios Requeridos

### 1. Entidades Nuevas a Crear

#### 1.1. `Planning` (Planificación)
Entidad principal que representa una planificación de entrenamiento.

```csharp
[Table("Plannings")]
public class Planning
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; } // null = indefinido
    public PlanningStatus Status { get; set; } = PlanningStatus.Draft;
    public int CoachId { get; set; } // ID del entrenador que creó la planificación
    public User Coach { get; set; } = null!;

    // Relaciones con atletas (asignación siempre individual)
    // Nota: Los grupos solo se usan para facilitar la asignación, pero la relación es siempre individual
    public ICollection<PlanningAthlete> PlanningAthletes { get; set; } = new List<PlanningAthlete>();

    // Relaciones con períodos (opcional - para agrupación y reportes)
    public ICollection<Period> Periods { get; set; } = new List<Period>();

    // Relaciones con mesociclos (directa - estructura principal)
    public ICollection<Mesocycle> Mesocycles { get; set; } = new List<Mesocycle>();

    // Relaciones con sesiones de entrenamiento (directa)
    public ICollection<TrainingSession> TrainingSessions { get; set; } = new List<TrainingSession>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

#### 1.2. `Period` (Período)
Representa un período opcional para agrupar mesociclos para reportes y análisis.
**Nota**: Los períodos son opcionales y no forman parte de la estructura jerárquica principal.
Los microciclos se vinculan al período a través del mesociclo al que pertenecen.

```csharp
[Table("Periods")]
public class Period
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int StartWeek { get; set; }
    public int EndWeek { get; set; }
    public string? Objective { get; set; }
    public PeriodStatus Status { get; set; } = PeriodStatus.Planning;

    // Relación opcional con Planning (para contexto)
    public int? PlanningId { get; set; }
    public Planning? Planning { get; set; }

    // Relaciones one-to-many con mesociclos (opcional - un mesociclo puede pertenecer a un período)
    public ICollection<Mesocycle> Mesocycles { get; set; } = new List<Mesocycle>();

    // Relaciones one-to-many con microciclos (requerida - un microciclo debe pertenecer a un período)
    public ICollection<Microcycle> Microcycles { get; set; } = new List<Microcycle>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

#### 1.3. `Mesocycle` (Mesociclo)
Representa un mesociclo dentro de una planificación (estructura principal).
**Nota**: Un mesociclo puede pertenecer opcionalmente a un período para agrupación y reportes, pero solo a uno.

```csharp
[Table("Mesocycles")]
public class Mesocycle
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Objective { get; set; }
    public int WeeksCount { get; set; }
    public MesocycleStatus Status { get; set; } = MesocycleStatus.Planning;

    // Relación directa con Planning (REQUERIDA - estructura principal)
    public int PlanningId { get; set; }
    public Planning Planning { get; set; } = null!;

    // Relación opcional con Period (para agrupación - un mesociclo pertenece a un solo período)
    public int? PeriodId { get; set; }
    public Period? Period { get; set; }

    // Relaciones con microciclos (un microciclo pertenece a un solo mesociclo)
    public ICollection<Microcycle> Microcycles { get; set; } = new List<Microcycle>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

#### 1.4. `Microcycle` (Microciclo)
Representa un microciclo (semana) dentro de un mesociclo.
**Nota**: Un microciclo debe pertenecer obligatoriamente a un período (relación directa requerida).

```csharp
[Table("Microcycles")]
public class Microcycle
{
    public int Id { get; set; }
    public int WeekNumber { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Sessions { get; set; }
    public decimal Volume { get; set; } // en kilómetros
    public MicrocycleIntensity Intensity { get; set; } = MicrocycleIntensity.Medium;
    public MicrocycleFocus? Focus { get; set; }

    // Relación con Mesocycle (REQUERIDA - un microciclo pertenece a un solo mesociclo)
    public int MesocycleId { get; set; }
    public Mesocycle Mesocycle { get; set; } = null!;

    // Relación con Period (REQUERIDA - un microciclo debe pertenecer a un período)
    public int PeriodId { get; set; }
    public Period Period { get; set; } = null!;

    // Relaciones con sesiones de entrenamiento
    public ICollection<TrainingSession> TrainingSessions { get; set; } = new List<TrainingSession>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

#### 1.5. `PlanningAthlete` (Tabla de relación many-to-many)
Tabla de relación entre Planning y Athletes para asignación individual.
**Nota**: Los grupos de atletas solo se usan para facilitar la asignación en la UI, pero la relación guardada es siempre individual (atleta-planificación). Si se asigna un grupo, se crean relaciones individuales para cada atleta del grupo.

```csharp
[Table("PlanningAthletes")]
public class PlanningAthlete
{
    public int Id { get; set; }
    public int PlanningId { get; set; }
    public Planning Planning { get; set; } = null!;
    public int AthleteId { get; set; }
    public User Athlete { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Índice único para evitar duplicados
    // Configurado en OnModelCreating
}
```


### 2. Enums Necesarios

```csharp
public enum PlanningStatus
{
    Draft = 0,
    Active = 1,
    Completed = 2
}

public enum PeriodStatus
{
    Planning = 0,
    Active = 1,
    Completed = 2
}

public enum MesocycleStatus
{
    Planning = 0,
    Active = 1,
    Completed = 2
}

public enum MicrocycleIntensity
{
    Low = 0,    // Baja
    Medium = 1, // Media
    High = 2    // Alta
}

public enum MicrocycleFocus
{
    AerobicEndurance = 0,      // Resistencia Aeróbica
    Speed = 1,                 // Velocidad
    Strength = 2,             // Fuerza
    Recovery = 3,             // Recuperación
    AnaerobicWork = 4,        // Trabajo Anaeróbico
    RunningTechnique = 5,     // Técnica de Carrera
    Competition = 6,          // Competición
    Transition = 7,           // Transición
    ActiveRest = 8            // Descanso Activo
}
```

### 3. Modificaciones a Entidades Existentes

#### 3.1. `TrainingSession` - CAMBIOS REQUERIDOS

**Cambios necesarios:**
1. Agregar campo `Date` (fecha específica a la que pertenece la sesión)
2. Agregar campo `MicrocycleId` (requerido, porque todas las sesiones están dentro de un microciclo)
3. Agregar campo `PlanningId` (requerido, para optimización de consultas y validación de integridad)
4. Modificar relaciones existentes si las hay

**Approach recomendado:**
Dado que la jerarquía es: Planning → Period → Mesocycle → Microcycle → TrainingSession, y las sesiones siempre están dentro de un microciclo, el approach más adecuado es:

- **MicrocycleId requerido**: Refleja la estructura jerárquica natural y es necesario para organizar las sesiones.
- **PlanningId requerido**: Optimiza consultas directas a planificaciones y permite validar integridad referencial (asegurar que el Microcycle pertenece a la Planning correcta).

**Nota importante**: A nivel de aplicación, se debe validar que el `MicrocycleId` pertenezca a un microciclo que esté dentro de la `PlanningId` especificada. Esto se puede hacer mediante una restricción check o validación en el servicio.

```csharp
[Table("TrainingSessions")]
public class TrainingSession
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    // NUEVO: Fecha específica a la que pertenece la sesión
    public DateTime Date { get; set; }
    public TrainingSessionCategory Category { get; set; } = TrainingSessionCategory.Training;

    // NUEVO: Relación con Microcycle (REQUERIDA - porque todas las sesiones están dentro de un microciclo)
    public int MicrocycleId { get; set; }
    public Microcycle Microcycle { get; set; } = null!;

    // NUEVO: Relación con Planning (REQUERIDA - para optimización de consultas y validación de integridad)
    public int PlanningId { get; set; }
    public Planning Planning { get; set; } = null!;

    // Relaciones con atletas (many-to-many)
    public ICollection<TrainingSessionAthlete> TrainingSessionAthletes { get; set; } = new List<TrainingSessionAthlete>();

    // Relaciones con intervalos (si existen)
    public ICollection<TrainingInterval> Intervals { get; set; } = new List<TrainingInterval>();

    public string? Notes { get; set; }
    public string? Volume { get; set; }
    public string? Intensity { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

#### 3.2. `TrainingSessionAthlete` (si no existe)
Tabla de relación many-to-many entre TrainingSession y Athletes.

```csharp
[Table("TrainingSessionAthletes")]
public class TrainingSessionAthlete
{
    public int Id { get; set; }
    public int TrainingSessionId { get; set; }
    public TrainingSession TrainingSession { get; set; } = null!;
    public int AthleteId { get; set; }
    public User Athlete { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Índice único para evitar duplicados
    // Configurado en OnModelCreating
}
```

### 4. Configuración de `OnModelCreating`

#### 4.1. Configuración de `Planning`

```csharp
modelBuilder.Entity<Planning>(entity =>
{
    entity.HasKey(e => e.Id);

    entity.Property(e => e.Name)
        .IsRequired()
        .HasMaxLength(200);

    entity.Property(e => e.Description)
        .HasMaxLength(1000);

    entity.Property(e => e.StartDate)
        .IsRequired();

    entity.Property(e => e.EndDate);

    entity.Property(e => e.Status)
        .IsRequired()
        .HasConversion<int>()
        .HasDefaultValue(PlanningStatus.Draft);

    entity.Property(e => e.CreatedAt)
        .IsRequired()
        .HasDefaultValueSql("CURRENT_TIMESTAMP");

    entity.Property(e => e.UpdatedAt)
        .IsRequired()
        .HasDefaultValueSql("CURRENT_TIMESTAMP");

    // Relación con Coach
    entity.HasOne(e => e.Coach)
        .WithMany()
        .HasForeignKey(e => e.CoachId)
        .OnDelete(DeleteBehavior.Restrict);

    // Relación con Periods (opcional - para agrupación)
    entity.HasMany(e => e.Periods)
        .WithOne(e => e.Planning)
        .HasForeignKey(e => e.PlanningId)
        .OnDelete(DeleteBehavior.SetNull); // SetNull porque es opcional

    // Relación con Mesocycles (directa - estructura principal)
    entity.HasMany(e => e.Mesocycles)
        .WithOne(e => e.Planning)
        .HasForeignKey(e => e.PlanningId)
        .OnDelete(DeleteBehavior.Cascade);

    // Relación con TrainingSessions (para optimización de consultas directas)
    entity.HasMany(e => e.TrainingSessions)
        .WithOne(e => e.Planning)
        .HasForeignKey(e => e.PlanningId)
        .OnDelete(DeleteBehavior.Cascade);

    // Índices
    entity.HasIndex(e => e.CoachId);
    entity.HasIndex(e => e.Status);
    entity.HasIndex(e => e.StartDate);
});
```

#### 4.2. Configuración de `Period`

```csharp
modelBuilder.Entity<Period>(entity =>
{
    entity.HasKey(e => e.Id);

    entity.Property(e => e.Name)
        .IsRequired()
        .HasMaxLength(200);

    entity.Property(e => e.StartWeek)
        .IsRequired();

    entity.Property(e => e.EndWeek)
        .IsRequired();

    entity.Property(e => e.Objective)
        .HasMaxLength(500);

    entity.Property(e => e.Status)
        .IsRequired()
        .HasConversion<int>()
        .HasDefaultValue(PeriodStatus.Planning);

    entity.Property(e => e.PlanningId);

    entity.Property(e => e.CreatedAt)
        .IsRequired()
        .HasDefaultValueSql("CURRENT_TIMESTAMP");

    entity.Property(e => e.UpdatedAt)
        .IsRequired()
        .HasDefaultValueSql("CURRENT_TIMESTAMP");

    // Relación opcional con Planning (para contexto)
    entity.HasOne(e => e.Planning)
        .WithMany(e => e.Periods)
        .HasForeignKey(e => e.PlanningId)
        .OnDelete(DeleteBehavior.SetNull);

    // Relación con Mesocycles (one-to-many - un mesociclo pertenece a un solo período, opcional)
    entity.HasMany(e => e.Mesocycles)
        .WithOne(e => e.Period)
        .HasForeignKey(e => e.PeriodId)
        .OnDelete(DeleteBehavior.SetNull); // SetNull porque es opcional

    // Relación con Microcycles (one-to-many - un microciclo debe pertenecer a un período)
    entity.HasMany(e => e.Microcycles)
        .WithOne(e => e.Period)
        .HasForeignKey(e => e.PeriodId)
        .OnDelete(DeleteBehavior.Restrict); // Restrict porque el período es requerido para microciclos

    // Índices
    entity.HasIndex(e => e.PlanningId);
    entity.HasIndex(e => e.Status);
});
```

#### 4.3. Configuración de `Mesocycle`

```csharp
modelBuilder.Entity<Mesocycle>(entity =>
{
    entity.HasKey(e => e.Id);

    entity.Property(e => e.Name)
        .IsRequired()
        .HasMaxLength(200);

    entity.Property(e => e.StartDate)
        .IsRequired();

    entity.Property(e => e.EndDate)
        .IsRequired();

    entity.Property(e => e.Objective)
        .HasMaxLength(500);

    entity.Property(e => e.WeeksCount)
        .IsRequired();

    entity.Property(e => e.Status)
        .IsRequired()
        .HasConversion<int>()
        .HasDefaultValue(MesocycleStatus.Planning);

    entity.Property(e => e.PlanningId)
        .IsRequired();

    entity.Property(e => e.PeriodId);

    entity.Property(e => e.CreatedAt)
        .IsRequired()
        .HasDefaultValueSql("CURRENT_TIMESTAMP");

    entity.Property(e => e.UpdatedAt)
        .IsRequired()
        .HasDefaultValueSql("CURRENT_TIMESTAMP");

    // Relación directa con Planning (REQUERIDA - estructura principal)
    entity.HasOne(e => e.Planning)
        .WithMany(e => e.Mesocycles)
        .HasForeignKey(e => e.PlanningId)
        .OnDelete(DeleteBehavior.Cascade);

    // Relación opcional con Period (para agrupación - un mesociclo pertenece a un solo período)
    entity.HasOne(e => e.Period)
        .WithMany(e => e.Mesocycles)
        .HasForeignKey(e => e.PeriodId)
        .OnDelete(DeleteBehavior.SetNull); // SetNull porque es opcional

    // Relación con Microcycles (un microciclo pertenece a un solo mesociclo)
    entity.HasMany(e => e.Microcycles)
        .WithOne(e => e.Mesocycle)
        .HasForeignKey(e => e.MesocycleId)
        .OnDelete(DeleteBehavior.Cascade);

    // Índices
    entity.HasIndex(e => e.PlanningId);
    entity.HasIndex(e => e.PeriodId); // NUEVO
    entity.HasIndex(e => e.Status);
    entity.HasIndex(e => e.StartDate);
    entity.HasIndex(e => e.EndDate);
});
```

#### 4.4. Configuración de `Microcycle`

```csharp
modelBuilder.Entity<Microcycle>(entity =>
{
    entity.HasKey(e => e.Id);

    entity.Property(e => e.WeekNumber)
        .IsRequired();

    entity.Property(e => e.StartDate)
        .IsRequired();

    entity.Property(e => e.EndDate)
        .IsRequired();

    entity.Property(e => e.Sessions)
        .IsRequired();

    entity.Property(e => e.Volume)
        .IsRequired()
        .HasColumnType("decimal(10,2)");

    entity.Property(e => e.Intensity)
        .IsRequired()
        .HasMaxLength(50)
        .HasConversion<string>();

    entity.Property(e => e.Focus)
        .HasConversion<int>();

    entity.Property(e => e.MesocycleId)
        .IsRequired();

    entity.Property(e => e.PeriodId)
        .IsRequired();

    entity.Property(e => e.CreatedAt)
        .IsRequired()
        .HasDefaultValueSql("CURRENT_TIMESTAMP");

    entity.Property(e => e.UpdatedAt)
        .IsRequired()
        .HasDefaultValueSql("CURRENT_TIMESTAMP");

    // Relación con Mesocycle (REQUERIDA - un microciclo pertenece a un solo mesociclo)
    entity.HasOne(e => e.Mesocycle)
        .WithMany(e => e.Microcycles)
        .HasForeignKey(e => e.MesocycleId)
        .OnDelete(DeleteBehavior.Cascade);

    // Relación con Period (REQUERIDA - un microciclo debe pertenecer a un período)
    entity.HasOne(e => e.Period)
        .WithMany(e => e.Microcycles)
        .HasForeignKey(e => e.PeriodId)
        .OnDelete(DeleteBehavior.Restrict); // Restrict porque el período es requerido

    // Relación con TrainingSessions (REQUERIDA - todas las sesiones están dentro de un microciclo)
    entity.HasMany(e => e.TrainingSessions)
        .WithOne(e => e.Microcycle)
        .HasForeignKey(e => e.MicrocycleId)
        .OnDelete(DeleteBehavior.Cascade);

    // Índices
    entity.HasIndex(e => e.MesocycleId);
    entity.HasIndex(e => e.PeriodId); // NUEVO
    entity.HasIndex(e => e.StartDate);
    entity.HasIndex(e => e.EndDate);
});
```

#### 4.5. Configuración de `PlanningAthlete`

```csharp
modelBuilder.Entity<PlanningAthlete>(entity =>
{
    entity.HasKey(e => e.Id);

    entity.Property(e => e.PlanningId)
        .IsRequired();

    entity.Property(e => e.AthleteId)
        .IsRequired();

    entity.Property(e => e.CreatedAt)
        .IsRequired()
        .HasDefaultValueSql("CURRENT_TIMESTAMP");

    // Relación con Planning
    entity.HasOne(e => e.Planning)
        .WithMany(e => e.PlanningAthletes)
        .HasForeignKey(e => e.PlanningId)
        .OnDelete(DeleteBehavior.Cascade);

    // Relación con Athlete
    entity.HasOne(e => e.Athlete)
        .WithMany()
        .HasForeignKey(e => e.AthleteId)
        .OnDelete(DeleteBehavior.Restrict);

    // Índice único para evitar duplicados
    entity.HasIndex(e => new { e.PlanningId, e.AthleteId })
        .IsUnique();

    // Índices adicionales
    entity.HasIndex(e => e.PlanningId);
    entity.HasIndex(e => e.AthleteId);
});
```

#### 4.6. Configuración MODIFICADA de `TrainingSession`

```csharp
modelBuilder.Entity<TrainingSession>(entity =>
{
    entity.HasKey(e => e.Id);

    entity.Property(e => e.Name)
        .IsRequired()
        .HasMaxLength(200);

    entity.Property(e => e.Description)
        .HasMaxLength(1000);

    // NUEVO: Campo Date (REQUERIDO)
    entity.Property(e => e.Date)
        .IsRequired();

    entity.Property(e => e.Category)
        .IsRequired()
        .HasMaxLength(50)
        .HasConversion<string>()
        .HasDefaultValue(TrainingSessionCategory.Training);

    entity.Property(e => e.MicrocycleId)
        .IsRequired();

    entity.Property(e => e.PlanningId)
        .IsRequired();

    entity.Property(e => e.Notes)
        .HasMaxLength(1000);

    // NUEVO: Relación con Microcycle (REQUERIDA - un entrenamiento pertenece a un solo microciclo)
    entity.HasOne(e => e.Microcycle)
        .WithMany(e => e.TrainingSessions)
        .HasForeignKey(e => e.MicrocycleId)
        .OnDelete(DeleteBehavior.Cascade);

    // NUEVO: Relación con Planning (REQUERIDA - para optimización de consultas y validación de integridad)
    entity.HasOne(e => e.Planning)
        .WithMany(e => e.TrainingSessions)
        .HasForeignKey(e => e.PlanningId)
        .OnDelete(DeleteBehavior.Cascade);

    entity.Property(e => e.CreatedAt)
        .IsRequired()
        .HasDefaultValueSql("CURRENT_TIMESTAMP");

    entity.Property(e => e.UpdatedAt)
        .IsRequired()
        .HasDefaultValueSql("CURRENT_TIMESTAMP");

    // Índices
    entity.HasIndex(e => e.PlanningId); // NUEVO
    entity.HasIndex(e => e.MicrocycleId); // NUEVO
    entity.HasIndex(e => e.Date); // NUEVO
    entity.HasIndex(e => e.Category);
});
```

#### 4.7. Configuración de `TrainingSessionAthlete` (si no existe)

```csharp
modelBuilder.Entity<TrainingSessionAthlete>(entity =>
{
    entity.HasKey(e => e.Id);

    entity.Property(e => e.TrainingSessionId)
        .IsRequired();

    entity.Property(e => e.AthleteId)
        .IsRequired();

    entity.Property(e => e.CreatedAt)
        .IsRequired()
        .HasDefaultValueSql("CURRENT_TIMESTAMP");

    // Relación con TrainingSession
    entity.HasOne(e => e.TrainingSession)
        .WithMany(e => e.TrainingSessionAthletes)
        .HasForeignKey(e => e.TrainingSessionId)
        .OnDelete(DeleteBehavior.Cascade);

    // Relación con Athlete
    entity.HasOne(e => e.Athlete)
        .WithMany()
        .HasForeignKey(e => e.AthleteId)
        .OnDelete(DeleteBehavior.Restrict);

    // Índice único para evitar duplicados
    entity.HasIndex(e => new { e.TrainingSessionId, e.AthleteId })
        .IsUnique();

    // Índices adicionales
    entity.HasIndex(e => e.TrainingSessionId);
    entity.HasIndex(e => e.AthleteId);
});
```

### 5. DbSets en ApplicationDbContext

Agregar los siguientes DbSets:

```csharp
public DbSet<Planning> Plannings { get; set; }
public DbSet<Period> Periods { get; set; } // Opcional - para agrupación y reportes
public DbSet<Mesocycle> Mesocycles { get; set; }
public DbSet<Microcycle> Microcycles { get; set; }
public DbSet<PlanningAthlete> PlanningAthletes { get; set; }
public DbSet<TrainingSessionAthlete> TrainingSessionAthletes { get; set; } // Si no existe
```

### 6. Resumen de Cambios

#### Entidades Nuevas:
1. ✅ `Planning`
2. ✅ `Period` (opcional - para agrupación y reportes)
   - Contiene mesociclos (opcional - un mesociclo puede pertenecer a un período)
   - Contiene microciclos (requerido - un microciclo debe pertenecer a un período)
3. ✅ `Mesocycle` (pertenece directamente a Planning, puede pertenecer opcionalmente a un período)
4. ✅ `Microcycle` (pertenece a un solo mesociclo y debe pertenecer a un período)
5. ✅ `PlanningAthlete` (tabla de relación - asignación siempre individual)
   - **Nota**: Los grupos de atletas solo se usan en la UI para facilitar la asignación, pero en el backend siempre se crean relaciones individuales (atleta-planificación)
6. ✅ `TrainingSessionAthlete` (tabla de relación, si no existe)

#### Entidades Modificadas:
1. ✅ `TrainingSession` - Agregar:
   - `Date` (DateTime, requerido)
   - `MicrocycleId` (int, requerido - porque todas las sesiones están dentro de un microciclo)
   - `PlanningId` (int, requerido - para optimización de consultas y validación de integridad)
   - Relaciones con `Microcycle` y `Planning`

#### Enums Nuevos:
1. ✅ `PlanningStatus`
2. ✅ `PeriodStatus`
3. ✅ `MesocycleStatus`
4. ✅ `MicrocycleIntensity`
5. ✅ `MicrocycleFocus`

#### Configuraciones OnModelCreating:
1. ✅ Configuración de `Planning`
2. ✅ Configuración de `Period` (opcional, contiene mesociclos)
3. ✅ Configuración de `Mesocycle` (pertenece directamente a Planning, opcionalmente a un período)
4. ✅ Configuración de `Microcycle` (pertenece a un solo mesociclo)
5. ✅ Configuración de `PlanningAthlete` (asignación siempre individual)
6. ✅ Configuración modificada de `TrainingSession` (pertenece a un solo microciclo)
7. ✅ Configuración de `TrainingSessionAthlete` (si no existe)

### 7. Migraciones Necesarias

Después de crear/modificar las entidades y configuraciones, será necesario crear una migración:

```bash
dotnet ef migrations add AddPlanningEntitiesAndModifyTrainingSession
dotnet ef database update
```

### 8. Notas Importantes

1. **TrainingSession.Date**: Campo requerido que representa la fecha específica a la que pertenece la sesión.
2. **TrainingSession.MicrocycleId**: Relación **requerida** porque todas las sesiones están dentro de un microciclo según la estructura jerárquica principal (Planning → Mesocycle → Microcycle → TrainingSession).
3. **TrainingSession.PlanningId**: Relación **requerida** para optimización de consultas directas a planificaciones y para validar integridad referencial (asegurar que el Microcycle pertenece a la Planning correcta).
4. **Validación de integridad**: A nivel de aplicación (servicio), se debe validar que el `MicrocycleId` pertenezca efectivamente a un microciclo que esté dentro de la `PlanningId` especificada. Esto asegura la consistencia de la jerarquía.
5. **Jerarquía principal**: La jerarquía principal es: **Planning → Mesocycle → Microcycle → TrainingSession** (requerida).
6. **Períodos opcionales**: Los períodos son opcionales y sirven para agrupar mesociclos y microciclos para reportes y análisis.
   - Un mesociclo puede no pertenecer a ningún período, pero si pertenece a uno, es solo a uno (opcional, one-to-many).
   - Un microciclo debe pertenecer obligatoriamente a un período (requerido, one-to-many).
7. **Relaciones únicas**: 
   - Un mesociclo puede no pertenecer a ningún período, pero si pertenece a uno, es solo a uno
   - Un microciclo debe pertenecer obligatoriamente a un período (relación directa requerida)
   - Un microciclo pertenece a un solo mesociclo (no puede pertenecer a múltiples mesociclos)
   - Un entrenamiento pertenece a un solo microciclo (no puede pertenecer a múltiples microciclos)
8. **Asignación individual**: Las planificaciones se asignan siempre a atletas individuales mediante `PlanningAthlete`. Los grupos de atletas (sedes) solo se usan en la UI para facilitar la asignación: si se selecciona un grupo en el frontend, el backend crea relaciones individuales (`PlanningAthlete`) para cada atleta del grupo. **No existe una entidad `PlanningTrainingGroup`** - la relación siempre es individual (atleta-planificación).
9. **Cascada de eliminación**: Al eliminar una planificación, se eliminan en cascada todos los mesociclos, microciclos y sesiones asociadas. Los períodos se eliminan también pero son opcionales.
10. **Approach recomendado**: Aunque `MicrocycleId` es suficiente para establecer la relación con `Planning` de forma transitiva, mantener `PlanningId` como campo requerido optimiza las consultas y permite validaciones de integridad más eficientes.
11. **Estructura simplificada**: Los mesociclos pertenecen directamente a las planificaciones, simplificando la estructura jerárquica. Los períodos son opcionales y se usan solo para agrupar mesociclos para reportes.

### 9. Creación de TrainingSession desde el Frontend

**Problema**: ¿Alcanza con solo pasar la fecha desde el frontend para identificar a qué microciclo pertenece una sesión?

**Respuesta**: **NO, solo con la fecha NO alcanza**. Se necesita al menos el `PlanningId` porque:

1. **Múltiples planificaciones activas**: Un atleta o grupo puede tener múltiples planificaciones activas simultáneamente.
2. **Múltiples microciclos con la misma fecha**: Si hay múltiples planificaciones, puede haber múltiples microciclos que contengan la misma fecha.
3. **Ambigüedad**: Sin el contexto de la planificación, el backend no puede determinar de forma única a qué microciclo pertenece la sesión.

**Approach recomendado para el Frontend**:

#### Opción 1: Pasar `PlanningId` + `Date` (Recomendado)
```typescript
// DTO desde el frontend
interface CreateTrainingSessionDto {
  planningId: number;      // REQUERIDO - contexto de planificación
  date: string;           // REQUERIDO - fecha de la sesión
  name: string;
  description?: string;
  category: 'training' | 'prep_competition' | 'main_competition';
  athleteIds: number[];
  intervals: CreateTrainingIntervalDto[];
  notes?: string;
  // ... otros campos
}
```

**Lógica en el Backend**:
```csharp
// En el servicio, buscar el microciclo que contiene la fecha dentro de la planificación
public async Task<TrainingSession> CreateTrainingSessionAsync(CreateTrainingSessionDto dto)
{
    // Validar que la planificación existe
    var planning = await _planningRepository.GetByIdAsync(dto.PlanningId);
    if (planning == null)
        throw new NotFoundException("Planificación no encontrada");

    // Buscar el microciclo que contiene la fecha dentro de esta planificación
    var sessionDate = DateTime.Parse(dto.Date);
    var microcycle = await _microcycleRepository
        .GetByPlanningIdAndDateAsync(dto.PlanningId, sessionDate);

    if (microcycle == null)
        throw new ValidationException(
            $"No se encontró un microciclo para la fecha {dto.Date} en la planificación {dto.PlanningId}");

    // Validar que la fecha está dentro del rango del microciclo
    if (sessionDate < microcycle.StartDate || sessionDate > microcycle.EndDate)
        throw new ValidationException(
            $"La fecha {dto.Date} no está dentro del rango del microciclo " +
            $"({microcycle.StartDate:yyyy-MM-dd} - {microcycle.EndDate:yyyy-MM-dd})");

    // Crear la sesión
    var trainingSession = new TrainingSession
    {
        PlanningId = dto.PlanningId,
        MicrocycleId = microcycle.Id,
        Date = sessionDate,
        Name = dto.Name,
        // ... otros campos
    };

    return await _trainingSessionRepository.CreateAsync(trainingSession);
}
```

**Método de repositorio necesario**:
```csharp
// En IMicrocycleRepository
Task<Microcycle?> GetByPlanningIdAndDateAsync(int planningId, DateTime date);

// Implementación
public async Task<Microcycle?> GetByPlanningIdAndDateAsync(int planningId, DateTime date)
{
    return await _context.Microcycles
        .Include(m => m.Mesocycle)
            .ThenInclude(me => me.Period)
                .ThenInclude(p => p.Planning)
        .Where(m => m.Mesocycle.Period.Planning.Id == planningId)
        .Where(m => m.StartDate <= date && m.EndDate >= date)
        .FirstOrDefaultAsync();
}
```

#### Opción 2: Pasar `MicrocycleId` + `Date` (Alternativa)
Si el frontend ya conoce el microciclo específico (por ejemplo, desde una vista de calendario semanal):

```typescript
interface CreateTrainingSessionDto {
  microcycleId: number;   // REQUERIDO - microciclo específico
  date: string;           // REQUERIDO - fecha de la sesión (validar que está en el rango)
  name: string;
  // ... otros campos
}
```

**Lógica en el Backend**:
```csharp
// Validar que la fecha está dentro del rango del microciclo
var microcycle = await _microcycleRepository.GetByIdAsync(dto.MicrocycleId);
if (microcycle == null)
    throw new NotFoundException("Microciclo no encontrado");

var sessionDate = DateTime.Parse(dto.Date);
if (sessionDate < microcycle.StartDate || sessionDate > microcycle.EndDate)
    throw new ValidationException(
        $"La fecha {dto.Date} no está dentro del rango del microciclo " +
        $"({microcycle.StartDate:yyyy-MM-dd} - {microcycle.EndDate:yyyy-MM-dd})");

// Obtener PlanningId del microciclo
var planningId = microcycle.Mesocycle.Period.PlanningId;

var trainingSession = new TrainingSession
{
    PlanningId = planningId,
    MicrocycleId = dto.MicrocycleId,
    Date = sessionDate,
    // ... otros campos
};
```

**Recomendación Final**: 
- **Usar Opción 1** (`PlanningId` + `Date`) si el frontend está en el contexto de una planificación específica (vista de planificación).
- **Usar Opción 2** (`MicrocycleId` + `Date`) si el frontend está en el contexto de un microciclo específico (vista semanal/mensual).

**¿Dónde hacer la identificación del Microciclo: Frontend o Backend?**

**Recomendación: HACER LA LÓGICA EN EL BACKEND**

Aunque desde el frontend siempre se crea una sesión dentro del contexto de una planificación (y por tanto tiene el `PlanningId`), **la identificación del microciclo debe hacerse en el backend** por las siguientes razones:

#### Ventajas de hacer la lógica en el Backend:

1. **Single Source of Truth**: La lógica de negocio está centralizada en un solo lugar, evitando duplicación y posibles inconsistencias.
2. **Seguridad**: El backend valida que el usuario tiene permisos para crear sesiones en esa planificación.
3. **Consistencia de datos**: Garantiza que siempre se use la misma lógica para identificar el microciclo, evitando errores por cambios en el frontend.
4. **Validaciones centralizadas**: Todas las validaciones (rango de fechas, existencia de microciclo, permisos, etc.) están en un solo lugar.
5. **Mantenibilidad**: Si cambia la lógica de identificación (por ejemplo, se agregan reglas especiales), solo se modifica en el backend.
6. **Resiliencia**: Si el frontend tiene datos desactualizados o hay cambios en los microciclos, el backend puede detectar y manejar estos casos.
7. **Testabilidad**: Es más fácil testear la lógica de negocio en el backend que en el frontend.

#### Desventajas de hacer la lógica en el Frontend:

1. **Lógica duplicada**: Si hay múltiples clientes (web, mobile, etc.), la lógica debe replicarse en cada uno.
2. **Inconsistencias**: Cambios en el frontend pueden introducir bugs o comportamientos diferentes.
3. **Seguridad**: El frontend puede ser manipulado, por lo que las validaciones deben estar en el backend de todas formas.
4. **Datos desactualizados**: El frontend puede tener datos en caché que no reflejan el estado actual del backend.
5. **Mantenimiento**: Cambios en la lógica requieren actualizar múltiples clientes.

#### Approach Recomendado:

**Frontend envía:**
```typescript
interface CreateTrainingSessionDto {
  planningId: number;      // REQUERIDO - contexto de planificación
  date: string;            // REQUERIDO - fecha de la sesión
  name: string;
  description?: string;
  category: 'training' | 'prep_competition' | 'main_competition';
  athleteIds: number[];
  intervals: CreateTrainingIntervalDto[];
  notes?: string;
  // ... otros campos
}
```

**Backend identifica el Microciclo:**
```csharp
// El backend busca el microciclo automáticamente
public async Task<TrainingSession> CreateTrainingSessionAsync(CreateTrainingSessionDto dto)
{
    // 1. Validar que la planificación existe y el usuario tiene permisos
    var planning = await _planningRepository.GetByIdAsync(dto.PlanningId);
    if (planning == null)
        throw new NotFoundException("Planificación no encontrada");

    // Validar permisos (el usuario debe ser el coach de la planificación)
    var currentUserId = _currentUserService.GetUserId();
    if (planning.CoachId != currentUserId)
        throw new UnauthorizedException("No tienes permisos para crear sesiones en esta planificación");

    // 2. Buscar el microciclo que contiene la fecha dentro de esta planificación
    var sessionDate = DateTime.Parse(dto.Date);
    var microcycle = await _microcycleRepository
        .GetByPlanningIdAndDateAsync(dto.PlanningId, sessionDate);

    if (microcycle == null)
        throw new ValidationException(
            $"No se encontró un microciclo para la fecha {dto.Date:yyyy-MM-dd} en la planificación. " +
            $"Asegúrate de que la fecha esté dentro del rango de algún microciclo de la planificación.");

    // 3. Validar que la fecha está dentro del rango del microciclo
    if (sessionDate < microcycle.StartDate || sessionDate > microcycle.EndDate)
        throw new ValidationException(
            $"La fecha {dto.Date:yyyy-MM-dd} no está dentro del rango del microciclo " +
            $"({microcycle.StartDate:yyyy-MM-dd} - {microcycle.EndDate:yyyy-MM-dd})");

    // 4. Crear la sesión con el microciclo identificado
    var trainingSession = new TrainingSession
    {
        PlanningId = dto.PlanningId,
        MicrocycleId = microcycle.Id,  // ← Identificado automáticamente por el backend
        Date = sessionDate,
        Name = dto.Name,
        Description = dto.Description,
        Category = MapCategory(dto.Category),
        // ... otros campos
    };

    // 5. Guardar y retornar
    return await _trainingSessionRepository.CreateAsync(trainingSession);
}
```

**Nota importante**: El campo `Date` siempre debe ser validado en el backend para asegurar que está dentro del rango del microciclo (`StartDate <= Date <= EndDate`).

