const {
    io
} = require('./globals');

const User = require('./models/users');
const Admin = require('./models/admin');
const Notification = require('./models/notification');

io.on('connection', (socket) => {
 console.log('Socket is connected');
// Register "join" events, requested by a connected client
    

    if (socket.handshake.query.token != "undefined") {
        socket.join(socket.handshake.query.token);
    }

    socket.on("checkNotification", async function (data) {
         console.log("A checkNotification", )

       let getToken = JSON.parse(data);
       console.log("A checkNotification", getToken)
       // console.log("ok fine ", getToken)
        let token = getToken.token.replace("Bearer ", "");
       // console.log("JMD", token)
        let userdata = await Admin.query().select("id").where("token", token).first();
        console.log("Socket User data",userdata)
        let notificationList = await Notification.query()
            .select("id", "type", "msg", "readstatus")
            .where("receiverId", userdata.id)
            .orderBy("created_at", "DESC")
            .offset(0)
            .limit(3);
        io.to(token).emit("message", {
            notification: notificationList,
            notificationDot: userdata.msg
        });
    });
    socket.on('close', function () {
        console.log('user disconnected');
    });


});