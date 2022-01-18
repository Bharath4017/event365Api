'use strict';

const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/users');
const Admin = require('../models/admin');

module.exports = function(passport) {

  var opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();

  opts.secretOrKey = CONFIG.jwt_encryption;
  opts.passReqToCallback = true;

  passport.use(new JwtStrategy(opts, async function(req, jwt_payload, done) {
    let token = req.headers.authorization.split(' ')[1];
    let auth_token;
   auth_token = await User.query().innerJoinRelation('userLoginDetail').eager('userLoginDetail').modifyEager('userLoginDetail', builder => { builder.select('userLoginDetails.id','userLoginDetails.deviceType','userLoginDetails.loginType', 'userLoginDetails.deviceId').where('userLoginDetails.authToken', token).where('userLoginDetails.userId', jwt_payload.userId)}).where('users.id', jwt_payload.userId).andWhere('userLoginDetail.authToken', token).first() || await Admin.query().where('token', token).andWhere('id', jwt_payload.userId).first();
    if (auth_token) {
      // req.token = token;
      return done(null, auth_token);
    } else {
      return done(null, false);
    }

  }));
}
