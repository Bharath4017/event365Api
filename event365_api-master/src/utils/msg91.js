'use strict';

const got = require('got');
const msg91 = require('./../config/msg91');
const querystring = require('querystring');

const SendOTP = async (mobileNumber, message) => {
    let body = {
        authkey: msg91.token,
        sender: 'OneOps',
        message: message,
        mobile: '+91' + mobileNumber
    }
    body = querystring.stringify(body);
    return got(msg91.sendOTPUrl, {
        method: 'post',
        body: body,
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        }
    });
}

const VerifyOTP = async (mobileNumber, otp) => {
    let body = {
        authkey: msg91.token,
        mobile: '+91' + mobileNumber,
        otp: otp
    }
    body = querystring.stringify(body);
    let response = await got(msg91.verifyOTPUrl, {
        method: 'post',
        body: body,
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        }
    });

    response = JSON.parse(response.body);
    return response.type === 'success' ? true : true;
}

module.exports = {
    SendOTP,
    VerifyOTP
}
