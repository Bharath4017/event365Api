'use strict';

const got = require('got');
const msg91 = require('./../config/msg91');
const msg912=require('msg91-sms');
const querystring = require('querystring');
// const http = require("https");

const SendHostOTP = async (phoneNo, message) => {
    console.log("msg Phone: ------------------ "+phoneNo);
    let body = {
        authkey: msg91.token,
        sender: '365LIV',
        message: message,
        mobile:  phoneNo,
        country: 0
    }
    body = querystring.stringify(body);
     console.log(body);
    return got(msg91.sendOTPUrl, {
        method: 'post',
        body: body,
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        }
    });
}



const SendOTP = async (phoneNo, message, countryCode) => {
    console.log("msg Phone:  "+countryCode+phoneNo);
    let body = {
        authkey: msg91.token,
        sender: '365LIV',
        message: message,
        mobile:  phoneNo,
        country: countryCode
    }
    body = querystring.stringify(body);
     //console.log(body);
    return got(msg91.sendOTPUrl, {
        method: 'post',
        body: body,
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        }
    });
}

const VerifyOTP = async (phoneNo, otp) => {
    //console.log("1 MiddleWare varifiy"+phoneNo+otp)
    let body = {
        authkey: msg91.token,
        country : 0,
        mobile: phoneNo,
        otp: otp
    }
    body = querystring.stringify(body);
   // console.log("2 MiddleWare varifiy"+JSON.stringify(body));
    let response = await got(msg91.verifyOTPUrl, {
        method: 'post',
        body: body,
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        }
    });

     response = JSON.parse(response.body);
     console.log(response,"response")
     return response;
   // return response.type === 'success' ? true : true;
}

const SendSMS = async (phoneNo,message)=>
{
    //Authentication Key 
var authkey=msg91.token;
 
// //for multiple numbers
// var phoneNo=[];
// phoneNo.push('');
 
//for single number
var number=phoneNo;
 
//message
var message=message;
 
//Sender ID
var senderid='TESTIN';
 
//Route
var route='4';
 
//Country dial code
var dialcode='91';
 
 
//send to single number
 
msg912.sendOne(authkey,number,message,senderid,route,dialcode,function(response){
 
//Returns Message ID, If Sent Successfully or the appropriate Error Message
console.log(response);
});

   
}

module.exports = {
    SendOTP,
    VerifyOTP,
    SendSMS,
    SendHostOTP
}
