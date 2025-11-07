# 🚌 UTCBusTracker

**Equipo:** Los +kFE  
**Proyecto:** Sistema de geolocalización y seguimiento de rutas internas de transporte universitario.  
**Hackathon:** Universidad Tecnológica de Coahuila  

---

## 📋 Descripción

**UTCBusTracker** es un sistema de seguimiento de transporte en tiempo real. Permite a los usuarios visualizar la ubicación de las unidades de transporte y a los administradores (conductores) transmitir su posición.

El proyecto se compone de dos partes principales:
1.  **Frontend:** Una aplicación web estática con vistas para usuarios y administradores.
2.  **Backend:** Una API construida con Hono que corre sobre Cloudflare Workers.

---

## 🏛️ Arquitectura y Tecnologías

### **Frontend**

La interfaz de usuario es una aplicación web estática construida con tecnologías web estándar, lo que garantiza máxima compatibilidad y un despliegue sencillo.

- **Stack:**
  - HTML5
  - CSS3 con **TailwindCSS** (a través de CDN)
  - JavaScript (ES Modules)
  - **Leaflet.js** para la visualización de mapas interactivos.

- **Componentes Principales:**
  - **Vista de Usuario (`/BusTrackerFront/user`):**
    - Muestra las rutas de transporte disponibles en formato de tarjetas.
    - Permite filtrar para ver solo las rutas activas.
    - Al seleccionar una ruta, despliega un mapa que sondea la API para mostrar la ubicación del autobús en tiempo real.
    - Carga y visualiza las paradas estáticas de la ruta seleccionada.
  - **Vista de Administrador/Conductor (`/BusTrackerFront/admin`):**
    - Permite al conductor seleccionar la ruta y el número de unidad que está operando.
    - Utiliza la **API de Geolocalización del navegador** (`watchPosition`) para obtener la ubicación del dispositivo.
    - Inicia y detiene el seguimiento, enviando coordenadas a la API del backend cada 10 segundos.
    - Permite cancelar el viaje, notificando al backend para que la ruta aparezca como inactiva.

- **Cómo Ejecutar el Frontend:**
  - Al ser un sitio estático, no requiere un proceso de build.
  - Simplemente abre los archivos `index.html` de las carpetas `/user` o `/admin` en un navegador web.
  - Para un mejor rendimiento y para evitar problemas con CORS, se recomienda servir los archivos con un servidor local simple (ej. `npx serve`).

### **Backend**

El servicio backend provee los endpoints necesarios para que el frontend funcione. Está construido para ser rápido, ligero y escalable.

- **Stack:**
  - **Hono.js:** Framework web ultrarrápido para entornos de borde (Edge).
  - **Cloudflare Workers:** Plataforma de ejecución serverless.
  - **Cloudflare D1:** Base de datos SQL serverless para la persistencia de datos.

- **Desarrollo del Backend:**
  - **Prerrequisitos:** Node.js, npm, y Wrangler CLI.
  - **Instalación:**
    ```bash
    cd BusTrackerBackHono
    npm install
    ```
  - **Ejecución Local:**
    ```bash
    npm run dev
    ```
  - **Despliegue:**
    ```bash
    npm run deploy
    ```

---

## 🗄️ Esquema de Base de Datos

La base de datos se compone de tres tablas principales:

1.  **Rutas**: Almacena la información de cada ruta, incluyendo su estado actual de seguimiento (ubicación, unidad y si está activa o no).
    - `id`, `nombre`, `distancia`, `unidad`, `latitud_actual`, `longitud_actual`, `ultima_actualizacion`, `status`.
2.  **Paradas**: Define las paradas específicas para cada ruta, con su orden y coordenadas.
    - `id`, `id_ruta`, `orden_parada`, `latitud`, `longitud`, `nombre`.
3.  **Viajes**: (Modelo anterior) Tabla para registrar cada viaje individualmente.
    - `id`, `id_ruta`, `latitud_actual`, `longitud_actual`, `ultima_actualizacion`, `capacidad_actual`, `ultima_parada`, `proxima_parada`.

---

## 📡 API Endpoints

A continuación se describen los endpoints principales de la API.

### Gestión de Viajes

#### Iniciar Viaje
- **Método:** `POST`
- **Ruta:** `/rutas/start`
- **Descripción:** Inicia un viaje actualizando el registro de una ruta con la ubicación y unidad actual. Cambia el `status` a `1`.
- **Body (Request):**
  ```json
  {
    "id_ruta": 1,
    "lat": 25.54,
    "long": -103.38,
    "unidad": 101
  }
  ```

#### Cancelar Viaje
- **Método:** `POST`
- **Ruta:** `/rutas/cancel`
- **Descripción:** Cancela un viaje, limpiando los datos de ubicación de la ruta. Cambia el `status` a `0`.
- **Body (Request):**
  ```json
  {
    "id_ruta": 1
  }
  ```

### Consulta de Rutas y Paradas

#### Listar Todas las Rutas
- **Método:** `GET`
- **Ruta:** `/rutas`
- **Descripción:** Devuelve una lista de todas las rutas con su información esencial.
- **Respuesta (Éxito):**
  ```json
  [
    {
      "id": 1,
      "nombre": "Ruta Principal",
      "lat": 25.54,
      "long": -103.38,
      "status": 1
    }
  ]
  ```

#### Obtener Ubicación de una Ruta
- **Método:** `GET`
- **Ruta:** `/rutas/{id_ruta}/location`
- **Descripción:** Obtiene la ubicación más reciente de una ruta activa.
- **Respuesta (Éxito):**
  ```json
  {
    "id_ruta": 1,
    "lat": 25.54,
    "long": -103.38,
    "status": 1
  }
  ```

#### Listar Paradas de una Ruta
- **Método:** `GET`
- **Ruta:** `/rutas/{id_ruta}/paradas`
- **Descripción:** Devuelve todas las paradas asociadas a una ruta, ordenadas.

#### Listar Paradas con Estatus de Viaje
- **Método:** `GET`
- **Ruta:** `/rutas/{id_ruta}/paradas/status`
- **Descripción:** Devuelve todas las paradas de una ruta, indicando si ya fueron visitadas (`pasada`) o no (`no pasada`) según el viaje más reciente.
  ```