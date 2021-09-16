var Express = require("express");
var Multer = require("multer");
var Minio = require("minio");
var cors = require('cors');
var BodyParser = require("body-parser");
const fs = require('fs')
var app = Express();

app.use(cors());
app.use(BodyParser.json({ limit: "5mb" }));

var minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
    port: process.env.MINIO_PORT || 9005,
    useSSL: false,
    accessKey: process.env.ACCESSKEY || 'AKIAIOSFODNN7EXAMPLE',
    secretKey: process.env.SECRETKEY || 'wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY'
});

app.post("/minio/upload", Multer({ storage: Multer.memoryStorage() }).single("upload"), function (request, response) {
    const bucket = request.query.bucket || 'ecollect';
    const accnumber = request.query.accnumber || '00000000000000';
    minioClient.putObject(bucket, accnumber + '_' + Date.now() + '_' + request.file.originalname, request.file.buffer, function (error, objInfo) {
        if (error) {
            console.log(error);
            response.status(500).json({
                success: false,
                error: error.message
            })
        }
        response.status(200).json({
            success: true,
            file: request.file,
            objInfo: objInfo
        })
    });
});

app.post("/minio/uploadfile", Multer({ dest: "./uploads/" }).single("upload"), function (request, response) {
    const bucket = request.query.bucket || 'ecollect';
    const accnumber = request.query.accnumber || '00000000000000';
    var metaData = {
        'Content-Type': 'text/html',
        'Content-Language': 123,
        'X-Amz-Meta-Testing': 1234,
        'example': 5678
    }
    minioClient.fPutObject(bucket, accnumber + '_' + Date.now() + '_' + request.file.originalname, request.file.path, metaData, function (error, objInfo) {
        if (error) {
            console.log(error);
            response.status(500).json({
                success: false,
                error: error.message
            })
            deleteFile(request);
        }
        //response.send(request.file);
        response.status(200).json({
            success: true,
            file: request.file,
            objInfo: objInfo
        })
        deleteFile(request);
    });
});

app.get("/minio/download", function (request, response) {
    minioClient.getObject("ecollect", request.query.filename, function (error, stream) {
        if (error) {
            return response.status(500).send(error);
        }
        stream.pipe(response);
    });
});

minioClient.bucketExists("ecollect", function (error) {
    if (error) {
        return console.log(error);
    }
    var server = app.listen(process.env.PORT || 4400, function () {
        console.log("Listening on port %s...", server.address().port);
    });
});

function deleteFile(req) {
    fs.unlink(req.file.path, (err) => {
        if (err) {
            console.error(err)
            return
        }
        //file removed
    })
}
