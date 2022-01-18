'use strict';

const Admin = require('../../models/admin');
const validator = require('validator');
const ValidationError = require('objection').ValidationError;
require('../../global_functions');
require('../../global_constants');
const bcrypt = require('bcrypt');
const Otp = require('./../../middlewares/msg91');
const EMAIL = require('./../../middlewares/email');
const jwt = require('jsonwebtoken');
const stripe = require('./../../middlewares/stripe');
/**
 * Login Admin 
 * @params req.body.property_id;
 * @return promise
 */
/**
 * registerCustomer API - used to register customers
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */


const registerCustomer = async (req, res) => {

    let data = req.body;

    if (!data.first_name) {
        throw badRequestError(res, {},"Please enter your first name.");
    }

    if (!data.last_name) {
        throw badRequestError(res, {},"Please enter your last name.");
    }

    if (!data.email_id) {
        throw badRequestError(res, {},"Please enter your email id.");
    }

    if (!data.mobile_number) {
        throw badRequestError(res, {},"Please enter your mobile number.");
    }

    if (!data.password) {
        throw badRequestError(res, {},"Please enter your password.");
    }

    let verification = await jwt.sign({
        email: data.email_id,
    }, CONFIG.jwt_encryption);

    data.verification = verification;
    data.user_type = "customer";

    let registered = await Admin.query().insert(
        data
    ).returning("*");

    if (!registered) {
        throw badRequestError(res, {},"Something went wrong.");
    }

    let link = GLOBAL_CLIENT_URL + 'auth/account-activated/?verify=' + verification;
    EMAIL.sendEmail(data.email_id, "Account Activation", "Hi, Welcome to Huco. Please activate your account by clicking the link - : " + link + "");

    return okResponse(res, {
        ...registered,
    }, "Congratulations! You have been registered succesfully. Please check your email to verify your account.");
}
/** login API
 * Description: Used to validate user Login Details and generates unique token for the user to work across
 * Params: data.email - stores the unique email id which was used while logging in (other then driver)
 * Params: data.mobile - stores the unique mobile number which was used while logging in (for driver only)
 * Params: data.password - stores the password used for the user to validate the user
 * Params: data.userType - stores the type of user; possible values super_admin, vendor, driver
 * Return: Response in JSON Format along with the unique token in header
 **/
const login = async (req, res) => {
  
    let data = req.body;

    /** Validate for the empty fields */

    if (!data.email_id) {
        throw badRequestError(res, {},"Please enter email");
    }

    if (!validator.isEmail(data.email_id)) {
        throw badRequestError(res, {},"Please enter a valid email id");
    }


    if (!data.password) {
        throw badRequestError(res, {},"Please enter password");
    }

    let err;

    /** Execute Query to fetch the user */
    let user = await Admin.query()
        .where('email_id', data.email_id).first();

    // if user not found
    if (!user) {
        err = true;

        throw badRequestError(res, {},'Email id is not registered.');

    }

    // password not matched
    if (!await user.comparePassword(data.password)) {
        err = true;
        throw badRequestError(res, {},'Invalid password.');
    }


    if (!user.is_email_verified) {
        err = true;
        throw unverifiedError(res, {},'Please verify your email to continue.');
    }

    if(user.user_type == 'sub_admin' && user.user_status == 'inactive'){
        throw badRequestError(res, {},"Your account has been blocked, contact to administrator");
    }

    // generate authenticated data
    let auth_token = await user.getJWT();
    let token = await Admin.query().where('id', user.id).update({
        token: auth_token,
        last_login_at: new Date().toISOString()
    }).returning('*');

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('authToken', auth_token);
    res.setHeader("Access-Control-Expose-Headers", "authToken");

    delete user.password;

    return okResponse(res, {
        ...user.toJSON(),
    }, "Login Successful");
}

/**
 * registerCustomer API - used to register customers
 * @param {stores the requested parameters} req 
 * @param {stores the respose} res 
 */
