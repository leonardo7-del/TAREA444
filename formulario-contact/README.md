# Módulo de Contacto - Frontend

Este proyecto implementa un formulario de contacto robusto con validación, manejo de errores, reintentos, cola offline e idempotencia, todo simulado en el frontend.

## Características

- ✅ Validación declarativa con Zod
- ✅ UX de formularios con estados, errores y accesibilidad
- ✅ Integración con API mock (MSW)
- ✅ Estrategias de resiliencia: retry con backoff, idempotency key
- ✅ Offline-first: cola de envíos cuando no hay red
- ✅ Observabilidad en cliente: métricas de latencia, éxito y errores

## Instalación

```bash
# Instalar dependencias
npm install
```

## Ejecución

```bash
# Modo desarrollo
npm run dev

# Construir para producción
npm run build
```

## Estructura del Proyecto

```
src/
 ├─ api/
 │   └─ contactApi.ts     # Cliente API con retry, backoff e idempotencia
 ├─ pages/
 │   └─ Contact.tsx       # Página de formulario de contacto
 ├─ components/
 │   ├─ TextField.tsx     # Componente de campo de texto
 │   ├─ TextArea.tsx      # Componente de área de texto con contador
 │   └─ StatsPanel.tsx    # Panel de estadísticas
 └─ mocks/                # Configuración de MSW
     ├─ handlers.ts       # Manejadores de peticiones mock
     └─ browser.ts        # Configuración del worker
```

## Configuración del Mock API

El proyecto utiliza MSW para simular la API. Para desactivarlo y conectar a una API real:

1. Edita `src/main.tsx` y comenta el bloque de inicialización de MSW
2. Modifica la URL base en `src/api/contactApi.ts` para apuntar a tu API real