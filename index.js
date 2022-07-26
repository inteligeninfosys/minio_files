var Express = require("express");
var Multer = require("multer");
var Minio = require("minio");
var cors = require('cors');
var BodyParser = require("body-parser");
const fs = require('fs')
var app = Express();

const corsConfig = {
    credentials: true,
    origin: true,
};

app.use(cors(corsConfig));
app.use(BodyParser.json({ limit: "5mb" }));

console.log('MINIO_ENDPOINT==' + process.env.MINIO_ENDPOINT)
console.log('MINIO_PORT=='+process.env.MINIO_PORT)
console.log(1 * process.env.MINIO_PORT)

var minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
    //port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT, 10) : 9005,
    //port: process.env.MINIO_PORT || parseInt("9005"),
    port: 1 * process.env.MINIO_PORT,
    useSSL: false, 
    accessKey: process.env.ACCESSKEY || 'AKIAIOSFODNN7EXAMPLE',
    secretKey: process.env.SECRETKEY || 'wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY'
});

app.post("/miniofiles/upload", Multer({ storage: Multer.memoryStorage() }).single("upload"), function (request, response) {
    const bucket = request.query.bucket || 'ecollect';
    const accnumber = request.body.accnumber || request.query.accnumber || '00000000000000';
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

app.post("/miniofiles/uploadfile", Multer({ dest: "./uploads/" }).single("file"), function (request, response) {
    const bucket = request.query.bucket || 'ecollect';
    const accnumber = request.body.accnumber || request.query.accnumber || '00000000000000';
    const savedfilename = accnumber + '_' + Date.now() + '_' + request.file.originalname
    var metaData = {
        'Content-Type': 'text/html',
        'Content-Language': 123,
        'X-Amz-Meta-Testing': 1234,
        'example': 5678
    }
    minioClient.fPutObject(bucket, savedfilename, request.file.path, metaData, function (error, objInfo) {
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
            savedfilename: savedfilename,
            file: request.file,
            objInfo: objInfo
        })
        deleteFile(request);
    });
});

app.get("/miniofiles/download", function (request, response) {
    minioClient.presignedUrl('GET', 'ecollect', request.query.filename, 24 * 60 * 60, function (err, presignedUrl) {
        if (err) return console.log(err)
        return response.status(200).send({ url: presignedUrl })
    })

});

app.post("/miniofiles/download", function (request, response) {
    const bucket = request.body.bucket;
    const filename = request.body.filename;
    minioClient.getObject(bucket, filename, function (error, stream) {
        if (error) {
            console.log(error)
            return response.status(500).send(error);
        }
        stream.pipe(response);
    });

});

app.post("/miniofiles/create-bucket", function (request, response) {
    const bucket = request.body.bucket;
    minioClient.makeBucket(bucket, function (err) {
        if (err) {
            console.log('Error creating bucket.', err)
            return response.status(500).json({
                success: false,
                message: 'Error creating bucket.' + err.message
            })
        }
        console.log('Bucket created successfully in "us-east-1".')
        response.status(200).json({
            success: true,
            message: bucket + ' Created !'
        })
    })
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
