let winston = require('winston');
let papertrailTransport = require('winston-papertrail').Papertrail;
let config = require('./env.json');

function sendToPT() {
  let log = new winston.Logger();
  log.add(papertrailTransport, {
    host: config.pt_host, //host: config.host,
    port: config.port, //port: config.port,
    program: "ROY",// data.logGroup,
    hostname: "ROY", // "K8s ",
    flushOnClose: true,
    logFormat: function (level, message) {
      return message;
    }
  });


  log.info("Hello Hello");

}

sendToPT()
