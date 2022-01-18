const sgMail = require('@sendgrid/mail');
const sendgrid = require('../config/index').sendgrid;
sgMail.setApiKey(sendgrid);
module.exports.sendEmail = async (to, subject, text) => {
    const msg = {
        to: to,
        from: 'support@365live.com',
        subject: subject,
        html:text
    };

    sgMail.send(msg)
        .then(() => {
            //Celebrate
            console.log("sent")
        })
        .catch(error => {

            //Log friendly error
            console.error(error.toString());

            //Extract error msg
            const {
                message,
                code,
                response
            } = error;

            //Extract response msg
            const {
                headers,
                body
            } = response;
        });
}

// const sgMail = require('@sendgrid/mail');
// const sendgrid = require('../config/index').sendgrid;
// sgMail.setApiKey(sendgrid);

// module.exports.sendEmail = async (to, subject, text) => {
//   console.log(sendgrid);
//   console.log("after this console.log");
//   const msg = {
//     to: to,
//     from: 'support@onebandhan.com',
//     subject: subject,
//     text: text
//   };
//   sgMail.send(msg)
//   .then(() => {
//     //Celebrate
//   })
//   .catch(error => {

//     //Log friendly error
//     console.error(error.toString());

//     //Extract error msg
//     const {message, code, response} = error;

//     //Extract response msg
//     const {headers, body} = response;
//   });
// }