const resendActivationLink = async (req, res) => {

    let data = req.body;


    if (!data.email_id) {
        throw badRequestError(res, {},"Please enter your email id.");
    }

    let verification = await jwt.sign({
        email: data.email_id,
    }, CONFIG.jwt_encryption);

    data.verification = verification;
    data.user_type = "super";

    /** Execute Query to fetch the user */
    let user = await Admin.query()
        .where('email_id', data.email_id).first();

    // if user not found
    if (!user) {


        throw badRequestError(res, {},'Email id is not registered.');

    }

    if (!user.is_email_verified) {


        let updateNewLink = await Admin.query().update({
            verification: verification
        }).where("id", user.id).returning("*");

        if (!updateNewLink) {
            throw badRequestError(res, {},"Something went wrong.");
        }

        let link = GLOBAL_CLIENT_URL + 'auth/account-activated/?verify=' + verification;
        EMAIL.sendEmail(data.email_id, "Account Activation", "Hi, Welcome to Huco. Please activate your account by clicking the link - : " + link + "");

        return okResponse(res, {
            ...updateNewLink,
        }, "Verification link has been sent to your email id -" + data.email_id);

    } else {
        throw badRequestError(res, {},"Invalid Request");
    }
}

const logout = async (req, res) => {

    if (req.headers.authToken) {
        await Admin.query().where('token', req.headers.authToken).update({
            'token': ''
        });
    }

    return noContentResponse(res);
}

/** forgotpassword API
 * Description: Used to fetch user for forgot password. This will generate a unique code (number for driver encrypted string for others) and will send it to the user on mobile / email respoectively
 * Params: data.email - stores the unique email id which was used while logging in
 * Params: data.userType - stores the type of user; possible values super_admin, vendor, driver
 * Return: Response in JSON Format along with the unique token in header
 **/
const requestForForgotPassword = async (req, res) => {

    let data = req.body;
    if (!data.email_id) {
        throw badRequestError(res, {},"Please enter email");
    }

    if (!validator.isEmail(data.email_id)) {
        throw badRequestError(res, {},"Please enter a valid email id");
    }

    // execute query 
    let user = await Admin.query()
        .where('email_id', data.email_id).first();

    let err;

    // if user not found show message based on user type
    if (!user) {
        err = true;

        throw badRequestError(res, {},'Email id is not registered.');

    }

    // check user's status before performing further actions
    if (user.status == 'pending') {
        err = true;
        throw unverifiedError(res, {},'Your account is not verified yet.');
    }

    if (user.status == 'deactive') {
        err = true;
        throw unverifiedError(res, {},'Your account has been deactivated, please contact admin for the same.');
    }

    if (!user.is_email_verified) {
        err = true;
        throw unverifiedError(res, {},'Please verify your email id to continue.');
    }

    let auth_token;
    let link;

    let path = user.user_type == "super_admin" ? GLOBAL_ADMIN_URL : GLOBAL_CLIENT_URL;
   
    // generate authenticated data

    auth_token = await user.getJWT();

    link = path + "auth/reset-password/?verifyLink=" + auth_token;

    let token = await Admin.query().where('id', user.id).update({
        verification: auth_token
    }).returning('*');

    EMAIL.sendEmail(data.email_id, "Reset Password", "You have Requested to reset password. Please find the link for further steps : " + link + "");
    /**here instead of sending it in response we will send it in email
     */
    return okResponse(res, {
        link,
    }, "Check");

};

/** verifyUserLink API
 * Description: Used to verify user based on a unique code (either by link or by code).
 * Params: data.email - stores the unique email id which was used while logging in
 * Return: Response in JSON Format along with the unique token in header
 **/

