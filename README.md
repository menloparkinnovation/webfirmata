
# webfirmata

A remote version of Firmata using Javascript, WebSockets, NodeJS, Express, and AngularJS

09/08/2016

# Menlo Firmata Web Project

This provides a remotable firmata client to any modern web browser that
supports javascript and websockets.

It was written when it was realized no web client for Firmata existed,
though examples of setting a pin or two are on the web.

It has evolved to become an example template application for an end
to end web application IoT client.

It offers:

Communicate with standard Firmata from Node.js
  - Arduino UNO reference platform
  - Others supported that communicate over USB serial with standard firmata
  - Easily extended to firmata over bluetooth, etc.

Client<->Server communications using socket.io/web sockets
  - server side for node.js
  - client side for browser

Express web server for Node.js
  - Proper project layout
  - Proper routing, static resource handling, etc.
  - Routing for bower_components, client side dependencies

AngularJS Material Design rich web client
  - Proper MVC separation
  - Use of up to date libraries, style sheets, etc.

Use of bower for client side dependencies
  - AngularJS
  - AngularJS Material
  - socket.io
  - Angular socket.io

Use of npm for server side dependencies
  - Express
  - socket.io
  - firmata node.js client

# installation

= bring in required node modules from package.json

npm install

= bring in bower_components from bower.json

bower install

= run it

npm start

= browse to

http://localhost:3000
