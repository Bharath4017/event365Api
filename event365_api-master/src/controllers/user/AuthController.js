'use strict';

const User = require('../../models/users');
const validator = require('validator');
const Contact = require('../../models/contactUs');
const AppContent = require('../../models/app_content');
const UserChooseSubcategory = require('../../models/userChooseSubCategory');
const ValidationError = require('objection').ValidationError;
require('../../global_functions');
require('../../global_constants');
const bcrypt = require('bcrypt');
const Otp = require('./../../middlewares/plivo');
//const Otp = require('./../../middlewares/msg91');
const EMAIL = require('./../../middlewares/email');
const jwt = require('jsonwebtoken');
const stripe = require('./../../middlewares/stripe');
const plivo = require('./../../middlewares/plivo');
const Admin = require('../../models/admin');
const UserLoginDetail = require('../../models/userLoginDetails');
const AdminNotification = require('./../../middlewares/push_notification');
var moment = require('moment');

const sendMail = async (req, res) => {
    //EMAIL.sendEmail('jaipal.solanki@engineerbabu.in',"Test","Hi this is testing");
    //Otp.SendOTP('7999685730', '91', 'This is testing'); //phoneOTPsend
}

/**
 * Signup - singnUp Only user (customer)
 * @params req.body;
 * @return promise
 */
const signup = async (req, res) => {
   
    let data = req.body;
    if (!data.name) {
        return badRequestError(res, "", "Please enter name");
    }

    if (!data.email) {
        return badRequestError(res, "", "Please enter email");
    }

    if (!data.password) {
        return badRequestError(res, "", "Please enter password");
    }
    data.userType = "customer";
    data.is_active = true;

    //data.emailOTP = 1234;
    let ranOtp = Math.floor(1000 + Math.random() * 9000);
    data.emailOTP = ranOtp;
    let err, inserted_user;
    let checkEmailExists = await User.query().select('id', 'isEmailVerified').where('email', data.email).first();
    if(checkEmailExists){
        if(checkEmailExists.isEmailVerified==1){
            return badRequestError(res, "", Message('accountEmailExists'));
        }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
        data.id = checkEmailExists.id;
        [err, inserted_user] = await to(User.query().upsertGraph(data).returning('*'));
        if (err) {
        return badRequestError(res, "", err.message);
        }
    }else{
        let customerId = await stripe.GetCustomerID({
            email: data.email
        });
        data.customerId = customerId;
        [err, inserted_user] = await to(User.query().insert(data).returning('*'));
        await User.query().update({createdBy: inserted_user.id}).where('id', inserted_user.id);
        if (err) {
            return badRequestError(res, "", err.message);
        }
    }
    EMAIL.sendEmail(data.email, "Account Activation", "Hi " + data.name + ", <br>Welcome to 365Live.<br>Please do not share this one-time password with anyone for security reasons.<br> Your one-time password is: " + "<b>" + ranOtp + "</b>" + "");
    res.setHeader('Content-Type', 'application/json');
    let response = {
        'id': inserted_user.id,
        'customerId': inserted_user.customerId
    }
    return okResponse(res,
        response, Message("otpSent"));
}

/**
 * verifyEmail (2nd Process)
 * @params req.body
 * @return promise
 */