const verifyUserLink = async (req, res) => {
    let verification_code = req.params.code;
    let data = req.body;
    
    // if no code is passed
    if (verification_code == "") {
        throw badRequestError(res, {},'Invalid link.');
    }

    // execute query 
    let user = await Admin.query().select().where('verification', verification_code).first();

    let err;

    // if no result found show the appropriate message
    if (!user) {
        err = true;

        throw badRequestError(res, {},'Either invalid link or link is expired or already used');

    }

    // check the user status to prevent him from updating any data
    if (user.user_status == 'pending') {
        err = true;
        throw unverifiedError(res, {},'Your account is not verified yet.');
    }

    if (user.user_status == 'deactive') {
        err = true;
        throw unverifiedError(res, {},'Your account has been deactivated, please contact admin for the same.');
    }

    if (!user.is_email_verified) {
        err = true;
        throw unverifiedError(res, {},'Please verify your email to continue.');
    }

    // send the response
    return okResponse(res, {}, "Valid Link");
}

/** VerifyAndUpdatePassword API
 * Description: Used to verify user based on a unique code (either by link or by code).
 * Params: data.email - stores the unique email id which was used while logging in
 * Params: data.password - stores the password used for the user to validate the user
 * Return: Response in JSON Format along with the unique token in header
 **/

const verifyAndUpdatePassword = async (req, res) => {

    let verification_code = req.params.code;
    let data = req.body;
  
    // if no code is passed
    if (verification_code == "") {
        throw badRequestError(res, {},'Invalid link.');
    }

    // if no password is added
    if (!data.password) {
        throw badRequestError(res, {},'Enter a password');
    }

    // execute query 
    let user = await Admin.query().where('verification', verification_code).first();

    let err;

    // if no result found show the appropriate message
    if (!user) {
        err = true;

        throw badRequestError(res, {},'Either invalid link or link is expired or already used');

    }

    // check the user status to prevent him from updating any data
    if (user.user_status == 'pending') {
        err = true;
        throw unverifiedError(res, {},'Your account is not verified yet.');
    }

    if (user.user_status == 'deactive') {
        err = true;
        throw unverifiedError(res, {},'Your account has been deactivated, please contact admin for the same.');
    }

    if (!user.is_email_verified) {
        err = true;
        throw unverifiedError(res, {},'Please verify your email to continue.');
    }

    // execute query to update password and reset the token 
    await Admin.query().where('id', user.id).update({
        password: data.password,
        verification: ''
    });

    delete user.password;

    // send the response
    return okResponse(res, {
        ...user.toJSON(),
    }, "Password updated successfully.");
};

/**
 * activateCustomerAccount 
 * @description: Used to activate customer's email
 * @param {stores the requested parameter} req 
 * @param {stores the response that has to send to the user} res 
 */
const activateCustomerAccount = async (req, res) => {

    let verification_code = req.params.code;
    let data = req.body;

    // if no code is passed
    if (verification_code == "") {
        throw badRequestError(res, {},'Invalid link.');
    }

    // execute query 
    let user = await Admin.query().where('verification', verification_code)
        .where("user_status", "pending").where("is_email_verified", false).first();

    if (!user) {
        throw badRequestError(res, {},"Link is expired. Your email is already verified.");
    }

    await Admin.query().update({
        verification: "",
        user_status: "active",
        is_email_verified: true
    });

    // send the response
    return okResponse(res, {
        ...user.toJSON(),
    }, "Your account is verified.");
};


/**
 * Updates device token for web user
 * @param {*} req 
 * @param {*} res 
 */


const updateDeviceToken = async (req, res) => {
    let data = req.body;
   
    if (!data.device_token) {
        throw global.badRequestError("Invalid Request");
    }
    if (!data.userId) {
        throw global.badRequestError("Invalid Request");
    }
    let user = await Admin.query().update({
        "device_token": data.device_token,
        "device_type": "WEB"
    }).where("id", data.userId);
    if (!user) {
        
        return badRequestError(res,"", "Your account is not verified.");
    }
    return okResponse(res,"", "Your account is verified.");
  };
  
module.exports = {
    registerCustomer,
    login,
    logout,
    requestForForgotPassword,
    verifyAndUpdatePassword,
    activateCustomerAccount,
    resendActivationLink,
    verifyUserLink,
    updateDeviceToken
};