'use strict';

const User = require('../../models/users');
const bankDetails = require('../../models/bank_details');
const VenueImages = require('../../models/venueImages');
const Admin = require('../../models/admin');
const AdminNotification = require('./../../middlewares/push_notification');
const validator = require('validator');
const Contact = require('../../models/contactUs');
const ContactVia = require('../../models/contactVia');
const UserLoginDetail = require('../../models/userLoginDetails');
var moment = require('moment');
const UserChooseSubcategory = require('../../models/userChooseSubCategory');

const ValidationError = require('objection').ValidationError;

require('../../global_functions');
require('../../global_constants');
const bcrypt = require('bcrypt');
//const Otp = require('./../../middlewares/msg91');
const EMAIL = require('./../../middlewares/email');
const jwt = require('jsonwebtoken');
const plivo = require('./../../middlewares/plivo');
const Otp = require('./../../middlewares/plivo');
const stripe = require('./../../middlewares/stripe');

/**
 * Signup (Venuer, Host, Promoter, Member) - (1st Process)
 * @params req.body;
 * @return promise
 */

const signup = async (req, res) => {
  let data = req.body;
  if (!data.name) {
    return badRequestError(res, "", "Please enter name");
  }

  if (!data.email) {
    return badRequestError(res, "", "Please enter Email !");
  }

  if (!data.password) {
    return badRequestError(res, "", "Please enter Password !");
  }
  if (!data.userType) {
    return badRequestError(res, "", "Please enter User Type !");
  }
  if (data.userType == 'venuer') {
    data.roles = '["event_management","user_management"]';
  }
  if (data.userType == 'host') {
    data.roles = '["event_management","user_management"]';
  }
  if (data.userType == 'promoter') {
    data.roles = '["event_management","user_management"]';
  }
  data.is_active = true;
  let ranOtp = Math.floor(1000 + Math.random() * 9000);
    data.emailOTP = ranOtp;
    let err, inserted_user;
    let checkEmailExists = await User.query().select('id', 'isEmailVerified').where('email', data.email).first();
    if(checkEmailExists){
        if(checkEmailExists.isEmailVerified==1){
            return badRequestError(res, "", Message('accountEmailExists'));
        }
       [err, inserted_user] = await to(User.query().update(data).where('id', checkEmailExists.id).returning('id'));
      if (err || inserted_user=="") {
        return badRequestError(res, "", err.message);
      }
      inserted_user.id = inserted_user[0].id;
    }else{
        let customerId = await stripe.GetCustomerID({
            email: data.email
        });
        data.customerId = customerId;
        [err, inserted_user] = await to(User.query().insert(data).returning('id'));
        
      
        if (err) {
          return badRequestError(res, "", err.message);
        }
        await User.query().update({createdBy: inserted_user.id}).where('id', inserted_user.id);
    }

   EMAIL.sendEmail(data.email, "Account Activation", "Hi " + data.name + ", <br> Welcome to 365Live.<br><br>Please do not share this one-time password with anyone for security reasons.<br> Your one-time password is: " + "<b>" + ranOtp + "</b>" + "");

  res.setHeader('Content-Type', 'application/json');

  let response = {
    'id': inserted_user.id
  }
  return createdResponse(res,
    response, Message("otpSent"));
}

/**
 * verifyEmail (2nd Process)
 * @params req.body 
 * @return promise
 */
const verifyEmail = async (req, res) => {
  //console. ("email check")
  let data = req.body;
  var response = {};
  response.isManageUser = false;
  response.isUnderVenue = false;
  response.isVenueOwner = false;

  if (!data.id) {
    return badRequestError(res, "", "Please enter Id");
  }
  if (!data.otp) {
    return badRequestError(res, "", Message("validOTP"));
  }

  const users = await User.query().findById(data.id);
  
  if (!users) return badRequestError(res, "", Message("emailNotExist"));

  if (users.userType == "venuer") {
    response.isVenueOwner = true
  } else {
    response.isVenueOwner = false;
  }

  //isUnderVenue check
  if (users.createdBy == users.id && users.userType == "venuer") {
    response.isUnderVenue = true;

  } else {
    response.isUnderVenue = false;
  }

  response.user = {
    id: users.id,
    name: users.name,
    profilePic: users.profilePic,
    userType: users.userType,
    roles:users.roles,
    createdBy:users.createdBy
  }

  //isManageUser check
  let roles = users.roles
 
  if(roles){
    if (roles.includes("user_management")) {
      response.isManageUser = true
    }else {
      response.isManageUser = false
    }
  }else {
    response.isManageUser = false
  }
   
  if (data.otp == users.emailOTP) {
    let auth_token = await users.getJWT();
   
    let tokenData = {
      deviceId: data.deviceId,
      deviceType: data.deviceType,
      deviceToken: data.deviceToken,
      OS: data.OS,
      sourceIp: data.sourceIp,
      platform: data.platform,
      authToken: auth_token
   }
    const updatedUser = await User.query().patchAndFetchById(data.id, {
      isEmailVerified: 1,
      deviceType: data.deviceType,
      deviceToken: data.deviceToken,
      // deviceId: data.deviceId,
      //token: auth_token
    });

    res.setHeader('Authorization', auth_token);
    res.setHeader('access-control-expose-headers', 'authorization');

   
    response.user = {
      id: users.id,
      name: users.name,
      profilePic: users.profilePic,
      userType: users.userType,
      roles:users.roles,
      createdBy: users.createdBy
    }
    await updateToken(users.id,users.userType,tokenData,'Logged In',auth_token)

    return okResponse(res, response, Message("emailVerified"));
  } else {
    return badRequestError(res, "", Message("IncorrectOTP"));
  }
}

/**
 * sendPhoneOTP (3rd Process)
 * @params req.body
 * @return promise
 */

const sendPhoneOTP = async (req, res) => {
  let data = req.body;
  if (!data.id) {
    return badRequestError(res, "", "Please enter user Id !");
  }
  if (!data.countryCode) {
    return badRequestError(res, "", "Please enter Country Code !");
  }
  if (!data.phoneNo) {
    return badRequestError(res, "", "Please enter Phone number !");
  }
  //check Id
  let checkUser = await User.query().skipUndefined().where('id', data.id).first();
  if (!checkUser) {
    return badRequestError(res, "", "user with this id doesn't exist");
  }

  if (checkUser.is_active == false || checkUser.accountStatus == 'inactive') {
    return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
  }
  //  checkExistPhone 
  let checkExistPhone = await User.query().select('id', 'isPhoneVerified').where('phoneNo', data.phoneNo).andWhere("id", data.id).first();
  if (checkExistPhone) {
      if (checkExistPhone.isPhoneVerified == 1) {
        return badRequestError(res, "", Message("phoneAlreadyVerified"));
      }
  }else {
    let checkExistPhone2 = await User.query().select().where('phoneNo', data.phoneNo).whereNotNull('phoneNo')
    if (checkExistPhone2.length > 0) {
      return badRequestError(res, "", "This Phone number already exits");
    }
  }
  // check mobile available or not 
  
  
  // Generate your OTP
  let ranOtp = Math.floor(1000 + Math.random() * 9000);
  data.phoneOTP = ranOtp;
  let msg = Message("sendOTPmsg") + ranOtp;
  Otp.SendOTP(data.phoneNo, data.countryCode, msg); //phoneOTPsend
  delete data.phoneNo
  delete data.countryCode
  let UserDataRes = await User.query().upsertGraph(data).returning('id');
  if (!UserDataRes) {
    return badRequestError(res, "", "error");
  }
  return okResponse(res, '', Message("phoneOTPsend"));
}

/**
 * verifyPhone (4th Process)
 * @description: verifyPhone (msg91 side)  match otp
 * @param {*} req
 * @param {*} res
 */

