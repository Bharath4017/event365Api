const admin = require('./admin/index');
const host = require('./host/index');
const user = require('./user/index');
const venue = require('./venuer/index');
const category = require('./category/index');
const event = require('./event/index');
const common = require('./common');
const ticket = require('./ticket/index');
const notification = require('./notification/index');

module.exports = [
    admin,
    host,
    user,
    venue,
    category,
    common,
    event,
    ticket,
    notification
]