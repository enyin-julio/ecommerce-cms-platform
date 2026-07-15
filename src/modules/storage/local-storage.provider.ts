import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import {
  sanitizeStorageFilename,
  type DeleteObjectInput,
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

  async deleteObject(input: DeleteObjectInput): Promise<void> {
    const source = input.pathname || input.url;

    if (!source) {
      return;
    }

    let candidate = source;

    try {
      candidate = new URL(source).pathname;
    } catch {
      // Local uploads may already be stored as a pathname.
    }

    const relativePath = candidate.replace(/^\/?uploads[\\/]/, "");
    const root = path.resolve(uploadRoot);
    const target = path.resolve(uploadRoot, relativePath);

    if (!target.startsWith(`${root}${path.sep}`)) {
      throw new Error("Invalid storage path");
    }

    try {
      await unlink(target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
}
