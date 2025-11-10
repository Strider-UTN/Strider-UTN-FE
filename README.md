# Strider - Sistema de Gestión de Entrenamiento para Atletas

Strider es una plataforma web diseñada para la gestión integral de entrenamientos de atletas de fondo y medio-fondo. Permite a entrenadores crear y gestionar planificaciones de entrenamiento, asignar sesiones a atletas, y realizar un seguimiento detallado del rendimiento.

## 🎯 Características Principales

### Para Entrenadores
- **Gestión de Planificaciones**: Crear y administrar planificaciones de entrenamiento con períodos, mesociclos y microciclos
- **Asignación de Atletas**: Asignar atletas individualmente o por grupos a diferentes planificaciones
- **Creación de Sesiones**: Diseñar sesiones de entrenamiento con intervalos personalizados
- **Plantillas de Entrenamiento**: Crear y reutilizar plantillas de entrenamiento
- **Calendario de Entrenamientos**: Visualizar y gestionar sesiones en un calendario interactivo
- **Seguimiento de Rendimiento**: Analizar el progreso de los atletas
- **Gestión de Grupos**: Crear y administrar grupos de atletas
- **Sistema de Feedback**: Proporcionar retroalimentación a los atletas

### Para Atletas
- **Vista de Planificación**: Visualizar la planificación asignada por el entrenador
- **Calendario Personal**: Ver sesiones de entrenamiento asignadas
- **Historial de Entrenamientos**: Revisar entrenamientos completados
- **Carga de Resultados**: Subir resultados de entrenamientos realizados
- **Integración con Garmin**: Sincronizar datos desde dispositivos Garmin
- **Feedback del Entrenador**: Recibir y revisar comentarios del entrenador

## 🛠️ Tecnologías Utilizadas

- **React 18.3.1** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite 6.3.5** - Build tool y dev server
- **Tailwind CSS 4.1.16** - Framework de estilos
- **Radix UI** - Componentes de UI accesibles
- **React Hook Form** - Manejo de formularios
- **Axios** - Cliente HTTP
- **date-fns** - Utilidades para fechas
- **Recharts** - Gráficos y visualizaciones
- **Sonner** - Sistema de notificaciones toast
- **Lucide React** - Iconos
- **React OAuth Google** - Autenticación con Google

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── ui/            # Componentes de UI reutilizables (Radix UI)
│   ├── types/          # Tipos TypeScript específicos
│   └── utils/          # Utilidades de componentes
├── services/           # Servicios para comunicación con API
├── types/              # Tipos TypeScript globales
├── utils/              # Utilidades generales
├── styles/             # Estilos globales
└── guidelines/          # Documentación y guías
```

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js (versión 18 o superior recomendada)
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio** (si aplica)
   ```bash
   git clone <repository-url>
   cd Strider-UTN-FE
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   - La aplicación estará disponible en `http://localhost:3000` (o el puerto que Vite asigne)

### Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción

## 🎨 Diseño Original

El diseño original de la aplicación está disponible en Figma:
[App de Atletas - Figma Design](https://www.figma.com/design/fWvI9JJZP2MnSbbmeaei1T/App-de-Atletas)

## 📚 Conceptos Clave

### Períodos de Planificación
- **Macrociclo**: Período de planificación que abarca un año completo (52 semanas)
- **Mesociclo**: Período de planificación correspondiente a un mes
- **Microciclo**: Período de planificación correspondiente a una semana de entrenamientos
- **Sesión**: Entrenamiento individual
- **Intervalo**: Unidad básica de trabajo dentro de una sesión

### Tipos de Usuarios
- **Entrenador (Coach)**: Usuario principal que crea y gestiona planificaciones
- **Atleta**: Usuario que recibe y ejecuta las planificaciones asignadas

## 🔗 Integración con Backend

Esta aplicación frontend se conecta con una API backend desarrollada en .NET. Asegúrate de que el backend esté corriendo y configurado correctamente antes de usar todas las funcionalidades.

## 📝 Notas de Desarrollo

- El proyecto utiliza TypeScript para mayor seguridad de tipos
- Los componentes de UI están basados en Radix UI para accesibilidad
- El sistema de autenticación utiliza JWT tokens
- Las fechas se manejan en formato UTC para evitar problemas de timezone

## 🤝 Contribución

Este es un proyecto académico desarrollado para la Universidad Tecnológica Nacional (UTN).

## 📄 Licencia

Este proyecto es privado y está destinado para uso académico.
