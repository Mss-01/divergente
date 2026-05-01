---

### 3. tasks.md
```markdown
# Desglose de Tareas (Tasks) - Fortress Vault

Este documento sirve como backlog técnico para la herramienta de codificación asistida (AI/Cursor).

## Épica 1: Configuración Inicial e Infraestructura
* [ ] **T1.1:** Inicializar proyecto Angular (standalone components, ruteo habilitado).
* [ ] **T1.2:** Configurar Tailwind CSS integrando los colores, fuentes (`Inter`) y variables descritas en `DESIGN.md`.
* [ ] **T1.3:** Inicializar proyecto Go (módulos, framework HTTP como Gin o Fiber).
* [ ] **T1.4:** Configurar proyecto de Firebase (Auth habilitado para Google, base de datos Firestore inicializada).
* [ ] **T1.5:** Conectar Angular con Firebase Auth y el backend de Go con Firebase Admin SDK.

## Épica 2: UI/UX Estática y Layouts (Frontend)
* [ ] **T2.1:** Crear pantalla de Login (`login.html`), integrando el flujo de Google Sign-In real.
* [ ] **T2.2:** Desarrollar el Layout Principal: Sidebar y Topbar navegables, adaptando las clases Tailwind de los archivos fuente.
* [ ] **T2.3:** Crear vista estática de `Security Dashboard` (`security_dashboard.html`).
* [ ] **T2.4:** Crear vista estática de `Vault Management` (`vault_management.html`) implementando el grid de 40/60%.

## Épica 3: Lógica de Backend (Go) y Conexión de Datos
* [ ] **T3.1:** Implementar middleware en Go para validar el token JWT proveniente de Angular.
* [ ] **T3.2:** Crear servicio en Go para el manejo de cifrado (AES-256) y hashing (SHA-256) de contraseñas.
* [ ] **T3.3:** Desarrollar endpoints CRUD en Go para interactuar con la subcolección `apps` en Firestore.
* [ ] **T3.4:** Implementar la lógica específica de validación de unicidad en el endpoint PUT/POST de contraseñas (retornar 409 si existe el hash).

## Épica 4: Integración del Motor de Contraseñas (Angular)
* [ ] **T4.1:** Integrar librería `zxcvbn` o similar en Angular mediante un `PasswordStrengthService`.
* [ ] **T4.2:** Interconectar el input de generación de contraseñas en `vault_management` con el servicio para actualizar dinámicamente:
    * El color de la barra (Rojo -> Naranja -> Verde -> Indigo).
    * El texto de "Time to Crack".
    * El cálculo de "Set Expiration".
* [ ] **T4.3:** Conectar la alerta "Security Violation Detected" al manejo de errores (capturar el error HTTP 409 del backend de Go).

## Épica 5: Conexión Frontend-Backend y Lógica UI
* [ ] **T5.1:** Llenar la vista de `Dashboard` consumiendo la API de Go. Agrupar las estadísticas (Total apps, Strong/Medium/Weak, Expiring soon).
* [ ] **T5.2:** Implementar la selección de aplicaciones en `Vault Management`. Al hacer click en la lista izquierda, cargar los detalles a la derecha.
* [ ] **T5.3:** Implementar funcionalidad del "Ojito" en los inputs de contraseñas (cambiar type `password` a `text` dinámicamente).
* [ ] **T5.4:** Implementar funcionalidad del botón copiar (Clipboard API).
* [ ] **T5.5:** Pruebas end-to-end del flujo: Creación de app -> Asignación de contraseña -> Falla intencional por duplicidad -> Guardado exitoso con expiración calculada.

## Épica 6: Security Audit — Breach Monitor

* [ ] **T6.1:** Configurar cliente HTTP en Go para conectar con Have I Been Pwned API. Implementar modelo k-Anonymity (SHA-1 del email, enviar solo primeros 5 chars). Agregar throttle de 1500ms entre peticiones para respetar el rate limit de HIBP.
* [ ] **T6.2:** Crear endpoint `GET /api/v1/audit/scan` en Go que itere los `apps` del usuario, consulte HIBP por cada username/email, actualice los campos `isCompromised` y `breachDetails` en Firestore y retorne el listado completo con estado de compromiso.
* [ ] **T6.3:** Desarrollar la vista `SecurityAuditComponent` en Angular (`/security-audit`) con: tarjeta de resumen (total escaneado / total comprometido), botón "Run Scan", skeleton loaders durante el escaneo y lista de apps comprometidas con favicon, nombre, detalles de filtración y badge rojo.
* [ ] **T6.4:** Implementar indicadores visuales (badges rojos en sidebar y en la lista) y botón "Rotate Password" que redirija a `/vault` con la aplicación afectada preseleccionada para rotación inmediata de contraseña.
