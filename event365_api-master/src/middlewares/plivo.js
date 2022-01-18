'use strict';
let plivo = require('plivo');
let client = new plivo.Client('MAYJBLYWQ0YJA3ZGUYZW', 'ZWVjMDQ5ZjE1YzI5MjhjNjM1N2M3NDc1ZWU4ODM4');
const SendOTP = async (phoneNo, countryCode, message) => {
    let fullphoneNo = countryCode+phoneNo;

    //console.log(message);
    await client.messages.create(
        '+1256-853-8053',
        fullphoneNo,
        message
    ).then(function (message_created) {
      //  console.log('message_created -------', message_created)
        return message_created;
    });

}
module.exports = {
    SendOTP
}
