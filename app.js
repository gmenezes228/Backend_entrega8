const express = require('express');  // Importa el módulo Express, framework para manejar las rutas y solicitudes HTTP
const fs = require('fs');            // Importa el módulo fs, para interactuar con el sistema de archivos
const path = require('path');        // Importa el módulo path, para manejar rutas de archivos de manera más segura
const cors = require('cors');        // Importa el módulo CORS, para habilitar peticiones desde otros dominios
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000; // Puerto donde se ejecutará el servidor
const JWT_SECRET = 'secreto_super_seguro'; // Clave secreta para firmar los tokens JWT
const TOKEN_EXPIRATION = '30s'; // Tiempo de expiración del token JWT

const pool = require('./db'); //Se importa conexion a MariaDB 
const bodyParser = require('body-parser');

// Middleware para analizar el cuerpo de la solicitud como JSON
app.use(bodyParser.json());


// Middleware para verificar y autenticar el token JWT
const authenticateToken = (req, res, next) => {
    // Obtener el token del encabezado de autorización
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Separa el formato "Bearer TOKEN"

    // Log para verificar si el token está siendo recibido
    console.log('Token recibido:', token);

    // Si no hay token, rechaza la solicitud
    if (!token) {

        console.log('No se proporcionó un token'); // Mensaje para depurar

        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    // Verificar el token usando la clave secreta
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {

            // Log para depurar en caso de error
            console.log('Error al verificar el token:', err.message);

            // Si el token es inválido o ha expirado
            return res.status(403).json({ message: 'Token inválido o expirado' });
        }

        // Log para verificar si el usuario fue autenticado correctamente
        console.log('Usuario autenticado:', user);


        // Adjunta el usuario al objeto de la solicitud y pasa al siguiente middleware
        req.user = user;
        next();
    });
};

// Endpoint POST para agregar productos al carrito de un usuario
app.post('/cart', authenticateToken, async (req, res) => {
    const { user, articles, shipping, payment } = req.body;

    console.log(req.body)

    // Verificamos si el carrito del usuario ya existe
    if (!user || !articles || articles.length === 0) {
        return res.status(400).json({ message: "El cuerpo de la solicitud es inválido" });
    }


    const connection = await pool.getConnection();

    try {
        // Iniciar una transacción
        await connection.beginTransaction();
        const [rows] = await pool.query('SELECT id FROM usuarios WHERE USER="' + user + '"');
        console.log(rows)
        const userId = parseInt(rows[0].id, 10);  // Asegúrate de convertir a número entero
        console.log(userId)
        // Creamos el carrito
        const { formaPago } = payment;
        const [newCartResult] = await connection.execute('INSERT INTO user_cart (user_id, payment) VALUES (?, ?)', [userId, formaPago]);
        let cartId = newCartResult.insertId;


        // Procesar los artículos del carrito
        for (const article of articles) {
            const { id, count, unitCost, currency } = article;


            // Si el producto no está, lo agregamos al carrito
            await connection.execute('INSERT INTO cart_items (cart_id, product_id, count, unit_cost, currency) VALUES (?, ?, ?, ?, ?)', [cartId, id, count, unitCost, currency]);

        }

        // Agrego datos del envio
        const { tipoEnvio, departamento, localidad, calle, numeroPuerta, esquina } = shipping;
        await connection.execute('INSERT INTO shipping (cart_id, tipoEnvio, departamento, localidad, calle, numeroPuerta, esquina) VALUES (?, ?, ?, ?, ?, ?, ?)', [cartId, tipoEnvio, departamento, localidad, calle, numeroPuerta, esquina]);

        // Confirmar la transacción
        await connection.commit();

        // Responder con el carrito actualizado
        res.status(200).json({
            message: "Producto(s) agregado(s) al carrito exitosamente"
        });
    } catch (error) {
        // Si hay algún error, hacer rollback de la transacción
        console.log(error)

        await connection.rollback();
        res.status(500).json({ message: "Error al agregar productos al carrito", error: error.message });
    } finally {
        // Liberar la conexión
        connection.release();
    }


});


//Se verifica la conexion
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Conexión a MariaDB exitosa');
        connection.release(); // Libera la conexión
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    }
})();

// Endpoint para obtener todos los usuarios
app.get('/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM usuarios');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});


