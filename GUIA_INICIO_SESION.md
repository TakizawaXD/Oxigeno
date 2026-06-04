# 📱 Guía Completa - Cómo Iniciar Sesión en HealthLogix OS

## URL DE ACCESO

```
https://healthlogix.com
o
http://localhost:5173 (desarrollo local)
```

---

## 🚀 PASO A PASO PARA INICIAR SESIÓN

### **Opción 1: Con Google (Recomendado - Más Rápido)**

#### Paso 1: Ir a la página de login
```
1. Accede a https://healthlogix.com/login
2. Verás dos botones principales
```

#### Paso 2: Hacer clic en "Sign In with Google"
```
1. Presiona el botón "Continuar con Google" (con logo de Google)
2. Se abrirá una ventana de Google
```

#### Paso 3: Autenticarse con Google
```
1. Selecciona tu cuenta de Google
2. Completa el proceso de autenticación
3. Autoriza los permisos solicitados
```

#### Paso 4: Completar tu perfil (primera vez)
```
Paso 1: Información Personal
- Ingresa tu nombre completo
- Selecciona tu posición en la empresa

Paso 2: Información de la Empresa
- Nombre de la empresa
- Industria/Ramo
- Tamaño de la empresa

Paso 3: Contacto
- Teléfono
- Revisa el resumen
```

#### Paso 5: ¡Acceso a Dashboard!
```
✅ Ya estás adentro
✅ Verás tu dashboard personalizado
✅ Datos de tu organización cargados
```

---

### **Opción 2: Con Email y Contraseña**

#### Paso 1: Ir a registro
```
1. Accede a https://healthlogix.com/signup
2. O presiona "Crear Organización" en la página de login
```

#### Paso 2: Llenar el formulario
```
Nombre completo: Tu nombre
Email: tu@email.com
Nombre de Organización: Tu Empresa S.A.
Contraseña: Mínimo 6 caracteres
```

#### Paso 3: Presionar "Crear Cuenta"
```
1. El sistema crea tu cuenta
2. Tu organización se genera automáticamente
3. Eres asignado como Owner (Propietario)
```

#### Paso 4: Completar cuestionario
```
Como en la opción de Google:
- Información Personal
- Información de Empresa
- Información de Contacto
```

#### Paso 5: ¡Acceso a Dashboard!
```
✅ Dashboard personalizado
✅ Datos reales de Supabase
✅ Listo para usar
```

---

### **Opción 3: Con "Recuérdame"**

#### Primer acceso
```
1. Inicia sesión normalmente
2. Marca el checkbox "Recuérdame" ✓
3. Se guardan tus credenciales localmente
```

#### Siguientes accesos
```
1. Entra a https://healthlogix.com/login
2. Tus credenciales están precargadas
3. Solo presiona "Iniciar Sesión"
4. ¡Listo!
```

---

## 📊 DESPUÉS DE INICIAR SESIÓN

### Dashboard Principal
```
Verás:
✅ Resumen de activos
✅ Órdenes pendientes
✅ Flota disponible
✅ Gráficos y estadísticas
✅ Alertas importantes
```

### Navegación Lateral (Sidebar)
```
📊 Dashboard - Panel principal
📦 Activos - Gestión de recursos
📚 Inventario - Control de stock
📋 Órdenes - Gestión de pedidos
🚚 Flota - Gestión de vehículos
🛣️ Rutas - Planificación de entregas
👥 Clientes - Gestión de clientes
⚠️ Incidentes - Reportes de problemas
💡 IA - Análisis predictivo
⚙️ Workflows - Automatizaciones
🏛️ Instalaciones - Ubicaciones
📄 Documentos - Archivos
💰 Facturas - Gestión de facturas
⚙️ Configuración - Ajustes de cuenta
```

---

## 💰 CREAR TU PRIMERA FACTURA

### Acceso a Facturas
```
1. Entra al dashboard
2. En el sidebar, presiona "Facturas" (icono de recibo)
3. Verás la página de gestión de facturas
```

### Crear Nueva Factura
```
1. Presiona botón "Nueva Factura" (arriba a la derecha)
2. Se abre el formulario
```

### Paso 1: Información del Cliente
```
- Nombre del Cliente: Juan Pérez
- Email: cliente@email.com
- Teléfono: +1 (555) 000-0000
- Dirección: Calle 123, Ciudad
```

### Paso 2: Método de Pago
```
Selecciona uno:
💳 Virtual (para pagos con tarjeta)
💵 Efectivo (pago directo)
```

### Paso 3: Agregar Líneas
```
Para cada producto/servicio:
- Descripción: Ej: "Servicio de ambulancia"
- Cantidad: 1
- Precio Unitario: $100.00
- IVA: 19%

Haz clic en "Agregar línea" para más items
```

### Paso 4: Revisar Totales
```
El sistema calcula automáticamente:
✅ Subtotal
✅ Impuestos
✅ Descuento (opcional)
✅ Total Final
```

### Paso 5: Agregar Notas (Opcional)
```
Notas especiales para el cliente
Ej: "Pago en 30 días" o "Gracias por su negocio"
```

### Paso 6: Crear Factura
```
1. Presiona "Crear y Descargar Factura"
2. El sistema:
   ✅ Guarda la factura en Supabase
   ✅ Genera la factura en PDF
   ✅ Permite descargar
   ✅ Redirige a la lista de facturas
```

### Ver la Factura
```
En la tabla de facturas verás:
- Número de factura (INV-TIMESTAMP)
- Cliente
- Monto
- Método de pago
- Estado (Pendiente/Completado)
- Botones: Ver, Descargar PDF, Eliminar
```

