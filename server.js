
// On USB hub
var ArduinoPort = "/dev/cu.usbmodem14271";

// Directly connected to MacBookAir
//var ArduinoPort = "/dev/cu.usbmodem1421";

var HttpPort = 3000;

//
// Web Firmata
//
//
// 09/25/2016
//
// Original example from the following but heavily updated/modified/replaced.
// https://www.codetutorial.io/nodejs-socket-io-and-jhonny-five-to-control-arduino/
//
//
// The MIT License (MIT)
// Copyright (c) 2016 Menlo Park Innovation LLC
// 
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.
//

// Express web server infrastructure
var express        = require('express');  
var app            = express();  

// HTTP Server
var httpServer = require("http").createServer(app);  

// web sockets
var io=require('socket.io')(httpServer);
 
// Javascript Firmata client
var firmata = require("firmata");
 
// WebFirmata Server Module
var webfirmataFactory = require("./lib/webfirmatasrv.js");
var webfirmata = new webfirmataFactory.WebFirmata();

//
// Setup Express Routes
//

//
// This sets up routing for the following basic project layout:
//
// "/html/file.html"     ==> "public/html/file.html"
// "/css/file.css"       ==> "public/css/file.css"
// "/javascript/file.js" ==> "public/javascript/file.js"
//
app.use(express.static(__dirname + '/public'));

//
// Configure route to the default home page from '/'
//
app.get('/', function(req, res) {
        res.sendFile(__dirname + '/public/html/index.html');
});

//
// Setup routing which allows the direct serving of bower managed standard
// client side library components.
//
// This way bower updates are automatically available to the clients.
//
// This sets up routing for "/lib/module/library.js" ==> "bower_components/module/library.js"
//
app.use('/lib', express.static(__dirname + '/bower_components'));

//
// Currently no REST interfaces are used as all requests come
// from the client through web sockets.
//
// If REST client requests are supported in the future, add the
// express routes here.
//

//
// Setup HTTP Server
//

httpServer.listen(HttpPort);
console.log('Server available at http://localhost:' + HttpPort);

//
// Setup web Socket connection listener
//
io.on('connection', function (socket) {

    console.log('web client connected');
    console.log(socket.id);
 
    //
    // Tell the self contained firmata server about the new client connection.
    //

    webfirmata.newSocketClient(socket);
});
 
//
// In order to wait until the board is plugged in we need
// to manage the serial port opening sequence manually before
// we attempt to construct the Board object.
//

//
// This re-uses the implementation of node SerialPort brought in by Firmata.js
//
var serialPortFactory = require("./node_modules/firmata/node_modules/serialport");

function tryOpenSerialPort(serialPortName, callback) {

    var serialPortSettings = {
        baudRate: 57600,
        bufferSize: 256
        };

    var serialPort = new serialPortFactory.SerialPort(serialPortName, serialPortSettings);

    serialPort.on("error", function(error) {
        console.log(error);
        callback(error, null);
    });

    serialPort.on("open", function() {
        callback(null, serialPort);
    });
}

function tryOpenSerialPortCallback(error, newSerialPort) {

    var timeoutObject = null;

    if (error != null) {

        console.log("Please connect a board.....");

        //
        // Poll for a Firmata board arrival every 10 seconds
        //
        timeoutObject = setTimeout(function() {

            tryOpenSerialPort(ArduinoPort, tryOpenSerialPortCallback);

        }, 10 * 1000);
    }
    else {
        console.log("tryOpenSerialPortCallback: port opened");

        //
        // Now create a Board instance with the serialPort
        //

        webfirmata.createBoardInstance(newSerialPort)
    }
}

//
// Try and open the serial port.
//
// Once open it will connect it with a Board instance.
//
tryOpenSerialPort(ArduinoPort, tryOpenSerialPortCallback);
