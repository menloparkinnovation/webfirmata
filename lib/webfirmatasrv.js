//
// Web Firmata Server Library
//
// 10/09/2016
//
// This is a relatively self contained library for serving firmata
// over websockets.
//
// It's purpose is to keep the firmata/board specific code out of
// the main express server code.
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

// Firmata client
var firmata = require("firmata");

function WebFirmata() {

    this.traceLog = true;

    this.boardConnected = false;
    this.boardArrivalFunction = null;

    this.boardState = {
        pinMode: [],        // current pinMode()
        pinReadState: [],   // current read value received in input
        pinWriteState: [],  // last value written.
        pinReaderActive: [] // true if inputRead(pin, func) is active
    };

    this.board = null;
}

//
// Create board instance from serial port already opened.
//
WebFirmata.prototype.createBoardInstance = function(port) {

    var self = this;

    var board = new firmata.Board(port);

    board.on("ready", function() {
        console.log('Arduino connected to firmata');
        self.configureNewBoard(board);
    });
}

//
// After we have opened the board there is some time until
// its ready for use.
//
WebFirmata.prototype.configureNewBoard = function(board) {

    var self = this;

    self.configureBoard(board);

    //
    // Now publish the board
    //
    self.board = board;

    self.boardConnected = true;

    // TODO: Event list!, important for multiple client support.
    if (self.boardArrivalFunction != null) {
        self.boardArrivalFunction({error: null, data: false});
        selfboardArrivalFunction = null;
    }
}

//
// Parse data received from the client as to whether its in the proper format
//
WebFirmata.prototype.parseArguments = function(data) {

   var self = this;

   var args = {};

    //
    // data.pin   => digital pin#
    // data.state => state variable. 0, 1 or a range for analog.
    //

    args.pin = -1;
    args.state = 0;

    try {
        args.state = data.state;

        // set pin value last, since it indicates if an exception occurs
        args.pin = data.pin;

    } catch (e) {
        // args.pin == -1 indicates error
    }

    if (args.pin == -1) {
        console.log('bad argument data received');
    }

    //
    // This keeps the client from causing various server arrays from overflowing
    // on invalid pin addresses.
    //
    if (args.pin > self.maxPins) {
        console.log('Greater than MaxPins received ' + args.pin);
        args.pin = -1;
    }

    return args;
}

WebFirmata.prototype.parseModeArguments = function(data) {

    var self = this;

    //
    // Parse pin, state arguments
    //
    var args = self.parseArguments(data);
    if (args.pin == -1) {
        return args;
    }

    //
    // Look for the mode argument
    //
    try {
        args.mode = data.mode;
    } catch (e) {
        // args.pin == -1 indicates error
        args.pin = -1;
    }

    return args;
}

/*

Firmata reports a board configuration with board.MODES
and board.pins.

The examples below are for an Arduino UNO.

board.MODES=
{ INPUT: 0,
  OUTPUT: 1,
  ANALOG: 2,
  PWM: 3,
  SERVO: 4,
  SHIFT: 5,
  I2C: 6,
  ONEWIRE: 7,
  STEPPER: 8,
  SERIAL: 10,
  PULLUP: 11,
  IGNORE: 127,
  PING_READ: 117,
  UNKOWN: 16 }

board.pins[]=
[ { supportedModes: [],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 127 },
  { supportedModes: [],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 127 },
  { supportedModes: [ 0, 1, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 127 },
  { supportedModes: [ 0, 1, 3, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 127 },
  { supportedModes: [ 0, 1, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 127 },
  { supportedModes: [ 0, 1, 3, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 127 },
  { supportedModes: [ 0, 1, 3, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 127 },
  { supportedModes: [ 0, 1, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 127 },
  { supportedModes: [ 0, 1, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 127 },
  { supportedModes: [ 0, 1, 3, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 127 },
  { supportedModes: [ 0, 1, 3, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 127 },
  { supportedModes: [ 0, 1, 3, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 127 },
  { supportedModes: [ 0, 1, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 127 },
  { supportedModes: [ 0, 1, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 127 },
  { supportedModes: [ 0, 1, 2, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 0 },
  { supportedModes: [ 0, 1, 2, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 1 },
  { supportedModes: [ 0, 1, 2, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 2 },
  { supportedModes: [ 0, 1, 2, 4, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 3 },
  { supportedModes: [ 0, 1, 2, 4, 6, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 4 },
  { supportedModes: [ 0, 1, 2, 4, 6, 11 ],
    mode: undefined,
    value: 0,
    report: 1,
    analogChannel: 5 } ]

board.analogPins[]=
[ 14, 15, 16, 17, 18, 19 ]

*/

