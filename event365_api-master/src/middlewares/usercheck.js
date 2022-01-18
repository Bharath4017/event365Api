// const Token = require('../models/Token');
const passport = require('passport');

module.exports = {

    checkUser: () => {
        return async function (req, res, next) {
            passport.authenticate('jwt', { session: false }, function (err, user, info) {
                if (err) { return next(err); }
                if (!user) {
                    // console.log()
                    return next(null, true);
                }
                req.user = user;   // Forward user information to the next middleware
                return next(null, user);
            })(req, res, next);
        }
    }
}