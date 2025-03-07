require('dotenv').config();
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs/promises');

const AwsFileNames = {
  State: 'state.json',
  Ads: 'ads.json'
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function getS3Json(key) {
  const data = await s3Client.send(new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  }));

  let jsonString = '';
  for await (const chunk of data.Body) {
    jsonString += chunk.toString();
  }
  return JSON.parse(jsonString);
}

async function uploadS3Json(key, data) {
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(data)
  }));
}

async function getState() {
  return getS3Json(AwsFileNames.State);
}

async function setState(state) {
  return uploadS3Json(AwsFileNames.State, state);
}

async function getAds() {
  return getS3Json(AwsFileNames.Ads);
}

async function setAds(ads) {
  return uploadS3Json(AwsFileNames.Ads, ads);
}

module.exports = {
  getState,
  setState,
  getAds,
  setAds
};

