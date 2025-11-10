# Strider - Guías del Sistema

## Terminología Técnica - Atletismo de Fondo y Medio-Fondo

### Definiciones Fundamentales

**Planificación**: Proceso de determinación de las actividades de entrenamiento (tanto en forma como en cantidad), y las competencias a realizar durante un período determinado de tiempo.

**Entrenador**: Persona encargada de llevar a cabo el proceso de planificación. Corresponde al usuario principal del sistema.

**Atleta**: Persona que es sujeto del proceso de planificación desarrollado por el entrenador.

**Fondo**: Prueba de atletismo que implica correr largas distancias, desde los 3.000 metros hasta la maratón (42.195 metros).

**Medio-fondo**: Prueba de atletismo de media distancia, que abarca desde los 800 metros hasta los 3.000 metros.

**Ritmo**: Medida utilizada para expresar la velocidad de un atleta de fondo o medio fondo, en términos del tiempo requerido para completar un kilómetro. Se expresa en min:seg/km.

**VO2 Max**: Aunque tiene una definición médica específica, en este contexto se refiere al ritmo máximo al que puede correr un atleta en una prueba de medio fondo o fondo.

### Períodos de Planificación

**Macrociclo**: Periodo de planificación que abarca un año completo, compuesto por 52 semanas.

**Mesociclo**: Periodo de planificación correspondiente a un mes.

**Microciclo**: Periode de planificación correspondiente a una semana de entrenamientos.

**Sesión**: Entrenamiento individual.

**Turno**: Cuando un día contiene más de una sesión (n > 1), estas se dividen en turnos según la capacidad del atleta.

**Serie**: Unidad básica de trabajo dentro de una sesión de entrenamiento que puede configurarse de dos formas:
- **Por Distancia**: Se define la distancia a recorrer y la velocidad objetivo (ritmo en min/km)
- **Por Tiempo**: Se define el tiempo de duración y la velocidad objetivo (ritmo en min/km)

En ambos casos, una serie incluye: repeticiones, velocidad objetivo, tiempo de recuperación e intensidad.

### Estructuración de la Planificación

El proceso de planificación para un atleta de alto rendimiento se estructura de manera anual siguiendo esta jerarquía:

#### Estructura Anual (Macrociclo)
- **Duración**: 1 año completo = 52 semanas
- **Organización**: Contiene directamente los mesociclos sin divisiones en períodos
- **Flexibilidad**: Permite organización según objetivos específicos de temporada

#### Estructura Mensual (Mesociclo)
- **Organización**: Los mesociclos se organizan directamente dentro del macrociclo
- **Función**: Permiten organización táctica y objetivos a mediano plazo
- **Creación Manual**: Los mesociclos se crean uno por uno de forma manual, la lista arranca vacía
- **Configuración de Fechas**:
  - **Fecha de inicio**: Se selecciona desde un calendario
  - **Fecha de fin**: Se calcula automáticamente basada en la cantidad de semanas especificadas
  - **Validación de Superposición**: El sistema detecta y alerta si el nuevo mesociclo se superpone con mesociclos existentes, requiriendo ajustar las fechas
- **Métricas Calculadas**: "Cantidad de sesiones" y "Volumen total" no se solicitan en la creación inicial, ya que se calculan automáticamente para reportes basados en las sesiones programadas

#### Estructura Semanal (Microciclo)  
- **Organización**: Los mesociclos se dividen en microciclos semanales
- **Función**: Unidad básica de planificación operativa

#### Estructura Diaria (Sesiones)
- **Composición**: Cada día dentro de un microciclo puede contener **n sesiones**
- **Turnos**: Si n > 1, las sesiones se dividen en turnos
- **Criterio**: La cantidad depende de la capacidad del atleta

#### Jerarquía Completa
```
Macrociclo (1 año / 52 semanas)
├── Mesociclo 1 (4 semanas aprox.)
│   ├── Microciclo 1 (1 semana)
│   │   ├── Día 1: n Sesiones/Turnos
│   │   ├── Día 2: n Sesiones/Turnos
│   │   └── ...
│   └── ...
├── Mesociclo 2 (4 semanas aprox.)
│   └── [Misma estructura]
└── ...
```

### Métricas y Medidas

**Volumen**: Kilometraje total realizado durante un período de tiempo. Se mide en kilómetros (km).

**Cuestas**: Tipo de entrenamiento realizado en terrenos con pendiente, usualmente en forma de intervalos.

