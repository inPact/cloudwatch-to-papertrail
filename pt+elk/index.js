const { Client } = require('@elastic/elasticsearch');
var stripAnsi = require ('strip-ansi');
var zlib = require('zlib');
var winston = require('winston');
var papertrailTransport = require('winston-papertrail').Papertrail;
var config = require('./env.json');
var zlib = require('zlib');

const client = new Client({
  node: config.elk_host,
  auth: {
    username: config.user,
    password: config.password,
  },
});


function sendToElk(log) {
  // console.log('log msg:')
  // console.log(log)
  client.index({
    index: config.index,
    body: {
      ['@timestamp']: (new Date()).toISOString(),
      message: log
    }
  });
}

function parseData(data){
  let res =  data.split('_');
  return res[0], res[1]
}

function pre_parse(data){

  let res =  data.logStream.split('.');

  if ( res[4].startsWith('fluentd-cloudwatch')  ||
      res[4].startsWith('external-dns') ||
      res[4].startsWith(' dashboard-metrics')){
    return null
  }
  else {
    return res[4].split('_');
  }

}



function getPTLog(logGroup, name_space) {
  let log = new winston.Logger();
  log.add(papertrailTransport, {
    host: config.pt_host, //host: config.host,
    port: config.port, //port: config.port,
    program: logGroup,// data.logGroup,
    hostname: name_space, // "K8s ",
    flushOnClose: true,
    logFormat: function (level, message) {
      return message;
    }
  });
  return log
}

exports.handler = function (event, context, cb) {

  context.callbackWaitsForEmptyEventLoop = true;

  var payload = Buffer.from(event.awslogs.data, 'base64');

  zlib.gunzip(payload, function (err, result) {
    if (err) { return cb(err); }
    var data = JSON.parse(result.toString('utf8'));
    var app_data =  pre_parse(data)
    if (app_data == null){ return; }

    let logGroup = app_data[0];
    let name_space = app_data[1];

    let ptLog = getPTLog(logGroup, name_space);

    data.logEvents.forEach(function (line) {
      var obj = JSON.parse(line.message)
      //fargate logs
      if ( obj.kubernetes == undefined ) {
        ptLog.info( stripAnsi(obj.logobj.log.substr(40)) );
      }
      //ordinary logs
      else if ( obj.kubernetes.container_image.startsWith('075139435924.dkr.ecr.eu-west-1.amazonaws.com')){
        ptLog.info( stripAnsi(obj.log));
        //if ros - send to elk
        if ( obj.kubernetes.container_image.startsWith('075139435924.dkr.ecr.eu-west-1.amazonaws.com/ros')){
          sendToElk(stripAnsi(obj.log));
        }
      }
    });
  });
};

const test1 = {
  log: "test",
  kubernetes: {
    container_image: '075139435924.dkr.ecr.eu-west-1.amazonaws.com/ros'
  }
}

log = getPTLog('roy', 'roy')
log.info(test1.log)
