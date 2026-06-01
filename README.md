# Oxigeno - Healthcare Logistics Operating System

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-fzwwlqy8)

Enterprise-grade multi-tenant operating system designed for healthcare logistics, medical asset management, and oxygen cylinder supply tracking.

---

## 🚀 Sistema de Evidencia Fotográfica y Control de Espacio

Hemos implementado un sistema robusto de evidencia física y fotográfica para el control de los activos (cilindros de oxígeno, concentradores, etc.) enfocado en optimizar el almacenamiento de la base de datos y asegurar la inmutabilidad de los registros.

### 1. Compresión de Imágenes en el Cliente
Para evitar saturar la base de datos con archivos pesados de cámaras móviles (normalmente entre 2MB y 6MB por foto), añadimos un módulo de compresión de imágenes basado en la API de Canvas del navegador:
* **Archivo de utilidad**: `src/lib/imageCompression.ts`
* **Funcionamiento**: Redimensiona proporcionalmente la imagen a una resolución máxima optimizada (máx. 600px de ancho/alto) y reduce su calidad de compresión a un formato JPEG del 60%.
* **Impacto**: Cada imagen de evidencia pasa de pesar megabytes a solo **20KB - 50KB** en formato base64, listos para almacenarse directamente en la base de datos de manera súper fluida y económica.

### 2. CRUD de Evidencia Fotográfica (Historial de Activos)
En la sección de detalles de cada activo (`AssetsPage.tsx`), los operadores e inspectores tienen un panel interactivo llamado **Evidencia Fotográfica de Cilindros / Activos**:
* **Crear**: Subir una foto del estado actual del cilindro (inspección física, daños, estado de la válvula).
* **Leer**: Ver la galería histórica con la marca temporal (fecha y hora exacta en español).
* **Actualizar (Reemplazar)**: Permite subir una nueva imagen para corregir la evidencia anterior en caso de error.
* **Eliminar**: Borrar una foto cargada incorrectamente.

### 3. Regla de Seguridad de 10 Minutos (Inmutabilidad de Registros)
Para cumplir con los estándares de trazabilidad sanitaria y evitar la manipulación de pruebas o registros históricos, implementamos una regla de bloqueo temporal de 10 minutos:
* **Período de Gracia (Menos de 10 min)**: Si una foto fue subida hace menos de 10 minutos, los operadores pueden **Reemplazar** o **Eliminar** la foto si cometieron un error de carga.
* **Registro Permanente (Más de 10 min)**: Transcurridos los 10 minutos, los botones de acción desaparecen en el frontend y se despliega el indicador de **🔒 Registro Permanente**. La foto queda registrada en el historial del activo de forma **inmodificable y permanente**.

---

## 🗄️ Migración de Base de Datos (Supabase SQL)

El esquema de base de datos necesario para soportar todo el sistema de logística de Oxígeno (instalaciones, cilindros, pedidos, conductores, incidencias, contratos y flujos) ha sido compilado secuencialmente en un único archivo SQL:

* **Ruta del esquema**: `supabase/unified_schema.sql`

Este archivo contiene el orden de migración exacto (`001` al `006`), incluyendo las tablas, los índices de velocidad de búsqueda, y las directivas de seguridad a nivel de fila (RLS).

### Pasos para migrar a Supabase:
1. Ve al panel de control de tu proyecto en **Supabase**.
2. Dirígete a la sección de **SQL Editor** y haz clic en **New Query**.
3. Copia el contenido de [unified_schema.sql](file:///media/andres/github/Oxigen/Oxigeno/supabase/unified_schema.sql) y pégalo allí.
4. Presiona el botón **Run** para desplegar todas las tablas y políticas.