WebFirmata.prototype.configureBoard = function(board) {

    var self = this;

    console.log("board.MODES=");
    console.log(board.MODES);

    console.log("board.pins[]=");
    console.log(board.pins);

    console.log("board.analogPins[]=");
    console.log(board.analogPins);

    var maxPins = board.pins.length;

    // For argument validation
    self.maxPins = maxPins;

    for (var index = 0; index < maxPins; index++) {
        self.boardState.pinReadState[index] = 0;
    }

    for (var index = 0; index < maxPins; index++) {
        self.boardState.pinWriteState[index] = 0;
    }

    for (var index = 0; index < maxPins; index++) {
        self.boardState.pinReaderActive[index] = false;
    }

    //
    // We leave the board state untouched until commands come
    // from the remote UI.
    //
    // This allows customized firmata configurations for a specific
    // application to not have their power on/default mode settings
    // changed.
    //
    // We expect the Firmata firmware to communicate its state
    // through board.pins[pin].mode.
    //

    // Initialize boardState
    for (var index = 0; index < maxPins; index++) {
         self.boardState.pinMode[index] = board.pins[index].mode;
    }
}

//
// Firmata reports which pins support which modes in the
// board.pins[pin].supportedModes[] array.
//
// This validates if the proposed mode is supported for the pin.
//
WebFirmata.prototype.isPinModeSupported = function(board, pin, mode) {

    var self = this;

    // Mode is not recognized
    if (mode == board.MODES.UNKNOWN) {
        console.log("mode string not recognized " + mode);
        return false;
    }

    // pin# to high
    if (pin > board.pins.length) {
        console.log("pin number to high for board.pins.supportedModes " + pin);
        return false;
    }

    // See if the pin supports it
    for (var index = 0; index < board.pins[pin].supportedModes.length; index++) {
        if (board.pins[pin].supportedModes[index] == mode) {
            return true;
        }
    }

    // Mode not configured for pin by Firmata
    console.log("firmata does not support mode " + mode + " on pin " + pin);

    return false;
}

//
// This returns the analog pin number for the pin
// if it exists.
//
WebFirmata.prototype.getAnalogPinNumber = function(board, pin) {

    if (board.pins[pin].analogChannel == 127) {
        return -1;
    }
    else {
        return board.pins[pin].analogChannel;
    }
}