const verifyPhone = async (req, res) => {
  // check otp varification
  let message, optData = '';
  let data = req.body;
  var response = {};
  response.isManageUser = false;
  response.isUnderVenue = false;
  response.isVenueOwner = false;

  if (!data.id) {
    return badRequestError(res, "", "Please enter Id");
  }
  if (!data.countryCode) {
    return badRequestError(res, "", "Please enter Country Code !");
  }
  if (!data.phoneNo) {
    return badRequestError(res, "", "Please enter Phone number !");
  }
  if (!data.otp) {
    return badRequestError(res, "", Message("validOTP"));
  }
  if (!data.country_code) {
    return badRequestError(res, "", "Country code required");
  }
  if (!data.currencyCode) {
    return badRequestError(res, "", "Currency code required");
  }
  const users = await User.query().findById(data.id);
  if (users.is_active == false || users.accountStatus == 'inactive') {
    return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
  }

  //check (isVenueOwner, isUnderVenue, isManageUser)
  //isUnderVenue check
  if (users.userType == "venuer") {
    response.isVenueOwner = true
  } else {
    response.isVenueOwner = false;
  }

  //isUnderVenue check
  if (users.createdBy == users.id && users.userType == "venuer") {
    response.isUnderVenue = true;

  } else {
    response.isUnderVenue = false;
  }

  response.user = {
    id: users.id,
    name: users.name,
    profilePic: users.profilePic,
    userType: users.userType
  }

  //isManageUser check
  let roles = users.roles
  response.isManageUser = false

  if (roles) {
    if (roles.includes("user_management")) {
      response.isManageUser = true
    }
  }
  

  const userphoneOTP = await User.query().select("phoneOTP").findById(data.id).first();
 
  if (!users) return badRequestError(res, "", Message("userNotRegisterd"));
  if (userphoneOTP.phoneOTP == data.otp) {
    //generete auth token
    let auth_token = await users.getJWT();
    //set header auth token
    res.setHeader('Authorization', auth_token);
    res.setHeader('access-control-expose-headers', 'authorization');
    let tokenData = {
      deviceId: data.deviceId,
      deviceType: data.deviceType,
      deviceToken: data.deviceToken,
      OS: data.OS,
      sourceIp: data.sourceIp,
      platform: data.platform,
      authToken: auth_token
   }
    //update phoneNo flag
    //create stripe account id
    let accountId = '';
    if ((users.userType == 'venuer' || users.userType == "promoter" || users.userType == "host") && (users.accountId == '' || users.accountId == null)) {
      let createAccountStripe = await stripe.createAccount({ countryCode: data.country_code, email: users.email });
     
      if (createAccountStripe != undefined) {
       
        if (createAccountStripe.status == false) {
          return badRequestError(res, "", createAccountStripe.data.message);
        }
        accountId = createAccountStripe.id;
       
      }
    }
   
    let phoneFlagData = await User.query().patchAndFetchById(data.id, {
      isPhoneVerified: 1,
      phoneNo: data.phoneNo,
      countryCode: data.countryCode,
      country_code: data.country_code,
      currencyCode: data.currencyCode,
      accountId: accountId,
      token: auth_token
    });
    await updateToken(data.id,users.userType,tokenData,'Logged In',auth_token)

    return okResponse(res, response, Message("verifyPhoneOTP"));
  } else {
    return errorResponse(res, '', Message("IncorrectOTP"));
  }
}


/**
 * verifyResetPW
 * @params req.body.id;
 * @params req.body.otp;
 * @return promise
 */

const verifyResetPW = async (req, res) => {
 
  let data = req.body;

  if (!data.id) {
    return badRequestError(res, "", "Please enter id");
  }
  let user = await User.query().where('id', data.id).first();

  if (!user) {
    return badRequestError(res, "", "user does not exist with this id");
  }

  if (user.is_active == false || user.accountStatus == 'inactive') {
    return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
  }

  if (data.otp == user.emailOTP) {
    return okResponse(res, {}, "otp is correct");
  } else {
    return badRequestError(res, "", Message("IncorrectOTP"));
  }
}

/**
 * resetPassword
 * @params req.body.email;
 * @params req.body.newPassword;
 * @return promise
 */

const resetPassword = async (req, res) => {

  let data = req.body;
  if (!data.email) {
    return badRequestError(res, "", "please enter email");
  }
  let user = await User.query().where('email', data.email).first();

  if (user.userType == "customer") {
    return badRequestError(res, "", Message("invalidAuth"));
  }
  if (!user) {
    return badRequestError(res, "", "user does not exist with this email");
  }

  if (user.is_active == false || user.accountStatus == 'inactive') {
    return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
  }

  let newPassword = await bcrypt.hash(data.newPassword, 10);
 
  const updatedUser = await User.query().patchAndFetchById(user.id, {
    password: newPassword
  });
  return okResponse(res, {}, "password is updated");

}
/**
 * loginUser 
 * @params req.body.property_id;
 * @return promise
 */

const loginUser = async (req, res) => {
  var response = {};
  response.isManageUser = false;
  response.isUnderVenue = false;
  response.isVenueOwner = false;

  let data = req.body
  if (!data.email) {
    return badRequestError(res, "", "Please enter email");
  }
  if (!data.password) {
    return badRequestError(res, "", "Please enter password");
  }
  let user = await User.query().skipUndefined().where('email', data.email).first();
  if (!user) {
    return badRequestError(res, "", Message("emailNotExist"));
  }
  if (user.userType == "customer") {
    return badRequestError(res, "", Message("invalidAuth"));
  }

   // Password compare
   if (!await user.comparePassword(data.password) && user.is_active == true) {
    if (user.wrongPassAttemptCount >= 5) {
      let updatedProfileStatus = await User.query().patch({ is_active: false, accountStatus: 'inactive' }).where('id', user.id);
      return InvalidAttemptPasswordError(res, "", "Your profile has been blocked cause of you attemped 5 time wrong password.");
    }
    let updateCount = await User.query().where('id', user.id).increment('wrongPassAttemptCount', 1);
    return badRequestError(res, "", Message("invalidPassword"));
  }

  //check account status
  if ((user.is_active == false) || (user.accountStatus == 'inactive')) {
    return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
  }

  
  response.user = {
    id: user.id,
    name: user.name,
    profilePic: user.profilePic,
    userType: user.userType,
    createdBy: user.createdBy
  }

  //isUnderVenue check
  if (user.userType == "venuer") {
    response.isVenueOwner = true
  } else {
    response.isVenueOwner = false;
  }

  //isUnderVenue check
  if (user.createdBy == user.id && user.userType == "venuer") {
    response.isUnderVenue = true;

  } else {
    response.isUnderVenue = false;
  }

  //isManageUser check
  let roles = user.roles

  if(roles){
    if (roles.includes("user_management")) {
      response.isManageUser = true
    } else {
      response.isManageUser = false
    }
  }else {
    response.isManageUser = false
  }

  if (user.isEmailVerified == 0) {
    let ranOtp = Math.floor(1000 + Math.random() * 9000);
    data.emailOTP = ranOtp;

    EMAIL.sendEmail(data.email, "Account Activation", "Hi " + user.name + ", <br>Welcome to 365Live.<br> <br>Please do not share this one-time password with anyone for security reasons.<br> Your one-time password is: " + "<b>" + ranOtp + "</b>" + "");
    let updateOTP = await User.query().context({
      email: data.email
    }).update({
      "emailOTP": data.emailOTP
    }).where("email", data.email);

    let response1 = {
      'id': user.id,
      'email': user.email,
    }
    return unverifiedEmailError(res, response1, Message("otpSent"));
  }

  if (data.deviceType != 'website') {
    //isPhoneVerified check
    //let checkPhone = await User.query().skipUndefined().select('phoneNo', 'isPhoneVerified').where('id', user.id).first();
   
    if (!user.phoneNo) {
      let resDataPhone = {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'countryCode': user.countryCode,
        'country_code': user.country_code,  
        'currencyCode': user.currencyCode
      }
      //let auth_token = user.token;
      //res.setHeader('Authorization', auth_token);
      //res.setHeader('access-control-expose-headers', 'authorization');
      return PNAError(res, resDataPhone, "Phone Number is not available");
    } else {
      if (user.isPhoneVerified == 0) {
        let resPhoneVerified = {
          'id': user.id,
          'name': user.name,
          'email': user.email,
          'phoneNo': user.phoneNo,
          'countryCode': user.countryCode,
          'country_code': user.country_code,  
          'currencyCode': user.currencyCode
        }
        //let auth_token = user.token;
        //res.setHeader('Authorization', auth_token);
        //res.setHeader('access-control-expose-headers', 'authorization');
        return unverifiedMobileError(res, resPhoneVerified, "PhoneNo is not verified, please verify your Number");
      }
    }
  }
  let auth_token = await user.getJWT();
  const devicetype = await User.query().skipUndefined().patchAndFetchById(user.id, {
    deviceType: data.deviceType,
    deviceToken: data.deviceToken,
    deviceId: data.deviceId,
    token: auth_token
  });

  res.setHeader('Authorization', auth_token);
  res.setHeader('access-control-expose-headers', 'authorization');
  response.stripeAccountStatus = false;
  response.accountLinkStatus = user.accountLinkStatus;
  if (user.accountLinkStatus == true) {
    const getStripeDetail = await stripe.getAccountDetail({ accountId: user.accountId });
    response.stripeAccountStatus = getStripeDetail;
  }
  delete user.token;

  await updateToken(user.id,user.userType,data,'Logged In',auth_token);

  return okResponse(res, response, "Login successfully !");
}
/**
 * editProfile
 * @params req.body.property_id;
 * @return promise
 */
