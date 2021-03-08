const { Client } = require('@elastic/elasticsearch');
let zlib = require('zlib');
let winston = require('winston');
let papertrailTransport = require('winston-papertrail').Papertrail;
let config = require('./env.json');


function sendToPT(data) {
  let log = new (winston.Logger)({
    transports: []
  });

  log.add(papertrailTransport, {
    host: config.ptHost,
    port: config.ptPort,
    program: data.logGroup,
    hostname: data.logStream.substr(-12),
    flushOnClose: true,
    logFormat: function (level, message) {
      return message;
    }
  });

  data.logEvents.forEach(function (line) {
    log.info(line.message);
  });
}

function sendToELK(data) {
  data.logEvents.forEach(function (line) {
    client.index({
      index: config.index,
      body: {
        ['@timestamp']: (new Date()).toISOString(),
        message: line.message,
        container: data.logStream.substr(-12),
        service: data.logGroup
      },
    });
  });
}

function process(data) {
    sendToPT(data);
    sendToELK(data);
}

exports.handler = function (event, context, cb) {
  context.callbackWaitsForEmptyEventLoop = config.waitForFlush;
  let payload = new Buffer(event.awslogs.data, 'base64');

  zlib.gunzip(payload, function (err, result) {
    if (err) {return cb(err);}
    let data = JSON.parse(result.toString('utf8'));

    process(data);
  });
};




