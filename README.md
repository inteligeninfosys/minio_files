docker run -it -d -p 9005:9000 -p 9001:9001 --name minio1 -e "MINIO_ROOT_USER=AKIAIOSFODNN7EXAMPLE" -e "MINIO_ROOT_PASSWORD=wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY" -v c:\minio\data:/data quay.io/minio/minio server /data --console-address ":9001"

process.env.MINIO_ENDPOINT || '127.0.0.1'
process.env.MINIO_PORT || 9005,
process.env.ACCESSKEY
process.env.SECRETKEY
process.env.PORT || 4400

/minio/upload?bucket=ecollect&accnumber=12345123451234

Buckets:
demands
ecollect
serviceprovider
