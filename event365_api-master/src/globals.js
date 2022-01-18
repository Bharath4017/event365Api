
const morgan = require('morgan');
const express = require('express');
const bodyParser = require('body-parser');
const promiseRouter = require('express-promise-router');
const router = promiseRouter();
const cors = require('cors');
var fs = require('fs');


//const http = require('http');

const http = require('http');

// var key = fs.readFileSync('localhost.key');
// var cert = fs.readFileSync('localhost.crt');
// var ca = fs.readFileSync('localhost.crt');

// var options = {
//   key: fs.readFileSync('./localhost.key'),
//   cert: fs.readFileSync('./localhost.cert'),
//   requestCert: false,
//   rejectUnauthorized: false
// };
const app = express()
  .use(bodyParser.json())
  .use(morgan('dev'))
  .use(router)
  .use(cors({
    credentials: true,
    origin: (origin, callback) => callback(null, true),
  }))

app.use(express.static('public'));
var server = http.createServer(app);
var io = require('socket.io')(server);

module.exports = {
  server,
  io,
  app
};

//-----------------old-----------
// const express	= require('express');
// const http = require('http');

// const app = express();
// var server = http.createServer(app);
// let io = require('socket.io')(server);
// io.on('connection', (socket) => {
//   console.log("socket server log");
//   if(typeof socket.handshake.query.user_id!='undefined'){
//     var user =socket.handshake.query.user_id;
//         console.log('online ');
//    }
//   console.log('new user connected');

// });