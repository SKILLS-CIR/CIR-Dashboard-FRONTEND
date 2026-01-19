import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.SUPABASE_S3_REGION!,
  endpoint: process.env.SUPABASE_S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY!,
    secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY!,
  },
  forcePathStyle: true,   // ✅ REQUIRED for Supabase S3
  tls: true,              // ✅ Fixes EPROTO SSL handshake
});

export async function uploadToS3(file: File, userId: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  const fileName = `avatars/${userId}-${Date.now()}-${file.name}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.SUPABASE_S3_BUCKET!,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    })
  );

  // 🔥 Correct Supabase public URL
  const base = process.env.SUPABASE_S3_ENDPOINT!.replace("/storage/v1/s3", "");

  return `${base}/storage/v1/object/public/${process.env.SUPABASE_S3_BUCKET}/${fileName}`;
}

export async function deleteFromS3(url: string): Promise<void> {
  const key = url.split(`${process.env.SUPABASE_S3_BUCKET}/`)[1];
  if (!key) return;

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.SUPABASE_S3_BUCKET!,
      Key: key,
    })
  );
}
