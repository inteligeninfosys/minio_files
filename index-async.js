var Express = require("express");
var Multer = require("multer");
var Minio = require("minio");
var cors = require('cors');
const fs = require('fs')
var app = Express();

const corsConfig = {
    credentials: true,
    origin: true,
};

app.use(cors(corsConfig));
//app.use(BodyParser.json({ limit: "5mb" }));
app.use(Express.json());



var minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
    port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT, 10) : 9005,
    //port: 1 * process.env.MINIO_PORT || parseInt("9005"),
    //port: 1 * process.env.MINIO_PORT,
    useSSL: false,
    accessKey: process.env.ACCESSKEY || 'AKIAIOSFODNN7EXAMPLE',
    secretKey: process.env.SECRETKEY || 'wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY'
});


app.post("/miniofiles/upload", Multer({ storage: Multer.memoryStorage() }).single("upload"), async (request, response) => {
    const bucket = request.query.bucket || 'ecollect';
    const accnumber = request.body.accnumber || request.query.accnumber || '00000000000000';
    try {
        const resp = await minioClient.putObject(bucket, accnumber + '_' + Date.now() + '_' + request.file.originalname, request.file.buffer);

        response.status(200).json({
            success: true,
            file: request.file,
            objInfo: resp
        })
    } catch (error) {
        console.log(error);
        response.status(500).json({
            success: false,
            error: error.message
        })
    }

});

app.post("/miniofiles/uploadfile", Multer({ dest: "./uploads/" }).single("file"), async (request, response) => {
    const bucket = request.query.bucket || 'ecollect';
    const accnumber = request.body.accnumber || request.query.accnumber || '00000000000000';
    const savedfilename = accnumber + '_' + Date.now() + '_' + request.file.originalname
    var metaData = {
        'Content-Type': 'text/html',
        'Content-Language': 123,
        'X-Amz-Meta-Testing': 1234,
        'example': 5678
    }
    try {
        const resp = await minioClient.fPutObject(bucket, savedfilename, request.file.path, metaData);

        response.status(200).json({
            success: true,
            savedfilename: savedfilename,
            file: request.file,
            objInfo: resp
        })
        deleteFile(request);
    } catch (error) {
        console.log(error);
        response.status(500).json({
            success: false,
            error: error.message
        })
        deleteFile(request);
    }

});

app.get("/miniofiles/download", async (request, response) => {
    try {
        const presignedUrl = await minioClient.presignedUrl('GET', 'ecollect', request.query.filename, 24 * 60 * 60);
        return response.status(200).send({ url: presignedUrl })
    } catch (error) {
        return console.log(err)
    }
});

app.post("/miniofiles/download", async (request, response) => {
    const bucket = request.body.bucket;
    const filename = request.body.filename;
    try {
        const stream = await minioClient.getObject(bucket, filename);
        stream.pipe(response);
    } catch (error) {
        console.log(error)
        return response.status(500).send(error);
    }
});


app.get("/miniofiles/downloadasync", async (request, response, next) => {
    const fileName = request.query.filename;
    try {
        // get url
        const url = await minioClient.presignedGetObject('test-bucket', fileName);
        return response.status(200).send({ url: url })
    } catch (error) {
        console.log(error)
        return response.status(500).json({ 'success': false, 'message': error.message });
    }

});


app.post('/upload', Multer({ storage: Multer.memoryStorage() }).single("file"), async (req, res, next) => {
    if (req.file) {
        var originalname = req.file.originalname.split(' ');
        const fileName = originalname.join('_');
        try {
            await minioClient.putObject('test-bucket', fileName, req.file.buffer);

            // get url
            const url = await minioClient.presignedGetObject('test-bucket', fileName);

            var id = uuid();
            // link valid for 3 minutes (180 seconds)
            // save link to redis
            redisClient.setex(id, 180, url, (err, reply) => {
                if (err) {
                    return res.json({ 'success': false, 'message': err });
                }
                return res.json({ 'success': true, 'message': id });
            });
        } catch (err) {
            return res.json({ 'success': false, 'message': err });
        }
    }
});

var server = app.listen(process.env.PORT || 4400, function () {
    console.log("Listening on port %s...", server.address().port);
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
