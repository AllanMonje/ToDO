var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var webToken = require('jsonwebtoken');
require('dotenv').config();
var nodemailer = require("nodemailer");

var mysql = require("mysql");

router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});


var con = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "12345Ammg.",
    database: "todo"
});

//INSERTAR UN USUARIO NUEVO
router.post('/insertar_usuario', (req, res, next) =>{
    var queryCondicion = 'SELECT * FROM usuarios WHERE email = ?';
    var valores = [req.body.email];
    
    var values = [req.body.email, req.body.password];

    if(req.body.email == undefined || req.body.email == "" || req.body.password == undefined || req.body.password == ""){
        res.status(400).json({
            message: "Llene todos los campos",
            status: res.statusCode
        });
    }else {
        con.query(queryCondicion, valores, (err, result, field)=> {
            if(result == 0){                 
               
                var user = {
                    email: req.body.email,
                    password: req.body.password
                };

                const create_user = (user) => {
                    var query = 'INSERT INTO usuarios (email, password) VALUES (?)';
                    
                    con.query(query, [Object.values(user)], (err, result, field)=> {
                        if(err){
                            next(err);
                        }else{
                            //AQUI
                            var queryCondicion = 'SELECT email FROM usuarios WHERE email = ?';
                               con.query(queryCondicion, valores, (err, rows, field)=> {
                                 
                                    if (err){
                                        throw err;
                                    }else {
                                        const expiresIn = 24 * 60 * 60;
                                        const accessToken = webToken.sign({ id: rows }, 'my_secret_key', { expiresIn: expiresIn });   
                                        const dataUser = {
                                            id_usuario: rows[0],
                                            email: req.body.email,
                                            accessToken: accessToken,
                                            expiresIn: expiresIn
                                          }                         
                                        res.status(200).json({dataUser});
                                    }
                                    
    
                                });
    
                            
                        }
                    });
                    
                };

                bcrypt.hash(user.password, 10).then((hashedPassword)=> {
                    user.password = hashedPassword;
                    create_user(user);
                })
                
                
            }else{
                res.send({status:'Ya existe una cuenta registrada con ese email'});
                next(err);
            }
        });
    }

});

//EDITAR UN USUARIO
router.put('/update_usuario', (req, res, next) =>{
    var user = {
        email: req.body.email,
        password: req.body.password
    };

    const create_user = (user) => {
        var query = 'UPDATE usuarios SET password=? WHERE email = ?';
        var values = [user.password, req.body.email];

                   con.query(query, values, (err, rows, field)=> {
                     
                        if (err){
                            throw err;
                        }else {
                                                    
                            res.status(200).json('Bien');
                        }
                        

                    });

    };

    bcrypt.hash(user.password, 10).then((hashedPassword)=> {
        user.password = hashedPassword;
        create_user(user);
    })
    

});


//API LOGIN
router.post('/login', (req, res, next) =>{
        var user = {
            email: req.body.email,
            password: req.body.password
        };
        const get_token = (user) => {
            var query = 'SELECT email, password FROM usuarios WHERE email = ?';

            con.query(query, [user.email], (err, result, fields)=>{
                if (err || result.length == 0) {
                    console.log(err);
                    res.status(400).json({message:"Email o Contraseña Incorrectos"});
                } else {
                    bcrypt.compare(user.password,result[0].password, (error, isMatch)=> {
                        if (isMatch){
                            const expiresIn = 24 * 60 * 60;
                                    const accessToken = webToken.sign({ id: result[0].id }, 'my_secret_key', { expiresIn: expiresIn });   
                                    const dataUser = {
                                        id_usuario: result[0],
                                        email: req.body.email,
                                        accessToken: accessToken,
                                        expiresIn: expiresIn
                                      }                         
                                    res.status(200).json({dataUser});

                        }else if (error){
                            res.status(400).json(error);
                        }else {
                            res.status(400).json({message: "Usuario o Contraseña Incorrectos"});
                        }
                    });
                }
            });
        }
        get_token(user);
});


// OBTENER TAREAS EN ESTADO PENDIENTE
router.get('/get_tareas', (req, res, next) =>{
    var query = 'select * from tareas where email_usuario = ? and estado = 1'
    var values = [req.query.email];
    con.query(query, values, (err, result, field)=> {
        if(err){
            next(err);
        }else{
            console.log(result);
            res.status(200).json(result);
        }
    });
});

// OBTENER TAREAS EN ESTADO REALIZADO
router.get('/get_tareas_realizadas', (req, res, next) =>{
    var query = 'select * from tareas where email_usuario = ? and estado = 0'
    var values = [req.query.email];
    con.query(query, values, (err, result, field)=> {
        if(err){
            next(err);
        }else{
            console.log(result);
            res.status(200).json(result);
        }
    });
});

//INSERTAR NUEVA TAREA
router.post('/insertar_tarea', (req, res, next) =>{
    var query = 'INSERT INTO tareas (titulo, descripcion, estado, email_usuario) VALUES (?,?,?,?)';
    var values = [req.body.titulo, req.body.descripcion, req.body.estado, req.body.email_usuario];

    con.query(query, values, (err, result, field)=> {
        if(err){
            next(err);
        }else{
            res.status(200).json(result);
        }
    });
});

//ACTUALIZAR TAREA
router.put('/update_tarea', (req, res, next) =>{
    var query = 'UPDATE tareas SET titulo=?, descripcion=?, estado=? WHERE email_usuario= ? and id_tarea = ?';
    var values = [req.body.titulo,req.body.descripcion, req.body.estado, req.body.email_usuario, req.body.id_tarea];

    con.query(query, values, (err, result, field)=> {
        if(err){
            next(err);
        }else{
            res.status(200).json(result);
        }
    });
});

//ELIMINAR TAREA REALIZADA
router.delete('/eliminar_tarea', (req, res, next) =>{
    var query = 'DELETE FROM tareas WHERE id_tarea = ?';
    var values = [req.query.id_tarea];

    con.query(query, values, (err, result, field)=> {
        if(err){
            next(err);
        }else{
            res.status(200).json(result);
        }
    });
});

//ACTUALIZAR CONTRASEÑA

router.put('/update_contrasena', (req, res, next) =>{
    var query = 'UPDATE usuarios SET password=? WHERE email_usuario= ?';
    var valor = [req.body.password, req.body.email]

    con.query(query, valor, (err, result, field)=> {
            if(err){
                next(err);
            }else{
      
                res.status(200).json(result);
              }
        });  
    
});


//API ENVIAR EMAIL PARA RESETEO DE CONTRASEÑA
router.post("/send-email",(req, res)=>{
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'allanmonje12@gmail.com',
          pass: '12345ammg' // naturally, eplace both with your real credentials or an application-specific password
        }
    })

    var mailOptions = {
        from: 'allanmonje12@gmail.com',
        to: [req.body.email],
        subject: 'SOLICITUD DE CAMBIO DE CONTRASEÑA',
        text: 'HA SOLICITADO CAMBIO DE CONTRASEÑA, SI NO FUE USTED IGNORE EL MENSAJE, LINK: http://localhost:4200/cambio_contrasena'
    }

    transporter.sendMail(mailOptions, (error, info)=>{
        if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
    });
});



module.exports = router;