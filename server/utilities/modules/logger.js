'use strict';

const main = require( __base + '/server/init/logger').main;
const healthcheck = require( __base + '/server/init/logger').healthcheck;

module.exports = {
  main: main,
  healthcheck: healthcheck,
  info: log_info,
  debug: log_debug,
  warn: log_warn,
  error: log_error,
  fatal: log_fatal,
  request: request,
  log_reject: log_reject,
  log_manager: log_manager
};

function log_info(fid, message, traceDetail) {

  main.info('['+fid.requestId+']: ' + fid.functionName + ' --> ' + message);

  if(traceDetail){
    main.trace('['+fid.requestId+']: ' + fid.functionName + ' --> ' + message + '. Detail - ' + JSON.stringify(traceDetail));
  }
}

function log_debug(fid, message, traceDetail) {

  main.debug('['+fid.requestId+']: ' + fid.functionName + ' --> ' + message);

  if(traceDetail){
    main.trace('['+fid.requestId+']: ' + fid.functionName + ' --> ' + message + '. Detail - ' + JSON.stringify(traceDetail));
  }
}

function log_warn(fid, message, traceDetail) {

  main.warn('['+fid.requestId+']: ' + 'Warn-' + fid.handler + ' --> ' + fid.functionName + ' --> ' + message);

  if(traceDetail){
    main.trace('['+fid.requestId+']: ' + 'Warn-' + fid.handler + ' --> ' + fid.functionName + ' --> ' + message + '. Detail - ' + JSON.stringify(traceDetail));
  }
}

function log_error(fid, message, traceDetail) {

  main.warn('['+fid.requestId+']: ' + 'Error-' + fid.handler + ' --> ' + fid.functionName + ' --> ' + message);

  if(traceDetail){
    main.trace('['+fid.requestId+']: ' + 'Error-' + fid.handler + ' --> ' + fid.functionName + ' --> ' + message + '. Detail - ' + JSON.stringify(traceDetail));
  }
}

function log_fatal(fid, message, traceDetail) {

  main.fatal('['+fid.requestId+']: ' + 'Fatal-' + fid.handler + ' --> ' + fid.functionName + ' --> ' + message);

  if(traceDetail){
    main.trace('['+fid.requestId+']: ' + 'Fatal-' + fid.handler + ' --> ' + fid.functionName + ' --> ' + message + '. Detail - ' + JSON.stringify(traceDetail));
  }
}

function request(functionName, req) {

  main.info('[' + req.requestId + ']: ' + req.ip + '/' + req.hostname + ' --> ' + req.url + ' --> '+ req.method + ' --> ' + functionName);

  if((functionName !== 'login' && functionName !== 'authentication') && (req.method === 'POST' || req.method === 'PUT')){
    main.trace('['+req.requestId+']: ' + req.ip + '/' + req.hostname + ' --> ' + req.url + ' --> '+ req.method + ' --> ' + functionName + ' --> Body - ' + JSON.stringify(req.body));
  }

}

function log_reject(req, body) {

  if(body.error) {

    log_manager(body.error);

  } else {

    const fid = {
      requestId: req.requestId,
      handler: req.passData.handler,
      functionName: 'Exception'
    };

    const errorTrace = {
      message: body.message,
      stack: body.stack
    };

    const new_body = { error: { code: 102, message: 'Problem processing', fid: fid, type: 'error', trace: errorTrace }};

    log_manager(new_body.error);
  }

}

function log_manager(error) {
  switch(error.type){
    case 'info':
      log_info(error.fid, error.message, error.trace);
      break;

    case 'debug':
      log_debug(error.fid, error.message, error.trace);
      break;

    case 'warn':
      log_warn(error.fid, error.message, error.trace);
      break;

    case 'error':
      log_error(error.fid, error.message, error.trace);
      break;

    case 'fatal':
      log_fatal(error.fid, error.message, error.trace);
      break;
    default:
      break;
  }
}
