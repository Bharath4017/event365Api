const User = require('../../models/users');
var global = require('../../global_functions');
var global = require('../../global_constants');
const EMAIL = require('./../../middlewares/email');
const jwt = require('jsonwebtoken');
const validator = require('validator');
require('../../global_functions');
require('../../global_constants');
const stripe = require('./../../middlewares/stripe');
const androidNotification = require('./../../middlewares/androidNotification');
const iosNotification = require('./../../middlewares/iosNotification');
const { use } = require('passport');

/**
 * getUsers
 * @params req.body;
 * @return promise
 */


const getUsers = async (req, res) => {
    
    // comment discuss by sudheer
   var roles = JSON.parse(req.user.roles);
   console.log(roles.length);
   //.where('createdBy',req.user.createdBy).orWhere('createdBy',req.user.id). comment discuss by sarthak
   for(let i=0;i<=roles.length;i++){
    if(roles[i]=='user_management'){
        var data = await User.query().select('id', 'name', 'userType', 'profilePic','roles','createdBy').whereNot('id', req.user.id).runAfter((result, builder)=>{
            console.log(builder.toKnexQuery().toQuery())
            return result;
        });
        
    } 
}
    
    if (data) {
        return okResponse(res, data, "User");
    } else {
        return notFoundError(res, "No user found");
    }

}

/**
 * addUser - User (Host, Promoter, Member) added by venuer
 * @params req.body;
 * @return promise
 */

 
const addUser = async (req, res) => {
console.log("Host Side- Add Member")
    let data = req.body;
    if (!data.firstName) {
        return badRequestError(res, "", "Please enter a first name");
    }

    if (!data.userType) {
        return badRequestError(res, "", "Please enter UserType");
    }

    if (!data.lastName) {
        return badRequestError(res, "", "Please enter a last name");
    }

    if (!data.email) {
        return badRequestError(res, "", "Please enter an email");
    }

    if (!data.password) {
        return badRequestError(res, "", "Please enter  a Password");
    }

    if (!data.phoneNo) {
        return badRequestError(res, "", "Please enter a phone number");
    }

    if (!data.roles) {
        return badRequestError(res, "", "Please enter roles");
    }
    data.name = data.firstName + " " + data.lastName;
    data.roles = '["' + data.roles.join('","') + '"]'
    data.createdBy = req.user.id; // used for by which venuer user is added.
    delete data.firstName;
    delete data.lastName;
    console.log("check Data",data)
    let token = await jwt.sign({
        email: data.email,
    }, CONFIG.jwt_encryption);
    let customerId = await stripe.GetCustomerID({
        email: data.email
    });
    data.customerId =customerId;
    data.token = token;
    data.is_active = true;
    //  data.userType = "host";
    res.setHeader('Authorization', token);
    res.setHeader('access-control-expose-headers', 'authorization');
   
    let alreadyUser = await User.query().where('email', data.email).first();
    console.log("alreadyUser Data",alreadyUser)
    if (alreadyUser) {
        return badRequestError(res, "", Message("emailExist"));
    } else {
        let registered = await User.query().insert(
            data
        ).returning("*");
        //console.log("just checkd" + JSON.stringify(registered))
        if (!registered) {
            throw badRequestError("Something went wrong.");
        }


        EMAIL.sendEmail(data.email, "Registered Your A/C", "Congratulations Dear " + data.name + " !  <br> Your A/C have been registered successfully to " + data.userType + " Role, and you permission " + data.roles + ". <br> Your credentials: Email: " + data.email + " and Password: " + data.password + "<br>. ");

        return okResponse(res, "", "Member " + registered.userType + " has been A/C created. Inform him to check mail.");
    }
}

/**
 * Delete User (by venuer)
 * @params req.body.property_id;
 * @return promise
 */


const deleteUser = async (req, res) => {
    if (!req.params.id) {
        return badRequestError(res, "", "Please enter User-Id");
    }
    //where('createdBy', req.user.id) commented discuss by @aarti @sarthak
    let deleted = await User.query().skipUndefined().deleteById(req.params.id);
    if (deleted == 0) {
        return badRequestError(res, "", Message("userDetailNotfound"));
    }
    return okResponse(res, "", Message("userDeleted"));
}

