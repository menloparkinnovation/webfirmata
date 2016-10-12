
//
// Web Firmata Client Library
//
// 10/05/2016
//
// This is a relatively self contained library for communicating
// with the remote firmata server over websockets.
//
// It's purpose is to keep the firmata/board specific code out of
// the UI javascript and serve as readily re-used code.
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

// Published interface
var webfirmata = {};

//
// Wait for board connection
//
// callback(error)
//
webfirmata.waitForBoardConnect = function(socket, callback) {
    console.log("waitForBoardConnect");

    //
    // Use a socket.io transaction by supplying an ackknowledgement function.
    //
    socket.emit('waitForBoardConnect', null, function(data) {

        //
        // data.data is a boolean whether a board is connected
        //

        if (data.error != null) {
            console.log("waitForBoardConnect: error=" + data.error);
            callback(data.error, null);
        }
        else if (!data.data) {
            console.log("waitForBoardConnect: no board");
            callback("no board", null);
        }
        else {
            webfirmata.createBoard(socket, callback);
        }
    });
};

//
// callback(error, board)
//
webfirmata.createBoard = function(socket, callback) {
    var board = {};

    board.socket = socket;

    //
    // Get the board configuration.
    //
    // This may take a while until a board becomes available
    // depending on the servers configuration.
    //
    // callback(error, boardConfig)
    //
    board.getBoardConfig = function(callback) {

        console.log("getBoardConfig");

        //
        // Use a socket.io transaction by supplying an ackknowledgement function.
        //
        board.socket.emit('boardConfig', null, function(data) {

            if (data.error != null) {
                console.log("boardConfig: error=" + data.error);
                callback(data.error, null);
                return;
            }

            var boardConfig = data.data;

            console.log("boardConfig.MODES=");
            console.log(boardConfig.MODES);

            console.log("boardConfig.pins[]=");
            console.log(boardConfig.pins);

            callback(null, boardConfig);
        });
    };

    //
    // Get the boards current modes and state.
    //
    // callback(error, boardConfig)
    //
    board.getBoardModes = function(callback) {

        console.log("getBoardModes");

        //
        // Use a socket.io transaction by supplying an ackknowledgement function.
        //
        board.socket.emit('boardModes', null, function(data) {

            if (data.error != null) {
                console.log("boardModes: error=" + data.error);
                callback(data.error, null);
            }
            else {
                var boardModes = data.data;

                console.log("boardModes.modes[]=");
                console.log(boardModes.modes);

                console.log("boardModes.readState[]=");
                console.log(boardModes.readState);

                console.log("boardModes.writeState[]=");
                console.log(boardModes.writeState);

                callback(null, boardModes);
            }
        });
    };

    //
    // Get pin mode number for name.
    //
    board.getPinModeNumber = function(boardConfig, modeName) {
        return board.MODES[modeName];
    };

    //
    // Return the string name of the mode given by modeNumber
    //
    board.getPinModeName = function(modeNumber) {

        //
        // An object MODES has a field name for for each mode
        // with an integer mode number as each field value
        //
        // Note: The mode integers do not represent the index of
        // the name but can be in any order and have gaps.
        //
        // boardConfig.MODES=
        // { INPUT: 0,
        //   PWM: 3,
        //     ...
        // };
        //

        var modeKeys = Object.keys(board.MODES);

        // Now look for a number match
        for (var index = 0; index < modeKeys.length; index++) {

            if (board.MODES[modeKeys[index]] == modeNumber) {
                return modeKeys[index];
            }
        }

        return "UNKNOWN";
    }

    //
    // Returns the analog pin number (Arduino style boards) for
    // the given pin number.
    //
    // Returns -1 if its not an analog pin.
    //
    board.isAnalogPin = function(pin) {

        var pinEntry = board.pins[pin];

        if (pinEntry.analogChannel != 127) {
            return pinEntry.analogChannel;
        }

        return -1;
    };

    //
    // Setup the modes for a given pin based on boardConfig
    //
    board.getPinModesAsString = function(pin) {
        var pinModes = [];

        var pinEntry = board.pins[pin];

        var modeIndex = 0;

        //
        // The pin modes are described by a number which is matched
        // in boardConfig.MODES.
        //
        for (var index = 0; index < pinEntry.supportedModes.length; index++) {

            var modeName = board.getPinModeName(pinEntry.supportedModes[index]);

            if (modeName != "UNKNOWN") {
                pinModes[modeIndex++] = modeName;
            }
        }

        return pinModes;
    };

    //
    // callback(error)
    //
    board.pinMode = function(pin, mode, pinState, callback) {

        //
        // Use a socket.io transaction by supplying an ackknowledgement function.
        //
        board.socket.emit('pinMode', {pin: pin, mode: mode, state: pinState}, function(data) {

            if (data.error != null) {
                callback(data.error);
            }
            else {
                callback(null);
            }
        });
    };

    //
    // There are four communication options:
    //
    // socket.emit(data) => requires a client connection
    //
    // socket.emit(data, func) => transaction. Server invokes func() when done processing.
    //
    // socket.volatile.emit(data) => no indication if client is not connected
    //
    // socket.broadcast.emit(data) => broadcast to any current listeners.
    //
    //
    board.digitalWrite = function(pin, state) {

        if (state) {
            board.socket.emit('digitalWrite', {pin: pin, state: 1});
            console.log('digitalWrite(' + pin + ', HIGH)');
        }
        else {
            board.socket.emit('digitalWrite', {pin: pin, state: 0});
            console.log('digitalWrite(' + pin + ', LOW)');
        }
    };

    //
    // Write an analog (typically PWM) value to the remote board.
    //
    board.analogWrite = function(pin, level) {
        board.socket.emit('analogWrite', {pin: pin, state: level});
    };

    //
    // The following code executes during board construction.
    //

    //
    // Get the board configuration with modes, pins, analogPins, etc.
    //
    board.getBoardConfig(function(error, boardConfig) {

        if (error != null) {
            callback(error, null);
            return;
        }

        board.MODES = boardConfig.MODES;
        board.pins = boardConfig.pins;
        board.analogPins = boardConfig.analogPins;

        //
        // Board is constructed
        //

        callback(null, board);
    });
};
