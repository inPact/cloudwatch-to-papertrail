var zlib = require('zlib');
// var config = require('./env.json');
// index.js
var winston = require('winston');
require('newrelic')
const newrelicFormatter = require('@newrelic/winston-enricher')
const NewrelicWinston = require('newrelic-winston');


const log = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
      newrelicFormatter()
  ),
  // defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console(),
    new NewrelicWinston()
  ],
});

function sendData(data) {
  log.info(data);
  // data.logEvents.forEach(function (line) {
  //   client.index({
  //     index: config.index,
  //     body: {
  //       ['@timestamp']: (new Date()).toISOString(),
  //       message: line.message,
  //       container: data.logStream.substr(-12),
  //       service: data.logGroup
  //     },
  //   });
  // });
}

exports.handler = function (event, context, cb) {
  handler(context, event, cb);
};

function handler(context, event, cb) {
  context.callbackWaitsForEmptyEventLoop = config.waitForFlush;

  const payload = new Buffer(event.awslogs.data, 'base64');

  zlib.gunzip(payload, function (err, result) {
    if (err) {return cb(err);}
    sendData(JSON.parse(result.toString('utf8')));
  });
}


sendData("test")
