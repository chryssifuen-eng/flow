# documentos-flow

Gestión de archivos con control de roles, recordatorios, notificaciones, y dashboard para administradores.

## Tecnologías principales

- React (Vite) + TypeScript + TailwindCSS
- Firebase Authentication + Firestore
- Supabase Storage
- Notificaciones por email (SMTP Gmail) y Push (Firebase Cloud Messaging)
- Despliegue recomendado: Netlify o Vercel

## Instalación

1. Clona el repositorio.
2. Copia `.env.example` a `.env.local` y coloca tus claves.
3. Instala dependencias:
    ```bash
    npm install
    ```
4. Corre el proyecto en desarrollo:
    ```bash
    npm run dev
    ```

## Variables de entorno

Configura tus credenciales en `.env.local` basándote en `.env.example`.

## Funcionalidades principales

- Registro/login seguro con datos de empleado.
- Subida y consulta de archivos (imágenes, videos, documentos).
- Dashboard para administradores: control de archivos, recordatorios, métricas.
- Notificaciones automáticas por email y push.
- Visualización y descarga de archivos en tiempo real.

## Despliegue

Listo para ser desplegado en Netlify, Vercel, o cualquier hosting estático moderno.

## Notas para Netlify

- Configura variables de entorno en el panel de Netlify según `.env.example`.
- El archivo `public/_redirects` asegura el funcionamiento de rutas en aplicaciones SPA.
- Las funciones serverless están en `/netlify/functions/`."# materia-rodante" 
