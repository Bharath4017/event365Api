'use strict';

const GetUserDeviceTokenByType = async (userData, type) => {
    return await userData.userLoginDetail.map(user => {
        return (user.deviceType === type) ? user.deviceToken: [];
       }).filter(item => item !== false);
}

module.exports = {
    GetUserDeviceTokenByType
}
