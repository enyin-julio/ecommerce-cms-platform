import { LocalStorageProvider } from "@/modules/storage/local-storage.provider";
import type { StorageProvider, StorageProviderName } from "@/modules/storage/storage-provider";
import { VercelBlobStorageProvider } from "@/modules/storage/vercel-blob.provider";

function resolveStorageProviderName(): StorageProviderName {
  const provider = process.env.STORAGE_PROVIDER || "local";

  if (provider === "vercel-blob") {
    return provider;
  }

  return "local";
}

export function getStorageProvider(): StorageProvider {
  const provider = resolveStorageProviderName();

  if (provider === "vercel-blob") {
    return new VercelBlobStorageProvider();
  }

  return new LocalStorageProvider();
}
