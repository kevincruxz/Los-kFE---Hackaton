# 🚌 UTCBusTracker

**Equipo:** Los +kFE  
**Proyecto:** Sistema de geolocalización y seguimiento de rutas internas de transporte universitario  
**Stack:** Frontend → React | Backend → Hono (Cloudflare Workers)  
**Hackathon:** Universidad Tecnológica de Coahuila  

---

## 📋 Descripción

**UTCBusTracker** es una aplicación web desarrollada para el hackathon de la Universidad Tecnológica de Coahuila.  
El sistema permite **visualizar en tiempo real la ubicación de las unidades de transporte internas de la universidad**, junto con sus rutas, paradas y nivel de ocupación.

Su objetivo es mejorar la experiencia de los estudiantes, optimizando el tiempo de espera y ofreciendo una forma simple de saber dónde están los camiones en todo momento.

---

## 🚀 Características principales

- Visualización de rutas y paradas en un mapa interactivo.  
- Seguimiento en tiempo real de las unidades activas.  
- Actualización periódica de la posición del transporte (cada 10–30 segundos).  
- Indicador de nivel de ocupación (vacío, medio, lleno).  
- Backend ligero y rápido con **Hono**.  
- Base de datos estructurada en **3 tablas principales**:  
  - `Rutas`  
  - `Paradas`  
  - `Viajes`

---

## 🧱 Arquitectura técnica

**Frontend (React)**
- Mapa interactivo (Leaflet / React-Leaflet)
- Axios para consumo de API
- TailwindCSS para diseño rápido y responsivo

**Backend (Hono)**
- Endpoints RESTful para CRUD de rutas, paradas y viajes
- Desplegable en Cloudflare Workers o Node.js
- CORS habilitado
- Persistencia en SQLite o Cloudflare D1

**Flujo general**
