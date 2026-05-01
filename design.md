# Documento de Diseño (ADD) - Fortress Vault

## 1. Arquitectura del Sistema
El sistema sigue un modelo Cliente-Servidor (SPA + API REST).
* **Cliente Angular:** Maneja la UI, ruteo, consumo de la API de Go y la integración directa con Firebase Auth para obtener el token JWT.
* **API Go:** Sirve como capa de lógica de negocio y seguridad. Recibe el token de Firebase, lo valida, y ejecuta operaciones CRUD contra Firestore utilizando el Firebase Admin SDK.
* **Firestore:** Actúa como fuente única de la verdad.

## 2. Especificaciones de Interfaz (UI/UX)
El frontend debe ser un fiel reflejo de los mockups estáticos y de `DESIGN.md`.
* **Tema:** Dark Mode puro (fondos basados en `#12131b` y variaciones de la paleta Slate/Indigo).
* **Tipografía:** Familia `Inter`.
* **Iconografía:** Google Material Symbols Outlined.
* **Componentes Clave:** Layout maestro con Sidebar fijo a la izquierda (256px), TopAppBar fijo y Canvas de contenido con `overflow` controlado.

## 3. Modelo de Datos (Firestore)
La base de datos estará estructurada en un esquema NoSQL orientado a subcolecciones por usuario.
```json
users (Collection)
 └── {userId} (Document - Ej. Google UID)
      ├── email: string
      └── apps (Subcollection)
           └── {appId} (Document)
                ├── appName: string
                ├── url: string
                ├── username: string
                ├── encryptedPassword: string
                ├── passwordHash: string (Utilizado para validar unicidad rápidamente)
                ├── strength: string ("Strong", "Medium", "Weak")
                ├── crackTimeSeconds: number
                ├── expirationDate: timestamp
                └── lastUpdated: timestamp

## 4. Security Audit — Breach Monitor

### 4.1 Integración de API Externa (Backend Go)
El backend en Go actúa como proxy seguro hacia Have I Been Pwned (HIBP) para proteger la API Key y garantizar la privacidad del usuario.

**Endpoint nuevo:**
```
GET /api/v1/audit/scan
```
- Requiere token JWT válido (mismo middleware de autenticación existente).
- Itera sobre todos los documentos `apps` del usuario en Firestore.
- Para cada `username`, calcula el hash SHA-1 y envía solo los primeros 5 caracteres a la API de HIBP (modelo k-Anonymity).
- Compara el sufijo del hash con la respuesta de HIBP.
- Actualiza los campos `isCompromised` y `breachDetails` en Firestore.
- Retorna el listado completo con el estado de compromiso.

**Rate limiting:** HIBP requiere un User-Agent personalizado y tiene un límite de 1 petición/1500ms. El backend implementará un throttle entre peticiones.

### 4.2 Modelo de Datos Actualizado (Firestore)
Se añaden dos campos al documento `apps/{appId}`:

```json
{
  "isCompromised": false,
  "breachDetails": "Found in: LinkedIn (2021), Adobe (2013)"
}
```

### 4.3 Componente Angular — Security Audit View
- Ruta: `/security-audit`
- Diseño consistente con el resto de la aplicación (dark mode, paleta Slate/Indigo, Material Symbols).
- Muestra un resumen de estado (total escaneado, total comprometido).
- Lista de aplicaciones comprometidas con badge rojo, detalles de la filtración y botón "Rotate Password".
- Botón "Run Scan" que dispara el endpoint `/api/v1/audit/scan`.
- Estado de carga con skeleton loaders durante el escaneo.
