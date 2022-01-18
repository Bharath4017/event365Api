const multer = require("multer");
const multerS3 = require("multer-s3");
const aws = require("aws-sdk");

aws.config.loadFromPath('src/middlewares/aws.json')

var s3 = new aws.S3();

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folderModule = req.params.module;

        cb(null, "public/uploads/venue");
    },
    filename: (req, file, cb) => {
        var filetype = "";
        if (file.mimetype === "image/gif") {
            filetype = "gif";
        }
        if (file.mimetype === "image/png") {
            filetype = "png";
        }
        if (file.mimetype === "image/jpeg") {
            filetype = "jpg";
        }
        cb(null, Date.now() + "." + filetype);
    }
});
var upload = multer({
    storage: storage
});

const UploadImages = (req, res) => {
    let uploadMultiple = upload.array("files");
    uploadMultiple(req, res, async err => {
        if (err) {
            console.log(err);
            return res.status(400).send(
                JSON.stringify({
                    message: "Files submission failed.",
                    image: []
                })
            );
        }
        req.files = await req.files.map(file => {
            return {
                url: file.location
            };
        });
        return res.status(201).send(
            JSON.stringify({
                message: "Files uploaded successfully.",
                image: req.files
            })
        );
    });
};

const uploadS3 = multer({
    storage: multerS3({
        s3: s3,
        bucket: "event365-1",
        acl: 'public-read',
        metadata: function (req, file, cb) {
            //console.log('metadata', file, cb);
            cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
            //console.log('key', file, cb)
            var myStr = file.originalname;
            var strArray = myStr.split(".");
            //console.log(strArray[1]);
            cb(null, strArray[0]+'_'+Date.now().toString()+'.'+strArray[1]);
        }
    })
});

const deleteImages = function (filename) {
    var s3 = new aws.S3();
    var params = {
        Bucket: "event365-1",
        Delete: {
            filename
        }
    };
    s3.deleteObjects(params, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("Deleted");
        }
    });
}

module.exports = {
    upload,
    UploadImages,
    uploadS3,
    deleteImages
};