const verifyEmail = async (req, res) => {
    
    let data = req.body;
    if (!data.id) {
        return badRequestError(res, "", "Please enter Id");
    }
    if (!data.otp) {
        return badRequestError(res, "", Message("validOTP"));
    }
    const users = await User.query().findById(data.id);
    if (!users) return badRequestError(res, "", Message("emailNotExist"));

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

        let checkPhone = await User.query().skipUndefined().select('id', 'name', 'email', 'latitude', 'latitude','userType').where('id', data.id).first();
      

        if (!checkPhone.latitude) {
            let resDataPhone = {
                'id': data.id,
                'name': checkPhone.name,
                'email': checkPhone.email
            }
        
            await updateToken(data.id,tokenData,'Logged In',auth_token,checkPhone.userType)

            return PInfoError(res, resDataPhone, "Please Update your Profile");
        } else {
            await updateToken(data.id,tokenData,'Logged In',auth_token,checkPhone.userType)

            return okResponse(res, {}, Message("emailVerified"));
        }
        //return okResponse(res, {}, Message("emailVerified"));
    } else {
        return badRequestError(res, {}, Message("IncorrectOTP"));
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

    //check Phone No
    let checkExistPhone = await User.query().select('id', 'isPhoneVerified').where('phoneNo', data.phoneNo).andWhere("id", data.id).first();
    if (checkExistPhone) {
        if (checkExistPhone.isPhoneVerified == 1) {
            return badRequestError(res, "", Message("phoneAlreadyVerified"));
          }
    }else{
        let checkExistPhone2 = await User.query().select().where('phoneNo', data.phoneNo)
        
        if (checkExistPhone2.length > 0) {
            return badRequestError(res, "", "This Phone number already exits");
        }
    }
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
    let data = req.body;
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

    const users = await User.query().findById(data.id);

    const userphoneOTP = await User.query().select("phoneOTP").findById(data.id).first();
    if (!users) return badRequestError(res, "", Message("userNotRegisterd"));
    if (userphoneOTP.phoneOTP == data.otp) {
        //generete auth token
        let auth_token = await users.getJWT();
        //set header auth token
        res.setHeader('Authorization', auth_token);
        res.setHeader('access-control-expose-headers', 'authorization');
        //update phoneNo flag

        let tokenData = {
            deviceId: data.deviceId,
            deviceType: data.deviceType,
            deviceToken: data.deviceToken,
            OS: data.OS,
            sourceIp: data.sourceIp,
            platform: data.platform,
            authToken: auth_token
         }

        let phoneFlagData = await User.query().patchAndFetchById(data.id, {
            isPhoneVerified: 1,
            phoneNo: data.phoneNo,
            countryCode: data.countryCode,
            token: auth_token
        });
        
        await updateToken(data.id,tokenData,'Logged In',auth_token,users.userType)
        //set success response
        let resUpdatedProfile = {
            'id': req.body.id
        }
        return okResponse(res, resUpdatedProfile, "Please choose Recommended !");
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
    if (!data.email) {
        return badRequestError(res, "", "Please enter email");
    }
    let user = await User.query().where('email', data.email).first();

    if (!user) {
        return badRequestError(res, "", "user does not exist with this email");
    }

    if (user.is_active == false || user.accountStatus == 'inactive') {
        return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
    }

    if (data.otp == user.emailOTP) {
        return okResponse(res, {}, "otp is correct");
    } else {
        return badRequestError(res, "", "incorrect otp");
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

    if (user.userType != "customer") {
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
 * resetPassword
 * @params req.body.email;
 * @params req.body.newPassword;
 * @return promise
 */
 const CommonresetPassword = async (req, res) => {
    let data = req.body;
    if (!data.email) {
        return badRequestError(res, "", "please enter email");
    }
    let user = await User.query().where('email', data.email).first();

    // if (user.userType != "customer") {
    //     return badRequestError(res, "", Message("invalidAuth"));
    // }
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
 * socialLogin
 * @params req.body;
 * @return promise
 */

const socialLogin = async (req, res) => {
    let data = req.body;
    let os = data.OS;
    let sourceIp = data.sourceIp;
    let platform = data.platform;
    let deviceId = data.deviceId;

    if (!data.loginType) {
        return badRequestError(res, "", "Please enter login type");
    }
    data.userType = "customer";
    data.is_active = true;
    if(data.loginType == 'apple'){
        //socialUser = await User.query().where('socailUserId', data.socailUserId).orWhere('email',data.email).whereNot('userType','customer').first();
       var socialUser = await User.query().where(builder => {
           if(data.email){ 
          builder.where('email',data.email)
           } else {
            builder.where('socailUserId', data.socailUserId)
           }
          
        }).first()
    }else{
       var socialUser = await User.query().where(builder => {
          builder.where('email',data.email)
        }).first()
    }
    // Check User exist or not
   // let socialUser = await User.query().where('socailUserId', data.socailUserId).first();
   //console.log('jshdghf',socialUser)
    if (socialUser) {
        if (socialUser.is_active == false || socialUser.accountStatus == 'inactive') {
            return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
        }
        if(data.loginType!='apple'){
            delete data.socailUserId;  
        } 
        data.id = socialUser.id;
        data.email = socialUser.email;
        data.name = socialUser.name
    } else {
        // Create Customer Id
        data.customerId = await stripe.GetCustomerID({
            email: data.email
        });
    }
    data.password = "";
    delete data.sourceIp;
    delete data.OS;
    delete data.platform;
    //delete data.deviceId;

    if(data.userType){
        if(socialUser){
         if(socialUser.userType!=data.userType){
          return badRequestError(res, "", "This user already exist as a "+socialUser.userType);
          }
        } 
   }
   

    let err, updated_user;
    [err, updated_user] = await to(User.query()
        .skipUndefined()
        .upsertGraphAndFetch(data, {
            relate: true
        }));
    if (err) {
        return badRequestError(res, "", err.message);
    }
    let user = await User.query().where('id', updated_user.id).first();
    // Auth Token Generate
    let token = await user.getJWT();
    let updatedToken = await User.query().patch({ token: token }).where('id', updated_user.id);

    const response = {
        'id': updated_user.id,
        'email': updated_user.email,
        'name': updated_user.name,
        'profilePic': updated_user.profilePic,
        "isRemind": updated_user.isRemind,
        "isNotify": updated_user.isNotify,
        'customerId': updated_user.customerId,
    }

    // Profile Update check
    // if (socialUser.latitude == null || socialUser.latitude == "") { remove for skip option
    //     //set header auth
    //     res.setHeader('Authorization', token);
    //     res.setHeader('access-control-expose-headers', 'authorization');

    //     let resProfileInfo = {
    //         'id': socialUser.id,
    //         'name': socialUser.name,
    //         'email': socialUser.email
    //     }

    //     let tokenData = {
    //     deviceId: deviceId,
    //     deviceToken: data.deviceToken,
    //     OS: os,
    //     sourceIp: sourceIp,
    //     platform: platform
    //  }
    //     await updateToken(socialUser.id,tokenData,'Update Profile',token)

    //     return PInfoError(res, resProfileInfo, "Please Update your Profile");
    // }

    // As per mentioned in EV-127 jira
    // if (socialUser.phoneNo == '' || socialUser.phoneNo == null) {
    //     let resDataPhone = {
    //         'id': socialUser.id,
    //         'name': socialUser.name,
    //         'email': socialUser.email
    //     }
    //     let auth_token = data.token;
    //     res.setHeader('Authorization', auth_token);
    //     res.setHeader('access-control-expose-headers', 'authorization');
    //     return PNAError(res, resDataPhone, "Phone Number is not available");
    // }

    res.setHeader('Authorization', token);
    res.setHeader('access-control-expose-headers', 'authorization');
    
    let tokenData = {
        deviceId: deviceId,
        deviceToken: data.deviceToken,
        OS: os,
        sourceIp: sourceIp,
        platform: platform
     }

    await updateToken(updated_user.id,tokenData,'Logged In',token,user.userType)

    return okResponse(res,
        response, 'User successfully logged !');
}

const testMsg = async (req, res) => {
    l//et msg = await plivo.SendOTP('9617822421', '91', 'Hi This is testing');
    //return okResponse(res, msg, "Send successfully !");
}

/**
 * loginUser
 * @params req.body;
 * @return promise
 */

const loginUser = async (req, res) => {
    let data = req.body;
    if (!data.email) {
        return badRequestError(res, "", Message("emailRequired"));
    }
    if (!data.password) {
        return badRequestError(res, "", Message("passwordRequired"));
    }
    //User Data fatch
    let user = await User.query().where('email', data.email).first();

    if (!user) {
        return badRequestError(res, "", Message("emailNotExist"));
    }
    if (user.userType != "customer") {
        return badRequestError(res, "", Message("invalidAuth"));
    }

    if (user.is_active == false || user.accountStatus == 'inactive') {
        return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
    }
    // Password compare
    if (!await user.comparePassword(data.password)) {
        if (user.wrongPassAttemptCount >= 5) {
            let updatedProfileStatus = await User.query().patch({ is_active: false,  accountStatus: 'inactive' }).where('id', user.id);
            return InvalidAttemptPasswordError(res, "", "Your profile has been blocked cause of you attemped 5 time wrong password.");
        }
        let updateCount = await User.query().where('id', user.id).increment('wrongPassAttemptCount', 1);
        return badRequestError(res, "", Message("invalidPassword"));
    }
    //==========================delete device tokens================================
    const sameDeviceTokens = await User.query().patch({
        deviceToken: null
    }).where('deviceToken', user.deviceToken);

    // check isEmailVerified
    if (user.isEmailVerified == 0) {
        let ranOtp = Math.floor(1000 + Math.random() * 9000);
        data.emailOTP = ranOtp;

        EMAIL.sendEmail(data.email, "Account Activation", "Hi " + user.name + ", <br>Welcome to 365Live.<br>Please do not share this one-time password with anyone for security reasons.<br> Your one-time password is: " + "<b>" + ranOtp + "</b>" + "");
        let updateOTP = await User.query().context({
            email: data.email
        }).update({
            "emailOTP": data.emailOTP

        }).where("email", data.email);

        let response = {
            'id': user.id,
            'customerId': user.customerId,
            'email': user.email,
        }
        return unverifiedEmailError(res, response, Message("otpSent"));
    }

    let auth_token = await user.getJWT();

    // Profile Update check
    // if (user.latitude == null || user.latitude == '') { //remove for skip option
    //     //set header auth
    //     res.setHeader('Authorization', auth_token);
    //     res.setHeader('access-control-expose-headers', 'authorization');

    //     let resProfileInfo = {
    //         'id': user.id,
    //         'name': user.name,
    //         'email': user.email
    //     }

    //     //common function to update the login detail
    //     await updateToken(user.id,data,'Update Profile',auth_token)

    //     return PInfoError(res, resProfileInfo, "Please Update your Profile");
    // }
    // if (user.phoneNo == '' || user.phoneNo == null) {
    //     let resDataPhone = {
    //         'id': user.id,
    //         'name': user.name,
    //         'email': user.email
    //     }
    //     let auth_token = user.token;
    //     res.setHeader('Authorization', auth_token);
    //     res.setHeader('access-control-expose-headers', 'authorization');
    //     return PNAError(res, resDataPhone, "PhoneNo is not Available");
    // }

    // check isPhoneVerified
    // if (user.isPhoneVerified == 0) {n
    //     let resDataPhone = {
    //         'id': user.id
    //     }
    //     let auth_token = user.token;
    //     res.setHeader('Authorization', auth_token);
    //     res.setHeader('access-control-expose-headers', 'authorization');
    //     return unverifiedMobileError(res, resDataPhone, "phoneNo is not verified, please verify you Number");
    // }

    //UserChooseSubcategory
    let recommendedCheck = await UserChooseSubcategory.query().where('userId', user.id).first();
    //set header auth
    res.setHeader('Authorization', auth_token);
    res.setHeader('access-control-expose-headers', 'authorization');

    if (!recommendedCheck) {
        let resRecommended = {
            'id': user.id
        }

        await updateToken(user.id,data,'Recommend',auth_token,user.userType)
        return RecommendedError(res, resRecommended, "Please Choose Recommended !");
    }
    //generate auth_token
    const devicetype = await User.query().skipUndefined().patchAndFetchById(user.id, {
        deviceType: data.deviceType,
        deviceToken: data.deviceToken,
        deviceId: data.deviceId,
        wrongPassAttemptCount: 0,
        token: auth_token
    });
  
    res.setHeader('Authorization', auth_token);
    res.setHeader('access-control-expose-headers', 'authorization');

    user = await User.query().select("id", "name", "profilePic", "isRemind", "isNotify", "customerId","userType").where('email', data.email).first();
    delete user.token;

    //common function to update the login detail
    await updateToken(user.id,data,'Logged In',auth_token,user.userType)

    return okResponse(res, user, "Login successfully !");
}

/**
 * editProfile
 * @params req.body.property_id;
 * @return promise
 */

const editProfile = async (req, res) => {
    let data = req.body;
    let checkPhone = await User.query().skipUndefined().where('phoneNo', data.phoneNo).first();

    if (checkPhone && checkPhone.id == req.user.id && checkPhone.isPhoneVerified == 1) {
        return okResponse(res, {
            checkPhone
        }, "profile details updated");
    }

    if (checkPhone && checkPhone.isPhoneVerified == 1) {
        return badRequestError(res, "", "Account with this phone number already exists");
    } else {
        // data.phoneOTP = 1234;
        let user = await User.query().patchAndFetchById(req.user.id, data);
        let msg = 'Message: Do not Share this code with anyone for security reasons. Your unique varification code is ##OTP##';
        Otp.SendOTP(data.phoneNo, msg);
        return okResponse(res, user, 'profile Details Updated and otp is sent on phone number');
    }
}

/**
 * changePassword
 * @params req.body.property_id;
 * @return promise
 */
const changePassword = async (req, res) => {
    let data = req.body;
    if (!data.oldPassword) {
        return badRequestError(res, "", Message("oldPasswordRequired"));
    }
    if (!await (req.user).comparePassword(data.oldPassword)) {
        return badRequestError(res, "", Message("oldPasswordMismatch"));
    } else {
        data.newPassword = await bcrypt.hash(data.newPassword, 10);
        let updatePassWord = await User.query().context({
            id: req.user.id
        }).update({
            "password": data.newPassword
        }).where("id", req.user.id);

        return okResponse(res, {}, Message("updatePass"));
    }
}

/**
 * Resend OTP
 * @params req.body
 * @return promise
 */
const ResendOTP = async (req, res) => {
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

    //check Phone No
    // let checkExistPhone = await User.query().skipUndefined().where('phoneNo', data.phoneNo);
   
    // if (checkExistPhone) {
    //     return badRequestError(res, "", "This Phone number already exits");
    // }
    // check mobile exist or not
    let user = await User.query().skipUndefined().where('id', data.id).first();
    // if (user) {
    //     if (user.phoneNo !== data.phoneNo) {

    //         return badRequestError(res, "", Message("phoneAlreadyVerified"));
    //     }
    // }
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
 * Support API (Customer and Organiser side)
 * @description: send notification to Admin
 * @params req.body;
 * @return promise
 */

const contactUs = async (req, res) => {
    let data = req.body;
    let user = (req.user!=undefined) ? req.user : '';

    // if (!user.id) {
    //     return badRequestError(res, "", "please enter user Id");
    // }
    if (!data.issueId) {
        return badRequestError(res, "", "please enter your issue");
    }
    if (!data.message) {
        return badRequestError(res, "", "please enter message");
    }
    if (user=='' && !data.email) {
        return badRequestError(res, "", "please enter email");
    }
    //Notification Process (send to Admin)
    let userData;
    if(user!= ''){
        userData = await User.query().skipUndefined().select("name", "deviceToken", "id", "deviceType", "userType").where("id", req.user.id).first();
    }else{
        userData = {'name':data.email, "id": null}
    }
    let adminData = await Admin.query().select('id', 'device_token').where('id', 1).first();

    let adminNotifiy = await AdminNotification.support(adminData, userData, data.message, data.issueId);

    data.userId = user.id;
    let [err, issue] = await to(Contact.query().skipUndefined().insert(data));
    if (err || !issue) {
        return badRequestError(res, "", Message('SomeError'));
    }

    return okResponse(res, {}, "Issue is reported");
}

/**
 * updateProfile - 3rd
 * @params req.body;
 * @return promise
 */

const updateProfile = async (req, res) => {
    let data = req.body;
    let user = req.user;
    let deviceType = (data.deviceType) ? data.deviceType : "";
    // Profile Image
    if (req.files && req.files.length > 0) {
        data.profilePic = await req.files.map(file =>
            file.location.toString());
        data.profilePic = data.profilePic.toString();
    } else {
        delete data.profilePic;
    }

        const users = await User.query().skipUndefined().select("countryCode", "phoneNo", "profilePic", "isPhoneVerified", "token").where("id", req.user.id).first();
        if((deviceType != 'website') && (data.phoneNo) && data.phoneNo!=null){
            let checkExistPhone = await User.query().select().where('phoneNo', data.phoneNo).andWhere("id", req.user.id)
            if (checkExistPhone.length === 0) {
                let checkExistPhone2 = await User.query().select().where('phoneNo', data.phoneNo).whereNotNull('phoneNo')
                 
                if (checkExistPhone2.length > 0) {
                    return badRequestError(res, "", "This Phone number already exits");
                }
            }
            //phoneNo check (with country code phoneNo)
            //Update Process
            let phonedata = req.body.phoneNo;
            // Generate your OTP
            if (data.isFromProfile == false || data.isFromProfile == 'false') {
                let ranOtp = Math.floor(1000 + Math.random() * 9000);
                data.phoneOTP = ranOtp;
                let msg = Message("sendOTPmsg") + ranOtp;
                const updatedphoneOTP = await User.query().patchAndFetchById(req.user.id, {
                    phoneOTP: data.phoneOTP
                });
                Otp.SendOTP(phonedata, data.countryCode, msg);
            }
        }

    delete data.isFromProfile;
    
    let tokenData = {
        deviceId: data.deviceId,
        deviceType: data.deviceType,
        deviceToken: data.deviceToken,
        OS: data.OS,
        sourceIp: data.sourceIp,
        platform: data.platform,
        authToken: ''
     }
     delete data.deviceId;
     delete data.deviceType;
     delete data.deviceToken;
     delete data.OS;
     delete data.sourceIp;
     delete data.platform;
    let updatedProfile = await User.query().patch(data).where('id', req.user.id).returning('id');
    let usertoken = await User.query().select().where('id', req.user.id).first();
    let auth_token = await usertoken.getJWT();
    tokenData.authToken = auth_token;
    res.setHeader('Authorization', auth_token);
    res.setHeader('access-control-expose-headers', 'authorization');
    await updateToken(req.user.id, tokenData,'Logged In',auth_token,usertoken.userType)
    
    if (!updatedProfile) {
        return badRequestError(res, "", "Profile not updated");
    }

    let response = {
        profilePic: data.profilePic
    }
    return okResponse(res, response, Message("updateProfile"));
}

/**
 * getUser
 * @params get type no params;
 * @return promise
 */

const getUser = async (req, res) => {
    let getUser = await User.query().skipUndefined().where('id', req.user.id).first();
    if (getUser.userType !== "customer") {
        return badRequestError(res, "", Message("emailNotExist"));
    }
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
        });
        if (!notify) {
            return badRequestError(err, "", "error in updating");
        }
        return okResponse(res, {}, Message("notifyUpdated"));
    }

}

/**
 * Logout
 * @params req.body;
 * @return promise
 */

const Logout = async (req, res) => {
    let todayDate = new Date();
    let todayTime = moment(todayDate).format('YYYY-MM-DD HH:mm:ss');
    const logout = await User.query().skipUndefined().patchAndFetchById(req.user.id, {
        // deviceType: null,
        deviceToken: null,
        // deviceId: 0,
        token: null
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
    if (!data.email) {
        return badRequestError(res, "", "please Enter Email !");
    }
    let user = await User.query().select().where('email', data.email).first();
    if (!user) {
     
        return badRequestError(res, "", Message("invalidAuth"));
    }

    if (user.userType != "customer") {
        return badRequestError(res, "", Message("invalidAuth"));
    }

    if (user.is_active == false || user.accountStatus == 'inactive') {
        return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
    }

    let ranOtp = Math.floor(1000 + Math.random() * 9000);
    data.emailOTP = ranOtp;

    EMAIL.sendEmail(data.email, "Forgot Password", "Hii " + user.name + ", <br> Welcome to Event365 Live.<br>Please do not share this OTP with anyone for security reasons. Your OTP is: " + "<b>" + ranOtp + "</b>" + "");
    let updateOTP = await User.query().context({
        email: data.email
    }).update({
        "emailOTP": data.emailOTP

    }).where("email", data.email);
    if (!user) {
      
        return badRequestError(res, "", "User does not exist with this email");

    } else {
        let updateEmailOtp = await User.query().context({
            emailOTP: ranOtp
        }).update({
            "emailOTP": ranOtp, //ranOtp

        }).where("email", data.email);
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

/**
 * 
 * common forgot password
 * @param {*} res 
 * @returns 
 */

 const CommonforgotPassword = async (req, res) => {
   
    let data = req.body;
    if (!data.email) {
        return badRequestError(res, "", "please Enter Email !");
    }
    let user = await User.query().select().where('email', data.email).first();
    if (!user) {
       
        return badRequestError(res, "", Message("invalidAuth"));
    }

    if (user.is_active == false || user.accountStatus == 'inactive') {
        return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
    }

    let ranOtp = Math.floor(1000 + Math.random() * 9000);
    data.emailOTP = ranOtp;

    EMAIL.sendEmail(data.email, "Forgot Password", "Hii " + user.name + ", <br> Welcome to Event365 Live.<br>Please do not share this OTP with anyone for security reasons. Your OTP is: " + "<b>" + ranOtp + "</b>" + "");
    let updateOTP = await User.query().context({
        email: data.email
    }).update({
        "emailOTP": data.emailOTP

    }).where("email", data.email);
    if (!user) {
     
        return badRequestError(res, "", "User does not exist with this email");

    } else {
        let updateEmailOtp = await User.query().context({
            emailOTP: ranOtp
        }).update({
            "emailOTP": ranOtp, //ranOtp

        }).where("email", data.email);
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


/**
 * Resend OTP
 * @params req.body.;
 * @return promise
 */

const againResedOTP = async (req, res) => {
   
    let data = req.body;
   
    if (!data.email) {
        return badRequestError(res, "", "please Enter Email");
    }

    let user = await User.query().select('email', 'name').where('email', data.email).first();
    if(!user){
        return badRequestError(res, "", "User does not exist with this email");
    }
    
    if (user.userType == "customer") {
        return badRequestError(res, "", Message("invalidAuth"));
    }

    if (user.is_active == false || user.accountStatus == 'inactive') {
        return UserBlockError(res, "", "Your account has been restricted. Please send us a message to resolve this issue");
    }

  
    let ranOtp = Math.floor(1000 + Math.random() * 9000);
    data.emailOTP = ranOtp;
  

    EMAIL.sendEmail(user.email, "Account Activation", "Hi " + user.name + ", <br>Welcome to 365Live.<br>Please do not share this one-time password with anyone for security reasons.<br>Your one-time password is: " + "<b>" + ranOtp + "</b>" + "");
    
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
 * policy
 * @params get type no params;
 * @return promise
 */

const policy = async (req, res) => {
    let policyData = await AppContent.query().select("id", "heading", "description").skipUndefined().where('type', 'policy');
    if (!policyData) {
        return badRequestError(res, "", "No policy found");
    }
    return okResponse(res,
        policyData,
        "policy data fetched");
}

/**
 * policy
 * @params get type no params;
 * @return promise
 */

const terms = async (req, res) => {
    let termsData = await AppContent.query().select("id", "heading", "description").skipUndefined().where('type', 'terms');
    if (!termsData) {
        return badRequestError(res, "", "No terms found");
    }
    return okResponse(res,
        termsData,
        "terms data fetched");
}

/**
 * policy
 * @params get type no params;
 * @return promise
 */

const getIssues = async (req, res) => {
  
    let IssuesData = await AppContent.query().select("id", "heading", "description").skipUndefined().where('type', 'issues').where('isActive', true).orderBy('heading', 'asc');
    if (!IssuesData) {
        return badRequestError(res, "", "No issues found");
    }
    return okResponse(res,
        IssuesData,
        "issues data fetched");
}

const updateToken = async (userId,data,currentStatus,auth_token,userType) => {
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
        loginType:loginType,
        deviceId: data.deviceId,
        deviceToken: data.deviceToken,
        deviceType: data.deviceType,
        OS: data.OS,
        sourceIp: data.sourceIp,
        platform: data.platform,
        authToken: auth_token,
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
    againResedOTP,
    forgotPassword,
    CommonforgotPassword,
    verifyResetPW,
    resetPassword,
    CommonresetPassword,
    ResendOTP,
    loginUser,
    socialLogin,
    editProfile,
    changePassword,
    contactUs,
    updateProfile,
    getUser,
    isRemindOrNotify,
    Logout,
    policy,
    terms,
    getIssues,
    testMsg,
    sendMail
}
