module.exports.nearby = (centerPoint, checkPoint, km) => {
    var ky = 40000 / 360;
    var kx = Math.cos(Math.PI * centerPoint.lat / 180.0) * ky;
    var dx = Math.abs(centerPoint.lng - checkPoint.lng) * kx;
    var dy = Math.abs(centerPoint.lat - checkPoint.lat) * ky;
    return Math.sqrt(dx * dx + dy * dy) <= km;
    
}

module.exports.distance = (centerPoint, checkPoint) => {
   // console.log("letLong check middleware",centerPoint, checkPoint)
    var ky = 40000 / 360;
    var kx = Math.cos(Math.PI * centerPoint.lat / 180.0) * ky;
    var dx = Math.abs(centerPoint.lng - checkPoint.lng) * kx;
    var dy = Math.abs(centerPoint.lat - checkPoint.lat) * ky;
    return Math.sqrt(dx * dx + dy * dy).toFixed(2);
    //console.log("letLong check dy",dy, dx)
}




// exports.nearbyLatLong = async (req, res) => {
//     let response = [], n = false, mom = {}, distance;
//     var userdetails = await User.query().select('latitude', 'longitude').where('id', req.user.id).first();
//     var user = { lat: userdetails.latitude, lng: userdetails.longitude };
//     var mothers = await User.query().select('id', 'userName', 'image', 'rating', 'latitude', 'longitude').where('userType', 2);
//     mothers.forEach(mother => {
//         mom.lat = mother.latitude; mom.lng = mother.longitude;
//         //returns true if user and mom are within 10 kms
//         n = latlong.nearby(user, mom, 10);
//         //returns the distance between two lat-long points
//         distance = latlong.distance(user, mom);
//         mother.distance = distance;
//         //add to the response array
//         if (n) response.push(mother);
//         else return;
//     });
//     if (response.length == 0) return badRequestError(res, "no nearby providers found");
//     //sort the array based on distance
//     await response.sort(function (a, b) { return a.distance - b.distance });
//     return okResponse(res, response, "nearby providers fetched");
// }
