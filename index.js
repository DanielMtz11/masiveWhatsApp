const mysql = require('mysql');
const { exit } = require('process');
var pool = mysql.createPool({
    host: '78.138.46.28',
    user: 'aplicacion',
    password: '4pl1c4c10N01!',
    database: 'whatsapp_chatbot6',
    port: '3306'
});

/*
=======================================================
=======================================================
Este es un programa para enviar un mensaje a los que 
se registren a Defi Club. Funciona de la siguiente ma-
nera: 
1. Se agregan a una tabla llamada user_data en la 
base de datos llamada whatsapp_chatbot5, los 
nuevos usuarios que se van registrando a defi_club 
2. Se agregan a una tabla llamada orders en la base de 
datos llamada whatsapp_chatbot5, las nuevas órdenes
(registros) que se hacen en defi_club. 
3. Cada vez que se agrega una nueva orden, se agrega
con un valor de intent = 0.
[3:26 p. m., 23/1/2023] Adrian Techsoft: 4. Este programa verifica si hay una nueva órden con
intent 0. En caso de que la haya, le manda mensaje a
esa persona en whatsapp invitándola a la masterclass y
dándole las gracias por registrarse 
=======================================================
=======================================================
*/

var sender; 
var nombre;
var apellido;
//el product_id lo vamos a ocupar para validar a qué curso o masterclass se registro el usuario, 
//y así enviarle un mensaje respectivo de ese curso o masterclass 
var product_id;
var user_id;

//esta nos dice si el número de teléfono del usuario ya fue limpiado 
var sender_verificado; 

//cambiar intent
function cambiarIntent(id, sender, intent){
    pool.query(`UPDATE whatsapp_chatbot5.user_data SET intent = '${intent}' WHERE sender= '${sender}' AND id='${id}'`);
}

async function enviarMensaje(sender, respuesta){
    cantidadOutbox = await verificarCantidadOutbox();
    if(cantidadOutbox>10){
        return;
    } else {
        pool.query(`INSERT INTO whatsapp_chatbot5.outbox (recipient, sender, tipo_mensaje, message, status, tipo) values ('${sender}', '3003', '1', '${respuesta}', 0, 'M')`, (error, result) => {
            if(error){
                console.log(error);
            }
        });
    }
}

async function enviarArchivo(sender, nombre_archivo){
    cantidadOutbox = await verificarCantidadOutbox();
    if(cantidadOutbox>10){
        return;
    } else { 
        pool.query(`INSERT INTO outbox (recipient, sender, message, status, tipo, archivo) values ('${sender}', '3003', 'archivo',  0, 'D', '/dewindows5/${nombre_archivo}')`, (error, result) => {
            if(error){
                console.log(error);
            }
        });
    }
}

async function arreglarNumeroWhatsapp(sender, user_id){
    return new Promise(resolve => {
        //esta es un array que contiene todas las ladas de teléfono de 3 dígitos 
        const threedigit_country_codes = new Array ('500', '501', '502', '503', '504', '505', '506', '507', '507', '508', '509', '590', '591', '592', '593', '594', '595', '596', '597', '598', '809', '829', '849');
        //esta es un array que contiene todas las ladas de teléfono de 2 dígitos 
        const twodigit_country_codes = new Array ('34', '52', '53', '54', '55', '56', '57', '58');
        //esta es la lada de usa
        const usa_lada = "1";

        /*
        ============================================================================
        ============================================================================
        Ahora que definimos las ladas, vamos a primero verificar si el número de teléfono
        del usuario coincide con la lada de usa (1 sólo dígito), en caso de que no, veremos
        si los dos primeros dígitos del número del usuario coinciden con cualquiera de las ladas
        de dos dígitos, y en caso de que tampoco coincida, verificaremos si coincide con las de 
        tres dígitos.
        ============================================================================
        ============================================================================
        */

        //primero vamos a verificar que el número tenga más de 8 dígitos 
        if(sender != '' && sender.length>8){
            var numeroFinal = '';
            var i;
            //esta variable guardará la lada del número registrado del usuario 
            var lada;
            //luego vamos a eliminar los espacios y caracteres como "+" del número 
            for (i = 0; i<sender.length; i++){
                if(!isNaN(sender[i]) && sender[i] != ' '){
                    numeroFinal = numeroFinal + sender[i];
                }
            }
            //ahora vamos a verificar si el primer dígito pertenece a la lada de usa 
            if (usa_lada == numeroFinal.substring(0,1)){
                lada = numeroFinal.substring(0,1);
                numeroFinal = numeroFinal.slice(1, numeroFinal.length);
            } //Como no pertecene a la lada de usa, vamos a verificar si los primeros dígitos pertenecen a las ladas de dos dígitos 
            else if (twodigit_country_codes.includes(numeroFinal.substring(0,2))){
                lada = numeroFinal.substring(0,2);
                numeroFinal = numeroFinal.slice(2, numeroFinal.length);
            } //como no pertenecen a la lada de dos dígitos, vamos a ver si pertenecen a la lada de tres dígitos 
            else if (threedigit_country_codes.includes(numeroFinal.substring(0,3))){
                lada = numeroFinal.substring(0,3);
                numeroFinal = numeroFinal.slice(3, numeroFinal.length);
            }

            //ahora vamos a juntar lada + número 1 (necesario para whatsapp) + numero de teléfono sin lada
            numeroFinal = lada + "1" + numeroFinal;
            //guardamos el número en la bdd 
            pool.query(`UPDATE whatsapp_chatbot5.user_data SET sender = '${numeroFinal}' WHERE user_id = '${user_id}'`);
            //ponemos el número como verificado
            pool.query(`UPDATE whatsapp_chatbot5.user_data SET sender_verificado = '1' WHERE user_id = '${user_id}'`);
            resolve([true,sender]);
        } else {
            //si el número está mal ponemos un '0000'
            pool.query(`UPDATE whatsapp_chatbot5.user_data SET sender = '0000' WHERE user_id = '${user_id}'`);
            //ponemos el número como verificado
            pool.query(`UPDATE whatsapp_chatbot5.user_data SET sender_verificado = '1' WHERE user_id = '${user_id}'`);
            resolve([false,sender]);
        }
    });
}

