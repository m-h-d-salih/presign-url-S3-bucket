const express = require('express');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const cors = require('cors');
const   Avatar  = require('./model');
const  mongoose  = require('mongoose');
require('dotenv').config();

const s3Client = new S3Client({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const app = express();
app.use(cors());
app.use(express.json());

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});

app.get("/s3-presigned-url", async (req, res) => {
  const { originalFilename, compressedFilename, mimetype ,role} = req.query;


  try {
    // Generate presigned URL for the original image
    const originalCommand = new PutObjectCommand({
      Bucket: "attendx-beta",
      Key: `${role}/original/${originalFilename}`,  
      ContentType: mimetype,
    });
    const originalUrl = await getSignedUrl(s3Client, originalCommand, { expiresIn: 60 });

    // Generate presigned URL for the compressed image
    const compressedCommand = new PutObjectCommand({
      Bucket: "attendx-beta",
      Key: `${role}/compressed/${compressedFilename}`, 
      ContentType: mimetype,
    });
    const compressedUrl = await getSignedUrl(s3Client, compressedCommand, { expiresIn: 60 });


    // getting s3 presign url
    const s3Compressed = new GetObjectCommand({
      Bucket: "attendx-beta",
     Key: `${role}/compressed/${compressedFilename}`
  })
    const s3CompressedUrl = await getSignedUrl(s3Client, s3Compressed, { expiresIn: 60 });

    const s3Original = new GetObjectCommand({
      Bucket: "attendx-beta",
      Key: `${role}/original/${originalFilename}`
  })
    const s3OriginalUrl = await getSignedUrl(s3Client, s3Original, { expiresIn: 60 });


    
    // stroing database  s3 presignurl
     const avater =  await Avatar({
      original: s3OriginalUrl,
      thumbnail: s3CompressedUrl
    })

   await avater.save()
   
    res.json({ originalUrl, compressedUrl, s3CompressedUrl });
    
  } catch (error) {
    console.error("Error generating presigned URLs:", error);
  }
});

mongoose.connect(process.env.DB).then(() => console.log("connected"))
.then((error) => console.log(error));