### Sistema de Informes y Reportes

**Informes/Reportes**: Sección dedicada al análisis y generación de reportes de entrenamiento, reemplaza la vista del Macrociclo en la interfaz de planificaciones.

**Propósito**: 
- Calcular y mostrar métricas agregadas como "Cantidad de sesiones" y "Volumen total"
- Analizar datos de rendimiento a lo largo de mesociclos y microciclos
- Generar visualizaciones y estadísticas de entrenamiento
- Evaluar cumplimiento de objetivos planificados vs. ejecutados

**Ubicación**: Primera pestaña en la vista detallada de planificaciones (Entrenador → Planificación → [Seleccionar Planificación] → Informes)

## Directrices de Uso de Terminología

### Consistencia en la Aplicación
- Usar siempre "Planificación" en lugar de términos genéricos como "plan" o "programa" cuando se refiera al proceso técnico
- Mantener la distinción entre "Entrenador" y "Atleta" en todas las interfaces
- Usar "Sesión" para entrenamientos individuales, no "entrenamiento" cuando sea específico
- Expresar ritmo siempre en formato "min:seg/km" (ej: 4:30/km)
- Usar "Volumen" para referirse al kilometraje total
- Distinguir claramente entre "Sesión" y "Turno" cuando hay múltiples entrenamientos por día

### Jerarquía de Planificación
La estructura jerárquica debe reflejarse consistentemente en:
- **Navegación**: Informes → Mesociclo → Microciclo → Día → Sesión/Turno
- **Interfaces**: Estructura simplificada con mesociclos directamente bajo la planificación anual
- **Calendarios**: Mostrar la organización flexible de mesociclos a lo largo del año
- **Informes**: Calcular y mostrar métricas agregadas respetando la jerarquía temporal (sesiones calculadas automáticamente, no ingresadas manualmente)

### Especialidades Atléticas
- Distinguir claramente entre "Fondo" (3.000m+) y "Medio-fondo" (800m-3.000m)
- Adaptar métricas y análisis según la especialidad del atleta

### Planificación por Objetivos
- Los períodos pueden subdividirse según objetivos específicos
- Cada subdivisión debe estar orientada a competencias concretas
- La capacidad del atleta determina el número de sesiones por día

## Guías Generales del Sistema

### Diseño y UX
- Usar colores de marca: azul oscuro (#1e293b) y turquesa (#06b6d4)
- Fuente: Poppins en todos los elementos
- Todo el texto debe estar en español
- Interfaces responsivas optimizadas para escritorio principalmente

### Componentes y Estructura
- Mantener archivos pequeños y componentes modulares
- Usar flexbox y grid por defecto, evitar posicionamiento absoluto
- Refactorizar código constantemente para mantener limpieza
- Funciones auxiliares en archivos separados

### Sistema de Tipografía
- No usar clases de Tailwind para font-size, font-weight o line-height a menos que se solicite específicamente
- El sistema base de tipografía está configurado en globals.css

### Datos y Estados
- Usar datos mock realistas que reflejen el contexto atlético
- Estados de carga y error apropiados
- Validación de formularios con feedback claro
- Respetar la estructura jerárquica de planificación en los datos mock

### Navegación y Flujos
- Dashboard centrado en las necesidades del entrenador
- Vista separada optimizada para atletas
- Flujos intuitivos para creación de planificaciones y seguimiento
- Navegación que refleje la jerarquía temporal: Año → Mes → Semana → Día

### Funcionalidades Específicas
- Sistema de subida manual de entrenamientos (sin Garmin en el componente TrainingUpload)
- Gestión de lesiones y molestias con terminología médica apropiada
- Asociación jerárquica entre planificaciones y sesiones
- Feedback detallado de entrenamientos con métricas específicas
- Soporte para múltiples sesiones por día organizadas en turnos

### Terminología en Interfaces
- "Mis Sedes" en lugar de "Equipos" o "Agrupaciones" (cambiar todos los usos de "agrupación" y "equipo" por "sede")
- "Mis Atletas" para gestión individual
- "Molestia" y "Dolor" como opciones de reporte (sin "Lesión")
- "Planificación" en lugar de "Entrenamientos" en pestañas de atletas

- "Turno" cuando hay múltiples sesiones en un día
- "Informes" o "Reportes" como primera pestaña en vista de planificaciones (reemplaza la vista del Macrociclo)
- Los mesociclos se crean manualmente uno por uno, sin lista pre-cargada