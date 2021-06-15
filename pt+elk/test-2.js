let winston = require('winston');
let papertrailTransport = require('winston-papertrail').Papertrail;
let config = require('./env.json');

function sendToPT() {
  let log = new winston.Logger();

  log.add(papertrailTransport, {
    host: config.pt_host,
    port: config.port,
    program: "Roy",
    hostname: "Roy",
    flushOnClose: true,
    logFormat: function (level, message) {
      return message;
    }
  });


  log.info("Hello Hello");

}

sendToPT()