// Configuración de CORS (permite solicitudes desde otros dominios) y para parsear JSON
app.use(cors());
app.use(express.json());

// Simulación de base de datos con contraseñas cifradas
// Nota: En un entorno real, debes usar una base de datos real y no almacenar contraseñas en texto plano
const users = [
    {
        id: 1,
        username: 'user@example.com',
        password: bcrypt.hashSync('contrasena123', 10) // Contraseña cifrada con bcrypt
    }
];


// Ruta de inicio de sesión (login)
// Verifica las credenciales del usuario y genera un token JWT
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Buscar el usuario en la base de datos simulada
    const user = users.find(u => u.username === username);
    if (!user) {
        // Si el usuario no existe
        return res.status(401).json({ message: 'Usuario incorrecto' });
    }

    // Verificar la contraseña usando bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        // Si la contraseña no coincide
        return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generar un token JWT con datos del usuario
    const token = jwt.sign(
        { username: user.username },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRATION }
    );

    // Devolver el token al cliente
    res.json({ token });
});

// Ruta protegida de prueba
// Solo accesible si el token JWT es válido
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: `¡Hola! Acceso autorizado.` });
});

// Ruta principal
app.get('/', (req, res) => {
    res.send('Bienvenido terrícola');
});

// Carga de archivos JSON para otras rutas
const cats = require('./api/cats/cat.json');
const cart = require('./api/cart/buy.json');
const sell = require('./api/sell/publish.json');
const user_cart = require('./api/user_cart/25801.json');

// Ruta para obtener categorías
app.get('/cats', (req, res) => res.json(cats));


// Ruta para obtener los productos en venta
app.get('/sell', (req, res) => res.json(sell));

// Ruta para obtener el carrito de un usuario específico
app.get('/user_cart', (req, res) => res.json(user_cart));

// Ruta para obtener todos los productos
app.get('/products', (req, res) => {
    const productosDir = path.join(__dirname, 'api/products');
    const productos = [];

    // Leer la carpeta donde se almacenan los productos
    fs.readdir(productosDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error al leer los productos' });
        }

        // Filtrar y cargar solo los archivos JSON
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        jsonFiles.forEach(file => {
            const filePath = path.join(productosDir, file);
            const producto = require(filePath);
            productos.push(producto);
        });

        // Devolver todos los productos
        res.json(productos);
    });
});

// Ruta para obtener un producto específico por su ID
app.get('/products/:id', (req, res) => {
    const productId = req.params.id;
    const filePath = path.join(__dirname, 'api/products', `${productId}.json`);

    // Verificar si el archivo del producto existe
    fs.access(filePath, fs.constants.F_OK, err => {
        if (err) {
            return res.status(404).json({ error: `Producto con ID ${productId} no encontrado` });
        }

        // Leer el archivo y devolver su contenido
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ error: 'Error al leer el archivo' });
            }

            res.type('application/json').send(data);
        });
    });
});

// Ruta para obtener los comentarios de un producto por su ID
app.get('/products_comments/:productId', (req, res) => {
    const productId = req.params.productId;
    const filePath = path.join(__dirname, 'api/products_comments', `${productId}.json`);

    // Verificar si el archivo de comentarios existe
    fs.access(filePath, fs.constants.F_OK, err => {
        if (err) {
            return res.status(404).json({
                success: false,
                message: `No se encontraron comentarios para el producto con ID: ${productId}`
            });
        }

        // Leer el archivo y devolver los comentarios
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Error al leer el archivo de comentarios',
                });
            }

            try {
                const jsonData = JSON.parse(data);
                res.json({
                    success: true,
                    comments: jsonData.length ? jsonData : [],
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'El archivo de comentarios contiene datos inválidos',
                });
            }
        });
    });
});

// Ruta para obtener productos por categoría (ID de categoría)
app.get('/cats_products/:id.json', (req, res) => {
    const id = req.params.id;
    const filePath = path.join(__dirname, 'api/cats_products', `${id}.json`);

    // Verificar si el archivo de la categoría existe
    fs.access(filePath, fs.constants.F_OK, err => {
        if (err) {
            return res.status(404).json({ error: `Archivo ${id}.json no encontrado` });
        }

        // Leer el archivo y devolver los datos
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ error: 'Error al leer el archivo' });
            }

            res.type('application/json').send(data);
        });
    });
});


// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});