const editProfile = async (req, res) => {
  let data = req.body;
  if (!data.profilePic) {
    data.profilePic = await req.files.map((file) => {
      return {
        profilePic: file.location
      };
    });
  }

  let checkPhone = await User.query().skipUndefined().where('phoneNo', data.phoneNo).first();
  

  if (checkPhone && checkPhone.id == req.user.id && checkPhone.isPhoneVerified == 1) {
    return okResponse(res, {
      user
    }, "profile details updated");
  }

  if (checkPhone && checkPhone.isPhoneVerified == 1) {
    return badRequestError(res, "", Message("phoneAlreadyExists"));
  } else {
    // data.phoneOTP = 1234;
    let user = await User.query().patchAndFetchById(req.user.id, data);
    return okResponse(res, {}, "profile Details Updated and otp is sent on phone number");
  }
}

/**
 * changePassword
 * @params req.body.property_id;
 * @return promise
 */

const changePassword = async (req, res) => {
  let data = req.body;

  if (!await (req.user).comparePassword(data.oldPassword)) {
    return badRequestError(res, "", "the password you entered Is incorrect !!");
  } else {
    data.newPassword = await bcrypt.hash(data.newPassword, 10);

    let user = await User.query().patchAndFetchById(req.user.id, {
      password: data.newPassword
    });
    // this.password = await bcrypt.hash(this.password, 10);

    return okResponse(res, {}, "password updated");
  }
}

/**
 * Resend OTP
 * @params req.body.;
 * @return promise
 */
const ResendOTP = async (req, res) => {

  let data = req.body;
 
  if (!data.email) {
    return badRequestError(res, "", "Please enter user email !");
  }
  if (!data.countryCode) {
    return badRequestError(res, "", "Please enter Country Code !");
  }
  if (!data.phoneNo) {
    return badRequestError(res, "", "Please enter Phone number !");
  }
  //check Id
  let checkUser = await User.query().skipUndefined().where('id', data.id).first();
  if (!checkUser) {
    return badRequestError(res, "", "user with this id doesn't exist");
  }

  //check account status
  if ((user.is_active == false) || (user.accountStatus == 'inactive')) {
    return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
  }

  // check mobile exist or not
  let user = await User.query().skipUndefined().where('id', data.id).first();
 
  // Generate your OTP
  let ranOtp = Math.floor(1000 + Math.random() * 9000);
  data.phoneOTP = ranOtp;

  let msg = Message("sendOTPmsg") + ranOtp;

  Otp.SendOTP(data.phoneNo, data.countryCode, msg); //phoneOTPsend

  delete data.phoneNo
  delete data.countryCode
  let UserDataRes = await User.query().upsertGraph(data).returning('id');
  if (!UserDataRes) {
    return badRequestError(res, "", "error");
  }
  return okResponse(res, '', Message("phoneOTPsend"));
}


/**
 * contactUs
 * @params req.body;
 * @return promise
 */
const contactUs = async (req, res) => {
  let data = req.body;
  let user = req.user;

  if (!user.id) {
    return badRequestError(res, "", "please enter user Id");
  }
  if (!data.issue) {
    return badRequestError(res, "", "please enter your issue");
  }
  if (!data.message) {
    return badRequestError(res, "", "please enter message");
  }

  data.userId = user.id;
  let issue = await Contact.query().skipUndefined().insert(data);

  if (!issue) {
    return badRequestError(res, "", "issue in reporting");
  }
  return okResponse(res, {}, "Issue is reported");
}

/**
 * updateProfile
 * @params req.body;
 * @return promise
 */
const updateProfile = async (req, res) => {
 
  let data = req.body;
  data.id = req.user.id;
  let contactVia;

  if (req.files.length > 0) {
    data.profilePic = await req.files.map(file =>
      file.location.toString());
    data.profilePic = data.profilePic.toString();
  } else {
    delete data.profilePic;

  }
  //venueImages
  // const options = {
  //   noDelete: ['profilePic'],
  //   related: true,
  //   unrelated: true,
  // };

  // data.profilePic = await req.files.map(file => file.location.toString())
  // data.profilePic = data.profilePic.toString()

  contactVia = JSON.parse(data.contactVia);
  
  data.contactVia = await contactVia.map((contactVia) => {
    return {
      contactVia: contactVia
    }
  });


  let updatedProfile = await User.query().upsertGraph(data).returning('id');
  if (!updatedProfile) {
    return badRequestError(res, "", "Profile not updated");
  }
  let response = {
    profilePic: data.profilePic
  }
  return okResponse(res, response, Message("updateProfile"));
}

// const updateProfile = async (req, res) => {

//   let data = req.body;
//   data.id = req.user.id;
//   let contactVia;

//   if (req.files.length > 0) {
//     data.profilePic = await req.files.map(file =>
//       file.location.toString());
//     data.profilePic = data.profilePic.toString();
//   } else {
//     delete data.profilePic;

//   }
//   contactVia = JSON.parse(data.contactVia);

//   data.contactVia = await contactVia.map((contactVia) => {
//     return {
//       contactVia: contactVia
//     }
//   });
//    // check Phone No


// // let checkExistPhone = await User.query().select().where('phoneNo', data.phoneNo).andWhere("id", req.user.id)
// // if(checkExistPhone.length === 0) {
// //     let checkExistPhone2 = await User.query().select().where('phoneNo', data.phoneNo)

// //     if(checkExistPhone2.length > 0) {
// //         return badRequestError(res, "", "This Phone number already exits");
// //     }
// // }
// // if(checkExistPhone ==""){
// // for (let i = 0; i < checkExistPhone.length; i++) {

// //     if (!checkExistPhone[i].phoneNo) {
// //         return badRequestError(res, "", "This Phone number already exits11");
// //     }
// // }}

//   //phoneNo check (with country code phoneNo)
//   const users = await User.query().skipUndefined().select("countryCode", "phoneNo", "profilePic", "isPhoneVerified", "token").where("id", req.user.id).first();
// //Update Process
// let phonedata = req.body.phoneNo;
// delete data.phoneNo;
// //update Process
// let updatedProfile = await User.query().patch(data).where('id', req.user.id).returning('id');
// //let users = await User.query().select().where('id', req.user.id).first();
// res.setHeader('Authorization', users.token);
// res.setHeader('access-control-expose-headers', 'authorization');
// if (!updatedProfile) {
//     return badRequestError(res, "", "Profile not updated");
// }

