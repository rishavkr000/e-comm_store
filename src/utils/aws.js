const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

// ✅ Create S3 client instance
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadFile = async (file) => {
  try {
    const uploadParams = {
      Bucket: "rishav-bucket-name",
      Key: "rishav_e-comm" + file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // ✅ Construct the public URL manually
    const fileUrl = `https://${uploadParams.Bucket}.s3.${s3Client.config.region}.amazonaws.com/${uploadParams.Key}`;
    return fileUrl;

  } catch (err) {
    throw { error: err };
  }
};

module.exports = { uploadFile };
