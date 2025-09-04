const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const cron = require('node-cron'); // 👈 Importar cron correctamente

const bodyParser = require('body-parser');
const app = express();

// Middleware para analizar las solicitudes JSON
app.use(express.json());
app.use(cors());

//base de datos en internet 
// Configuración de la base de datos (Railway)
const db = mysql.createConnection({
  host: 'yamabiko.proxy.rlwy.net',    // Cambiado
  port: 20739,                        // Agregado
  user: 'root',                        // Cambiado
  password: 'rNIqEiNAfDFKKDGRVUTxnvgjyaqGfqjj', // Cambiado
  database: 'railway',                 // Cambiado
});


/*
// Configuración de la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'calculator',
});
*/
// Conexión a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});


///////////////////////////////////////////////////////////
//////////////////////////////////////////CLIENTES///////////////////////////////////////////////////////////////////////

//Cliente Cercano por usuario
// Ruta para obtener clientes por usuario logueado 
app.get('/api/clientes', (req, res) => {
  const { usuarioId } = req.query; // Obtener el usuarioId de los parámetros de la solicitud

  if (!usuarioId) {
    return res.status(400).json({ error: 'El ID del usuario es requerido' });
  }

  const query = `
    SELECT id_cliente, nombreCliente, direccionLatitud, direccionLongitud, trabajolatitud, trabajolongitud, foto, apellidoPaterno, apellidoMaterno 
    FROM clientes
    WHERE id_usuario = ? AND direccionLatitud IS NOT NULL AND direccionLongitud IS NOT NULL AND trabajolatitud IS NOT NULL AND trabajolongitud IS NOT NULL
  `;
console.log("este"),
  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error('Error al obtener clientes:', err);
      return res.status(500).json({ error: 'Error al consultar la base de datos' });
    }

    res.json(results); // Devuelve solo los clientes del usuario logueado
  });
});

//Ver Tarjeta














////////////////////////////////////////////////////////////
///////////////////LISTA CLAVOS ///////////////////////
// Obtener todos los clientes marcados como clavos
app.get('/clavos', (req, res) => {
  const query = `
    SELECT 
      c.id_cliente, 
      c.nombreCliente, 
      c.apellidoPaterno, 
      c.apellidoMaterno, 
      c.cedula,
      c.foto, 
      c.cedulaanverso, 
      c.cedulareverso, 
      cl.motivo, 
      cl.veces, 
      cl.fecha_clavo, 
      cl.comentario  -- Aquí se agrega el campo 'comentario'
    FROM clavos cl
    JOIN clientes c ON cl.id_cliente = c.id_cliente
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error obteniendo clavos:', err);
      res.status(500).json({ error: 'Error obteniendo los clavos.' });
    } else {
      res.json(results);
    }
  });
});

/////////////////////////VER COMEMTARIOS/////////////////////////////////
app.get('/clavos/:cedula', (req, res) => {
  const { cedula } = req.params;

  const query = `
    SELECT cl.*, 
           c.nombreCliente, 
           c.apellidoPaterno, 
           c.apellidoMaterno, 
           c.cedula, 
           c.foto, 
           c.cedulaanverso, 
           c.cedulareverso
    FROM clavos AS cl
    INNER JOIN clientes AS c ON cl.id_cliente = c.id_cliente
    WHERE c.cedula = ?
  `;

  db.promise().query(query, [cedula])
    .then(([clavos]) => {
      res.json(clavos);
    })
    .catch(error => {
      console.error('Error al obtener clavos:', error);
      res.status(500).json({ error: 'Error al obtener los clavos' });
    });
});




/////////////////////////////////////////////////////////
/////////////COMENTARIOS POR CI//////////////////////
app.get('/comentarios/:id_cliente', (req, res) => {
  const { id_cliente } = req.params;

  const query = 'SELECT * FROM comentarios WHERE id_cliente = ? ORDER BY fecha_clavo DESC';

  db.promise().query(query, [id_cliente])
    .then(([comentarios]) => {
      res.json(comentarios);
    })
    .catch(error => {
      console.error('Error al obtener comentarios:', error);
      res.status(500).json({ message: 'Error al obtener comentarios' });
    });
});
////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////










////////////////////////////CAJAS///////////////////////////////7

//calcular caja

/////////////////////VER USUARIOS////////////////////////////////////////

// Endpoint para obtener la lista de usuarios con días restantes
app.get('/api/usuarios', (req, res) => {
  const query = `
    SELECT 
      usuarios.id_usuario,
      usuarios.usuario,
      usuarios.contraseña,
      usuarios.fecha AS fecha_creacion,
      usuarios.fecha_vencimiento,
      usuarios.meses_pagados,
      usuarios.activo,
      usuarios.id_supervisor,
      rol.nombre AS nombre_rol,
      personas.nombre AS nombre_persona,
      personas.primerapellido AS primerapellido_persona,
      personas.segundoapellido AS segundoapellido_persona,
      personas.cedula AS cedula_persona,
      personas.celular AS celular_persona,
      DATEDIFF(usuarios.fecha_vencimiento, CURDATE()) AS dias_restantes,
      CONCAT(supervisores.nombre, ' ', supervisores.primerapellido, ' ', IFNULL(supervisores.segundoapellido, '')) AS nombre_supervisor -- Nombre del supervisor
    FROM 
      usuarios
    LEFT JOIN 
      rol ON usuarios.id_rol = rol.id_rol
    LEFT JOIN 
      personas ON usuarios.id_persona = personas.id_persona
    LEFT JOIN 
      personas AS supervisores ON usuarios.id_supervisor = supervisores.id_persona;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al consultar la tabla usuarios:', err);
      return res.status(500).json({ error: 'Error al obtener los usuarios.' });
    }

    // Retornar los resultados como JSON
    res.json(results);
  });
});



