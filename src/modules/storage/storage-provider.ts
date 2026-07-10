export type StorageProviderName = "local" | "vercel-blob";

export type StoredObject = {
  url: string;
  pathname: string;
  provider: StorageProviderName;
  fileName: string;
  contentType: string;
  size: number;
};

export type PutObjectInput = {
  filename: string;
  contentType: string;
  body: ArrayBuffer;
};

export interface StorageProvider {
  readonly provider: StorageProviderName;
  putObject(input: PutObjectInput): Promise<StoredObject>;
}

export function sanitizeStorageFilename(filename: string) {
  const normalized = filename
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "upload";
}