//función para ver si el número de whatsapp del usuario ya se arregló 
async function validarNumero(user_id){
    return new Promise(resolve => {
            pool.query(`SELECT * FROM user_data WHERE user_id = ${user_id}`, (error, result) => {
                if(!error){
                    if(result[0] != undefined){
                        sender_verificado = result[0].sender_verificado;
                        sender = result[0].sender;
                        if(sender_verificado == 1){
                            resolve(true);
                        } else if (sender_verificado == 0){
                            resolve(false);
                        }
                        
                    }
                } 
        });
    });
}

async function obtenerDatosUsuario(user_id){
    return new Promise(resolve => {
        pool.query(`SELECT * FROM user_data WHERE user_id = ${user_id} AND sender != '0000' LIMIT 1`, (error, result) => {
            if(!error){
                if(result[0] != undefined){
                    sender = result[0].sender;
                    product_id = result[0].product_id;
                    resolve([sender, product_id]);
                    
                }
            } 
        }); 
    });
}

//con esta función vamos a verificar si hay nuevas órdenes, en caso de que la haya, le mandamos un 
//whatsapp al usuario invitándolo a la masterclass 
async function verificarNuevasOrdenes (){
    var numeroCorrecto;
    var datosUsuario;

    pool.query(`SELECT * FROM orders WHERE intent = 0 LIMIT 1`, (error, result) => {
        if(!error){
            if(result[0] != undefined){
                nombre = result[0].nombre;
                user_id = result[0].user_id;
                apellido = result[0].apellido;     
            }
        }
    })

    //vemos si ya se intentó arreglar el sender 
    var numeroValidado = await validarNumero(user_id);
    if (numeroValidado == true){
        //obtenemos los datos de el usuario que acaba de crear una nueva órden
        datosUsuario  = await obtenerDatosUsuario(user_id);
        if(datosUsuario){
            sender = datosUsuario[0];
            product_id =  datosUsuario[1];
            enviarMensaje(sender, "tu numero ya está validado");
        }
    } else if (numeroValidado == false ){
        numeroArreglado = arreglarNumeroWhatsapp(sender, user_id).then(() => {
            //SI se pudo arreglar, le mandamos el mensaje, sino imprimimos que no se pudo
            if (numeroArreglado[0] == true) {
                sender = numeroArreglado[1];
                //obtenemos el product_id
                datosUsuario  = obtenerDatosUsuario(user_id);
                if(datosUsuario){
                    product_id =  datosUsuario[1];
                }
                //enviamos el mensaje que queremos 
                enviarMensaje(sender, "hola, tu número se acaba de validar correcto");
            } else if (numeroArreglado[0] == false){
                console.log("El número esta incompleto");
            }
            
        });
    }

}


//=============================Correr función ===========================================

//Después vamos a cambiar esta función para que ya solo corra cada 4000 msegundos y no en todo este tiempo
//setInterval(verificarNuevasOrdenes, 4000);

(function loop() {
    var rand = Math.round(Math.random() * (120000 - 35000)) + 35000;
    setTimeout(function() {
            verificarNuevasOrdenes();
            loop();  
    }, rand);
}());