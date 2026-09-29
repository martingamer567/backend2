# Proyecto Eventos - API REST

API REST para una plataforma de gestión de eventos y sesiones. Permite administrar eventos y las sesiones asociadas a cada uno (charlas, talleres, etc.), junto con los usuarios que participan de la plataforma.

**Temática elegida:** Plataforma de eventos (events & sessions).

Este repositorio corresponde a la **Pre-entrega 1**: estructura base del servidor Express organizada por capas, lista para escalar en las próximas entregas (persistencia en MongoDB, autenticación, lógica de negocio, etc.).

## Tecnologías

- Node.js
- Express
- dotenv
- Módulos ES (ESM)

## Instalación

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/martingamer567/backend2
   
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

## Configuración de variables de entorno

Crear un archivo `.env` en la raíz del proyecto a partir de `.env.example`:

```bash
cp .env.example .env
```

## Cómo ejecutar

Modo desarrollo (con recarga automática ante cambios):

```bash
npm run dev
```

Modo producción:

```bash
npm start
```
El servidor toma el puerto desde la variable de entorno `PORT` 