////////////////////BORRAR USUARIOS/////////////////////////////////////////
app.delete('/api/usuarios/:id', (req, res) => {
  const idUsuario = req.params.id;
  const query = 'DELETE FROM usuarios WHERE id_usuario = ?';

  db.query(query, [idUsuario], (err, results) => {
    if (err) {
      console.error('Error al eliminar usuario:', err);
      return res.status(500).json({ error: 'Error al eliminar el usuario.' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({ message: 'Usuario eliminado correctamente.' });
  });
});

////////////////////CREAR USUARIOS/////////////////////////////////////////
app.post('/api/crear_usuario', (req, res) => {
  const { cedula, nombre, primerapellido, segundoapellido, celular, foto, fecha, usuario, contraseña, activo, id_rol } = req.body;

  // Calcular fecha de vencimiento (1 mes después de la fecha actual)
  const fechaVencimiento = new Date();
  fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
  const fechaVencimientoFormatted = fechaVencimiento.toISOString().split('T')[0]; // Formato YYYY-MM-DD

  // Insertar persona
  const sqlPersona = `INSERT INTO personas (cedula, nombre, primerapellido, segundoapellido, celular, foto, fecha) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sqlPersona, [cedula, nombre, primerapellido, segundoapellido, celular, foto, fecha], (err, resultPersona) => {
    if (err) {
      console.error('Error al crear la persona:', err);
      return res.status(500).json({ error: 'Error al crear la persona' });
    }

    const idPersona = resultPersona.insertId;

    // Insertar usuario
    const sqlUsuario = `INSERT INTO usuarios (usuario, contraseña, fecha, fecha_vencimiento, activo, id_rol, id_persona) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(sqlUsuario, [usuario, contraseña, fecha, fechaVencimientoFormatted, activo, id_rol, idPersona], (err, resultUsuario) => {
      if (err) {
        console.error('Error al crear el usuario:', err);
        return res.status(500).json({ error: 'Error al crear el usuario' });
      }

      const idUsuario = resultUsuario.insertId;

      // Insertar caja
      const sqlCaja = `INSERT INTO caja (ultima_fecha_liquidada, caja_ultima_liquidada, caja_actual, estimado_cobrar, total_cobrado, liquidada_total, cobro_dia, total_ventas, gastos, id_usuario) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      db.query(sqlCaja, [
        new Date(), // ultima_fecha_liquidada
        0.00, // caja_ultima_liquidada
        0.00, // caja_actual
        0.00, // estimado_cobrar
        0.00, // total_cobrado
        0.00, // liquidada_total
        0.00, // cobro_dia
        0.00, // total_ventas
        0.00, // gastos
        idUsuario  // id_usuario
      ], (errCaja, resultCaja) => {
        if (errCaja) {
          console.error('Error al crear la caja:', errCaja);
          return res.status(500).json({ error: 'Error al crear la caja' });
        }

        // Responder con los ids creados
        res.status(201).json({
          id_persona: idPersona,
          id_usuario: idUsuario,
          id_caja: resultCaja.insertId,
          fecha_vencimiento: fechaVencimientoFormatted // Devolver la fecha de vencimiento
        });
      });
    });
  });
});

/////////////////////////////////////////////////////////////
app.post('/api/crearUsuario', async (req, res) => {
  const { 
    cedula, 
    nombre, 
    primerApellido, 
    segundoApellido, 
    celular, 
    foto, 
    fecha, 
    usuario, 
    contraseña, 
    id_rol, 
    id_supervisor 
  } = req.body;

  try {
    // Primero creamos la persona
    const personaResult = await db.query(
      'INSERT INTO personas (cedula, nombre, primerapellido, segundoapellido, celular, foto, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [cedula, nombre, primerApellido, segundoApellido, celular, foto, fecha]
    );
    const idPersona = personaResult.insertId;

    // Ahora creamos el usuario
    const usuarioResult = await db.query(
      'INSERT INTO usuarios (usuario, contraseña, id_rol, id_persona, id_supervisor) VALUES (?, ?, ?, ?, ?)', 
      [usuario, contraseña, id_rol, idPersona, id_supervisor || null] // Si es Cobrador, podemos enviar el id_supervisor
    );
    const idUsuario = usuarioResult.insertId;

    // Si el usuario es un Supervisor (id_rol 2), se crea su caja
    if (id_rol === 2) {
      await db.query(
        'INSERT INTO caja (ultima_fecha_liquidada, caja_ultima_liquidada, caja_actual, estimado_cobrar, total_cobrado, liquidada_total, cobro_dia, total_ventas, gastos, id_usuario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ['2000-01-01', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, idUsuario]
      );
    }

    res.json({ success: true, idUsuario });
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).json({ success: false, error: 'Error al crear el usuario' });
  }
});

//////////////////////ASIGNAR ROLES EN USUARIOS////////////////////////    
// Ruta para obtener supervisores (id_rol = 2)
// Ruta para obtener supervisores (id_rol = 2)
app.get('/api/supervisores', (req, res) => {
  const query = `
    SELECT 
      u.id_usuario, 
      CONCAT(p.nombre, ' ', p.primerapellido, ' ', IFNULL(p.segundoapellido, '')) AS nombre_persona
    FROM usuarios u
    JOIN personas p ON u.id_persona = p.id_persona
    WHERE u.id_rol = 2`;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener supervisores:', err);
      res.status(500).json({ error: 'Error al obtener supervisores' });
    } else {
      res.json(results);
    }
  });
});

// Ruta para obtener cobradores (id_rol = 3)
app.get('/api/cobradores', (req, res) => {
  const query = `
    SELECT 
      u.id_usuario, 
      CONCAT(p.nombre, ' ', p.primerapellido, ' ', IFNULL(p.segundoapellido, '')) AS nombre_persona
    FROM usuarios u
    JOIN personas p ON u.id_persona = p.id_persona
    WHERE u.id_rol = 3`;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener cobradores:', err);
      res.status(500).json({ error: 'Error al obtener cobradores' });
    } else {
      res.json(results);
    }
  });
});


// Ruta para asignar cobradores a un supervisor
app.post('/api/asignar-cobradores', (req, res) => {
  const { idSupervisor, idCobradores } = req.body;

  if (!idSupervisor || !idCobradores || idCobradores.length === 0) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  // Consulta para actualizar el id_supervisor en la tabla usuarios
  const updateQuery = 'UPDATE usuarios SET id_supervisor = ? WHERE id_usuario IN (?)';
  
  db.query(updateQuery, [idSupervisor, idCobradores], (updateErr, updateResults) => {
    if (updateErr) {
      console.error('Error al actualizar usuarios:', updateErr);
      return res.status(500).json({ error: 'Error al actualizar usuarios' });
    }

    // Construir valores para insertar en asignaciones_supervisor_cobrador
    const values = idCobradores.map(idCobrador => [idSupervisor, idCobrador]);
    const insertQuery = 'INSERT INTO asignaciones_supervisor_cobrador (id_supervisor, id_cobrador) VALUES ?';

    db.query(insertQuery, [values], (insertErr, insertResults) => {
      if (insertErr) {
        console.error('Error al insertar en asignaciones:', insertErr);
        return res.status(500).json({ error: 'Error al insertar en asignaciones' });
      }

      res.json({ 
        message: 'Cobradores asignados correctamente', 
        updatedRows: updateResults.affectedRows,
        insertedRows: insertResults.affectedRows
      });
    });
  });
});

// Ruta para obtener los cobradores de un supervisor
app.get('/supervisor/:id_usuario/cobradores', (req, res) => {
  const id_supervisor = req.params.id_usuario;

  // Consulta SQL para obtener los cobradores asignados a un supervisor
  const query = `
    SELECT u.id_usuario, p.nombre, p.primerapellido, p.segundoapellido
    FROM usuarios u
    JOIN asignaciones_supervisor_cobrador asignaciones ON u.id_usuario = asignaciones.id_cobrador
    JOIN personas p ON u.id_persona = p.id_persona
    WHERE asignaciones.id_supervisor = ?;
  `;

  db.query(query, [id_supervisor], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error en la base de datos');
    }

    // Devolvemos los resultados (cobradores asignados al supervisor)
    res.json(results);
  });
});


/////////////////////////PAGO DE MESES/////////////////////////////////////////////
// Ruta para actualizar usuario
app.put('/api/usuarios/:id', (req, res) => {
  const { id } = req.params;
  const { meses_pagados, fecha_vencimiento } = req.body;

  const query = `
    UPDATE usuarios
    SET meses_pagados = ?, fecha_vencimiento = ?
    WHERE id_usuario = ?
  `;

  connection.query(query, [meses_pagados, fecha_vencimiento, id], (error, results) => {
    if (error) {
      console.error('Error al actualizar el usuario:', error);
      res.status(500).json({ message: 'Error al actualizar el usuario.' });
    } else {
      res.status(200).json({ message: 'Usuario actualizado correctamente.' });
    }
  });
});

///////////////////////////VER LOS DIAS RESTANTES///////////////////////////////////////////////////
// Ruta para actualizar el estado de un usuario
app.put('/api/usuarios/:idUsuario/estado', (req, res) => {
  const { idUsuario } = req.params;
  const { activo } = req.body; // Estado enviado desde el frontend (true o false)

  const query = `
    UPDATE usuarios
    SET activo = ?
    WHERE id_usuario = ?
  `;

  db.query(query, [activo, idUsuario], (err, results) => {
    if (err) {
      console.error('Error al actualizar el estado:', err);
      return res.status(500).json({ error: 'Error al actualizar el estado' });
    }
    res.json({ message: 'Estado actualizado correctamente' });
  });
});


////////////////////////////PARA VER EL ACTIVO DEL USUARIO//////////////////////////////////////////////////
app.put('/api/usuarios/actualizarEstados', (req, res) => {
  // Asegúrate de que la fecha de vencimiento está siendo comparada correctamente
  const query = `
    UPDATE usuarios
    SET activo = CASE
      WHEN fecha_vencimiento <= CURDATE() AND activo = 1 THEN 0  -- Desactivar si venció la fecha y está activo
      WHEN fecha_vencimiento > CURDATE() AND activo = 0 THEN 1  -- Activar si la fecha no ha vencido y está inactivo
      ELSE activo  -- Mantener el estado si no se cumple ninguna de las condiciones anteriores
    END;
  `;

  // Ejecutar la consulta SQL
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al actualizar los estados de los usuarios:', err);
      // Responder con un error si algo falla
      return res.status(500).json({ error: 'Error al actualizar los estados.' });
    }

    // Responder con éxito si la actualización fue correcta
    res.json({ message: 'Estados actualizados correctamente.' });
  });
});

////////////////////////////AUMENTO DE MESES DEPLAZO DEL USUARIO ///////////////////////////////////////////////////////
// Endpoint para actualizar fecha_vencimiento y meses_pagados

// Nueva ruta para actualizar meses_pagados y fecha_vencimiento 
app.put('/api/usuarios/meses/:id_usuario', (req, res) => {    
  const { id_usuario } = req.params;
  const { meses_pagados, fecha_vencimiento } = req.body;

  // Validación de los parámetros requeridos
  if (!meses_pagados || !fecha_vencimiento) {
    return res.status(400).json({ message: 'Datos incompletos. Se requieren meses_pagados y fecha_vencimiento.' });
  }

  const query = `
    UPDATE usuarios 
    SET meses_pagados = ?, fecha_vencimiento = ? 
    WHERE id_usuario = ?
  `;

  const values = [meses_pagados, fecha_vencimiento, id_usuario];

  // Ejecutar la consulta de actualización
  db.query(query, values, (error, results) => {
    if (error) {
      console.error('Error al actualizar usuario:', error);
      return res.status(500).json({ message: 'Error interno del servidor.' });
    }

    // Verificar si la actualización afectó alguna fila
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.json({ message: 'Usuario actualizado correctamente.', id_usuario });
  });
});
///////////////////////EDITAR EL USUARIO CON SUS VALORES////////////////////////////////////////////////////////
app.put('/api/usuarios/editar/:id', (req, res) => {
  const { id } = req.params;
  const {
    cedula_persona,
    nombre_persona,
    primerapellido_persona,
    segundoapellido_persona,
    nombre_rol,
    celular_persona,
    usuario,
    contraseña,
    fecha_vencimiento,
    activo
  } = req.body;

  const queryRol = `SELECT id_rol FROM rol WHERE nombre = ?`;

  db.query(queryRol, [nombre_rol], (err, rolResult) => {
    if (err) {
      console.error('Error obteniendo el rol:', err);
      return res.status(500).json({ message: 'Error al obtener el ID del rol.' });
    }

    if (rolResult.length === 0) {
      return res.status(400).json({ message: 'Rol no válido.' });
    }

    const id_rol = rolResult[0].id_rol;

    const query = `
      UPDATE usuarios 
      SET usuario = ?, contraseña = ?, fecha_vencimiento = ?, activo = ?, id_rol = ? 
      WHERE id_usuario = ?
    `;

    db.query(query, [usuario, contraseña, fecha_vencimiento, activo, id_rol, id], (err) => {
      if (err) {
        console.error('Error al actualizar usuario:', err);
        return res.status(500).json({ message: 'Error al actualizar el usuario.' });
      }

      const queryPersonas = `
        UPDATE personas 
        SET cedula = ?, nombre = ?, primerapellido = ?, segundoapellido = ?, celular = ? 
        WHERE id_persona = (SELECT id_persona FROM usuarios WHERE id_usuario = ?)
      `;

      db.query(queryPersonas, [cedula_persona, nombre_persona, primerapellido_persona, segundoapellido_persona, celular_persona, id], (err) => {
        if (err) {
          console.error('Error al actualizar datos personales:', err);
          return res.status(500).json({ message: 'Error al actualizar datos personales.' });
        }

        res.json({ message: 'Usuario actualizado correctamente.' });
      });
    });
  });
});
/*
cron.schedule('0 0 * * *', () => {
  console.log('🕛 Reiniciando valores de novedad en todos los clientes...');

  const query = `UPDATE clientes SET novedad = ''`;

  db.query(query, (err, result) => {
    if (err) {
      console.error('❌ Error al reiniciar novedades:', err);
    } else {
      console.log(`✅ Novedades reiniciadas en ${result.affectedRows} clientes`);
    }
  });
});
// 🕛 Cronjob para reiniciar cobro_dia todos los días a las 00:00
// 🕛 CRON para resetear cobro_dia a 0 todos los días
cron.schedule('0 0 * * *', () => {
  const now = new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' });
  console.log(`⏰ Ejecutando cron de reinicio cobro_dia: ${now}`);

  const resetQuery = `UPDATE caja SET cobro_dia = 0`;
  db.query(resetQuery, (err, result) => {
    if (err) {
      console.error('❌ Error al resetear cobro_dia:', err);
    } else {
      console.log(`✅ cobro_dia reiniciado a 0 para todos los usuarios. Filas afectadas: ${result.affectedRows}`);
    }
  });
});
// Cronjob: Ejecutar todos los días a las 00:00 AM
cron.schedule('0 0 * * *', () => {
  const hoy = new Date();
  const esDomingo = hoy.getDay() === 0;

  if (esDomingo) {
    console.log("🛑 Hoy es domingo. No se suman días de atraso.");
    return;
  }

  const sql = 'UPDATE tarjetas SET diasatrazo = diasatrazo + 1 WHERE activo = 1';

  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Error al actualizar días de atraso:", err);
    } else {
      console.log(`✅ Se sumó 1 día de atraso a ${result.affectedRows} tarjeta(s).`);
    }
  });
});*/
                    ////////////////////////////////////////////////////////////////
                    ///////////////         REINICIO DE DIA           //////////////
                    ////////////////////////////////////////////////////////////////
// CRON combinado: Ejecutar todos los días a las 00:00 hora boliviana
cron.schedule('0 0 * * *', () => {
  const now = new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' });
  console.log(`🕛 Ejecutando tareas programadas a las 00:00 (Hora Bolivia): ${now}`);

  // 1. Reiniciar novedades de todos los clientes
  const resetNovedades = `UPDATE clientes SET novedad = ''`;
  db.query(resetNovedades, (err, result) => {
    if (err) {
      console.error('❌ Error al reiniciar novedades:', err);
    } else {
      console.log(`✅ Novedades reiniciadas para ${result.affectedRows} cliente(s)`);
    }
  });

  // 2. Reiniciar cobro_dia de todos los usuarios
  const resetCobroDia = `UPDATE caja SET cobro_dia = 0`;
  db.query(resetCobroDia, (err, result) => {
    if (err) {
      console.error('❌ Error al resetear cobro_dia:', err);
    } else {
      console.log(`✅ cobro_dia reiniciado para ${result.affectedRows} usuario(s)`);
    }
  });

  // 3. Aumentar 1 día de atraso en tarjetas activas (excepto domingos)
  const hoy = new Date();
  const horaBolivia = new Date(hoy.toLocaleString('en-US', { timeZone: 'America/La_Paz' }));
  const esDomingo = horaBolivia.getDay() === 0;

  if (esDomingo) {
    console.log("🛑 Hoy es domingo. No se suman días de atraso.");
    return;
  }

  const sumarAtraso = 'UPDATE tarjetas SET diasatrazo = diasatrazo + 1 WHERE activo = 1';
  db.query(sumarAtraso, (err, result) => {
    if (err) {
      console.error("❌ Error al actualizar días de atraso:", err);
    } else {
      console.log(`✅ Se sumó 1 día de atraso a ${result.affectedRows} tarjeta(s).`);
    }
  });
});


                    ////////////////////////////////////////////////////////////////
                    ///////////////             CALCULADORA           //////////////
                    ////////////////////////////////////////////////////////////////




                    ////////////////////////////////////////////////////////////////
                    ///////////////             LOGIN                 //////////////
                    ////////////////////////////////////////////////////////////////
// Ruta de inicio de sesión   
app.post('/login', (req, res) => {
  const { email, contraseña } = req.body;

  const query = `
    SELECT 
      u.id_usuario,
      u.usuario,
      u.activo,
      p.nombre,
      p.primerapellido,
      r.nombre AS rol
    FROM usuarios u
    JOIN personas p ON u.id_persona = p.id_persona
    JOIN rol r ON u.id_rol = r.id_rol
    WHERE u.usuario = ? AND u.contraseña = ?
  `;

  db.query(query, [email, contraseña], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    const userData = results[0];

    if (userData.activo === 0) {
      return res.status(403).json({ message: 'Cuenta inactiva. Contacta al administrador.' });
    }

    return res.json({
      message: 'Inicio de sesión exitoso',
      user: {
        id_usuario: userData.id_usuario,
        usuario: userData.usuario,
        nombre: userData.nombre,
        primerapellido: userData.primerapellido,
        rol: userData.rol,
      },
    });
  });
});

                    ////////////////////////////////////////////////////////////////
                    ///////////////         PRINCIPAL                 //////////////
                    ////////////////////////////////////////////////////////////////



                    ////////////////////////////////////////////////////////////////
                    ///////////////         ORDEN RUTA           //////////////
                    ////////////////////////////////////////////////////////////////
app.get('/clientesorden', (req, res) => {
  const { usuarioId } = req.query;
  if (!usuarioId) return res.status(400).json({ error: 'Falta usuarioId' });

  const query = `
    SELECT DISTINCT c.* 
    FROM clientes c
    INNER JOIN tarjetas t ON c.id_cliente = t.id_cliente
    WHERE c.id_usuario = ? AND t.activo = 1
    ORDER BY c.orden ASC
  `;

  db.query(query, [usuarioId], (err, rows) => {
    if (err) {
      console.error("Error al obtener clientes con tarjeta activa:", err);
      return res.status(500).json({ error: 'Error al obtener clientes con tarjeta activa' });
    }
    res.json(rows);
  });
});


                    ////////////////////////////////////////////////////////////////
                    ///////////////         CLIENTE NUEVO             //////////////
                    ////////////////////////////////////////////////////////////////

///////////////////////CREAR CLIENTE////////////////////////////////////
// Ruta para crear un nuevo cliente
app.post('/api/crearclientes', (req, res) => {
  const {
    cedula,
    nombreCliente,
    apellidoPaterno,
    negocio,
    telefono,
    barrio,
    direccionLatitud,
    direccionLongitud,
    id_usuario
  } = req.body;

  if (!cedula || !nombreCliente || !apellidoPaterno) {
    return res.status(400).json({ error: 'Los campos cédula, nombreCliente y apellidoPaterno son obligatorios.' });
  }

  const query = `
    INSERT INTO clientes (
      cedula, nombreCliente, apellidoPaterno,
      negocio, telefono, barrio,
      direccionLatitud, direccionLongitud,
      id_usuario, novedad
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    cedula,
    nombreCliente,
    apellidoPaterno,
    negocio || null,
    telefono || null,
    barrio || null,
    direccionLatitud || null,
    direccionLongitud || null,
    id_usuario || null,
    'nuevo' // ✅ se inserta como valor por defecto aquí
  ];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Error al insertar cliente:', err);
      return res.status(500).json({ error: 'Error al guardar el cliente en la base de datos.' });
    }

    res.status(201).json({
      message: 'Cliente creado exitosamente.',
      clienteId: results.insertId
    });
  });
});


                    ////////////////////////////////////////////////////////////////
                    ///////////////         LISTA CLIENTES            //////////////
                    ////////////////////////////////////////////////////////////////

// Ruta para obtener los clientes de un usuario específico
app.get('/clientes', (req, res) => {
  const { usuarioId } = req.query;

  if (!usuarioId) {
    return res.status(400).json({ error: 'El ID del usuario es requerido' });
  }

  const query = `
    SELECT id_cliente, cedula, nombreCliente, 
           apellidoPaterno, negocio, telefono, barrio, 
           direccionlatitud, direccionlongitud
    FROM clientes
    WHERE id_usuario = ?
  `;
  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error('Error al obtener clientes:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(results); // Enviar los resultados como respuesta
  });
});

                    ////////////////////////////////////////////////////////////////
                    ///////////////         VER CLIENTES              //////////////
                    ////////////////////////////////////////////////////////////////

 ///////////////////PARA MANDAR MENSAJE DE REPORTES////////////////////
app.get('/api/reporte-cliente/:id_cliente', (req, res) => {
  const { id_cliente } = req.params;

  const query = `SELECT fechainicial, valor, cuotas, cuotas_pagadas, abono_sobrante, cuotas_abono, deudaactual, valorcuota 
                 FROM tarjetas 
                 WHERE id_cliente = ? AND activo = 1`;

  db.query(query, [id_cliente], (err, tarjetas) => {
    if (err) return res.status(500).json({ error: 'Error en la base de datos' });

    if (tarjetas.length === 0) {
      return res.json({ mensaje: 'Este cliente no tiene préstamos activos actualmente.' });
    }

    let mensaje = tarjetas.map(t => {
      const fecha = new Date(t.fechainicial).toLocaleDateString('es-BO');
      const totalPagado = (t.cuotas_pagadas || 0) + (t.cuotas_abono || 0);
      return `Su crédito realizado el día ${fecha} con un valor de ${t.valor} Bs tiene pagado ${totalPagado} de ${t.cuotas} cuotas, con un abono sobrante de ${t.abono_sobrante} Bs. Queda una deuda pendiente de ${t.deudaactual} Bs.`;
    }).join('\n\n');

    res.json({ mensaje });
  });
});

//ACTUALIZAR LA NOVEDAD DEL CLIENTE////
app.post('/api/novedad', (req, res) => {
  const { id_cliente, novedad } = req.body;

  if (!id_cliente || !novedad) {
    return res.status(400).json({ success: false, message: 'Faltan datos' });
  }

  const query = 'UPDATE clientes SET novedad = ? WHERE id_cliente = ?';
  db.query(query, [novedad, id_cliente], (err, result) => {
    if (err) {
      console.error('Error al actualizar novedad:', err);
      return res.status(500).json({ success: false, message: 'Error del servidor' });
    }

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Novedad actualizada correctamente' });
    } else {
      res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
  });
});

                    ////////////////////////////////////////////////////////////////
                    ///////////////             VER MAPA              //////////////
                    ////////////////////////////////////////////////////////////////


                    ////////////////////////////////////////////////////////////////
                    ///////////////       EDITAR CLIENTE              //////////////
                    ////////////////////////////////////////////////////////////////
//editar cliente
// ✅ Ruta completa para actualizar cliente incluyendo coordenadas
app.put('/api/clientes/:id_cliente', (req, res) => {
  const { id_cliente } = req.params;
  const {
    cedula,
    nombreCliente,
    apellidoPaterno,
    telefono,
    barrio,
    negocio,
    direccionLatitud,
    direccionLongitud
  } = req.body;

  console.log('Datos recibidos para actualizar cliente:', req.body);

  const sql = `
    UPDATE clientes
    SET cedula = ?, nombreCliente = ?, apellidoPaterno = ?, telefono = ?, barrio = ?, negocio = ?, direccionLatitud = ?, direccionLongitud = ?
    WHERE id_cliente = ?
  `;

  db.query(
    sql,
    [cedula, nombreCliente, apellidoPaterno, telefono, barrio, negocio, direccionLatitud, direccionLongitud, id_cliente],
    (err, result) => {
      if (err) {
        console.error('❌ Error al actualizar cliente:', err);
        return res.status(500).json({ error: 'Error al actualizar cliente' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      res.status(200).json({ mensaje: 'Cliente actualizado correctamente' });
    }
  );
});

// Obtener cliente por ID
app.get('/api/clientes/:id', (req, res) => {
  const { id } = req.params;

  db.query('SELECT * FROM clientes WHERE id_cliente = ?', [id], (err, results) => {
    if (err) {
      console.error('❌ Error al obtener cliente por ID:', err);
      return res.status(500).json({ mensaje: 'Error interno del servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    res.status(200).json(results[0]); // ⬅️ Enviamos el cliente como objeto
  });
});


                    ////////////////////////////////////////////////////////////////
                    ///////////////             TARJETAS              //////////////
                    ////////////////////////////////////////////////////////////////
//para ver las tarjetas por cliente
app.get('/api/tarjetas', (req, res) => {
  const { clienteId } = req.query;

  if (!clienteId) {
    return res.status(400).json({ error: 'El parámetro clienteId es obligatorio.' });
  }

  const query = 'SELECT * FROM tarjetas WHERE id_cliente = ? AND activo = 1';

  db.query(query, [clienteId], (err, results) => {
    if (err) {
      console.error('Error ejecutando la consulta:', err);
      return res.status(500).json({ error: 'Error en el servidor.' });
    }

    res.status(200).json(results);
  });
});

// Editar el detalle de una tarjeta
app.put('/api/tarjetas/:id', (req, res) => {
  const { id } = req.params; // id_tarjeta
  const { detalle } = req.body; // nuevo valor

  if (!detalle) {
    return res.status(400).json({ error: 'El campo detalle es obligatorio.' });
  }

  const query = 'UPDATE tarjetas SET detalle = ? WHERE id_tarjeta = ?';

  db.query(query, [detalle, id], (err, result) => {
    if (err) {
      console.error('Error ejecutando la consulta:', err);
      return res.status(500).json({ error: 'Error en el servidor.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tarjeta no encontrada.' });
    }

    res.status(200).json({ mensaje: 'Detalle actualizado correctamente.' });
  });
});
app.delete('/api/tarjetas/:id', (req, res) => {
  const { id } = req.params;
  const { id_usuario } = req.body; // Usuario que realiza la acción

  if (!id_usuario) {
    return res.status(400).json({ error: 'Falta id_usuario en la petición.' });
  }

  db.beginTransaction(err => {
    if (err) {
      console.error('Error iniciando transacción:', err);
      return res.status(500).json({ error: 'Error interno.' });
    }

    // 1️⃣ Obtener tarjeta
    const querySelect = `
      SELECT valor, cuotas_pagadas, cuotas_abono, abono_sobrante, deudaactual, valortotal
      FROM tarjetas
      WHERE id_tarjeta = ?
    `;

    db.query(querySelect, [id], (err, results) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error consultando tarjeta:', err);
          return res.status(500).json({ error: 'Error consultando la tarjeta.' });
        });
      }

      if (results.length === 0) {
        return db.rollback(() => {
          return res.status(404).json({ error: 'Tarjeta no encontrada.' });
        });
      }

      const tarjeta = results[0];

      // 2️⃣ Validar condiciones para borrar
      const puedeBorrar =
        tarjeta.cuotas_pagadas === 0 &&
        tarjeta.cuotas_abono === 0 &&
        tarjeta.abono_sobrante === 0 &&
        tarjeta.deudaactual === tarjeta.valortotal;

      if (!puedeBorrar) {
        return db.rollback(() => {
          return res.status(400).json({
            error: 'No se puede borrar: tiene pagos, abonos o deuda pendiente.'
          });
        });
      }

      // 3️⃣ Actualizar caja
      const queryUpdateCaja = `
        UPDATE caja
        SET caja_actual = caja_actual + ?,
            total_ventas = total_ventas - ?
        WHERE id_usuario = ?
      `;

      db.query(queryUpdateCaja, [tarjeta.valor, tarjeta.valor, id_usuario], (err, result) => {
        if (err) {
          return db.rollback(() => {
            console.error('Error actualizando caja:', err);
            return res.status(500).json({ error: 'Error al actualizar la caja.' });
          });
        }

        if (result.affectedRows === 0) {
          return db.rollback(() => {
            return res.status(400).json({ error: 'No se encontró caja para el usuario.' });
          });
        }

        // 4️⃣ Eliminar tarjeta
        const queryDelete = `DELETE FROM tarjetas WHERE id_tarjeta = ?`;

        db.query(queryDelete, [id], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Error eliminando tarjeta:', err);
              return res.status(500).json({ error: 'Error al eliminar la tarjeta.' });
            });
          }

          // 5️⃣ Confirmar transacción
          db.commit(err => {
            if (err) {
              return db.rollback(() => {
                console.error('Error confirmando transacción:', err);
                return res.status(500).json({ error: 'Error interno.' });
              });
            }
            return res.status(200).json({ message: 'Tarjeta eliminada y caja actualizada.' });
          });
        });
      });
    });
  });
});


                    ////////////////////////////////////////////////////////////////
                    ///////////////     DETALLE DE TARJETAS           //////////////
                    ////////////////////////////////////////////////////////////////
