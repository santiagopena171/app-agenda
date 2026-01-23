# App Agenda - Sistema de Agendamiento de Turnos

Sistema de agendamiento de turnos simple y eficiente para pequeños y medianos negocios, sin pagos ni comisiones.

## Características Principales

- ✅ **Confirmación automática** de turnos
- 👤 **Sin registro para clientes** - experiencia sin fricción
- 🔐 **Control total del dueño** sobre la agenda
- 🚫 **Sistema de cola FIFO** - evita colisiones de reservas
- 📱 **Notificaciones automáticas** vía Telegram
- ⏰ **Gestión de asistencias** y clientes problemáticos
- 🌐 **Link público único** por negocio

## Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Backend**: Firebase (Auth, Firestore, Functions)
- **Hosting**: Vercel (Frontend) + Firebase Hosting (opcional)
- **Notificaciones**: Telegram Bot API
- **Zona horaria**: Uruguay (UTC-3)

## Estructura del Proyecto

```
app-agenda/
├── frontend/              # Aplicación Next.js
│   ├── app/
│   │   ├── page.tsx      # Página principal
│   │   ├── auth/         # Autenticación
│   │   ├── dashboard/    # Panel del dueño
│   │   └── book/         # Página pública de reservas
│   └── lib/
│       ├── firebase.ts   # Configuración Firebase
│       └── types.ts      # Tipos TypeScript
│
├── functions/            # Cloud Functions
│   └── src/
│       ├── config/       # Configuración
│       ├── services/     # Lógica de negocio
│       └── index.ts      # Exportación de funciones
│
├── firestore/
│   ├── firestore.rules   # Reglas de seguridad
│   └── firestore.indexes.json
│
├── firebase.json         # Configuración Firebase
├── .firebaserc          # Proyecto Firebase
└── .env.example         # Variables de entorno

```

## Requisitos Previos

- Node.js 18+
- Cuenta de Firebase
- Bot de Telegram (crear con @BotFather)

## Instalación

### 1. Clonar y configurar dependencias

```bash
# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias del frontend
cd frontend
npm install

# Instalar dependencias de functions
cd ../functions
npm install
cd ..
```

### 2. Configurar Firebase

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Authentication (Email/Password)
3. Crear base de datos Firestore
4. Obtener credenciales del proyecto

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Iniciar sesión
firebase login

# Configurar proyecto
firebase use --add
```

### 3. Configurar variables de entorno

Copiar `.env.example` a `.env` en la carpeta `frontend/`:

```bash
cp .env.example frontend/.env.local
```

Editar `frontend/.env.local` con tus credenciales:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configurar Bot de Telegram

1. Crear bot con @BotFather en Telegram
2. Obtener token del bot
3. Configurar webhook para Cloud Function:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/telegramWebhook"
```

4. Configurar variable de entorno en Firebase Functions:

```bash
firebase functions:config:set telegram.bot_token="TU_TOKEN_AQUI"
```

### 5. Desplegar Firestore Rules e Indexes

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 6. Desplegar Cloud Functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

## Desarrollo Local

### Frontend (Next.js)

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Functions (Emulator)

```bash
cd functions
npm run serve
```

## Deployment

### Frontend en Vercel

1. Conectar repositorio en [Vercel](https://vercel.com)
2. Configurar variables de entorno
3. Deploy automático desde Git

### Functions en Firebase

```bash
firebase deploy --only functions
```

### Todo junto

```bash
npm run deploy
```

## Uso

### Para el Dueño del Local

1. Registrarse en `/auth/login`
2. Configurar servicios en `/dashboard/services`
3. Definir disponibilidad horaria en `/dashboard/availability`
4. Vincular bot de Telegram (obtener chat ID con `/start`)
5. Compartir link público: `https://tu-app.com/book/tu-slug`

### Para Clientes

1. Acceder al link público del local
2. Esperar turno en cola (si hay otros clientes)
3. Seleccionar servicio
4. Elegir fecha y hora
5. Ingresar nombre y teléfono
6. Confirmar reserva (inmediata)

## Arquitectura

### Modelo de Datos (Firestore)

- **users**: Información de locales
- **services**: Servicios por local
- **availability**: Horarios disponibles
- **exceptions**: Días bloqueados
- **appointments**: Turnos reservados
- **queues**: Cola FIFO por local
- **problemClients**: Clientes con no asistencias
- **history**: Historial mensual

### Cloud Functions

**Callable Functions:**
- `joinQueueFunc`: Ingresar a cola
- `updateActivityFunc`: Heartbeat de cliente
- `removeFromQueueFunc`: Salir de cola
- `getAvailableSlotsFunc`: Obtener horarios disponibles
- `createAppointmentFunc`: Crear turno
- `cancelAppointmentFunc`: Cancelar turno

**Scheduled Functions:**
- `sendRemindersScheduled`: Recordatorios (cada 5 min)
- `requestAttendanceScheduled`: Confirmación asistencia (cada 2 min)
- `expireAppointmentsScheduled`: Expirar turnos (cada 10 min)
- `cleanupQueueScheduled`: Limpiar cola (cada 2 min)

**HTTP Functions:**
- `telegramWebhook`: Recibir callbacks de Telegram

### Sistema de Cola FIFO

- Máximo 20 clientes por local
- Timeout de 10 minutos de inactividad
- Solo el cliente en posición 1 puede reservar
- Heartbeat cada 30 segundos
- Reposicionamiento automático

## Seguridad

### Firestore Rules

- Clientes no autenticados solo pueden leer datos públicos
- Dueños solo acceden a sus propios datos
- Escritura de turnos solo por Cloud Functions
- Cola de clientes manejada por Functions

### Validaciones

- Nombre: 2-50 caracteres
- Teléfono: 8-15 dígitos
- Límite de 3 turnos futuros por cliente
- Máximo 1 turno por día por cliente
- Verificación de disponibilidad en tiempo real

## Notificaciones Telegram

**Eventos:**
- Nueva reserva
- Recordatorio 1 hora antes
- Solicitud de confirmación de asistencia
- Respuesta de asistencia (botones inline)

## Mantenimiento

### Logs

```bash
# Ver logs de functions
firebase functions:log

# Ver logs de función específica
firebase functions:log --only createAppointmentFunc
```

### Monitoreo

- Firebase Console > Functions (métricas)
- Firebase Console > Firestore (uso)
- Firebase Console > Authentication (usuarios)

## Troubleshooting

### Error: "Queue is full"
- Ajustar `MAX_QUEUE_SIZE` en `queueService.ts`

### Error: "This time slot is no longer available"
- Otro cliente reservó primero (comportamiento esperado)
- Mostrar slots actualizados

### Telegram no envía notificaciones
- Verificar token del bot
- Confirmar webhook configurado
- Revisar chat ID del usuario

### Functions timeout
- Aumentar memory/timeout en `index.ts`
- Optimizar queries de Firestore

## Próximas Mejoras

- [ ] Dashboard con estadísticas
- [ ] Gestión de múltiples locales por usuario
- [ ] Exportar reportes (PDF/CSV)
- [ ] WhatsApp como alternativa a Telegram
- [ ] App móvil nativa
- [ ] Integración con Google Calendar

## Licencia

MIT

## Soporte

Para consultas y soporte:
- Issues: GitHub Issues
- Email: soporte@app-agenda.com

---

**Desarrollado con ❤️ para pequeños y medianos negocios**
