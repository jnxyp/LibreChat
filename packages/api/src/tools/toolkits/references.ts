/** Resolves every reference before any image bytes are read or sent upstream. */
export async function withImageReferences<T extends { file_id: string }, R>({
  imageIds,
  files,
  loadFiles,
  onError,
  execute,
}: {
  imageIds: readonly string[];
  files: readonly T[];
  /** The adapter must scope this lookup to the authenticated owner and tenant. */
  loadFiles: (ids: string[]) => Promise<readonly T[]>;
  onError: (message: string) => R;
  execute: (files: T[]) => Promise<R>;
}): Promise<R> {
  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    return onError(
      'Reference image IDs are required. Reattach the image and use its exact file_id.',
    );
  }
  const available = new Map(files.map((file) => [file.file_id, file]));
  const missing = [...new Set(imageIds.filter((id) => !available.has(id)))];
  if (missing.length > 0) {
    for (const file of await loadFiles(missing)) {
      if (missing.includes(file.file_id)) {
        available.set(file.file_id, file);
      }
    }
  }
  const ordered: T[] = [];
  for (const id of imageIds) {
    const file = available.get(id);
    if (!file) {
      return onError(
        'Reference image IDs could not be resolved. Use the exact file_id from the image tool context, not a filename, or reattach the image. Do not replace this reference-image edit with text-only generation.',
      );
    }
    ordered.push(file);
  }
  return execute(ordered);
}
