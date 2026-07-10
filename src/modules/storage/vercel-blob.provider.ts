import { put } from "@vercel/blob";
import {
  sanitizeStorageFilename,
  type PutObjectInput,
  type StorageProvider,
  type StoredObject
} from "@/modules/storage/storage-provider";

export class VercelBlobStorageProvider implements StorageProvider {
  readonly provider = "vercel-blob" as const;

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN is required when STORAGE_PROVIDER=vercel-blob");
    }

    const safeFilename = sanitizeStorageFilename(input.filename);
    const filename = `${Date.now()}-${crypto.randomUUID()}-${safeFilename}`;
    const pathname = `uploads/${filename}`;
    const blob = await put(pathname, Buffer.from(input.body), {
      access: "public",
      contentType: input.contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      provider: this.provider,
      fileName: filename,
      contentType: blob.contentType || input.contentType,
      size: input.body.byteLength
    };
  }
}