/**
 * Edit User (by venuer)
 * @params req.body;
 * @return promise
 */

const editUser = async (req, res) => {

    let data = req.body;
    // if (!data.id) {
    //     return badRequestError(res, "Please Enter userId");
    // }
    console.log(data, "data")
    if (!data.userType) {
        return badRequestError(res, "", "Please enter UserType");
    }
    if (!data.roles) {
        return badRequestError(res, "", "Please enter Roles");
    }
    data.roles = '["' + data.roles.join('","') + '"]'
    data.id = parseInt(req.params.id);
    data.createdBy = req.user.id; // used for by which venuer user is added.
    console.log(data)

    const MemberData = await User.query().select('id', 'name', 'deviceType', 'deviceToken','profilePic', 'createdBy', )
    .eager('[userLoginDetail as androidUser, userLoginDetail as iosUser]')
    .modifyEager('androidUser', builder =>{
        builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'android')
    }) 
    .modifyEager('iosUser', builder =>{
        builder.select("userId","deviceToken", "deviceType").whereNotNull('deviceToken').where('deviceToken', '!=', '').where('deviceType', 'ios')
    })
    .where('id', req.params.id).first();
    console.log(MemberData, "MemberData")

    //Notification Process
    let organiserData = await User.query().select('id', 'name', 'deviceType', 'deviceToken' ).where('id', req.user.id).first();
    if(organiserData.deviceType =="andorid"){
        var AndroideventCreate = await androidNotification.sendEditMember(MemberData, req.user.id, data);
    }
    else{
        var IOSeventCreate = await iosNotification.sendEditMember(MemberData, req.user.id, data);
    }
    const updateUserData = await User.query().upsertGraph(data, { 
        relate: true,
        unrelate: true
    });
    console.log("updateUserData" + JSON.stringify(updateUserData));
    if (!updateUserData) {
        return badRequestError(res, "", Message("userDetailNotfound"));
    } else {
        return okResponse(res, "", Message("userUpdate"));
    }
}

/**
 * Get host,promoter,member by Venuer
 * @param {stores the requested parameters} req
 * @param {stores the response} res
 */

const getUserByVenuer = async (req, res) => {
    let roles1;
    if (!req.params.id) {
        return badRequestError(res, "", "Please provide userId");
    }

    let user = await User.query().skipUndefined().select('id', 'name', 'email', 'phoneNo', 'address', 'city', 'state', 'zip', 'profilePic', 'shortInfo', 'shortInfo', 'URL', 'roles', 'userType').where('id', req.params.id).where('createdBy', req.user.id).first();
    if (user.roles) {
        let roles = user.roles;
        let roles1 = JSON.parse(roles);

        user.roles = roles1;
    }
    if (!user) {
        return badRequestError(res, "", "No User found");
    }

    return okResponse(res, user, "User Fetched");
}


/**
 * getSendRSVP 
 * @params get type
 * @return promise
 */

const getSendRSVP = async (req, res) => {
    console.log("getSendRSVP for Host");
    let page = (req.query.page) ? req.query.page : 1;
    let limit = req.query.limit ? req.query.limit : PER_PAGE;
    let offset = req.query.offset ? req.query.offset : limit * (page - 1);
    let data = req.body;
    let serachData = "";
    serachData = await User.query().select("id", "name", "profilePic", "email").where((builder) => {
        if (data.countryCode) {
            builder.where("countryCode", "ilike", data.countryCode + "%");
        }
        if (data.city) {
            builder.where("city", "ilike", data.city + "%");
        }
        if (data.name) {
            builder.where("name", "ilike", data.name + "%");

        }
    }).where("userType", "customer").offset(offset).limit(limit);

    let response = {
        'users': serachData,
        'page': page,

    }
    return okResponse(res, response, "User List");
}



module.exports = {
    addUser,
    getSendRSVP,
    getUsers,
    deleteUser,
    editUser,
    getUserByVenuer
}