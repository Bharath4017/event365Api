
pe = require('parse-error'); //parses error so you can read error message and handle them accordingly

Message = function (resKey) { // Success Web Response
  let resp, responseM;
  resp = require('./helper/message.json');
  responseM = resp[resKey];
  return responseM;
};

to = function (promise) { //global function that will help use handle promise rejections, this article talks about it http://blog.grossman.io/how-to-write-async-await-without-try-catch-blocks-in-javascript/
  return promise
    .then(data => {
      return [null, data];
    }).catch(err => [pe(err)]);
};

// Response handlers
successResponse = function (res, code, data, message) {
  return res.status(code || 200).json({
    success: true,
    data,
    code,
    message
  })
}

okResponse = function (res, data, message) {
  return successResponse(res, 200, data, message);
}

okPhoneResponse = function (res, data, message) {
  return successResponse(res, 437, data, message);
}

createdResponse = function (res, data, message) {
  return successResponse(res, 201, data, message);
}

noContentResponse = function (res, message) {
  return successResponse(res, 204, {}, message);
}
notFoundError = function (res,message) {
  return successResponse(res,404,{},message);
}

forbiddenError = function (res,msg) {
  return successResponse(res,403,{},msg);
}

errorResponse = function (res, data, message) {
  res.statusCode = 406;
  return res.json({
    success: false,
    code:406,
    data,
    message
  })
}

ticketFutureErrRes = function (res, data, message, code) {
  res.statusCode = 407;
  return res.json({
    success: false,
    code:407,
    data,
    message
  })
}

badRequestError = function (res, data, message) {
  res.statusCode = 406;
  return res.json({
    success: false,
    code: 406,
    data: data,
    message: message
  })
}
unverifiedError = function (res, message) {
  res.statusCode = 412;
  return res.json({
    success: false,
    code: 412,
    message: message
  })
}

// Error handler for unverified Email with dedicated response code.
// Code 432 - Unverified Email
unverifiedEmailError = function (res, data, message) {
  res.statusCode = 432;
  return res.json({
    success: false,
    code: 432,
    data,
    message: message
  })
}

// Error handler for unverified mobile number with dedicated response code.
// Code 433 - Unverified Mobile Number
unverifiedMobileError = function (res, data, message) {
  res.statusCode = 433;
  return res.json({
    success: false,
    code: 433,
    data,
    message: message
  })
}

// PhoneNo not Available 
PNAError = function (res, data, message) {
  res.statusCode = 434;
  return res.json({
    success: false,
    code: 434,
    data,
    message: message
  })
}

//user side - Profile update Error
PInfoError = function (res, data, message) {
  res.statusCode = 435;
  return res.json({
    success: false,
    code: 435,
    data: data,
    message: message
  })
}

//user side - recommended
RecommendedError = function (res, data, message) {
  res.statusCode = 436;
  return res.json({
    success: false,
    code: 436,
    data: data,
    message: message
  })
}

//user side - recommended
InvalidAttemptPasswordError = function (res, data, message) {
  res.statusCode = 410;
  return res.json({
    success: false,
    code: 410,
    data: data,
    message: message
  })
}

//user block error
UserBlockError = function (res, data, message) {
  res.statusCode = 409;
  return res.json({
    success: false,
    code: 409,
    data: data,
    message: message
  })
}

ReE = function (res, err, code) { // Error Web Response
  console.log(err);
  // console.log(res);
  console.log(code);
  if (typeof err == 'object' && typeof err.message != 'undefined') {
    err = err.message;
  }

  if (typeof code !== 'undefined') res.statusCode = code;

  return res.json({
    success: false,
    message: err,
    code: code
  });
}
