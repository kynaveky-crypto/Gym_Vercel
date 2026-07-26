# GYM

App personal para controlar tu tabla de ejercicios y su evolución.

## Cómo publicarla (paso a paso)

### 1. Sube este código a GitHub
1. Entra en https://github.com/new y crea un repositorio nuevo (por ejemplo `gym-app`). Puede ser privado.
2. En la página del repositorio recién creado, pulsa "uploading an existing file".
3. Arrastra aquí **todos los archivos y carpetas** de este proyecto (menos `node_modules`, que no existe todavía) y confirma la subida ("Commit changes").

### 2. Importa el proyecto en Vercel
1. Entra en https://vercel.com/new
2. Elige el repositorio que acabas de crear.
3. Pulsa "Deploy". Vercel detectará que es un proyecto Vite automáticamente.

### 3. Añade el almacenamiento (para que tus datos no se pierdan nunca)
1. En el panel de tu proyecto en Vercel, ve a la pestaña "Storage".
2. Pulsa "Create Database" → elige "KV" (o "Redis").
3. Conéctala a tu proyecto cuando te lo pida (esto añade las variables de conexión automáticamente).

### 4. Añade tu clave de API de Anthropic (para que se sigan dibujando los bocetos)
1. Consigue una clave en https://console.anthropic.com/settings/keys (necesita facturación activada).
2. En tu proyecto de Vercel, ve a "Settings" → "Environment Variables".
3. Añade una variable: nombre `ANTHROPIC_API_KEY`, valor tu clave.
4. Guarda y vuelve a desplegar el proyecto (Vercel te lo pedirá o hay un botón "Redeploy").

### 5. Instalar el icono en tu móvil
1. Abre la URL que te ha dado Vercel (algo como `gym-app.vercel.app`) en Chrome de tu Android.
2. Menú (⋮) → "Añadir a pantalla de inicio".

Listo — tendrás tu icono "GYM" y tus datos guardados de forma segura en la nube.