// let existFullPhoneNo = users.countryCode + users.phoneNo;
// let fullPhoneNo = req.body.countryCode + phonedata;


// if (existFullPhoneNo == fullPhoneNo && users.isPhoneVerified == 1) {
//     let updatedProfile = await User.query().patch(data).where('id', req.user.id).returning('*');
//     let response = {
//         profilePic: data.profilePic
//     }
//     return okResponse(res, response, Message("updateProfile"));
// } else if (users.isPhoneVerified == 0 || existFullPhoneNo !== fullPhoneNo) {

//     // Generate your OTP
//     let ranOtp = Math.floor(1000 + Math.random() * 9000);
//     data.phoneOTP = ranOtp;


//     let msg = Message("sendOTPmsg") + ranOtp;

//     const updatedphoneOTP = await User.query().patchAndFetchById(req.user.id, {
//         phoneOTP: data.phoneOTP
//     });

//     Otp.SendOTP(phonedata, data.countryCode, msg);

//     let SendOTP = {
//         'id': req.user.id
//     }
//     return okPhoneResponse(res, SendOTP, Message("phoneOTPsend"));
// } else {

//     let response = {
//         profilePic: data.profilePic
//     }
//     return okResponse(res, response, Message("updateProfile"));
// }
// }

/**
 * getUser
 * @params get type no params;
 * @return promise
 */

const getUser = async (req, res) => {
  let userId = req.params.id;
 
  let getUser = await User.query().skipUndefined().select('id', 'name', 'email', 'phoneNo', 'address', 'countryCode', 'country_code', 'city', 'state', 'zip', 'profilePic', 'shortInfo', 'URL','isPhoneVerified','isEmailVerified','isRemind','isNotify','createdBy','latitude','longitude','currencyCode','lastLoginTime','accountStatus','isProfileUpdated','customerId','roles').where('id', userId).orderBy('created_at', 'desc').first();
  if (!getUser) {
    return badRequestError(res, "", "No user found");
  }
  return okResponse(res,
    getUser,
    "User data fetched");
}

/**
 * isRemindOrNotify 
 * @params req.body.property_id;
 * @return promise
 */

const isRemindOrNotify = async (req, res) => {
  let data = req.body;
  let isRemind, isNotify;
  let type = data.type;
  if (type == 1) {
    // let Remind = await User.query().select('isRemind').findById(req.user.id);
    let remind = await User.query().patchAndFetchById(req.user.id, {
      isRemind: data.value
    });
    if (!remind) {
      return badRequestError(err, "", "error in updating");
    }
    return okResponse(res, {}, "remind is updated");
  }
  if (type == 2) {
    // let Notify = await User.query().select('isNotify').findById(req.user.id);
    let notify = await User.query().patchAndFetchById(req.user.id, {
      isNotify: data.value
    })
    if (!notify) {
      return badRequestError(err, "", "error in updating");
    }
    return okResponse(res, {}, "notify is updated");
  }

}

/**
 * Logout
 * @params req.body;
 * @return promise
 */

const Logout = async (req, res) => {
  let data = req.body;
  //let deviceId = (req.user.userLoginDetail!=undefined) ? ((req.user.userLoginDetail.length> 0) ? req.user.userLoginDetail[0].deviceId : data.deviceId) : data.deviceId;
  let todayDate = new Date();
  let todayTime = moment(todayDate).format('YYYY-MM-DD HH:mm:ss');
  const logout = await User.query().skipUndefined().patchAndFetchById(req.user.id, {
    token: ''
  });
  let update = await UserLoginDetail.query().patch({ 'signOutTime': todayTime, 'currentStatus': 'Logged Out', 'authToken': "", 'deviceToken': "" }).where('userId', req.user.id).where('deviceId', req.user.userLoginDetail[0].deviceId).first();

  return okResponse(res, {}, Message("Logout"));
}

/**
 * @function: Forgot Password (sendEmailOTP) 
 * @description: otp varification with register mobile number
 * @param {*} req
 * @param {*} res
 */
const forgotPassword = async (req, res) => {
  
  let data = req.body;
  // if (!data.id) {

  //   return badRequestError(res, "", "please Enter Email !");
  // }
 
  let user = await User.query().select().where('email', data.email).first();
  if (!user) {
    return badRequestError(res, "", Message("invalidAuth"));
  }
  if (user.userType == "customer") {
    return badRequestError(res, "", Message("invalidAuth"));
  }

  //check account status
  if ((user.is_active == false) || (user.accountStatus == 'inactive')) {
    return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
  }

  let ranOtp = Math.floor(1000 + Math.random() * 9000);
  user.emailOTP = ranOtp;
 

  EMAIL.sendEmail(user.email, "Forgot Password", "Hii " + user.name + ", <br> Welcome to Event365 Live.<br>Please do not share this OTP with anyone for security reasons. Your OTP is: " + "<b>" + ranOtp + "</b>" + "");
  let updateOTP = await User.query().context({
    email: user.email
  }).update({
    "emailOTP": user.emailOTP

  }).where("email", user.email);
  if (!user) {
    return badRequestError(res, "", "User does not exist with this email");

  } else {
    let updateEmailOtp = await User.query().context({
      emailOTP: ranOtp
    }).update({
      "emailOTP": ranOtp, //ranOtp

    }).where("email", user.email);
    if (!updateEmailOtp) {
      throw badRequestError(Message("errorParsingResponse"));
    }
    let response = {
      'id': user.id
    }

    // let link = GLOBAL_CLIENT_URL + 'auth/account-activated/app-link?verify=';
    // EMAIL.sendEmail(data.email, 'Hello Event365 user, Your OTP is ' + ranOtp + ' You can continue click this link - : ' + link + '');
    return okResponse(res, {
      ...response,
    }, "OTP send Sucessfully your Email!");
  }
}

// const forgotPassword = async (req, res) => {
//   let data = req.body;
//   if (!data.email) {
//     return badRequestError(res, "please Enter Email");
//   }
//   let ranOtp = Math.floor(100000 + Math.random() * 900000);

//   let user = await User.query().where('email', data.email).first();

//   if (!user) {
//     return badRequestError(res, "User does not exist with this email");

//   } else {
//     let alreadyOTP = await User.query().select('emailOTP').where('email', data.email).first();

//     let otp = alreadyOTP.emailOTP;
//     if (otp !== null) {
//       return badRequestError(res, "Already send OTP your emailId Please Check !");
//     } else {
//       let updateEmailOtp = await User.query().context({
//         emailOTP: ranOtp
//       }).update({
//         "emailOTP": ranOtp,

//       }).where("email", data.email);
//       if (!updateEmailOtp) {
//         throw badRequestError("Something went wrong.");
//       }
//       let link = GLOBAL_CLIENT_URL + 'auth/account-activated/app-link?verify=';
//       EMAIL.sendEmail(data.email, 'Hello Event365 user, Your OTP is ' + ranOtp + ' You can continue click this link - : ' + link + '');
//       return okResponse(res, {
//         ...updateEmailOtp,
//       }, "OTP send Sucessfully !");
//     }
//   }
// }

/**
 * Resend OTP
 * @params req.body.;
 * @return promise
 */

