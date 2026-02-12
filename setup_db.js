const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function iniciarBaseDeDatos() {
    // Esto crea el archivo 'negocio.db' en tu carpeta
    const db = await open({
        filename: './negocio.db',
        driver: sqlite3.Database
    });

    // Creamos las tablas para Usuarios y sus Billeteras
    await db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY,
            nombre TEXT,
            patrocinador_id INTEGER
        );

        CREATE TABLE IF NOT EXISTS billeteras (
            usuario_id INTEGER PRIMARY KEY,
            saldo DECIMAL(10,2) DEFAULT 0
        );
    `);

    // Te registramos a ti como el primer usuario si no existes
    await db.run('INSERT OR IGNORE INTO usuarios (id, nombre, patrocinador_id) VALUES (1, "Ulises", NULL)');
    await db.run('INSERT OR IGNORE INTO billeteras (usuario_id, saldo) VALUES (1, 0)');

    console.log("-----------------------------------------");
    console.log("✅ ¡Base de datos creada exitosamente!");
    console.log("Ahora tienes un archivo llamado 'negocio.db'");
    console.log("-----------------------------------------");
}

iniciarBaseDeDatos();