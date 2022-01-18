const fs = require("fs");
const path = require("path");
var admin = require("firebase-admin");
const CONFIG = require('./config');

const apn = require("apn");
//firebase-adminsdk-ipvrt@eventlive365.iam.gserviceaccount.com
//firebase-adminsdk-ipvrt@eventlive365.iam.gserviceaccount.com
//var serviceAccount = require("path/to/serviceAccountKey.json");

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://eventlive365.firebaseio.com"
//   });


var serviceAccount = require("./helper/eventlive365-firebase-adminsdk-ipvrt-d10b4b2b1b.json");
var options = {
    token: {
        key: 'src/middlewares/ios_certs/AuthKey_9CWANM98T6.p8',
        keyId: '9CWANM98T6',
        teamId: '9JH37XY79W',
    },
  production: false
};
var apnProvider = new apn.Provider(options);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://eventlive365.firebaseio.com"
  });
  
const sendNotificationToAndroid = (registrationToken, dataToSend) => {
    // registrationToken = "ejG8a6LZ_NL_Tc2jzlIFk5:APA91bGTxEoT97P84LcLOuQsnCUKhPN1uL08y-uV4IL1GFC4Ta-2wAaIWrYd4Vc7lLMA__4wkYysHmK_PSIhXtGssaOPSBjbschtmLs5ZA_FLFHwN9TgHMshUauIAMmOW7wsSU5ZhAvG";
    var payload = {
        data: dataToSend
    };

    var options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
    };
    admin.messaging().sendToDevice(registrationToken, payload, options).then(function (response) {
            //  console.log(response.results[0])
        })
        .catch(function (error) {
            console.log(error)
            console.log("Error sending message:", error.message);
        });
};
//let registrationToken = "eKVWNNfrgx0:APA91bGajxet5xfOL6CSvucYpyUAMKAZMuuuWeWvoJC3CQshGXqK5OunEl92hpQKIwn-bOteKksIGKQtkjB0-45xc2sdP3pdD3my7eXjlkoCF0VEEStNgDX4MPtR-KkW0Ws6a41I_i7n";

const sendNotificationToUser = (registrationToken, dataToSend) => {

    // console.log(dataToSend)
    // console.log(registrationToken)
    var payload = {
        data: dataToSend
    };
    // let registrationToken = "ejG8a6LZ_NL_Tc2jzlIFk5:APA91bGTxEoT97P84LcLOuQsnCUKhPN1uL08y-uV4IL1GFC4Ta-2wAaIWrYd4Vc7lLMA__4wkYysHmK_PSIhXtGssaOPSBjbschtmLs5ZA_FLFHwN9TgHMshUauIAMmOW7wsSU5ZhAvG";
    var options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
    };
    admin.messaging().sendToDevice(registrationToken, payload, options).then(function (response) {
            //console.log(response)
        })
        .catch(function (error) {
            // console.log("Error sending message:", error);
        });
};

const sendNotificationToIOS = (payload, registrationTokens) => {
    var note = new apn.Notification();

    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    note.badge = 1;
    note.sound = "ping.aiff";
    note.alert = payload.title;
    note.payload = payload;
    note.topic = "com.horsepowerllc.app";

    apnProvider
        .send(note, registrationTokens)
        .then(result => {
            console.log(JSON.stringify(result));
            console.log("notification sent to ios");
        })
        .catch(err => {
            console.log("error sending notification");
            console.log(err);
        });
};

module.exports = {
    sendNotificationToAndroid,
    sendNotificationToUser,
    sendNotificationToIOS
};