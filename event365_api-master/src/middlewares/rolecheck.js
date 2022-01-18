require('./../global_functions');
require('./../global_constants');

module.exports = {
    adminAccess: (req, res, next) => {
        if (req.user.user_type === 'super_admin') {
            return next();
        } else {
            return forbiddenError( res, "Not Authorized");
        }
    },
    customerAccess: (req, res, next) => {
        if (req.user.userType === "customer") {
            return next();
        } else {
            return forbiddenError(res, "Not Authorized");
        }
    },

    hostAccess: (req, res, next) => {
        if (req.user.userType === "host") {
            console.log("hostAccess")
            return next();
        } else {
            return forbiddenError(res,"Not Authorized");
        }
    },
    onlyVenuerAccess: (req, res, next) => {
        if (req.user.userType === "venuer") {
            console.log("venuer")
            return next();
        }else {
            return forbiddenError(res,"Not Authorized");
        }
    },
    venuerAccess: (req, res, next) => {
        if (req.user.userType === "venuer") {
            console.log("venuer")
            return next();
        }
        else if (req.user.userType === "host") {
            console.log("venuer host")
            return next();
        } else {
            return forbiddenError(res,"Not Authorized");
        }
    },
    venuerAccessWithMember: (req, res, next) => {
        //console.log(req)
        if (req.user.id == req.user.createdBy) {
            console.log("venuerAccessWithMember")
            return next();
        
        } else if (req.user.createdBy == req.user.createdBy) {
            console.log("venuerAccessWithMember")
            return next();
        }
        else{
            return forbiddenError(res,"Not Authorized");
        }
        
    },
    promoterAccess: (req, res, next) => {
        if (req.user.userType === "promoter") {
            console.log("venuer hostppp")
            return next();
        } else {
            return forbiddenError(res,"Not Authorized");
        }
    },

    checkRole: (roleIds) => {
        return function (req, res, next) {
           // console.log(roleIds);
            if (req.user.roles.indexOf(roleIds) !== -1) {
                return next();
            } else {
                return forbiddenError(res,"Not Authorized");
            }
        }
    }
}