//
// Start a inputPin reader
//
// Note: inputPin readers are cancelled by mode change with pinMode().
//
// socket - web socket that the request came in on. Required for async readers.
//
// board - Firmata board to operate on.
//
// pin - pin to open the reader on.
//
// mode - pin mode to start the reader for.
//
WebFirmata.prototype.inputPinReader = function(socket, board, pin, mode) {

    var self = this;

    // Indicate reader is active.
    self.boardState.pinReaderActive[pin] = true;

    if ((mode == board.MODES.INPUT) || (mode == board.MODES.PULLUP)) {

        board.digitalRead(pin, function(value) {

            if (self.boardState.pinReadState[pin] != value) {
                self.boardState.pinReadState[pin] = value;

                //console.log("digitalRead: pin state changed for pin " + pin + " value=" + value);

                socket.emit('inputPinReader', {pin: pin, state: value});
            }
            else {
                //console.log("digitalRead: pin state not changed for pin " + pin + " value=" + value);
            }
        });
    }
    else if (mode == board.MODES.ANALOG) {

        //
        // Note: Though its not documented in the firmata.js documentation
        // analogRead() must take the analog pin number, not the number from
        // the board report in board.pins[].
        //
        // Otherwise an exception is thrown.
        //

        var analogPin = self.getAnalogPinNumber(board, pin);

        console.log("starting analogRead() for pin " + pin + " analogPin " + analogPin);

        board.analogRead(analogPin, function(value) {

            if (self.boardState.pinReadState[pin] != value) {
                self.boardState.pinReadState[pin] = value;

                //console.log("analogRead: pin state changed for pin " + pin + " value=" + value);

                socket.emit('inputPinReader', {pin: pin, state: value});
            }
            else {
                //console.log("analogRead: pin state not changed for pin " + pin + " value=" + value);
            }
        });
    }
}

//
// Mode changes can involve registering reader callback functions, etc.
//
// socket - web socket that the request came in on. Required for async readers.
//
// board - Firmata board to operate on.
//
// pin - pin to change mode on.
//
// mode - mode to change to.
//
// initialState - Initial State of pin when changed to new mode.
//
WebFirmata.prototype.processModeChange = function(socket, board, pin, mode, initialState) {

    var self = this;

    //
    // Validate that board.pins[] supports the mode.
    //
    if (!self.isPinModeSupported(board, pin, mode)) {
        return false;
    }

    //
    // Analog pin number/name translation
    //
    // board.analogPins[]
    //
    //   Index is the Arduino A0 - A5, and the result is its
    //   index in board.pins[].
    //
    //   This indexes analog pin 5 (A5)
    //   board.pins[board.analogPins[5]];
    //

    console.log("board.pinMode(" + pin + ", " + mode + ")");

    board.pinMode(pin, mode);

    self.boardState.pinMode[pin] = mode;

    //
    // Outstanding readers are cancelled by mode change
    //
    self.boardState.pinReaderActive[pin] = false;

    //
    // If its output, set its initial state
    //
    if (mode == board.MODES.OUTPUT) {
        self.boardState.pinWriteState[pin] = initialState;

        if (initialState) {
            board.digitalWrite(pin, board.HIGH);
        }
        else {
            board.digitalWrite(pin, board.LOW);
        }
    }

    //
    // If its an input mode, start a reader for the data updates.
    //
    if ((mode == board.MODES.INPUT) || (mode == board.MODES.PULLUP) || (mode == board.MODES.ANALOG)) {

        console.log("starting inputPinReader for pin " + pin);

        self.inputPinReader(socket, board, pin, mode);
    }

    return true;
}