const againResedOTP = async (req, res) => {
 
  let data = req.body;
  
  if (!data.id) {
    return badRequestError(res, "", "please Enter id");
  }

  let user = await User.query().select('email', 'name').where('id', data.id).first();
  if (!user) {
    return badRequestError(res, "", "User does not exist with this email");
  }
  if (user.userType == "customer") {
    return badRequestError(res, "", Message("invalidAuth"));
  }
  //check account status
  if ((user.is_active == false) || (user.accountStatus == 'inactive')) {
    return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
  }

 
  let ranOtp = Math.floor(1000 + Math.random() * 9000);
  data.emailOTP = ranOtp;

  EMAIL.sendEmail(user.email, "Account Activation", "Hi " + user.name + ", <br> Welcome to 365Live.<br>Please do not share this one-time password with anyone for security reasons.<br> Your one-time password is: " + "<b>" + ranOtp + "</b>" + "");

  let updateOTP = await User.query().context({
    email: user.email
  }).update({
    "emailOTP": data.emailOTP

  }).where("email", user.email);

  if (!user) {
    return badRequestError(res, "", "User does not exist with this email");

  } else {
    let updateEmailOtp = await User.query().context({
      emailOTP: ranOtp
    }).update({
      "emailOTP": ranOtp, //ranOtp

    }).where("email", user.email);
    if (!updateEmailOtp) {
      throw badRequestError("Something went wrong.");
    }
    let response = {
      'id': user.id,
      'email': user.email
    }
    return okResponse(res, {
      ...response,
    }, "OTP send Sucessfully your Email!");
  }
}

/**
 * ProfileDetail
 * @params req.body.;
 * @return promise
 */

const ProfileDetail = async (req, res) => {

  let details = await User.query().skipUndefined().select('id', 'name', 'email', 'address', 'city', 'state', 'countryCode', 'country_code', 'zip', 'phoneNo', 'URL', 'profilePic', 'shortInfo', 'isContactVia', 'userType','isPhoneVerified','isEmailVerified','roles','createdBy').mergeNaiveEager('contactVia').modifyEager('contactVia', builder => {
    builder.distinct('contactVia')
  }).where('id', req.user.id).first();

  if (!details) {
    return badRequestError(res, "", "No profile found");
  }
  return okResponse(res, details, "Profile Fetched");
}

/**
 * venueimages
 * @params req.body.;
 * @return promise
 */
const venueimages = async (req, res) => {

  let venueImages = await VenueImages.query().skipUndefined().select('venueImages').where('venueId', req.params.id)

  if (!venueImages) {
    return badRequestError(res, "", "No venue images found");
  }
  return okResponse(res, venueImages, "Venue images Fetched");
}

/**
 * Get Bank Details
 * @params get type no params;
 * @return promise
 */
const getBankDetails = async (req, res) => {

  let page = (req.query.page) ? req.query.page : 1;
  let limit = (req.query.limit) ? req.query.limit : PER_PAGE;
  let offset = (req.query.offset) ? req.query.offset : limit * (page - 1);

  let userId = req.user.id;
  let [err, BankDeatls] = await to(User.query().skipUndefined().select("").eager('[bank_details]').modifyEager('bank_details', builder => {
    builder.select("id as bankIdKey", "AccountNo", "routingNo", "bankName", 'active')
  }).where('id', userId).offset(offset).limit(limit).first());

  if (err) {
    return badRequestError(res, "", err.message);
  }
  if (BankDeatls.bank_details == undefined || BankDeatls.bank_details == "" || BankDeatls.bank_details == null) {
    BankDeatls.stripeAccountStatus = false;
    BankDeatls.accountLinkStatus = req.user.accountLinkStatus;
    if (req.user.accountId) {
      const getStripeDetail = await stripe.getAccountDetail({ accountId: req.user.accountId });
      BankDeatls.stripeAccountStatus = getStripeDetail;
    }
  } else {
    BankDeatls.accountLinkStatus = false;
    BankDeatls.stripeAccountStatus = false
  }
  BankDeatls.page = page
  return okResponse(res, BankDeatls, Message("getBankDetails"));
}

/**
 * Add BankDetails
 * @params req.body;
 * @return promise
 */
const addBankDetails = async (req, res) => {
 
  let data = req.body;
  let userId = req.user.id;
  //data.id= userId;

  if (!data.AccountNo) {
    return badRequestError(res, "", "Please enter A/C Number");
  }

  if (!data.routingNo) {
    return badRequestError(res, "", "Please enter Routing Number");
  }
  if (!req.user.currencyCode) {
    return badRequestError(res, "", "Currency code required");
  }
  if (!req.user.country_code) {
    return badRequestError(res, "", "Country code required");
  }
  data.userId = userId
  let BankDeatls, err;
  let userinfo = await User.query().select('customerId').where('id', req.user.id).first();

  const createBankId = await stripe.createBank({ routing_number: data.routingNo, account_number: data.AccountNo, accountId: req.user.accountId, countryCode: req.user.country_code, currency: req.user.currencyCode });
  if (createBankId.status == false) {
    return badRequestError(res, "", createBankId.data.message);
  }
  //data.countryCode = req.user.country_code;
  data.bankIdKey = createBankId.data.id;
 
  [err, BankDeatls] = await to(bankDetails.query().upsertGraph(data).returning('*'));

  let userData = await User.query().skipUndefined().select("name", "deviceToken", "id", "deviceType", "userType").where("id", req.user.id).first();

  let adminData = await Admin.query().select('id', 'device_token').where('id', 1).first();

  //Notification Process (send to Admin)
  let adminNotifiy = await AdminNotification.verifyACNotifiy(adminData, userData);

  if (err) {
    return badRequestError(res, "", err.message);
  }
  return okResponse(res, "", Message("addBankDetails"));
}

/**
 * editBankDetails
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const editBankDetails = async (req, res) => {

  let data = req.body;
 
  let userId = req.user.id;
  let [err, BankDeatls] = await to(bankDetails.query().context({
    userId: userId
  }).update(data).where("id", req.body.id));
  if (err) {
    return badRequestError(res, "", err.message);
  }
  return okResponse(res, '', Message("updateBankDetails"));
}

/**
 * Delete Event
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const deleteBankDetails = async (req, res) => {
 
  // let data = req.params.id;
  // let checkEvent = await Event.query().where('id', data.id);
  // if (checkEvent == '') {
  //     return badRequestError(res, "", Message("eventFond"));
  // }
  let deletedAc = await bankDetails.query().deleteById(req.params.id);
  return okResponse(res, "", Message("deleteBankDetails"));
}

/**
 * settingInfo
 * @params req.body 
 * @return promise
 */

const settingInfo = async (req, res) => {
  var response = {};
  response.isManageUser = false;
  response.isNotify = false;
  response.isCreateEvent = false;
  const users = await User.query().select().where("id", req.user.id).first();

  // isNotify check
  response.isNotify = users.isNotify;

  //isManageUser check
  let roles = (users.roles) ? users.roles : [];
  if (roles.includes("user_management")) {
    response.isManageUser = true
  } else {
    response.isManageUser = false
  }
  //isCreateEvent check
  if (roles.includes("event_management")) {
    response.isCreateEvent = true
  } else {
    response.isCreateEvent = false
  }
  return okResponse(res, response, "Get setting Info");
}

const accountLink = async (req, res) => {
  var userId = req.user.id;
  let ranOtp = Math.floor(10000 + Math.random() * 80000);
  let uniqueCode = await bcrypt.hash(userId + ranOtp + 'abcd', 10);
  if (userId == null || userId == undefined || uniqueCode == undefined) return badRequestError(res, "", "Required Parameter not found");
  //userId = base64_encode({'uniqueCode':userId});
  //const accountDetail = await stripe.payoutsCreate({stripe_account_id: req.user.accountId, amount:100});
  //const accountDetail = await stripe.createBank({accountId: req.user.accountId, routing_number:'110000000', account_number:'000123456733'});
  const accountDetail = await stripe.createAccountLink({ accountId: req.user.accountId, uniqueCode: uniqueCode });
  //const accountDetail = await stripe.getAccountDetail({accountId: req.user.accountId});
  if (accountDetail.status == true) {
    const update = await User.query().patch({ uniqueCode: uniqueCode }).where('id', userId);
    return okResponse(res, accountDetail.data, "successfully linked");
  }
  return badRequestError(res, "", accountDetail.data.message);
}

const successAccountLink = async (req, res) => {

  var id = req.query.id;
  const update = await User.query().patch({ accountLinkStatus: true, uniqueCode: '' }).where('uniqueCode', id).runAfter((result, builder)=>{
   
    return result;
  });
  // console.log('aa',update);
  return res.redirect('https://test.365live.com/success.html');
  //return okResponse(res, "", 'Successfully linked');
}

