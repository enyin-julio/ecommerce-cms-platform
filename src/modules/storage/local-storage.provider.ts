import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  sanitizeStorageFilename,
  type PutObjectInput,
  type StorageProvider,
  type StoredObject
} from "@/modules/storage/storage-provider";

const uploadRoot = path.join(process.cwd(), "public", "uploads");

export class LocalStorageProvider implements StorageProvider {
  readonly provider = "local" as const;

  async putObject(input: PutObjectInput): Promise<StoredObject> {
    await mkdir(uploadRoot, { recursive: true });

    const safeFilename = sanitizeStorageFilename(input.filename);
    const filename = `${Date.now()}-${crypto.randomUUID()}-${safeFilename || "upload"}`;
    const storagePathname = `uploads/${filename}`;
    const pathname = path.join(uploadRoot, filename);

    await writeFile(pathname, Buffer.from(input.body));

    return {
      url: `/uploads/${filename}`,
      pathname: storagePathname,
      provider: this.provider,
      fileName: filename,
      contentType: input.contentType,
      size: input.body.byteLength
    };
  }
}