//
// A new client socket connection has arrived.
//
// Setup the Firmata web event handlers on it.
//
WebFirmata.prototype.newSocketClient = function(socket) {

    var self = this;

    console.log('web client connected');

    console.log(socket.id);

    socket.on('disconnect', function() {
        console.log("web client disconnected");
    });

    //
    // Socket event handlers
    //

    //
    // Wait for a board arrival event
    //
    socket.on('waitForBoardConnect', function (data, ackfn) {

        if (self.boardConnected) {
            ackfn({error: null, data: true });
            return;
        }

        //
        // Place the ackfn where the board arrival can indicate it.
        //

        self.boardArrivalFunction = ackfn;
    });

    //
    // boardConfig returns the board configuration reported by firmata.
    //
    // {
    //   error: "error message or null for success",
    //   data: board_configuration
    // };
    //
    socket.on('boardConfig', function (data, ackfn) {

        if (!self.boardConnected) {
            ackfn({error: "boardConfig: board not connected"});
            return;
        }

        var boardConfig = {};

        boardConfig.MODES = self.board.MODES;
        boardConfig.pins = self.board.pins;
        boardConfig.analogPins = self.board.analogPins;

        ackfn({error: null, data: boardConfig});
    });

    //
    // Query the current modes and state of the board.
    //
    socket.on('boardModes', function (data, ackfn) {

        if (!self.boardConnected) {
            ackfn({error: "boardMode: board not connected"});
            return;
        }

        var boardModes = {};

        boardModes.modes = self.boardState.pinMode;

        // Return pin states
        boardModes.readState = self.boardState.pinReadState;
        boardModes.writeState = self.boardState.pinWriteState;

        ackfn({error: null, data: boardModes});
    });

    //
    // pinMode expects a mode string which matches board.MODES structure.
    //
    // Arguments:
    //
    // data:
    //
    //  {
    //    pin: pin_number,
    //    mode: new_mode_as_in_modes[],
    //    state: initial state of pin for new mode
    //  }
    //
    // ackfn: function(data) to invoke with response/ack
    //
    //   { error: null } // success
    //   { error: "error message" } // error
    //
    socket.on('pinMode', function (data, ackfn) {

        var args = self.parseModeArguments(data);
        if (args.pin == -1) {
            console.log('pinMode() bad argument data received');
            ackfn({error: "bad pin"});
            return;
        }

        if (args.mode == self.board.MODES.UNKNOWN) {
            console.log('pinMode() bad mode ' + args.mode);
            ackfn({error: "bad pin mode"});
            return;
        }

        if (self.traceLog) {
            console.log('pinMode(' + args.pin + ', ' + args.mode + ', ' + args.state + ') received');
        }

        if (self.boardConnected) {

            // process Mode Change
            if (!self.processModeChange(socket, self.board, args.pin, args.mode, args.state)) {
                console.log('pinMode() mode rejected by board ' + args.mode + ' for pin ' + args.pin);
                ackfn({error: "mode change rejected by board"});
            }
            else {
                ackfn({error: null});
            }
        }
        else {
           console.log('pinMode: no board');
           ackfn({error: "no board connected"});
        }
    });

    //
    // Arguments:
    //
    //  {
    //    pin: pin_number,
    //    state: 0 or 1
    //  }
    //
    socket.on('digitalWrite', function (data) {

        var args = self.parseArguments(data);
        if (args.pin == -1) {
            console.log('digitalWrite() bad argument data received');
            return;
        }

        if (self.traceLog) {
            console.log('digitalWrite(' + args.pin + ', ' + args.state + ') received');
        }

        if (self.boardConnected) {

            if (args.state) {
                self.board.digitalWrite(args.pin, self.board.HIGH);
            }
            else {
                self.board.digitalWrite(args.pin, self.board.LOW);
            }

            self.boardState.pinWriteState[args.pin] = args.state;

            if (self.traceLog) {
               console.log('digitalWrite: success');
            }
        }
        else {
           console.log('digitalWrite: no board');
        }
    });

    socket.on('digitalRead', function (data) {
        console.log("digitalRead not implemented");

        //
        // digitalReads are pushed as events to the client
        // when a digital input mode is selected.
        //

        //
        // A pull mode could be implemented to minimize change traffic
        // by reading a local variable updated by the pin change event handler.
        //
    });

    socket.on('analogWrite', function (data) {

        var args = self.parseArguments(data);
        if (args.pin == -1) {
            console.log('analogWrite() bad argument data received');
            return;
        }

        if (self.traceLog) {
            console.log('analogWrite(' + args.pin + ', ' + args.state + ') received');
        }

        if (self.boardConnected) {

            // args.state is the analog level
            self.board.analogWrite(args.pin, args.state);
        }
        else {
           console.log('analogWrite: no board');
        }
    });

    socket.on('analogRead', function (data) {
        console.log("analogRead not implemented");

        // see notes for digitalRead.
    });

    socket.on('servoWrite', function (data) {
        console.log("servoWrite not implemented");
    });

    socket.on('servoConfig', function (data) {
        console.log("servoConfig not implemented");
    });
};

module.exports = {
  WebFirmata: WebFirmata
};