const failedAccountLink = async (req, res) => {
  ////console.log(res);
  return res.redirect('https://test.365live.com/failed.html');
  //return okResponse(res, "", "Account does not linked");
}

/**
 * socialLogin
 * @params req.body;
 * @return promise
 */

const socialLogin = async (req, res) => {
  var response = {};
  response.isManageUser = false;
  response.isUnderVenue = false;
  response.isVenueOwner = false;

  let data = req.body;
  let os = data.OS;
  let sourceIp = data.sourceIp;
  let platform = data.platform;
  let deviceId = data.deviceId;

  // if (!data.name) {
  //     return badRequestError(res, "", "Please enter name");
  // }
  // if (!data.email) {
  //     return badRequestError(res, "", "Please enter email");
  // }
  if (!data.loginType) {
    return badRequestError(res, "", "Please enter login type");
  }
  if (data.userType == 'venuer') {
    data.roles = '["event_management","user_management"]';
  }
  if (data.userType == 'host') {
    data.roles = '["event_management","user_management"]';
  }
  if (data.userType == 'promoter') {
    data.roles = '["event_management","user_management"]';
  }
  // data.userType = "host";
  // Check User exist or not
  var socialUser;
  if(data.loginType == 'apple'){
    //socialUser = await User.query().where('socailUserId', data.socailUserId).orWhere('email',data.email).whereNot('userType','customer').first();
   var socialUser = await User.query().whereNot('userType','customer').where(builder => {
       if(data.email){ 
      builder.where('email',data.email)
       } else {
        builder.where('socailUserId', data.socailUserId)
       }
      
    }).first()
}else{
   var socialUser = await User.query().whereNot('userType','customer').where(builder => {
      builder.where('email',data.email)
    }).first()
}
  //user try to login without registration
  if(!data.userType && !socialUser){
    return badRequestError(res, "", "You have not registred.Please registered with us!");
  }
  //console.log(socialUser,'do');
  if (socialUser) {
     //check account status
    if ((socialUser.is_active == false) || (socialUser.accountStatus == 'inactive')) {
      return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
    }
    if(data.loginType!='apple'){
      delete data.socailUserId;  
    } 
    data.id = socialUser.id;
    data.email = socialUser.email;
    data.name = socialUser.name
  }
 
  data.password = "";
  data.is_active = true;
  let err, updated_user;

  delete data.OS;
  delete data.sourceIp;
  delete data.platform;
  //delete data.deviceId;

  if(data.userType){
    if(socialUser){
     if(socialUser.userType!=data.userType){
      return badRequestError(res, "", "This user already exist as a "+socialUser.userType);
      }
    } 
}
  
  [err, updated_user] = await to(User.query()
    .upsertGraphAndFetch(data, {
      relate: true
    }));

  if (err) {
    //console.log('err');
    return badRequestError(res, "", err.message);
  }

  await User.query().update({createdBy: updated_user.id}).where('id', updated_user.id);

  let user = await User.query().where('id', updated_user.id).first();
  // Auth Token Generate
  let token = await user.getJWT();
  let updatedProfileStatus = await User.query().patch({ token: token }).where('id', updated_user.id);
  //as per mention in EV-127 jira
  if (data.deviceType != 'website') {
    //isPhoneVerified check
    //let checkPhone = await User.query().skipUndefined().select('phoneNo', 'isPhoneVerified').where('id', user.id).first();
   
    if (!updated_user.phoneNo) {
      let resDataPhone = {
        'id': updated_user.id,
        'name': updated_user.name,
        'email': updated_user.email,
        'countryCode': updated_user.countryCode,
        'country_code': updated_user.country_code,  
        'currencyCode': updated_user.currencyCode
      }
      res.setHeader('Authorization', token);
      res.setHeader('access-control-expose-headers', 'authorization');
      return PNAError(res, resDataPhone, "Phone Number is not available");
    } else {
      if (updated_user.isPhoneVerified == 0) {
        let resPhoneVerified = {
          'id': updated_user.id,
          'name': updated_user.name,
          'email': updated_user.email,
          'phoneNo': updated_user.phoneNo,
          'countryCode': updated_user.countryCode,
          'country_code': updated_user.country_code,  
          'currencyCode': updated_user.currencyCode
        }
        res.setHeader('Authorization', token);
        res.setHeader('access-control-expose-headers', 'authorization');
        return unverifiedMobileError(res, resPhoneVerified, "PhoneNo is not verified, please verify your Number");
      }
    }
  }
  response.user = {
    id: user.id,
    name: user.name,
    profilePic: user.profilePic,
    userType: user.userType
  }

  //isUnderVenue check
  if (user.userType == "venuer") {
    response.isVenueOwner = true
  } else {
    response.isVenueOwner = false;
  }

  //isUnderVenue check
  if (user.createdBy == user.id && user.userType == "venuer") {
    response.isUnderVenue = true;
  } else {
    response.isUnderVenue = false;
  }

  //isManageUser check
  //let roles = user.roles
  //   if (roles.includes("user_management")) {
  //     response.isManageUser = true
  // } else {
  //   response.isManageUser = false
  // }    
  response.stripeAccountStatus = false;
  response.accountLinkStatus = user.accountLinkStatus;
  if (user.accountLinkStatus == true) {
    const getStripeDetail = await stripe.getAccountDetail({ accountId: user.accountId });
    response.stripeAccountStatus = getStripeDetail;
  }

  res.setHeader('Authorization', token);
  res.setHeader('access-control-expose-headers', 'authorization');

  let tokenData = {
    deviceId: deviceId,
    deviceToken: data.deviceToken,
    OS: os,
    sourceIp: sourceIp,
    platform: platform
 }

  await updateToken(user.id,user.userType,tokenData,'Logged In',token)

  return okResponse(res, response, 'Host successfully logged !');
}

const updateSocialLoginData = async (req, res) => {
  var response = {};
  response.isManageUser = false;
  response.isUnderVenue = false;
  response.isVenueOwner = false;

  let data = req.body;
  let os = data.OS;
  let sourceIp = data.sourceIp;
  let platform = data.platform;
  let deviceId = data.deviceId;

  let roles;
  if (data.userType == 'venuer') {
    roles = '["event_management","user_management"]';
  }
  if (data.userType == 'host') {
    roles = '["event_management","user_management"]';
  }
  if (data.userType == 'promoter') {
    roles = '["event_management","user_management"]';
  }

  const update = await User.query().patch({ userType: data.userType, roles: roles }).where('id', data.userId);
  if (update) {
    let user = await User.query().where('id', data.userId).first();
    // Auth Token Generate
    let token = await user.getJWT();
    let updatedProfileStatus = await User.query().patch({ token: token }).where('id', data.userId);

    response.user = {
      id: user.id,
      name: user.name,
      profilePic: user.profilePic,
      userType: user.userType
    }

    //isUnderVenue check
    if (user.userType == "venuer") {
      response.isVenueOwner = true
    } else {
      response.isVenueOwner = false;
    }

    //isUnderVenue check
    if (user.createdBy == user.id && user.userType == "venuer") {
      response.isUnderVenue = true;

    } else {
      response.isUnderVenue = false;
    }

    //isManageUser check
    let roles = user.roles
    if (roles.includes("user_management")) {
      response.isManageUser = true
    } else {
      response.isManageUser = false
    }
    response.stripeAccountStatus = false;
    response.accountLinkStatus = user.accountLinkStatus;
    if (user.accountLinkStatus == true) {
      const getStripeDetail = await stripe.getAccountDetail({ accountId: user.accountId });
      response.stripeAccountStatus = getStripeDetail;
    }

    // Update login detail for history
    let tokenData = {
      deviceId: deviceId,
      deviceToken: data.deviceToken,
      OS: os,
      sourceIp: sourceIp,
      platform: platform
   }
  
    await updateToken(user.id,user.userType,tokenData,'Logged In',token)

    res.setHeader('Authorization', token);
    res.setHeader('access-control-expose-headers', 'authorization');
    return okResponse(res, response, 'Host successfully logged !');
  }
}