/////////////////ver abonos en las tarjetas////////////////////
app.get('/api/abonos/:id_tarjeta', (req, res) => {
  const { id_tarjeta } = req.params;
  const query = `SELECT monto, fecha FROM abonos WHERE id_tarjeta = ? ORDER BY fecha DESC`;
  db.query(query, [id_tarjeta], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error en la base de datos' });
    res.json(results);
  });
});

// Ruta para actualizar la cuota y la deuda actual
app.post('/api/marcarCuota/:id_tarjeta', (req, res) => {
  const { id_tarjeta } = req.params;
  const { id_usuario } = req.body;

  try {
    const query = 'SELECT cuotas_pagadas, cuotas, deudaactual, valorcuota, diasatrazo FROM tarjetas WHERE id_tarjeta = ?';
    db.query(query, [id_tarjeta], (err, rows) => {
      if (err) {
        console.error('Error al obtener la tarjeta:', err);
        return res.status(500).json({ error: 'Error al consultar la base de datos' });
      }

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Tarjeta no encontrada' });
      }

      let { cuotas_pagadas, cuotas, deudaactual, valorcuota, diasatrazo } = rows[0];

      if (cuotas_pagadas >= cuotas) {
        return res.status(400).json({ error: 'Ya se han pagado todas las cuotas' });
      }

      const nuevaDeuda = deudaactual - valorcuota;
      const nuevasCuotasPagadas = cuotas_pagadas + 1;
      const nuevoDiasAtra = diasatrazo - 1;

      const updateQuery = `
        UPDATE tarjetas
        SET cuotas_pagadas = ?, deudaactual = ?, diasatrazo = ?
        WHERE id_tarjeta = ?
      `;

      db.query(updateQuery, [nuevasCuotasPagadas, nuevaDeuda, nuevoDiasAtra, id_tarjeta], (err) => {
        if (err) {
          console.error('Error al actualizar la cuota:', err);
          return res.status(500).json({ error: 'Error al actualizar la cuota' });
        }

        const updateCajaQuery = `
          UPDATE caja 
          SET 
            caja_actual = caja_actual + ?,
            total_cobrado = total_cobrado + ?,
            cobro_dia = cobro_dia + ?
          WHERE id_usuario = ?
        `;

        db.query(updateCajaQuery, [valorcuota, valorcuota, valorcuota, id_usuario], (err) => {
          if (err) {
            console.error('Error al actualizar la caja:', err);
            return res.status(500).json({ error: 'Error al actualizar la caja' });
          }

          res.status(200).json({
            mensaje: 'Cuota actualizada correctamente y caja actualizada',
            nuevasCuotasPagadas,
            nuevaDeuda,
            nuevoDiasAtra
          });
        });
      });
    });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


////CREAMOS UN COBRO
app.post('/api/insertarCobro', (req, res) => {
  const { id_tarjeta, monto, id_usuario } = req.body;

  if (!id_tarjeta || !monto || !id_usuario) {
    console.error('Error: Faltan parámetros requeridos', { id_tarjeta, monto, id_usuario });
    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
  }

  const fecha = new Date(); // guarda fecha y hora exacta

  // Consultar valor de cuota
  const getValorCuotaQuery = `SELECT valorcuota FROM tarjetas WHERE id_tarjeta = ?`;

  db.query(getValorCuotaQuery, [id_tarjeta], (err, result) => {
    if (err) {
      console.error('Error al obtener valor de cuota:', err);
      return res.status(500).json({ error: 'Error al obtener valor de cuota' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    const valorcuota = result[0].valorcuota;

    // Calcular cuántas cuotas completas representa el monto
    const cantidadCuotas = Math.floor(monto / valorcuota);

    if (cantidadCuotas <= 0) {
      return res.status(400).json({ error: 'El monto no alcanza para una cuota completa' });
    }

    // Preparamos los valores para inserción múltiple
    const insertValues = Array(cantidadCuotas)
      .fill()
      .map(() => [id_tarjeta, valorcuota, fecha, id_usuario]);

    const insertQuery = `
      INSERT INTO cobros (id_tarjeta, monto, fecha, id_usuario) 
      VALUES ?
    `;

    db.query(insertQuery, [insertValues], (err, resultInsert) => {
      if (err) {
        console.error('Error al insertar cobros múltiples:', err);
        return res.status(500).json({ error: 'Error al insertar cobros en la base de datos' });
      }

      console.log(`✅ Se insertaron ${cantidadCuotas} cobros de ${valorcuota} = Total: ${cantidadCuotas * valorcuota}`);

      res.status(200).json({
        mensaje: `Se registraron ${cantidadCuotas} cobros de ${valorcuota} correctamente`,
        cantidadCuotas,
        valorPorCuota: valorcuota,
        total: cantidadCuotas * valorcuota
      });
    });
  });
});


// CREAMOS UN ABONO
app.post('/agregar-abono', (req, res) => {
  const { id_tarjeta, monto, id_usuario } = req.body;

  if (!id_tarjeta || !monto || !id_usuario) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  const montoNum = parseFloat(monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    return res.status(400).json({ message: 'Monto inválido' });
  }

  const insertAbonoQuery = 'INSERT INTO abonos (id_tarjeta, monto, id_usuario, fecha) VALUES (?, ?, ?, NOW())';

  db.query(insertAbonoQuery, [id_tarjeta, montoNum, id_usuario], (err, result) => {
    if (err) {
      console.error('Error al insertar el abono:', err);
      return res.status(500).json({ message: 'Error al insertar el abono' });
    }

    const getTarjetaQuery = 'SELECT deudaactual, abono_sobrante, valorcuota, diasatrazo, cuotas_abono FROM tarjetas WHERE id_tarjeta = ?';
    db.query(getTarjetaQuery, [id_tarjeta], (err, rows) => {
      if (err) {
        console.error('Error al obtener la tarjeta:', err);
        return res.status(500).json({ message: 'Error al obtener la tarjeta' });
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Tarjeta no encontrada' });
      }

      const tarjeta = rows[0];
      const nuevaDeuda = Math.max(0, tarjeta.deudaactual - montoNum);
      let nuevoSobrante = tarjeta.abono_sobrante + montoNum;
      let diasAtraso = tarjeta.diasatrazo;
      let cuotasAbono = tarjeta.cuotas_abono || 0;

      // Permitir valores negativos en diasAtraso restando 1 por cada cuota completa cubierta por sobrante
      while (nuevoSobrante >= tarjeta.valorcuota) {
        nuevoSobrante -= tarjeta.valorcuota;
        diasAtraso = diasAtraso - 1; // Ya no limita a 0, puede ser negativo
        cuotasAbono += 1;
      }

      const updateTarjetaQuery = `
        UPDATE tarjetas 
        SET deudaactual = ?, abono_sobrante = ?, diasatrazo = ?, cuotas_abono = ?
        WHERE id_tarjeta = ?
      `;

      db.query(updateTarjetaQuery, [nuevaDeuda, nuevoSobrante, diasAtraso, cuotasAbono, id_tarjeta], (err) => {
        if (err) {
          console.error('Error al actualizar la tarjeta:', err);
          return res.status(500).json({ message: 'Error al actualizar la tarjeta' });
        }

        const updateCajaQuery = `
          UPDATE caja 
          SET 
            caja_actual = caja_actual + ?,
            total_cobrado = total_cobrado + ?,
            cobro_dia = cobro_dia + ?
          WHERE id_usuario = ?
        `;

        db.query(updateCajaQuery, [montoNum, montoNum, montoNum, id_usuario], (err) => {
          if (err) {
            console.error('Error al actualizar la caja:', err);
            return res.status(500).json({ message: 'Error al actualizar la caja' });
          }

          return res.status(200).json({
            message: 'Abono registrado correctamente',
            nuevaDeuda,
            abono_sobrante: nuevoSobrante,
            cuotas_abono: cuotasAbono,
            diasAtrasoActual: diasAtraso
          });
        });
      });
    });
  });
});




/////////////////DIAS DE ATRASO EN ABONOS//////////////////////
app.post('/api/restarDiasPorAbonos', (req, res) => { 
  const { id_tarjeta, cuotasPorAbono } = req.body;
  console.log('POST /api/restarDiasPorAbonos recibido:', req.body);

  if (!id_tarjeta || cuotasPorAbono === undefined) {
    console.warn('Faltan datos en la solicitud:', req.body);
    return res.status(400).json({ error: 'Faltan datos en la solicitud' });
  }

  db.query('SELECT diasatrazo, cuotas_abono FROM tarjetas WHERE id_tarjeta = ?', [id_tarjeta], (err, results) => {
    if (err) {
      console.error('Error al consultar tarjeta:', err);
      return res.status(500).json({ error: 'Error al consultar tarjeta' });
    }

    if (results.length === 0) {
      console.warn('Tarjeta no encontrada:', id_tarjeta);
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    const tarjeta = results[0];
    const diasActuales = tarjeta.diasatrazo || 0;
    const cuotasAbonoActuales = tarjeta.cuotas_abono || 0;

    console.log(`Tarjeta ${id_tarjeta}: días atraso antes: ${diasActuales}, cuotas abono antes: ${cuotasAbonoActuales}`);

    const nuevasCuotasAbono = cuotasAbonoActuales + cuotasPorAbono;
    const nuevosDiasAtraso = diasActuales - cuotasPorAbono; // permite valores negativos

    db.query(
      'UPDATE tarjetas SET diasatrazo = ?, cuotas_abono = ? WHERE id_tarjeta = ?',
      [nuevosDiasAtraso, nuevasCuotasAbono, id_tarjeta],
      (err, result) => {
        if (err) {
          console.error('Error al actualizar tarjeta:', err);
          return res.status(500).json({ error: 'Error al actualizar tarjeta' });
        }

        console.log(`Actualización exitosa de tarjeta ${id_tarjeta}: nuevos días atraso: ${nuevosDiasAtraso}, nuevas cuotas abono: ${nuevasCuotasAbono}`);

        return res.json({
          message: `✅ Se restaron ${cuotasPorAbono} día(s) por abonos completos`,
          nuevosDiasAtraso,
          nuevasCuotasAbono
        });
      }
    );
  });
});
///////VER LOS ABONOS Y LOS TOTALES DE LA TARJETA/////////////////
app.get('/api/obtener-abonos/:id', (req, res) => {
  const idTarjeta = req.params.id;

  const query = 'SELECT SUM(monto) AS totalAbonos FROM abonos WHERE id_tarjeta = ?';

  db.query(query, [idTarjeta], (err, results) => {
    if (err) {
      console.error('Error al obtener abonos:', err);
      return res.status(500).json({ error: 'Error al obtener abonos' });
    }

    const totalAbonos = results[0].totalAbonos || 0;
    res.json({ totalAbonos });
  });
});
// Ruta combinada para obtener tarjeta y cliente
app.get('/api/verTarjeta/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT t.*, c.* 
    FROM tarjetas t
    JOIN clientes c ON t.id_cliente = c.id_cliente
    WHERE t.id_tarjeta = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error al obtener tarjeta y cliente:', err);
      return res.status(500).json({ error: 'Error al consultar la base de datos' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'No se encontraron datos' });
    }

    const tarjeta = results[0];
    const cliente = {
      id_cliente: tarjeta.id_cliente,
      cedula: tarjeta.cedula,
      nombreCliente: tarjeta.nombreCliente,
      apellidoPaterno: tarjeta.apellidoPaterno,
      negocio: tarjeta.negocio,
      telefono: tarjeta.telefono,
      barrio: tarjeta.barrio,
      direccionLatitud: tarjeta.direccionLatitud,
      direccionLongitud: tarjeta.direccionLongitud,
      id_usuario: tarjeta.id_usuario
    };

    res.json({
      tarjeta: {
        id_tarjeta: tarjeta.id_tarjeta,
        valor: tarjeta.valor,
        fechainicial: tarjeta.fechainicial,
        fechafinal: tarjeta.fechafinal,
        cuotas: tarjeta.cuotas,
        valorcuota: tarjeta.valorcuota,
        deudaactual: tarjeta.deudaactual,
        activo: tarjeta.activo,
        diasatrazo: tarjeta.diasatrazo,
        interes: tarjeta.interes,
        detalle: tarjeta.detalle,
        valortotal: tarjeta.valortotal,
        cuotas_pagadas: tarjeta.cuotas_pagadas,
        cuotas_liquidadas: tarjeta.cuotas_liquidadas  // <--- agregamos aquí
      },
      cliente: cliente
    });
  });
});
//////////////////////////ver fechas de las cuotas///////////////////////////////////////7
app.get('/api/obtener-cuotas-confirmadas/:id_tarjeta', (req, res) => {
  const id_tarjeta = req.params.id_tarjeta;

  const query = `
    SELECT 
      c.fecha,
      FLOOR(SUM(c.monto) / t.valorcuota) AS cantidad_cuotas
    FROM cobros c
    JOIN tarjetas t ON t.id_tarjeta = c.id_tarjeta
    WHERE c.id_tarjeta = ?
    GROUP BY c.fecha
    ORDER BY c.fecha ASC
  `;

  db.query(query, [id_tarjeta], (err, results) => {
    if (err) {
      console.error('Error al obtener cuotas confirmadas desde cobros:', err);
      return res.status(500).json({ error: 'Error al obtener cuotas confirmadas' }); // <-- aquí se devuelve JSON
    }

    res.json(results); // <-- aquí también JSON válido
  });
});
// Ruta GET para actualizar el campo "novedad" del cliente
app.get('/api/actualizar-novedad/:id_cliente/:tipo', (req, res) => {
  const { id_cliente, tipo } = req.params;

  console.log("⏳ Recibido actualizar novedad -> id_cliente:", id_cliente, "tipo:", tipo);

  const query = `UPDATE clientes SET novedad = ? WHERE id_cliente = ?`;

  db.query(query, [tipo, id_cliente], (err, result) => {
    if (err) {
      console.error("❌ Error al actualizar novedad:", err);
      return res.status(500).json({ error: "Error al actualizar novedad" });
    }

    if (result.affectedRows === 0) {
      console.warn("⚠️ No se encontró el cliente con ese id_cliente");
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    console.log("✅ Novedad actualizada correctamente");
    res.json({ success: true, message: "Novedad actualizada correctamente" });
  });
});

//para mostrar los abonos 
// Obtener cuotas_abono de una tarjeta
app.get('/api/cuotas-abono/:id_tarjeta', (req, res) => {
  const { id_tarjeta } = req.params;

  const query = 'SELECT cuotas_abono FROM tarjetas WHERE id_tarjeta = ?';
  db.query(query, [id_tarjeta], (err, results) => {
    if (err) {
      console.error('Error al obtener cuotas_abono:', err);
      return res.status(500).json({ error: 'Error al obtener cuotas_abono' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    res.json({ cuotas_abono: results[0].cuotas_abono });
  });
});
//ver los cobros y abonos de una tarjeta
// Obtener cobros por id_tarjeta
app.get('/api/cobros/:id_tarjeta', (req, res) => {
  const { id_tarjeta } = req.params;
  const query = `
    SELECT id_cobro, id_tarjeta, monto, fecha, id_usuario 
    FROM cobros 
    WHERE id_tarjeta = ? 
    ORDER BY fecha DESC
  `;
  db.query(query, [id_tarjeta], (err, results) => {
    if (err) {
      console.error('Error al obtener cobros:', err);
      return res.status(500).json({ error: 'Error al obtener cobros' });
    }
    res.json(results);
  });
});

// Obtener abonos por id_tarjeta
app.get('/api/abonoss/:id_tarjeta', (req, res) => {
  const { id_tarjeta } = req.params;
  const query = `
    SELECT id_abono, id_tarjeta, monto, fecha, id_usuario 
    FROM abonos 
    WHERE id_tarjeta = ? 
    ORDER BY fecha DESC
  `;
  db.query(query, [id_tarjeta], (err, results) => {
    if (err) {
      console.error('Error al obtener abonos:', err);
      return res.status(500).json({ error: 'Error al obtener abonos' });
    }
    res.json(results);
  });
});

//ELIMINAR CUOTAS
app.delete('/api/cobros/:id_cobro', (req, res) => {
  const { id_cobro } = req.params;
  const { id_usuario } = req.body;

  const getCobroQuery = 'SELECT id_tarjeta FROM cobros WHERE id_cobro = ?';
  db.query(getCobroQuery, [id_cobro], (err, cobroResult) => {
    if (err || cobroResult.length === 0) {
      return res.status(500).json({ error: 'Error al obtener cobro' });
    }

    const id_tarjeta = cobroResult[0].id_tarjeta;

    const getTarjetaQuery = 'SELECT valorcuota FROM tarjetas WHERE id_tarjeta = ?';
    db.query(getTarjetaQuery, [id_tarjeta], (err, tarjetaResult) => {
      if (err || tarjetaResult.length === 0) {
        return res.status(500).json({ error: 'Error al obtener datos de la tarjeta' });
      }

      const valorcuota = tarjetaResult[0].valorcuota;

      const deleteQuery = 'DELETE FROM cobros WHERE id_cobro = ?';
      db.query(deleteQuery, [id_cobro], (err, deleteResult) => {
        if (err) {
          return res.status(500).json({ error: 'Error al eliminar cobro' });
        }

        if (deleteResult.affectedRows === 0) {
          return res.status(404).json({ error: 'Cobro no encontrado' });
        }

        // 👇 Aquí actualizamos cuotas_pagadas Y sumamos +1 a diasatrazo
        const updateTarjetaQuery = `
          UPDATE tarjetas
          SET 
            cuotas_pagadas = cuotas_pagadas - 1,
            deudaactual = deudaactual + ?,
            diasatrazo = diasatrazo + 1
          WHERE id_tarjeta = ?
        `;

        db.query(updateTarjetaQuery, [valorcuota, id_tarjeta], (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error al actualizar tarjeta' });
          }

          // ✅ Actualizar caja
          const updateCajaQuery = `
            UPDATE caja
            SET 
              caja_actual = caja_actual - ?,
              total_cobrado = total_cobrado - ?,
              cobro_dia = cobro_dia - ?
            WHERE id_usuario = ?
          `;

          db.query(updateCajaQuery, [valorcuota, valorcuota, valorcuota, id_usuario], (err) => {
            if (err) {
              return res.status(500).json({ error: 'Error al actualizar caja' });
            }

            res.json({ message: 'Cobro eliminado, tarjeta y caja actualizadas correctamente' });
          });
        });
      });
    });
  });
});


//ELIMINAR ABONOS
// Eliminar un abono por su ID
// Eliminar un abono por su ID    
app.delete('/api/abonos/:id_abono', (req, res) => {
  const { id_abono } = req.params;
  const { id_usuario } = req.body;

  if (!id_abono) {
    return res.status(400).json({ error: 'Falta el id_abono' });
  }

  console.log(`📥 Solicitando eliminar abono ID ${id_abono} por usuario ID ${id_usuario}`);

  const obtenerAbonoQuery = 'SELECT id_tarjeta, monto FROM abonos WHERE id_abono = ?';

  db.query(obtenerAbonoQuery, [id_abono], (err, abonoResult) => {
    if (err) {
      console.error('❌ Error al obtener el abono:', err);
      return res.status(500).json({ error: 'Error al obtener el abono' });
    }

    if (abonoResult.length === 0) {
      return res.status(404).json({ error: 'Abono no encontrado' });
    }

    const { id_tarjeta, monto } = abonoResult[0];

    const obtenerTarjetaQuery = `
      SELECT deudaactual, abono_sobrante, valorcuota, cuotas_abono, diasatrazo
      FROM tarjetas
      WHERE id_tarjeta = ?
    `;

    db.query(obtenerTarjetaQuery, [id_tarjeta], (err, tarjetaResult) => {
      if (err) {
        console.error('❌ Error al obtener la tarjeta:', err);
        return res.status(500).json({ error: 'Error al obtener la tarjeta' });
      }

      if (tarjetaResult.length === 0) {
        return res.status(404).json({ error: 'Tarjeta no encontrada' });
      }

      const tarjeta = tarjetaResult[0];

      let nuevaDeuda = tarjeta.deudaactual + monto;
      let nuevoSobrante = tarjeta.abono_sobrante;
      let nuevasCuotasAbono = tarjeta.cuotas_abono;
      let nuevosDiasAtraso = tarjeta.diasatrazo || 0;

      if (monto > nuevoSobrante) {
        const faltante = monto - nuevoSobrante;

        nuevoSobrante = 0;

        if (nuevasCuotasAbono > 0) {
          nuevasCuotasAbono -= 1;
          nuevosDiasAtraso += 1;

          // Creamos un nuevo sobrante en base al valor de cuota y lo restamos el faltante
          nuevoSobrante = tarjeta.valorcuota - faltante;

          // Validación por si queda negativo (por seguridad extra)
          if (nuevoSobrante < 0) nuevoSobrante = 0;
        }
      } else {
        // Si el abono sobrante alcanza, simplemente lo restamos
        nuevoSobrante = nuevoSobrante - monto;
      }

      const eliminarQuery = 'DELETE FROM abonos WHERE id_abono = ?';

      db.query(eliminarQuery, [id_abono], (err, result) => {
        if (err) {
          console.error('❌ Error al eliminar el abono:', err);
          return res.status(500).json({ error: 'Error al eliminar el abono' });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Abono no encontrado o ya eliminado' });
        }

        const actualizarTarjetaQuery = `
          UPDATE tarjetas
          SET deudaactual = ?, abono_sobrante = ?, cuotas_abono = ?, diasatrazo = ?
          WHERE id_tarjeta = ?
        `;

        db.query(actualizarTarjetaQuery, [nuevaDeuda, nuevoSobrante, nuevasCuotasAbono, nuevosDiasAtraso, id_tarjeta], (err) => {
          if (err) {
            console.error('❌ Error al actualizar la tarjeta:', err);
            return res.status(500).json({ error: 'Abono eliminado, pero no se pudo actualizar la tarjeta' });
          }

          const actualizarCajaQuery = `
            UPDATE caja
            SET 
              caja_actual = caja_actual - ?,
              total_cobrado = total_cobrado - ?,
              cobro_dia = cobro_dia - ?
            WHERE id_usuario = ?
          `;

          db.query(actualizarCajaQuery, [monto, monto, monto, id_usuario], (err) => {
            if (err) {
              console.error('⚠️ Abono y tarjeta actualizados, pero no se pudo actualizar la caja:', err);
              return res.status(500).json({ error: 'Abono y tarjeta actualizados, pero no se pudo actualizar la caja' });
            }

            console.log(`✅ Abono ID ${id_abono} eliminado, tarjeta y caja actualizadas correctamente`);
            res.json({ message: 'Abono, tarjeta y caja actualizados correctamente' });
          });
        });
      });
    });
  });
});





                    ////////////////////////////////////////////////////////////////
                    ///////////////     CREAR TARJETAS                //////////////
                    ////////////////////////////////////////////////////////////////


const moment = require('moment-timezone');

app.post('/api/tarjetas', (req, res) => {
  const { 
    id_cliente, 
    valor, 
    fechainicial, // viene como 'YYYY-MM-DD' desde el frontend
    fechafinal, 
    cuotas, 
    valorcuota, 
    deudaactual, 
    activo,
    interes, 
    detalle, 
    cuotas_pagadas, 
    valortotal 
  } = req.body;

  if (
    !id_cliente || 
    !valor || 
    !fechainicial || 
    !fechafinal || 
    !cuotas || 
    !valorcuota || 
    !deudaactual || 
    interes === undefined || 
    cuotas_pagadas === undefined || 
    valortotal === undefined
  ) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // ✅ Obtener la hora actual en Bolivia y combinar con la fecha seleccionada
  const horaBolivia = moment().tz('America/La_Paz').format('HH:mm:ss');
  const fechainicialFinal = `${fechainicial} ${horaBolivia}`;

  const query = `
    INSERT INTO tarjetas (
      id_cliente, valor, fechainicial, fechafinal, cuotas, valorcuota,
      deudaactual, activo, interes, detalle, cuotas_pagadas, valortotal
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    id_cliente, valor, fechainicialFinal, fechafinal, cuotas,
    valorcuota, deudaactual, activo, interes, detalle,
    cuotas_pagadas, valortotal
  ];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Error al crear tarjeta:', err);
      return res.status(500).json({ error: 'Error al insertar en la base de datos' });
    }

    const actualizarCajaQuery = `
      UPDATE caja
      SET 
        total_ventas = total_ventas + ?, 
        estimado_cobrar = estimado_cobrar + ?, 
        caja_actual = caja_actual - ?
      WHERE id_usuario = (
        SELECT id_usuario 
        FROM clientes 
        WHERE id_cliente = ?
      )
    `;

    const actualizarCajaValues = [valor, valorcuota, valor, id_cliente];

    db.query(actualizarCajaQuery, actualizarCajaValues, (err, updateResults) => {
      if (err) {
        console.error('Error al actualizar los valores de caja:', err);
        return res.status(500).json({ error: 'Error al actualizar los valores de caja' });
      }

      res.status(201).json({ 
        message: 'Tarjeta creada y valores de caja actualizados correctamente', 
        tarjetaId: results.insertId 
      });
    });
  });
});






                    ////////////////////////////////////////////////////////////////
                    ///////////////     INFORMACION DEL COBRO         //////////////
                    ////////////////////////////////////////////////////////////////

// Listar todas las entradas de la tabla "caja"
app.get('/api/caja/:id_usuario', (req, res) => {
  const { id_usuario } = req.params; // Capturar el id_usuario desde los parámetros de la URL.
  const query = 'SELECT * FROM caja WHERE id_usuario = ?';

  db.query(query, [id_usuario], (err, results) => {
    if (err) {
      console.error('Error al consultar la tabla "caja":', err);
      return res.status(500).json({ error: 'Error al consultar la base de datos.' });
    }
    res.json(results); // Devolver los resultados filtrados.
  });
});
//////////////////////////VER ESTIMADO POR COBRAR POR DIA////////////////////////////////////////7
// Ruta para obtener el total de valorcuota de un usuario
app.get('/api/totalValorCuotas/:usuarioId', (req, res) => {
  const usuarioId = req.params.usuarioId;

  // Consulta SQL para obtener la suma de los valores de 'valorcuota' de las tarjetas asociadas a los clientes de un usuario
  const query = `
    SELECT SUM(valorcuota) AS totalValorCuotas
    FROM tarjetas
    JOIN clientes ON tarjetas.id_cliente = clientes.id_cliente
    WHERE clientes.id_usuario = ?
  `;

  db.execute(query, [usuarioId], (err, results) => {
    if (err) {
      console.error('Error al ejecutar la consulta:', err);
      return res.status(500).json({ error: 'Hubo un error al obtener el total de cuotas' });
    }

    // Si no hay resultados, devolvemos 0
    const totalValorCuotas = results[0].totalValorCuotas || 0;
    res.json({ totalValorCuotas });
  });
});
////////////////////////VER COBRO DEL DIA//////////////////////////////////

app.get('/api/total/cobrosDelDia/:usuarioId', (req, res) => {
  const usuarioId = req.params.usuarioId;
  const today = new Date().toISOString().split('T')[0];

  console.log(`🔍 Consultando cobros del día para el usuario: ${usuarioId} | Fecha: ${today}`);

  const query = `
    SELECT COALESCE(SUM(c.monto), 0) AS totalCobros
    FROM cobros c
    JOIN tarjetas t ON c.id_tarjeta = t.id_tarjeta
    JOIN clientes cl ON t.id_cliente = cl.id_cliente
    WHERE DATE(c.fecha) = ? AND cl.id_usuario = ?
  `;

  db.query(query, [today, usuarioId], (err, rows) => {
    if (err) {
      console.error('❌ Error al obtener el total de cobros del día:', err);
      return res.status(500).json({ error: 'Error al consultar el total de cobros' });
    }

    const totalCobros = rows[0].totalCobros;
    console.log(`📦 Total cobros del día (solo consulta): ${totalCobros}`);

    return res.status(200).json({ totalCobros });
  });
});
//////////////////////////////COBROS en total EL DATO EN INPUT///////////////////////////////////////////
// Endpoint para obtener el total de cobros de todos los días    
app.get('/api/total/cobrosTotales/:usuarioId', (req, res) => {
  const usuarioId = req.params.usuarioId;

  // Consulta primero la última fecha de liquidación
  const getFechaLiquidacion = `SELECT ultima_fecha_liquidada FROM caja WHERE id_usuario = ?`;

  db.query(getFechaLiquidacion, [usuarioId], (err, result) => {
    if (err) {
      console.error('❌ Error al obtener ultima_fecha_liquidada:', err);
      return res.status(500).json({ error: 'Error al consultar la última fecha de liquidación' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Caja no encontrada para este usuario' });
    }

    const ultimaFecha = result[0].ultima_fecha_liquidada;

    // Ahora suma solo los cobros posteriores a esa fecha
    const queryCobros = `
      SELECT COALESCE(SUM(c.monto), 0) AS totalCobros
      FROM cobros c
      JOIN tarjetas t ON c.id_tarjeta = t.id_tarjeta
      JOIN clientes cl ON t.id_cliente = cl.id_cliente
      WHERE cl.id_usuario = ? AND c.fecha > ?
    `;

    db.query(queryCobros, [usuarioId, ultimaFecha], (err2, rows) => {
      if (err2) {
        console.error('❌ Error al obtener el total de cobros:', err2);
        return res.status(500).json({ error: 'Error al consultar el total de cobros' });
      }

      const totalCobros = rows[0].totalCobros;

      // Actualiza el valor en la tabla caja
      const updateCaja = `
        UPDATE caja SET total_cobrado = ? WHERE id_usuario = ?
      `;
      db.query(updateCaja, [totalCobros, usuarioId], (err3) => {
        if (err3) {
          console.error('❌ Error al actualizar total_cobrado en caja:', err3);
          return res.status(500).json({ error: 'Error al actualizar total_cobrado' });
        }

        // Devuelve el resultado actualizado
        res.status(200).json({ totalCobros });
      });
    });
  });
});
// Ruta para inyectar monto a caja_actual
app.put('/api/caja/:idCaja/inyectar', (req, res) => {
  const idCaja = req.params.idCaja;
  const { monto, id_usuario, descripcion } = req.body;

  if (!monto || isNaN(monto) || monto <= 0) {
    return res.status(400).json({ message: 'Monto inválido' });
  }

  if (!id_usuario) {
    return res.status(400).json({ message: 'ID de usuario requerido' });
  }

  // Paso 1: Actualizar caja_actual
  const queryUpdateCaja = `
    UPDATE caja 
    SET caja_actual = caja_actual + ? 
    WHERE id_caja = ?
  `;

  db.query(queryUpdateCaja, [monto, idCaja], (err, result) => {
    if (err) {
      console.error('Error al actualizar caja_actual:', err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Caja no encontrada' });
    }

    // Paso 2: Insertar en la tabla inyectado con descripción
    const queryInsertInyectado = `
      INSERT INTO inyectado (id_caja, id_usuario, monto, descripcion)
      VALUES (?, ?, ?, ?)
    `;

    db.query(queryInsertInyectado, [idCaja, id_usuario, monto, descripcion || ''], (err2, result2) => {
      if (err2) {
        console.error('Error al insertar en la tabla inyectado:', err2);
        return res.status(500).json({ message: 'Error al registrar inyección' });
      }

      res.status(200).json({ message: 'Monto inyectado con éxito y registrado' });
    });
  });
});

/////////////////////RETIRAR DE CAJA /////////////////////////
  app.put('/api/caja/:idCaja/retirar', (req, res) => {
  const idCaja = req.params.idCaja;
  const { monto, id_usuario, descripcion } = req.body;

  if (!monto || isNaN(monto) || monto <= 0) {
    return res.status(400).json({ message: 'Monto inválido' });
  }

  if (!id_usuario) {
    return res.status(400).json({ message: 'ID de usuario es requerido' });
  }

  // 1. Verificar caja_actual
  const verificarCaja = `SELECT caja_actual FROM caja WHERE id_caja = ?`;

  db.query(verificarCaja, [idCaja], (err, results) => {
    if (err) {
      console.error('Error al consultar caja:', err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Caja no encontrada' });
    }

    const cajaActual = parseFloat(results[0].caja_actual);
    const montoRetiro = parseFloat(monto);

    if (montoRetiro > cajaActual) {
      return res.status(400).json({ message: 'Saldo insuficiente en caja' });
    }

    // 2. Restar monto
    const actualizarCaja = `
      UPDATE caja 
      SET caja_actual = caja_actual - ? 
      WHERE id_caja = ?
    `;

    db.query(actualizarCaja, [montoRetiro, idCaja], (err, result) => {
      if (err) {
        console.error('Error al actualizar caja:', err);
        return res.status(500).json({ message: 'Error en el servidor al restar' });
      }

      // 3. Insertar en tabla retiro
      const insertarRetiro = `
        INSERT INTO retiro (id_usuario, id_caja, monto, descripcion)
        VALUES (?, ?, ?, ?)
      `;

      db.query(insertarRetiro, [id_usuario, idCaja, montoRetiro, descripcion || null], (err, result) => {
        if (err) {
          console.error('Error al registrar retiro:', err);
          return res.status(500).json({ message: 'Error al guardar retiro' });
        }

        res.status(200).json({ message: 'Retiro realizado con éxito ✅' });
      });
    });
  });
});

////////////////el boton liquidar ya hace las cuotas_liquidadas//////////////////////
app.put('/api/liquidarCuotas/:id_usuario', async (req, res) => {
  const idUsuario = req.params.id_usuario;
  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. Obtener total de cobros del día
    const totalCobrosQuery = `
      SELECT COALESCE(SUM(c.monto), 0) AS totalCobros
      FROM cobros c
      JOIN tarjetas t ON c.id_tarjeta = t.id_tarjeta
      JOIN clientes cl ON t.id_cliente = cl.id_cliente
      WHERE DATE(c.fecha) = ? AND cl.id_usuario = ?
    `;

    const totalCobros = await new Promise((resolve, reject) => {
      db.query(totalCobrosQuery, [today, idUsuario], (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0].totalCobros);
      });
    });

    // 2. Obtener caja
    const cajaQuery = `SELECT caja_actual, total_ventas, gastos FROM caja WHERE id_usuario = ? LIMIT 1`;
    const caja = await new Promise((resolve, reject) => {
      db.query(cajaQuery, [idUsuario], (err, rows) => {
        if (err) return reject(err);
        if (rows.length === 0) return reject(new Error("Caja no encontrada"));
        resolve(rows[0]);
      });
    });

    // 3. Insertar liquidación
    const insertLiquidacion = `
      INSERT INTO liquidacion (id_usuario, fecha_liquidada, caja_liquidada, total_cobrado, total_ventas, total_gastos)
      VALUES (?, NOW(), ?, ?, ?, ?)
    `;
    await new Promise((resolve, reject) => {
      db.query(
        insertLiquidacion,
        [
          idUsuario,
          caja.caja_actual || 0,
          totalCobros || 0,
          caja.total_ventas || 0,
          caja.gastos || 0
        ],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // 4. Actualizar la caja
    const updateCaja = `
      UPDATE caja
      SET 
        ultima_fecha_liquidada = NOW(),
        caja_ultima_liquidada = caja_actual,
        total_cobrado = 0,
        total_ventas = 0,
        gastos = 0
      WHERE id_usuario = ?
    `;
    await new Promise((resolve, reject) => {
      db.query(updateCaja, [idUsuario], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // 5. Obtener clientes
    const clientesQuery = `SELECT id_cliente FROM clientes WHERE id_usuario = ?`;
    const clientes = await new Promise((resolve, reject) => {
      db.query(clientesQuery, [idUsuario], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    if (clientes.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontraron clientes' });
    }

    // 6. Actualizar cuotas_liquidadas
    let totalActualizados = 0;
    let errores = [];

    await Promise.all(clientes.map((cliente) => {
      return new Promise((resolve) => {
        const updateQuery = `
          UPDATE tarjetas
          SET cuotas_liquidadas = cuotas_pagadas
          WHERE id_cliente = ?
        `;
        db.query(updateQuery, [cliente.id_cliente], (err, result) => {
          if (err) {
            errores.push({ cliente: cliente.id_cliente, error: err });
          } else {
            totalActualizados += result.affectedRows;
          }
          resolve();
        });
      });
    }));

    // 7. Marcar tarjetas con deudaactual = 0 como inactivas
    const marcarInactivasQuery = `
      UPDATE tarjetas
      SET activo = 0
      WHERE deudaactual = 0 AND id_tarjeta IN (
        SELECT t.id_tarjeta
        FROM tarjetas t
        JOIN clientes c ON t.id_cliente = c.id_cliente
        WHERE c.id_usuario = ?
      )
    `;
    await new Promise((resolve, reject) => {
      db.query(marcarInactivasQuery, [idUsuario], (err, result) => {
        if (err) return reject(err);
        console.log(`✅ Tarjetas marcadas como inactivas: ${result.affectedRows}`);
        resolve();
      });
    });

    if (errores.length > 0) {
      return res.status(500).json({
        mensaje: 'Algunos clientes no se pudieron actualizar',
        errores,
      });
    }

    res.json({
      mensaje: `✅ Liquidación completada: ${totalActualizados} tarjetas actualizadas, caja liquidada y tarjetas saldadas inactivadas.`,
    });

  } catch (error) {
    console.error("❌ Error general en la liquidación:", error);
    res.status(500).json({ error: 'Error al realizar la liquidación', detalle: error.message });
  }
});



                    ////////////////////////////////////////////////////////////////
                    ///////////////     VER TOTAL COBRADO             //////////////
                    ////////////////////////////////////////////////////////////////

                    //////////////listado de cuotas y abonos juntos para total_cobrado 
// Asumiendo que tienes configurado 'db' para MySQL y 'app' para Express
app.get('/api/cobrosYabonos/:usuarioId', (req, res) => {
  const { usuarioId } = req.params;

  const sql = `
    SELECT 
      c.id_cobro AS id,
      c.id_tarjeta,
      c.monto,
      c.fecha,
      'cuota' AS tipo,
      t.id_cliente,
      cl.nombreCliente,
      cl.apellidoPaterno,
      '' AS apellidoMaterno
    FROM cobros c
    JOIN tarjetas t ON c.id_tarjeta = t.id_tarjeta
    JOIN clientes cl ON t.id_cliente = cl.id_cliente
    JOIN caja cx ON cx.id_usuario = cl.id_usuario
    WHERE cl.id_usuario = ? 
      AND cl.id_cliente IS NOT NULL
      AND c.fecha > DATE_ADD(cx.ultima_fecha_liquidada, INTERVAL 1 SECOND)

    UNION ALL

    SELECT 
      a.id_abono AS id,
      a.id_tarjeta,
      a.monto,
      a.fecha,
      'abono' AS tipo,
      t.id_cliente,
      cl.nombreCliente,
      cl.apellidoPaterno,
      '' AS apellidoMaterno
    FROM abonos a
    JOIN tarjetas t ON a.id_tarjeta = t.id_tarjeta
    JOIN clientes cl ON t.id_cliente = cl.id_cliente
    JOIN caja cx ON cx.id_usuario = cl.id_usuario
    WHERE cl.id_usuario = ? 
      AND cl.id_cliente IS NOT NULL
      AND a.fecha > DATE_ADD(cx.ultima_fecha_liquidada, INTERVAL 1 SECOND)

    ORDER BY fecha DESC
  `;

  db.query(sql, [usuarioId, usuarioId], (err, rows) => {
    if (err) {
      console.error('❌ Error al obtener cobros y abonos:', err);
      return res.status(500).json({ error: 'Error al consultar cobros y abonos' });
    }

    if (rows.length === 0) {
      return res.status(200).json({ mensaje: 'No hay cobros ni abonos registrados desde la última liquidación.' });
    }

    res.status(200).json({ movimientos: rows });
  });
});



                    ////////////////////////////////////////////////////////////////
                    ///////////////     VER COBRO DIA                 //////////////
                    ////////////////////////////////////////////////////////////////
app.get('/api/movimientosDelDia/:usuarioId', (req, res) => {
  const usuarioId = req.params.usuarioId;

  // Obtener el inicio del día en horario de Bolivia (UTC-4)
  const now = new Date();
  const boliviaOffsetMs = -4 * 60 * 60 * 1000; // UTC-4
  const boliviaDate = new Date(now.getTime() + boliviaOffsetMs);

  const year = boliviaDate.getUTCFullYear();
  const month = String(boliviaDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(boliviaDate.getUTCDate()).padStart(2, '0');

  const inicioDia = `${year}-${month}-${day} 00:00:00`;
  const finDia = `${year}-${month}-${day} 23:59:59`;

  const query = `
    SELECT 
      c.id_cobro AS id,
      c.monto,
      c.fecha,
      'cobro' AS tipo,
      t.id_tarjeta,
      t.id_cliente,
      cl.nombreCliente,
      cl.apellidoPaterno,
      '' AS apellidoMaterno
    FROM cobros c
    JOIN tarjetas t ON c.id_tarjeta = t.id_tarjeta
    JOIN clientes cl ON t.id_cliente = cl.id_cliente
    WHERE cl.id_usuario = ? AND c.fecha BETWEEN ? AND ?
    
    UNION ALL

    SELECT 
      a.id_abono AS id,
      a.monto,
      a.fecha,
      'abono' AS tipo,
      t.id_tarjeta,
      t.id_cliente,
      cl.nombreCliente,
      cl.apellidoPaterno,
      '' AS apellidoMaterno
    FROM abonos a
    JOIN tarjetas t ON a.id_tarjeta = t.id_tarjeta
    JOIN clientes cl ON t.id_cliente = cl.id_cliente
    WHERE cl.id_usuario = ? AND a.fecha BETWEEN ? AND ?

    ORDER BY fecha DESC
  `;

  db.query(query, [usuarioId, inicioDia, finDia, usuarioId, inicioDia, finDia], (err, rows) => {
    if (err) {
      console.error('Error al obtener movimientos del día:', err);
      return res.status(500).json({ error: 'Error al consultar movimientos del día' });
    }
    if (rows.length === 0) {
      return res.status(200).json({ mensaje: 'No hay movimientos para hoy.' });
    }
    res.status(200).json({ movimientos: rows });
  });
});


                    ////////////////////////////////////////////////////////////////
                    ///////////////     VER VENTAS                    //////////////
                    ////////////////////////////////////////////////////////////////
// Obtener ventas por usuario desde la última liquidación
app.get('/api/ventas/:id_usuario', (req, res) => {
  const { id_usuario } = req.params;

  const sql = `
    SELECT 
      t.valor, 
      t.fechainicial, 
      CONCAT(c.nombreCliente, ' ', c.apellidoPaterno, ' ') AS nombreCompleto
    FROM tarjetas t
    JOIN clientes c ON t.id_cliente = c.id_cliente
    JOIN caja cx ON cx.id_usuario = c.id_usuario
    WHERE c.id_usuario = ? 
      AND t.fechainicial > DATE_ADD(cx.ultima_fecha_liquidada, INTERVAL 1 SECOND)
  `;

  db.query(sql, [id_usuario], (err, results) => {
    if (err) {
      console.error('❌ Error al obtener las ventas:', err);
      return res.status(500).json({ message: 'Error al obtener las ventas' });
    }
    res.json(results);
  });
});




                    ////////////////////////////////////////////////////////////////
                    ///////////////     VER GASTOS                    //////////////
                    ////////////////////////////////////////////////////////////////
// Ruta para obtener los gastos de un usuario con reseteo en liquidacion
app.get('/api/gastos/:usuarioId', (req, res) => {
  const usuarioId = req.params.usuarioId;

  const query = `
    SELECT g.*
    FROM gastos g
    JOIN caja c ON c.id_usuario = g.id_usuario
    WHERE g.id_usuario = ?
      AND g.fecha > DATE_ADD(c.ultima_fecha_liquidada, INTERVAL 1 SECOND)
    ORDER BY g.fecha DESC
  `;

  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error('Error al obtener gastos:', err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    res.json(results);
  });
});

                    ////////////////////////////////////////////////////////////////
                    ///////////////     AGREGAR GASTOS                //////////////
                    ////////////////////////////////////////////////////////////////
// Ruta para agregar un gasto 
app.post('/api/gastos', (req, res) => {
  const { valor, descripcion, id_usuario } = req.body;

  // Obtener la fecha y hora actual en horario de Bolivia (UTC-4)
  const fechaBoliviana = new Date(new Date().getTime() - 4 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' '); // formato: "YYYY-MM-DD HH:MM:SS"

  const sqlGastos = 'INSERT INTO gastos (valor, descripcion, id_usuario, fecha) VALUES (?, ?, ?, ?)';
  db.query(sqlGastos, [valor, descripcion, id_usuario, fechaBoliviana], (err, result) => {
    if (err) {
      console.error('Error al agregar el gasto:', err);
      return res.status(500).json({ message: 'Error al agregar el gasto' });
    }

    const sqlCaja = 'UPDATE caja SET gastos = gastos + ? WHERE id_usuario = ?';
    db.query(sqlCaja, [valor, id_usuario], (err, result) => {
      if (err) {
        console.error('Error al actualizar caja:', err);
        return res.status(500).json({ message: 'Error al actualizar caja' });
      }

      res.json({ valor, descripcion, fecha: fechaBoliviana });
    });
  });
});


// Ruta para actualizar la caja después de agregar un gasto
app.put('/api/caja/actualizar/:id_usuario', (req, res) => {
  const { gasto } = req.body;
  const { id_usuario } = req.params;

  const sql = 'UPDATE caja SET caja_actual = caja_actual - ? WHERE id_usuario = ?';
  db.query(sql, [gasto, id_usuario], (err, result) => {
    if (err) {
      console.error('Error al actualizar caja actual:', err);
      return res.status(500).json({ message: 'Error al actualizar caja actual' });
    }
    res.json({ message: 'Caja actualizada correctamente' });
  });
});
                    ////////////////////////////////////////////////////////////////
                    ///////////////     CLIENTES PENDIENTES           //////////////
                    ////////////////////////////////////////////////////////////////
//ruta para ver la novedad en blanco
// Ruta para ver clientes pendientes (novedad en blanco o null) con tarjeta activa
app.get('/clientes-pendientes', (req, res) => {
  const { usuarioId } = req.query;

  if (!usuarioId) {
    return res.status(400).json({ error: 'Falta el parámetro usuarioId' });
  }

  const query = `
    SELECT DISTINCT c.* 
    FROM clientes c
    INNER JOIN tarjetas t ON c.id_cliente = t.id_cliente
    WHERE c.id_usuario = ? 
      AND t.activo = 1
      AND (c.novedad IS NULL OR c.novedad = '')
    ORDER BY c.nombreCliente ASC
  `;

  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener clientes pendientes:", err);
      return res.status(500).json({ error: 'Error al obtener clientes pendientes' });
    }

    res.json(results);
  });
});


                    ////////////////////////////////////////////////////////////////
                    ///////////////     MOVIMIENTOS                   //////////////
                    ////////////////////////////////////////////////////////////////
//VER ALGUNOS MOVIMIENTOS
app.get('/api/movimientos-resumen/:id_usuario', (req, res) => {
  const { id_usuario } = req.params;
  if (!id_usuario) {
    return res.status(400).json({ error: 'Falta id_usuario' });
  }

  // Consulta para caja
  const queryCaja = 'SELECT total_ventas, gastos, total_cobrado FROM caja WHERE id_usuario = ? LIMIT 1';

  db.query(queryCaja, [id_usuario], (err, cajaRows) => {
    if (err) {
      console.error('Error al consultar caja:', err);
      return res.status(500).json({ error: 'Error en la base de datos (caja)' });
    }
    if (cajaRows.length === 0) {
      return res.status(404).json({ error: 'No se encontró caja para ese usuario' });
    }

    // Consulta para total inyectado
    const queryInyectado = 'SELECT IFNULL(SUM(monto), 0) AS total_inyectado FROM inyectado WHERE id_usuario = ?';
    db.query(queryInyectado, [id_usuario], (err2, inyectadoRows) => {
      if (err2) {
        console.error('Error al consultar inyectado:', err2);
        return res.status(500).json({ error: 'Error en la base de datos (inyectado)' });
      }

      // Consulta para total retirado
      const queryRetiro = 'SELECT IFNULL(SUM(monto), 0) AS total_retirado FROM retiro WHERE id_usuario = ?';
      db.query(queryRetiro, [id_usuario], (err3, retiroRows) => {
        if (err3) {
          console.error('Error al consultar retiro:', err3);
          return res.status(500).json({ error: 'Error en la base de datos (retiro)' });
        }

        // Finalmente respondemos con todos los datos
        res.json({
          total_ventas: cajaRows[0].total_ventas,
          gastos: cajaRows[0].gastos,
          total_cobrado: cajaRows[0].total_cobrado,
          total_inyectado: inyectadoRows[0].total_inyectado,
          total_retirado: retiroRows[0].total_retirado,
        });
      });
    });
  });
});

//este es la cartera lo que hay prestado
// Total de deuda de todas las tarjetas activas de un usuario
app.get('/api/total-deuda', (req, res) => {
  const { id_usuario } = req.query;

  if (!id_usuario) {
    return res.status(400).json({ error: 'Falta el parámetro id_usuario' });
  }

  const query = `
    SELECT SUM(tarjetas.deudaactual) AS total_deuda
    FROM tarjetas
    JOIN clientes ON tarjetas.id_cliente = clientes.id_cliente
    WHERE clientes.id_usuario = ? AND tarjetas.activo = 1
  `;

  db.query(query, [id_usuario], (err, results) => {
    if (err) {
      console.error('Error al obtener total de deuda:', err);
      return res.status(500).json({ error: 'Error al obtener total de deuda' });
    }

    const total_deuda = results[0].total_deuda || 0;
    res.json({ total_deuda });
  });
});

//VER ABONOS Y COBROS
app.get('/resumen-movimientos', async (req, res) => {
  const { id_usuario } = req.query;
  if (!id_usuario) {
    return res.status(400).json({ error: 'Falta el parámetro id_usuario' });
  }

  try {
    // 1. Obtener clientes de ese usuario
    const clientes = await new Promise((resolve, reject) => {
      const sql = 'SELECT id_cliente, nombreCliente, apellidoPaterno FROM clientes WHERE id_usuario = ?';
      db.query(sql, [id_usuario], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (clientes.length === 0) {
      return res.json({ totalGeneral: 0, detalleClientes: [] });
    }

    // 2. Obtener tarjetas de esos clientes
    const idsClientes = clientes.map(c => c.id_cliente);
    const placeholders = idsClientes.map(() => '?').join(',');

    const tarjetas = await new Promise((resolve, reject) => {
      const sql = `SELECT id_tarjeta, id_cliente FROM tarjetas WHERE id_cliente IN (${placeholders})`;
      db.query(sql, idsClientes, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Agrupar tarjetas por cliente
    const clientesMap = new Map();

    for (const cliente of clientes) {
      clientesMap.set(cliente.id_cliente, {
        id_cliente: cliente.id_cliente,
        nombre_cliente: `${cliente.nombreCliente} ${cliente.apellidoPaterno}`,
        tarjetas: []
      });
    }

    for (const tarjeta of tarjetas) {
      const id_tarjeta = tarjeta.id_tarjeta;
      const id_cliente = tarjeta.id_cliente;

      // Obtener cobros de esta tarjeta
      const cobros = await new Promise((resolve, reject) => {
        const sql = `SELECT monto, fecha FROM cobros WHERE id_tarjeta = ?`;
        db.query(sql, [id_tarjeta], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      // Obtener abonos de esta tarjeta
      const abonos = await new Promise((resolve, reject) => {
        const sql = `SELECT monto, fecha FROM abonos WHERE id_tarjeta = ?`;
        db.query(sql, [id_tarjeta], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      const totalCobros = cobros.reduce((acc, c) => acc + c.monto, 0);
      const totalAbonos = abonos.reduce((acc, a) => acc + a.monto, 0);
      const totalTarjeta = totalCobros + totalAbonos;

      const tarjetaConDetalle = {
        id_tarjeta,
        total: totalTarjeta,
        detalle: [
          ...cobros.map(c => ({ tipo: 'Cobro', monto: c.monto, fecha: c.fecha })),
          ...abonos.map(a => ({ tipo: 'Abono', monto: a.monto, fecha: a.fecha })),
        ]
      };

      if (clientesMap.has(id_cliente)) {
        clientesMap.get(id_cliente).tarjetas.push(tarjetaConDetalle);
      }
    }

    // Solo clientes que tienen tarjetas
    const detalleClientes = Array.from(clientesMap.values()).filter(c => c.tarjetas.length > 0);

    const totalGeneral = detalleClientes.reduce((accClientes, cliente) => {
      return accClientes + cliente.tarjetas.reduce((accTarjetas, tarjeta) => accTarjetas + tarjeta.total, 0);
    }, 0);

    res.json({ totalGeneral, detalleClientes });

  } catch (error) {
    console.error('Error en /resumen-movimientos:', error);
    res.status(500).json({ error: 'Error al obtener el resumen de movimientos' });
  }
});
////VER TODOS LOS GASTOS
app.get('/resumen-gastos', (req, res) => {
  const { id_usuario } = req.query;
  if (!id_usuario) return res.status(400).json({ error: 'Falta id_usuario' });

  const queryAsync = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
  });

  (async () => {
    try {
      const gastos = await queryAsync(
        `SELECT id_gasto, valor, descripcion, fecha 
         FROM gastos WHERE id_usuario = ? ORDER BY fecha DESC`,
        [id_usuario]
      );
      const totalGastos = gastos.reduce((acc, g) => acc + g.valor, 0);
      res.json({ totalGastos, gastosDetalle: gastos });
    } catch (error) {
      console.error('Error en /resumen-gastos:', error);
      res.status(500).json({ error: 'Error al obtener gastos' });
    }
  })();
});

//VER TODAS LAS VENTAS
app.get('/resumen-ventas', (req, res) => {
  const { id_usuario } = req.query;
  if (!id_usuario) return res.status(400).json({ error: 'Falta id_usuario' });

  const queryAsync = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
  });

  (async () => {
    try {
      // Obtener clientes del usuario
      const clientes = await queryAsync(
        'SELECT id_cliente, nombreCliente, apellidoPaterno FROM clientes WHERE id_usuario = ?',
        [id_usuario]
      );

      if (clientes.length === 0) return res.json({ totalVentas: 0, ventasDetalle: [] });

      const idsClientes = clientes.map(c => c.id_cliente);
      const placeholders = idsClientes.map(() => '?').join(',');

      // Obtener tarjetas
      const tarjetas = await queryAsync(
        `SELECT id_tarjeta, id_cliente, valor, detalle FROM tarjetas WHERE id_cliente IN (${placeholders})`,
        idsClientes
      );

      const totalVentas = tarjetas.reduce((acc, t) => acc + t.valor, 0);

      const ventasDetalle = clientes.map(cliente => ({
        id_cliente: cliente.id_cliente,
        nombre: `${cliente.nombreCliente} ${cliente.apellidoPaterno}`,
        tarjetas: tarjetas.filter(t => t.id_cliente === cliente.id_cliente).map(t => ({
          id_tarjeta: t.id_tarjeta,
          valor: t.valor,
          detalle: t.detalle,
        })),
      }));

      res.json({ totalVentas, ventasDetalle });
    } catch (error) {
      console.error('Error en /resumen-ventas:', error);
      res.status(500).json({ error: 'Error al obtener ventas' });
    }
  })();
});
// VER INYECTADO
app.get('/resumen-inyectado', (req, res) => {
  const { id_usuario } = req.query;
  if (!id_usuario) return res.status(400).json({ error: 'Falta id_usuario' });

  const queryAsync = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
  });

  (async () => {
    try {
      const inyectado = await queryAsync(
        `SELECT id_inyectado, monto, fecha, descripcion FROM inyectado WHERE id_usuario = ? ORDER BY fecha DESC`,
        [id_usuario]
      );
      const totalInyectado = inyectado.reduce((acc, i) => acc + i.monto, 0);
      res.json({ totalInyectado, inyectadoDetalle: inyectado });
    } catch (error) {
      console.error('Error en /resumen-inyectado:', error);
      res.status(500).json({ error: 'Error al obtener inyectado' });
    }
  })();
});

//VER RETIROS
app.get('/resumen-retirado', (req, res) => {
  const { id_usuario } = req.query;
  if (!id_usuario) return res.status(400).json({ error: 'Falta id_usuario' });

  const queryAsync = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => err ? reject(err) : resolve(results));
  });

  (async () => {
    try {
      const retirado = await queryAsync(
        `SELECT id_retiro, monto, fecha, descripcion FROM retiro WHERE id_usuario = ? ORDER BY fecha DESC`,
        [id_usuario]
      );
      const totalRetirado = retirado.reduce((acc, r) => acc + parseFloat(r.monto), 0);

      res.json({ total_retirado: totalRetirado, retiradoDetalle: retirado }); // <== NOMBRE CAMPO CORREGIDO AQUÍ
    } catch (error) {
      console.error('Error en /resumen-retirado:', error);
      res.status(500).json({ error: 'Error al obtener retirado' });
    }
  })();
});

//ver ganancia
// Endpoint para calcular ganancias por tarjetas con deudaactual = 0
// GET /api/ganancias?id_usuario=14
app.get('/api/ganancias', (req, res) => {
  const { id_usuario } = req.query;

  if (!id_usuario) {
    return res.status(400).json({ error: 'Falta el parámetro id_usuario' });
  }

  const query = `
    SELECT 
      t.id_tarjeta, 
      t.valortotal, 
      t.valor,
      (t.valortotal - t.valor) AS ganancia
    FROM tarjetas t
    JOIN clientes c ON t.id_cliente = c.id_cliente
    WHERE t.deudaactual = 0 AND c.id_usuario = ?
  `;

  db.query(query, [id_usuario], (err, results) => {
    if (err) {
      console.error('Error al calcular ganancias:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    const gananciaTotal = results.reduce((sum, row) => sum + row.ganancia, 0);

    res.json({ gananciaTotal, detalles: results });
  });
});


                    ////////////////////////////////////////////////////////////////
                    ///////////////     DETALLE DE TARJETAS           //////////////
                    ////////////////////////////////////////////////////////////////
app.post('/clientes/orden', (req, res) => {
  const { ordenes } = req.body; // [{ id_cliente: 1, orden: 0 }, ...]

  if (!ordenes || !Array.isArray(ordenes)) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const updates = ordenes.map(({ id_cliente, orden }) => {
    return new Promise((resolve, reject) => {
      db.query(
        'UPDATE clientes SET orden = ? WHERE id_cliente = ?',
        [orden, id_cliente],
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });
  });

  Promise.all(updates)
    .then(() => res.json({ success: true }))
    .catch((err) => {
      console.error('Error al actualizar orden:', err);
      res.status(500).json({ error: 'Error al guardar orden' });
    });
});



//////////////////////////////////////////////////



// Ruta para manejar errores 404
app.use((req, res) => {
  res.status(404).send('Ruta no encontrada');
});

// Configuración del puerto
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
