const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_ENTRY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_MIN_LENGTH = 22;
const MAX_ZIP_COMMENT_LENGTH = 0xffff;
const CENTRAL_DIRECTORY_ENTRY_MIN_LENGTH = 46;
const ZIP64_MARKER = 0xffffffff;

export type ZipEntry = { name: string; uncompressedSize: number };

/** Random access to an archive: a whole buffer, or a file descriptor for a file on disk. */
export type ZipReader = {
  size: number;
  read: (offset: number, length: number) => Promise<Buffer>;
};

export const bufferZipReader = (content: Buffer): ZipReader => ({
  read: async (offset, length) => content.subarray(offset, offset + length),
  size: content.length,
});

/**
 * Lists the entries of a zip archive from its central directory, without inflating anything and without loading the
 * archive in memory. Used to reject archives before they are opened anywhere: unexpected entry types and zip bombs.
 * Throws on a malformed archive or a ZIP64 archive (sizes beyond 4 GiB are never legitimate here).
 */
export const listZipEntries = async (reader: ZipReader): Promise<ZipEntry[]> => {
  const endOfCentralDirectory = await findEndOfCentralDirectory(reader);
  const entriesCount = endOfCentralDirectory.readUInt16LE(10);
  const centralDirectorySize = endOfCentralDirectory.readUInt32LE(12);
  const centralDirectoryOffset = endOfCentralDirectory.readUInt32LE(16);
  if (centralDirectoryOffset === ZIP64_MARKER || centralDirectorySize === ZIP64_MARKER) {
    throw new Error('zip64 archives are not supported');
  }
  if (centralDirectoryOffset + centralDirectorySize > reader.size) {
    throw new Error('malformed zip central directory');
  }
  const directory = await reader.read(centralDirectoryOffset, centralDirectorySize);

  return Array.from({ length: entriesCount }).reduce<{ entries: ZipEntry[]; offset: number }>(
    ({ entries, offset }) => {
      if (
        offset + CENTRAL_DIRECTORY_ENTRY_MIN_LENGTH > directory.length ||
        directory.readUInt32LE(offset) !== CENTRAL_DIRECTORY_ENTRY_SIGNATURE
      ) {
        throw new Error('malformed zip central directory');
      }
      const uncompressedSize = directory.readUInt32LE(offset + 24);
      if (uncompressedSize === ZIP64_MARKER) {
        throw new Error('zip64 archives are not supported');
      }
      const nameLength = directory.readUInt16LE(offset + 28);
      const extraLength = directory.readUInt16LE(offset + 30);
      const commentLength = directory.readUInt16LE(offset + 32);
      const nameOffset = offset + CENTRAL_DIRECTORY_ENTRY_MIN_LENGTH;
      return {
        entries: [...entries, { name: directory.toString('utf8', nameOffset, nameOffset + nameLength), uncompressedSize }],
        offset: nameOffset + nameLength + extraLength + commentLength,
      };
    },
    { entries: [], offset: 0 }
  ).entries;
};

/** The end of central directory record sits at the end of the file, before an optional comment of at most 64 KiB. */
const findEndOfCentralDirectory = async (reader: ZipReader): Promise<Buffer> => {
  const tailLength = Math.min(reader.size, END_OF_CENTRAL_DIRECTORY_MIN_LENGTH + MAX_ZIP_COMMENT_LENGTH);
  const tail = await reader.read(reader.size - tailLength, tailLength);
  const offset = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]), tail.length - END_OF_CENTRAL_DIRECTORY_MIN_LENGTH);
  if (offset < 0 || tail.readUInt32LE(offset) !== END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
    throw new Error('end of central directory not found');
  }
  return tail.subarray(offset, offset + END_OF_CENTRAL_DIRECTORY_MIN_LENGTH);
};