const loginWebsite = async (req, res) => {
  let data = req.body;
  var response = {};
  if (!data.email) {
      return badRequestError(res, "", Message("emailRequired"));
  }
  if (!data.password) {
      return badRequestError(res, "", Message("passwordRequired"));
  }
  //User Data fatch
  let user = await User.query().select().omit(['uniqueCode', 'adminPayment', 'country_code', 'currencyCode', 'countryName']).where('email', data.email).first();

  if (!user) {
      return badRequestError(res, "", Message("emailNotExist"));
  }
   
  // Password compare
  if (!await user.comparePassword(data.password) && user.is_active == true) {
      if (user.wrongPassAttemptCount >= 5) {
          let updatedProfileStatus = await User.query().patch({ is_active: false, accountStatus: 'inactive' }).where('id', user.id);
          return InvalidAttemptPasswordError(res, "", "Your profile has been blocked cause of you attemped 5 time wrong password.");
      }
      let updateCount = await User.query().where('id', user.id).increment('wrongPassAttemptCount', 1);
      return badRequestError(res, "", Message("invalidPassword"));
  }
  //check account status
  if (user.is_active == false || user.accountStatus == 'inactive') {
    return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
  } 
  //==========================delete device tokens================================
  // const sameDeviceTokens = await User.query().patch({
  //     deviceToken: null
  // }).where('deviceToken', user.deviceToken);

  // check isEmailVerified
  if (user.isEmailVerified == 0) {
      let ranOtp = Math.floor(1000 + Math.random() * 9000);
      data.emailOTP = ranOtp;

      EMAIL.sendEmail(data.email, "Account Activation", "Hi " + user.name + ", <br> Welcome to 365Live.<br>Please do not share this OTP with anyone for security reasons. Your OTP is: " + "<b>" + ranOtp + "</b>" + "");
      let updateOTP = await User.query().context({
          email: data.email
      }).update({
          "emailOTP": data.emailOTP

      }).where("email", data.email);

      let response = {
          'id': user.id,
          'customerId': user.customerId,
          'email': user.email,
          'userType': user.userType,
          'createdBy': user.createdBy
      }
      return unverifiedEmailError(res, response, Message("otpSent"));
  }
  let resProfileInfo = "";
  let currentStatus = "Logged In";
  let auth_token = await user.getJWT();
  // Profile Update check
  //remove this option for skip process
  // if ((user.latitude == null || user.latitude == '') && (user.userType == 'customer') ) {
  //     //set header auth
  //     resProfileInfo = {
  //         'id': user.id,
  //         'name': user.name,
  //         'email': user.email,
  //         'userType': user.userType
  //     }
  //     currentStatus = "Update Profile";
  // }
  user.isProfileUpdated = false;
  if ((!!user.latitude) && (!!user.longitude) && (user.latitude!='undefined') && (user.userType!='customer')) { 
    user.isProfileUpdated = true;
  }

  //isUnderVenue check
  if(user.userType!='customer'){
    if (user.userType == "venuer") {
      user.isVenueOwner = true
    } else {
      user.isVenueOwner = false;
    }
  
    //isUnderVenue check
    if (user.createdBy == user.id && user.userType == "venuer") {
      user.isUnderVenue = true;
  
    } else {
      user.isUnderVenue = false;
    }
  
    //isManageUser check
    let roles = user.roles
   
    if (roles.includes("user_management")) {
      user.isManageUser = true
    } else {
      user.isManageUser = false
    }
  }

  let resRecommended = "";
  //Check UserChooseSubcategory
  // if(user.userType == 'customer'){ //remove this option for skip process
  //   let recommendedCheck = await UserChooseSubcategory.query().where('userId', user.id).first();
  //   //set header auth
   
  //   if (!recommendedCheck) {
  //     currentStatus = 'Recommended';
  //       resRecommended = {
  //           'id': user.id,
  //           'userType': user.userType
  //       }
  //   }
  // }
  
  if(user.userType != 'customer'){
    user.stripeAccountStatus = false;
    user.accountLinkStatus = user.accountLinkStatus;
    if (user.accountLinkStatus == true) {
      const getStripeDetail = await stripe.getAccountDetail({ accountId: user.accountId });
      user.stripeAccountStatus = getStripeDetail;
    }
    delete user.token;
  }
 

  // Update login detail for history
  let todayDate = new Date();
  let todayTime = moment(todayDate).format('YYYY-MM-DD HH:mm:ss');

  let loginDetail = {
      userId: user.id,
      signInTime: todayTime,
      currentStatus: currentStatus,
      browser: 'In-App',
      loginType: 'Application',
      deviceId: data.deviceId,
      deviceToken: data.deviceToken,
      OS: data.OS,
      sourceIp: data.sourceIp,
      platform: data.platform,
      authToken: auth_token,
      deviceType: data.deviceType
     
  }

  await updateToken(user.id,user.userType,loginDetail,'Logged In',auth_token);

  res.setHeader('Authorization', auth_token);
  res.setHeader('access-control-expose-headers', 'authorization');
  
  if(resProfileInfo){
    return PInfoError(res, resProfileInfo, "Please Update your Profile");
  }
  if(resRecommended){
    return RecommendedError(res, resRecommended, "Please Choose Recommended !");
  }

  const devicetype = await User.query().skipUndefined().patchAndFetchById(user.id, {
    wrongPassAttemptCount: 0
  });
  
  delete user.password;
  delete user.isPhoneVerified;
  delete user.isEmailVerified;
  delete user.deviceToken;
  delete user.created_at;
  delete user.updated_at;
  delete user.emailOTP;
  delete user.socialUserId;
  delete user.totalAmount;
  delete user.currentAmounts;
  delete user.deviceType;
  //delete user.roles;
 // delete user.createdBy;
  delete user.socailUserId;
  delete user.phoneOTP;
  delete user.isReleased;
  delete user.accountId;
  delete user.wrongPassAttemptCount;
  delete user.stripeAccountStatus;
  if(user.userType == 'customer'){
    return okResponse(res, user, "Login successfully !");
  }else{
    return okResponse(res, user, "Login successfully !");
  }
}

