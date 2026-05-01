# Especificación de Requerimientos (PRD) - Fortress Vault

## 1. Visión General
Fortress Vault es una aplicación web SPA orientada a la gestión segura de contraseñas personales o empresariales. Su propuesta de valor principal es la evaluación en tiempo real de la fortaleza de las credenciales, la expiración dinámica basada en la entropía y la prevención estricta de reutilización de contraseñas.

## 2. Stack Tecnológico
* **Frontend:** Angular
* **Backend:** Go (Golang)
* **Base de Datos:** Firebase (Firestore para almacenamiento, Firebase Auth para identidad)
* **Estilos:** Tailwind CSS (alineado con los tokens de `DESIGN.md`)

## 3. Historias de Usuario & Funcionalidades Core

### 3.1 Autenticación (Referencia: `login.html`)
* **[REQ-AUTH-01]** El usuario debe poder iniciar sesión de forma segura utilizando Google SSO vía Firebase Authentication.
* **[REQ-AUTH-02]** Las rutas de la aplicación (Dashboard, Vault) deben estar protegidas y ser inaccesibles sin un token de sesión válido.

### 3.2 Dashboard (Referencia: `security_dashboard.html`)
* **[REQ-DASH-01]** El usuario visualizará una métrica global de "Aplicaciones Totales" registradas.
* **[REQ-DASH-02]** El sistema mostrará un gráfico de salud (Health Chart) dividiendo las contraseñas en "Fuertes", "Medias" y "Débiles".
* **[REQ-DASH-03]** Se mostrará una alerta de acciones críticas (contraseñas próximas a expirar en < 7 días).
* **[REQ-DASH-04]** Se listarán las aplicaciones en una tabla con su estado, indicador visual de fortaleza y una barra de progreso representando el tiempo restante hasta la expiración.

### 3.3 Gestión de Bóveda / Vault Management (Referencia: `vault_management.html`)
* **[REQ-VAULT-01]** El usuario podrá ver una lista navegable de sus aplicaciones registradas en un panel lateral izquierdo.
* **[REQ-VAULT-02]** Al seleccionar una aplicación, el panel derecho mostrará sus detalles generales (URL, Email/Username).
* **[REQ-VAULT-03]** La contraseña actual se mostrará enmascarada (`••••••••`) por defecto, con un botón ("ojito") para revelar su contenido.
* **[REQ-VAULT-04]** El usuario podrá copiar al portapapeles tanto el usuario como la contraseña.

### 3.4 Motor de Contraseñas & Reglas de Negocio (Crítico)
* **[REQ-ENG-01]** **Evaluación en Tiempo Real:** Al generar o escribir una nueva contraseña, el sistema debe calcular el tiempo estimado para descifrarla mediante fuerza bruta y clasificar su fortaleza (Débil, Media, Fuerte).
* **[REQ-ENG-02]** **Expiración Dinámica:** Al guardar una contraseña, el sistema le asignará una fecha de expiración proporcional o equivalente al tiempo calculado de descifrado (hasta un máximo lógico, ej. 90 días o años según política de la empresa).
* **[REQ-ENG-03]** **Unicidad Estricta:** Antes de guardar, el backend en Go consultará la base de datos (Firestore) para verificar si el usuario ya ha utilizado esa contraseña exacta en cualquier otra aplicación. Si existe, se bloqueará la acción y se mostrará el mensaje de error: "Security Violation Detected".

### 3.5 Security Audit — Breach Monitor

* **[REQ-AUDIT-01]** **Monitoreo de Filtraciones:** El sistema debe integrar una verificación externa vía la API de Have I Been Pwned (HIBP) para contrastar los correos/usuarios registrados en la bóveda contra bases de datos de filtraciones conocidas. Las consultas se realizarán desde el backend en Go para proteger la API Key y la privacidad del usuario.
* **[REQ-AUDIT-02]** **Panel de Compromisos:** Se mostrará una vista dedicada "Security Audit" que lista todas las aplicaciones cuyo usuario/email aparezca en una filtración conocida, indicando el nombre de la filtración, la fecha y el tipo de datos expuestos.
* **[REQ-AUDIT-03]** **Acción de Mitigación:** Cada registro comprometido mostrará un botón de acción rápida "Rotate Password" que redirige al usuario directamente a la pantalla de Vault Management con la aplicación afectada preseleccionada para cambiar la contraseña de forma inmediata.
* **[REQ-AUDIT-04]** **Persistencia del Estado:** El resultado del escaneo se persiste en Firestore mediante los campos `isCompromised` (boolean) y `breachDetails` (string) en cada documento de aplicación, evitando consultas repetidas innecesarias a la API externa.
* **[REQ-AUDIT-05]** **Privacidad:** Las consultas a HIBP se realizarán usando el modelo k-Anonymity — solo se envían los primeros 5 caracteres del hash SHA-1 del correo, nunca el correo completo ni el hash completo.
