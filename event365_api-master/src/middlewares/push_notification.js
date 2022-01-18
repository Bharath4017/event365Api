const gcm = require('node-gcm');
const Notification = require('../models/notification');
const settings = {
  gcm: {
    id: 'AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG' // AIzaSyA4JAhTu0d520QcPp3JlThrBHOAu8aFt1I
  }
};
var moment = require('moment');
const PushNotifications = require('node-pushnotifications');
const push = new PushNotifications(settings);
//const apn = require('apn');

var options = {
  // token: {
  //   key: "./certs/AuthKey_J2HR3T4NF8.p8",
  //   keyId: "J2HR3T4NF8",
  //   teamId: "6C6S2874ZZ"
  // },
  // production: false
};

// var apnProvider = new apn.Provider(options);
var gcmSender = new gcm.Sender(settings.gcm.id);
module.exports.push = push;

/**Web push notification */
module.exports.verifyACNotifiy = async (notif, userData, options) => {
 // console.log(notif, userData, options)

  var http = require("https");
  var options = {
    "method": "POST",
    "hostname": "fcm.googleapis.com",
    // "port": null,
    "path": "/fcm/send",
    "headers": {
      "content-type": "application/json",
      "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
      "cache-control": "no-cache"
    }
  };

  // for (let index = 0; index < notif.token.length; index++) {
  var req = await http.request(options, function (res) {
   // console.log("req", req)
    var chunks = [];
    res.on("data", function (chunk) {
      chunks.push(chunk);
    });
    res.on("end", function () {
      //console.log(chunks);
      var body = Buffer.concat(chunks);
      // console.log(JSON.parse(body));
    });
  });
  let bodyData = {};
//update Notification Table (msg as a url link store in db)
  let notifiyStore = await Notification.query().insertGraph({
    eventId: null,
    userId: userData.id,
    receiverId:notif.id,
   // msg: userData.name+", Please verification my A/C ",
    body: userData.name+", Please verify my A/C ",
    title: "Organiser has sent his A/C request for verification",
    msg: userData.userType,
    type: "isVerifyACReq",

  }).returning("*");

  const element = notif.device_token;
  console.log("element", req)
 let created_at =  today = new Date();
// let created_at = moment().format('YYYY-MM-DD HH:mm:ss');
  bodyData = JSON.stringify({
    "data": {
      "notification": {
        "body": userData.name+", Please verification my A/C ",
        "title": "Organiser has sent his A/C request for verify",
        "msg": userData.userType,
        "created_at": created_at
        // "icon": '/var/www/html/moki_api/default_image.png',
        //"click_action": notif.url
      }
    },
    "to": element
  });
  await req.write(bodyData);
  req.end();
}
module.exports.releasedPayment = async (notif, userData, options) => {
  // console.log("releasedPayment",notif, userData, options)
 
   var http = require("https");
   var options = {
     "method": "POST",
     "hostname": "fcm.googleapis.com",
     // "port": null,
     "path": "/fcm/send",
     "headers": {
       "content-type": "application/json",
       "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
       "cache-control": "no-cache"
     }
   };
 
   // for (let index = 0; index < notif.token.length; index++) {
   var req = await http.request(options, function (res) {
    // console.log("req", req)
     var chunks = [];
     res.on("data", function (chunk) {
       chunks.push(chunk);
     });
     res.on("end", function () {
       //console.log(chunks);
       var body = Buffer.concat(chunks);
       // console.log(JSON.parse(body));
     });
   });
   let bodyData = {};
 //update Notification Table (msg as a url link store in db)
   let notifiyStore = await Notification.query().insertGraph({
     eventId: null,
     userId: userData.id,
     receiverId:notif.id,
    // msg: userData.name+", Please verification my A/C ",
     body: userData.name+", Please released my Payment",
     title: "Released payment request",
     msg: "organiser-payment",
     type: "releasedPayment",
 
   }).returning("*");
 
   const element = notif.device_token;
   console.log("element", req)
  let created_at =  today = new Date();
 // let created_at = moment().format('YYYY-MM-DD HH:mm:ss');
   bodyData = JSON.stringify({
     "data": {
       "notification": {
         "body": userData.name+", Please released my Payment ",
         "title": "Released payment request",
         "msg": "organiser-payment",
         "created_at": created_at
         // "icon": '/var/www/html/moki_api/default_image.png',
         //"click_action": notif.url
       }
     },
     "to": element
   });
   await req.write(bodyData);
   req.end();
 }

 module.exports.support = async (notif, userData, askQuery, issueId, options) => {
   console.log("support",notif, userData, askQuery)
 
   var http = require("https");
   var options = {
     "method": "POST",
     "hostname": "fcm.googleapis.com",
     // "port": null,
     "path": "/fcm/send",
     "headers": {
       "content-type": "application/json",
       "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
       "cache-control": "no-cache"
     }
   };
 
   var req = await http.request(options, function (res) {
     var chunks = [];
     res.on("data", function (chunk) {
       chunks.push(chunk);
     });
     res.on("end", function () {
       var body = Buffer.concat(chunks);
     });
   });
   let bodyData = {};

 //update Notification Table (msg as a url link store in db)
   let notifiyStore = await Notification.query().insertGraph({
     eventId: null,
     userId: userData.id,
     receiverId:notif.id,
    // msg: userData.name+", Please verification my A/C ",
     body: userData.name+" has asked a query: "+askQuery,
     title: "365 Live Support Query",
     msg: "query/"+issueId,
     type: "support",
 
   }).returning("*");
 
   const element = notif.device_token;
   console.log("element", req)
  let created_at =  today = new Date();
 // let created_at = moment().format('YYYY-MM-DD HH:mm:ss');
   bodyData = JSON.stringify({
     "data": {
       "notification": {
         "body": userData.name+" has asked a query: "+askQuery,
         "title": "365 Live Support Query",
         "msg": "query/"+issueId,
         "created_at": created_at
         // "icon": '/var/www/html/moki_api/default_image.png',
         //"click_action": notif.url
       }
     },
     "to": element
   });
   await req.write(bodyData);
   req.end();
 }
//YM
 module.exports.notes = async (notif, options) => {
    console.log("support",notif, options)
    var http = require("https");
    var options = {
      "method": "POST",
      "hostname": "fcm.googleapis.com",
      // "port": null,
      "path": "/fcm/send",
      "headers": {
        "content-type": "application/json",
        "Authorization": "key=AAAAoHdpJ6Y:APA91bEVhR_RuKaZYYB8mS5GVkQM_yBgSgmNtOnIBubBndqnKOfYpCq7hf3lRzyd7P68FVQR6lptd7P27Lcuw5nU0QBFD6B78VN8ys3oEAjReEns-1Bh0-vpSGXNhv6eUYeFFLuECOCG",
        "cache-control": "no-cache"
      }
    };

    for (let index = 0; index < notif.deviceToken.length; index++) {
      var req = await http.request(options, function (res) {
        var chunks = [];
        res.on("data", function (chunk) {
          chunks.push(chunk);
        });
        res.on("end", function () {
          var body = Buffer.concat(chunks);
        });
      });
      let bodyData = {};
      const element = notif.deviceToken[index].device_token;
      let created_at =  today = new Date();
      bodyData = JSON.stringify({
         "data": {
           "notification": {
             "body": "You have received a note from sub-admin",
             "title": "New notes",
             "msg": "",
             "created_at": created_at
             // "icon": '/var/www/html/moki_api/default_image.png',
             //"click_action": notif.url
           }
         },
         "to": element
       });
       await req.write(bodyData);
       req.end();
    }
}