const socialLoginWebsite = async (req, res) => {
  var response = {};
  
  let data = req.body;
  let os = data.OS;
  let sourceIp = data.sourceIp;
  let platform = data.platform;
  let deviceId = data.deviceId;
 
  if (!data.loginType) {
    return badRequestError(res, "", "Please enter login type");
  }
  // data.userType = "host";
  // Check User exist or not
  var socialUser;
  if (data.loginType == 'apple') {
    socialUser = await User.query().where(builder => {
      builder.orWhere('email', data.email).orWhere('socailUserId', data.socailUserId)
    }).first()
                       
  } else {
    socialUser = await User.query().where(builder => {
      builder.orWhere('email', data.email).orWhere('socailUserId', data.socailUserId)
    }).first()
  }
  if(!data.userType && !socialUser){
    return badRequestError(res, "", "You have not registred.Please registered with us!");
  }
  if (socialUser) {
    //check account status
    if (socialUser.is_active == false || socialUser.accountStatus == 'inactive') {
      return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
    } 
    data.id = socialUser.id;
    data.email = socialUser.email;
    data.name = socialUser.name
  }else{
      // Create Customer Id
      data.customerId = await stripe.GetCustomerID({
        email: data.email
      });
  }
  data.password = "";
  data.is_ajkhkhlhiihihkl,
  data.isEmailVerified=1;
  let err, updated_user;

  delete data.OS;
  delete data.sourceIp;
  delete data.platform;
  //delete data.deviceId;

if(data.userType){
if(socialUser){
 if(socialUser.userType!=data.userType){
  return badRequestError(res, "", "This user already exist as a "+socialUser.userType);
  }
} 
}

if (data.userType == 'venuer') {
  data.roles = '["event_management","user_management"]';
}
if (data.userType == 'host') {
  data.roles = '["event_management","user_management"]';
}
if (data.userType == 'promoter') {
  data.roles = '["event_management","user_management"]';
}

  [err, updated_user] = await to(User.query()
    .upsertGraphAndFetch(data, {
      relate: true
    }));

  if (err) {
    return badRequestError(res, "", err.message);
  }

  let user = await User.query().where('id', updated_user.id).first();
  // Auth Token Generate
  let token = await user.getJWT();
  //let updatedProfileStatus = await User.query().patch({ token: token }).where('id', updated_user.id);
  

  let resProfileInfo = "";
  let currentStatus = "Logged In";
  response.isManageUser = false,
  response.isUnderVenue = false,
  response.isVenueOwner = false
  if(user.userType != 'customer'){
    response.user = {
      id: user.id,
      name: user.name,
      profilePic: user.profilePic,
      userType: user.userType,
     
    }
    //isUnderVenue check
    if (user.userType == "venuer") {
      response.isVenueOwner = true
    } else {
      response.isVenueOwner = false;
    }
  
    //isUnderVenue check
    if (user.createdBy == user.id && user.userType == "venuer") {
      response.isUnderVenue = true;
    } else {
      response.isUnderVenue = false;
    }
  
    //isManageUser check
    
    let roles = user.roles
    if(roles){
      if (roles.includes("user_management")) {
        response.isManageUser = true
    } else {
      response.isManageUser = false
    }   
  } 
    response.stripeAccountStatus = false;
    response.accountLinkStatus = user.accountLinkStatus;
    if (user.accountLinkStatus == true) {
      const getStripeDetail = await stripe.getAccountDetail({ accountId: user.accountId });
      response.stripeAccountStatus = getStripeDetail;
    }

    response.isProfileUpdated = false;
    if ((!!user.latitude) && (!!user.longitude) && (user.latitude!='undefined')) { 
      response.isProfileUpdated = true;
    }
  }else{
    response = {
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'profilePic': user.profilePic,
        "isRemind": user.isRemind,
        "isNotify": user.isNotify,
        'customerId': user.customerId,
        'userType': user.userType,
        'createdBy':user.createdBy,
        'roles':user.roles
    } 

    // Profile Update check
    // if (user.latitude == null || user.latitude == "") { //remove this option for skip process
    //   currentStatus = 'Update Profile';
    //     //set header auth
    //     resProfileInfo = {
    //         'id': user.id,
    //         'name': user.name,
    //         'email': user.email,
    //         'userType': user.userType
    //     }
        
    // }

   
  
  }
  
  // Update login detail for history
  let todayDate = new Date();
  let todayTime = moment(todayDate).format('YYYY-MM-DD HH:mm:ss');
  
  let loginDetail = {
    userId: user.id,
    signInTime: todayTime,
    currentStatus: currentStatus,
    browser: 'In-App',
    loginType: 'Application',
    deviceId: deviceId,
    deviceToken: data.deviceToken,
    OS: os,
    sourceIp: sourceIp,
    platform: platform,
    authToken: token,
    deviceType: data.deviceType
  }

  await updateToken(user.id,user.userType,loginDetail,'Logged In',token);
  res.setHeader('Authorization', token);
  res.setHeader('access-control-expose-headers', 'authorization');
  
  if(resProfileInfo){
    return PInfoError(res, resProfileInfo, "Please Update your Profile");
  }
  return okResponse(res, response, 'Host successfully logged !');
}


const forgotPasswordWebsite = async (req, res) => {
  let data = req.body;
  let user = await User.query().select('id','email','name', 'userType', 'is_active', 'accountStatus').where('email', data.email).first();
  if (!user) {
    return badRequestError(res, "", Message("invalidAuth"));
  }
  //check account status
  if (user.is_active == false || user.accountStatus == 'inactive') {
    return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
  } 
  let ranOtp = Math.floor(1000 + Math.random() * 9000);
  //user.emailOTP = ranOtp;
 
  EMAIL.sendEmail(user.email, "Forgot Password", "Hii " + user.name + ", <br> Welcome to Event365 Live.<br>Please do not share this OTP with anyone for security reasons. Your OTP is: " + "<b>" + ranOtp + "</b>" + "");
  let updateOTP = await User.query().context({
    email: user.email
  }).update({
    "emailOTP": ranOtp
  }).where("email", user.email);
  if (!updateOTP) {
    throw badRequestError(Message("errorParsingResponse"));
  }
  let response = {
    'id': user.id,
    'userType': user.userType
  }
  return okResponse(res, {
    ...response,
  }, "OTP send Sucessfully your Email!");
}

//create stripe account 
const createAccountId = async (req, res) => {
  
  const users = req.user;
  const data = req.body;
  if (users.is_active == false || users.accountStatus == 'inactive') {
    return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
  }

  if ((users.userType == 'venuer' || users.userType == "promoter" || users.userType == "host") && (users.accountId == '' || users.accountId == null)) {
    let createAccountStripe = await stripe.createAccount({ countryCode: data.country_code, email: users.email });
   
    if (createAccountStripe != undefined) {
      
      if (createAccountStripe.status == false) {
        return badRequestError(res, "", createAccountStripe.data.message);
      }
      let accountId = createAccountStripe.id;
     
      let updateId = await User.query().update({ 'accountId' : accountId, 'country_code': data.country_code, 'currencyCode': data.currencyCode}).where('id', users.id);
      return okResponse(res, accountId, Message("accountIdCreated"));
    }
  }
  return badRequestError(res, "", Message('SomeError'));
}

const updateToken = async (userId,userType,data,currentStatus,auth_token) => {
  // Update login detail for history
  let todayDate = new Date();
  let todayTime = moment(todayDate).format('YYYY-MM-DD HH:mm:ss');
  
  let browser = '';
  let loginType = '';
  
  if(data.deviceType!= 'android' && data.deviceType!= 'ios'){
      browser = 'In-Web';
      loginType = 'Website';
  }else{
      browser = 'In-App';
      loginType = 'Application';
  }

  let loginDetail = {
      userId: userId,
      signInTime: todayTime,
      currentStatus: currentStatus,
      browser: browser,
      loginType: loginType,
      deviceId: data.deviceId,
      deviceToken: data.deviceToken,
      deviceType: data.deviceType,
      OS: data.OS,
      sourceIp: data.sourceIp,
      platform: data.platform,
      authToken: auth_token
  }
  let insertLoginDetail, updateToken, update;
  let checkAlreadyExist = await UserLoginDetail.query().select('id', 'userId', 'deviceId').where('userId', userId).where('deviceId', data.deviceId).first();
  if (checkAlreadyExist) {
      update = await UserLoginDetail.query().patch(loginDetail).where('deviceId', data.deviceId).where('userId', userId);
  } else {
      insertLoginDetail = await UserLoginDetail.query().insert(loginDetail);
  }
  updateToken = await UserLoginDetail.query().patch({ 'deviceToken': '', 'authToken': '' }).whereNot('userId', userId).where('userType',userType).where('deviceId', data.deviceId);

}

module.exports = {
  signup,
  verifyEmail,
  sendPhoneOTP,
  verifyPhone,
  forgotPassword,
  verifyResetPW,
  resetPassword,
  ResendOTP,
  loginUser,
  editProfile,
  changePassword,
  contactUs,
  updateProfile,
  getUser,
  isRemindOrNotify,
  Logout,
  againResedOTP,
  ProfileDetail,
  venueimages,
  settingInfo,
  //Bank
  getBankDetails,
  addBankDetails,
  editBankDetails,
  deleteBankDetails,
  accountLink,
  successAccountLink,
  failedAccountLink,
  socialLogin,
  updateSocialLoginData,
  forgotPasswordWebsite,
  loginWebsite,
  socialLoginWebsite,
  createAccountId
}
