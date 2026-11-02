# SimulaFuturo · Guía paso a paso para publicarlo en tu dominio

Al terminar tendrás:

- SimulaFuturo funcionando en tu propio sitio.
- Las **evaluaciones** de los estudiantes llegando **solas** a una hoja de Google tuya, sin que nadie copie ni envíe códigos.
- Los **números de uso** (minutos, módulos, misiones) llegando solos, de forma anónima.
- El **Panel docente** mostrando todo con tu clave.

Tiempo aproximado: 20 minutos. No necesitas saber programar.

## Contenido de esta carpeta

| Archivo | Para qué |
|---|---|
| `index.html` | El simulador completo. |
| `config.js` | Aquí pegas la dirección de tu hoja (paso 2). Es el único archivo que editas. |
| `api/explorar.js` | Asistente de IA. Solo funciona con la clave propia de cada estudiante; el simulador no tiene créditos de IA. |
| `google-apps-script/Codigo.gs` | Código para tu hoja de Google (paso 1). |

---

## Paso 1. Crea tu hoja de resultados (10 min)

1. Entra a <https://sheets.google.com> con tu cuenta de Google y crea una hoja en blanco. Ponle de nombre **SimulaFuturo – Resultados**.
2. En el menú, ve a **Extensiones → Apps Script**. Se abre una pestaña nueva con un editor.
3. Borra todo lo que aparece en el editor y pega el contenido completo de `google-apps-script/Codigo.gs`.
4. Busca esta línea, cerca del inicio:
   ```
   const CLAVE_DOCENTE = 'CAMBIA-ESTA-CLAVE';
   ```
   Cambia `CAMBIA-ESTA-CLAVE` por una clave tuya de al menos 12 caracteres, por ejemplo `Orientacion-Grado11-2026`. **No la compartas con estudiantes**: es la que abre el Panel docente.
5. Pulsa el ícono de guardar 💾.
6. Arriba a la derecha, pulsa **Implementar → Nueva implementación**.
7. En el engranaje ⚙️ junto a «Seleccionar tipo», elige **Aplicación web** y configura:
   - **Descripción:** SimulaFuturo
   - **Ejecutar como:** Yo (tu correo)
   - **Quién tiene acceso:** **Cualquier usuario**. Es necesario para que los estudiantes envíen sin iniciar sesión. Solo pueden *enviar* datos; para *leerlos* hace falta tu clave.
8. Pulsa **Implementar** y luego **Autorizar acceso**. Elige tu cuenta. Si aparece «Google no verificó esta app», pulsa **Configuración avanzada → Ir a SimulaFuturo (no seguro)** → **Permitir**. Es tu propio script y solo usa tu hoja.
9. Copia la **URL de la aplicación web**. Termina en `/exec` y se ve así:
   `https://script.google.com/macros/s/AKfy…/exec`

✅ **Comprobación:** pega esa URL en el navegador y agrégale al final `?action=ping`. Debe aparecer `{"ok":true,"servicio":"SimulaFuturo"}`.

## Paso 2. Conecta el simulador con tu hoja (1 min)

Abre `config.js` con el Bloc de notas (o cualquier editor de texto) y pega tu URL entre las comillas:

```js
window.SIMULAFUTURO_CONFIG = {
  resultsUrl: 'https://script.google.com/macros/s/AKfy…/exec'
};
```

Guarda el archivo.

## Paso 3. Publica el sitio en Vercel (8 min)

1. Crea una cuenta gratuita en <https://github.com> y otra en <https://vercel.com>. Puedes entrar a Vercel con tu cuenta de GitHub.
2. En GitHub: **New repository** → nombre `simulafuturo` → **Create repository**.
3. En el repositorio nuevo, pulsa **uploading an existing file**. Arrastra **todo el contenido** de esta carpeta: `index.html`, `config.js` y las carpetas `api` y `google-apps-script`. Luego pulsa **Commit changes**.
4. En Vercel: **Add New… → Project** → busca `simulafuturo` → **Import** → **Deploy**. No agregues ninguna variable de entorno con claves de IA.
5. En **Settings → Domains**, escribe tu dominio (por ejemplo `simulafuturo.co`). Copia los registros DNS que Vercel te muestre en el panel de tu proveedor de dominio. Pueden tardar algunas horas en activarse.
6. Opcional y recomendado: en **Settings → Environment Variables**, agrega `ALLOWED_ORIGIN` con tu dominio exacto (`https://simulafuturo.co`) y vuelve a desplegar.

## Paso 4. Prueba que todo llega (2 min)

1. Abre tu sitio en el celular, entra a **Evaluar el simulador** (en el pie de página), respóndela y pulsa **Terminar y enviar (anónimo)**. Debe aparecer «Listo: tu evaluación llegó a tu docente».
2. Abre tu hoja de Google: en la pestaña **Respuestas** aparece una fila nueva.
3. En el simulador, abre **Panel docente** (pie de página), escribe tu clave docente y pulsa **Cargar resultados**.

¡Listo! Comparte con tus estudiantes el enlace de tu dominio.

---

## Preguntas frecuentes

**¿Qué datos llegan a la hoja?**
Una fila por dispositivo, con un identificador anónimo al azar: tipo de dispositivo, visitas, minutos de uso activo, módulos visitados, pasos de las misiones, cantidad de decisiones, metas y profesiones exploradas, y, si el estudiante evaluó, sus 22 respuestas y comentarios opcionales. **Nunca** llegan nombres, correos, contraseñas, claves de IA ni lo que el estudiante escribe en sus actividades. En los comentarios de la evaluación se borran correos y teléfonos.

**¿Un estudiante puede no compartir sus números de uso?**
Sí. En **Tus datos y privacidad** puede desactivarlo. Su evaluación solo se envía cuando él la termina.

**Si un estudiante usa el simulador varias veces, ¿se duplica?**
No. Su fila se actualiza; no se crean filas nuevas.

**Cambié algo en el script. ¿Cómo lo actualizo sin cambiar la URL?**
En Apps Script: **Implementar → Gestionar implementaciones** → lápiz ✏️ → **Versión: Nueva versión** → **Implementar**. La URL sigue igual.

**¿Esto cuesta?**
No. Google Sheets, Apps Script, GitHub y el plan gratuito de Vercel son suficientes para el uso escolar. La IA solo funciona con la clave propia de cada estudiante y nunca con créditos del simulador.

**¿Y el enlace de claude.ai?**
Sigue funcionando, pero ahí la evaluación no puede enviarse sola: el estudiante recibe un código. Para que todo llegue automáticamente, usa tu dominio.
