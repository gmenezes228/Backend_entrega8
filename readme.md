# Backend de E-commerce 🚀

Este proyecto es una API para manejar un sistema de e-commerce que incluye funcionalidades de autenticación, carritos de compra, gestión de productos, comentarios y más.

## Tabla de Contenidos

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso](#uso)
- [Rutas Disponibles](#rutas-disponibles)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Mejoras Futuras](#mejoras-futuras)

---

## Requisitos

Asegúrate de tener instalados los siguientes programas:

- [Node.js](https://nodejs.org) 
- [MariaDB](https://mariadb.org/)

## Instalación

1. Clona este repositorio:
    ```bash
    git clone https://github.com/PaulinaBach/entrega8backend.git
    cd entrega8backend
    ```

2. Instala las dependencias:
    ```bash
    npm install
    ```

3. Configura la base de datos:
    - Ejecutar script de generacion de base de datos ecommerce.sql.
    - Realizar conexion con la base de datos en archivo db.js debes modificar la contraseña.


## Uso

1. Inicia el servidor:
    ```bash
    node app.js
    ```

2. Accede al servidor desde tu navegador o cliente de API en [http://localhost:3000](http://localhost:3000).

## Rutas Disponibles

### Autenticación
- `POST /login`: Genera un token JWT para un usuario autenticado.

### Carrito de Compras
- `POST /cart`: Agrega productos al carrito del usuario autenticado.
- `GET /user_cart`: Obtiene los datos del carrito de un usuario específico.

### Productos
- `GET /products`: Obtiene todos los productos disponibles.
- `GET /products/:id`: Obtiene la información de un producto específico por su ID.
- `GET /products_comments/:productId`: Obtiene los comentarios asociados a un producto.

### Categorías
- `GET /cats`: Lista todas las categorías.
- `GET /cats_products/:id.json`: Lista los productos de una categoría específica.

### Pruebas
- `GET /protected`: Ruta protegida para verificar autenticación.

---

## Tecnologías Utilizadas

- **Backend**: Node.js + Express.js
- **Base de Datos**: MariaDB
- **Autenticación**: JWT (JSON Web Tokens)
- **Manejo de Archivos**: Módulos `fs` y `path` de Node.js
- **Contraseñas**: Bcrypt.js para cifrado
- **CORS**: Para permitir solicitudes desde otros orígenes

---


## Autor

**[Gabriela Menezes]**   
[gmenezes.228@gmail.com]

---