---

## 🔑 CARACTERÍSTICAS PRINCIPALES

### 📦 Gestión de Activos
```
- Agregar nuevos activos/equipos
- Seguimiento en tiempo real
- Historial de movimientos
- Estado de salud de equipos
- Alertas de mantenimiento
```

### 📋 Gestión de Órdenes
```
- Crear nuevas órdenes
- Asignar a operadores
- Rastrear en tiempo real
- Confirmar entregas
- Calificar servicios
```

### 🚚 Gestión de Flota
```
- Registrar vehículos
- GPS en tiempo real
- Mantenimiento programado
- Consumo de combustible
- Alertas de problemas
```

### 💰 Gestión de Facturas
```
- Crear facturas profesionales
- Descargar PDF
- Rastrear pagos
- Registrar comprobantes
- Generar reportes
```

### 👥 Roles y Permisos
```
Owner (Propietario):
- Acceso a todo
- Crear facturas
- Gestionar usuarios
- Ver reportes

Employee (Empleado):
- Tomar fotos
- Subir comprobantes
- Ver información asignada
- Reportar problemas
```

---

## ⚠️ SOLUCIÓN DE PROBLEMAS

### No puedo iniciar sesión
```
❌ Email incorrecto
   ✅ Verifica que el email sea el correcto

❌ Contraseña olvidada
   ✅ Presiona "¿Olvidaste tu contraseña?"
   ✅ Se enviará un enlace de reset

❌ Cuenta no existe
   ✅ Ve a /signup para registrarte
   ✅ Crea una nueva cuenta
```

### No aparece mi organización
```
❌ Primera vez iniciando sesión
   ✅ Completa el cuestionario de perfil
   ✅ La organización se genera automáticamente

❌ Sesión expirada
   ✅ Presiona F5 para refrescar
   ✅ Vuelve a iniciar sesión
```

### Las facturas no se guardan
```
❌ Conexión a internet
   ✅ Verifica tu conexión
   ✅ Intenta nuevamente

❌ Campos incompletos
   ✅ Revisa que todos los campos obligatorios (*) estén llenos
   ✅ El botón de crear debe estar habilitado (no gris)
```

### Problema con descarga de PDF
```
❌ Navegador bloqueando descargas
   ✅ Habilita descargas en tu navegador

❌ Sin espacio en disco
   ✅ Libera espacio en tu dispositivo

❌ html2pdf no cargó
   ✅ Presiona "Imprimir" para imprimir como PDF
   ✅ Guarda como PDF desde el diálogo de impresión
```

---

## 🔒 SEGURIDAD Y PRIVACIDAD

### Tu Información Está Protegida
```
✅ Encriptación de datos en tránsito (HTTPS)
✅ Encriptación de datos en reposo
✅ Row Level Security (RLS) en Supabase
✅ Cumplimiento HIPAA para datos sanitarios
✅ Backups automáticos diarios
✅ Logs de auditoría completos
```

### Remember Me
```
⚠️ IMPORTANTE:
- Solo usa en dispositivos personales
- NO uses en computadoras públicas
- Las credenciales se guardan localmente
- Puedes borrar en Settings → Seguridad
```

### Cerrar Sesión
```
1. Presiona el avatar en la esquina superior derecha
2. Selecciona "Cerrar Sesión"
3. Serás redirigido a la página de login
4. Las credenciales guardadas NO se borran
   (puedes borrarlas manualmente si quieres)
```

---

## 📞 SOPORTE

### Obtener Ayuda
```
📧 Email: support@healthlogix.com
💬 Chat en vivo: En la página principal
📞 Teléfono: +1 (555) 000-0000
🌐 Centro de ayuda: help.healthlogix.com
📚 Documentación: docs.healthlogix.com
```

### Reportar un Problema
```
1. Ve a Configuración → Soporte
2. Presiona "Reportar Problema"
3. Describe el problema
4. Adjunta screenshots si es necesario
5. Nuestro equipo responderá en 24 horas
```

---

## 🎓 CAPACITACIÓN

### Videos de Capacitación
```
Disponibles en: https://healthlogix.com/training

Temas:
✅ Primeros pasos
✅ Gestión de activos
✅ Creación de facturas
✅ Análisis de datos
✅ Mejores prácticas
```

### Webinars
```
📅 Cada jueves a las 2 PM (EST)
📹 Duración: 1 hora
🔗 Registrate en: https://healthlogix.com/webinar
📊 Tema cada semana diferente
```

---

## ✅ CHECKLIST DE CONFIGURACIÓN INICIAL

```
Primera Vez:
☐ Crear cuenta (Google o Email)
☐ Completar perfil
☐ Verificar información de organización
☐ Explorar el dashboard
☐ Crear primer activo
☐ Crear primera orden
☐ Generar primera factura

Configuración:
☐ Foto de perfil
☐ Cambiar contraseña
☐ Agregar usuarios/empleados
☐ Configurar permisos
☐ Agregar ubicaciones
☐ Configurar horarios

Operación:
☐ Comenzar a registrar datos
☐ Seguimiento de activos
☐ Gestión de facturas
☐ Análisis de reportes
☐ Optimización de procesos
```

---

## 🎉 ¡ESTÁS LISTO!

Ya tienes todo lo que necesitas para:
- ✅ Iniciar sesión
- ✅ Gestionar tu organización
- ✅ Crear facturas profesionales
- ✅ Seguimiento de activos y órdenes
- ✅ Análisis en tiempo real

**¡Bienvenido a HealthLogix OS!** 🚀

Para más información, visita: https://healthlogix.com
