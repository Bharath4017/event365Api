'use strict';

const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

AWS.config.accessKeyId = 'AKIAREZ4BO3K2AOAHJOX';
AWS.config.secretAccessKey = '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';
AWS.config.region = 'us-east-2';

// ========================== MULTER CONFIG ================================
const Storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, "./images");
  },
  filename: function (req, file, cb) {
    let ext = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
    //   cb(null, file.fieldname + '-' + new Date().getTime() + ext)
    cb(null, 'file' + (Math.random().toString(36) + '00000000000000000').slice(2, 10) + '-' + Date.now() + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1])
  }
});

const upload = multer({
  storage: Storage
});

// const BASE_URL = 'https://s3.ap-south-1.amazonaws.com/ovonts/';

// const upload = multer({
//   storage: multerS3({
//     s3: new AWS.S3(),
//     bucket: 'onebandhan',
//     acl: 'public-read',
//     metadata: function (req, file, cb) {
//       cb(null, {
//         fieldName: file.fieldname
//       });
//     },
//     key: function (req, file, cb) {
//       console.log(file);
//       cb(null, Date.now().toString() + '_' + file.originalname)
//     }
//   })
// });
// ========================== MULTER CONFIG ================================

const UploadImages = (req, res) => {
  let uploadMultiple = upload.array('files');
  uploadMultiple(req, res, async (err) => {
    if (err) {
      console.log(err);
      return res.status(400).send(JSON.stringify({
        message: "Files submission failed.",
        image: []
      }));;
    }
    req.files = await req.files.map((file) => {
      return {
        // url: file.location // for AWS
        url : file.filename  // for disk Storage
      };
    });
    return res.status(201).send(JSON.stringify({
      message: "Files uploaded successfully.",
      image: req.files
    }));
  });
}

const UploadImage = (req, res) => {
  // var s3 = new AWS.S3();
  let uploadOne = upload.array('file', 1);
  uploadOne(req, res, async (err) => {
    if (err) {
      return res.status(400).send(JSON.stringify({
        message: "File submission failed.",
        image: []
      }));;
    }
    req.files = await req.files.map((file) => {
      return {
        // url: file.location // for AWS
        url: file.filename // for disk Storage
      };
    });
    return res.status(201).send(JSON.stringify({
      message: "File uploaded successfully.",
      image: req.files[0]
    }));
  });
}

module.exports = {
  UploadImage,
  UploadImages,
  upload
};
