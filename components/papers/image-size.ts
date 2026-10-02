import { closeSync, openSync, readSync } from "fs"

/**
 * Pixel size of a PNG or JPEG, read from the file's own header. Server only.
 *
 * Why it exists: the figures in public/data/papers/ come from the lab at
 * whatever size each study drew them (1041 by 573 up to 2800 by 1900), and the
 * data file does not carry their sizes. The card needs them twice: for the
 * width and height attributes on the <img>, and to tell a tall multi-panel
 * figure from a landscape plot (a 1080 by 2340 figure letterboxed into a
 * landscape well is a sliver nobody can read).
 *
 * The type is decided by the signature, never the extension: on 2026-10-02 ten
 * of the files named .png were JPEGs.
 *
 * Only the first 256 KB is read. A PNG's size is in its first 24 bytes; a
 * JPEG's is in its first start-of-frame marker, which sits after any EXIF or
 * ICC block and is in practice well inside that window. A file this cannot
 * read returns null and the card falls back to an <img> with no size
 * attributes inside the same fixed well, so nothing shifts either way.
 */
const WINDOW = 256 * 1024

export function imageSize(file: string): { width: number; height: number } | null {
  let fd: number | null = null
  try {
    fd = openSync(file, "r")
    const buf = Buffer.alloc(WINDOW)
    const n = readSync(fd, buf, 0, WINDOW, 0)
    return fromPng(buf, n) ?? fromJpeg(buf, n)
  } catch {
    return null
  } finally {
    if (fd !== null) {
      try {
        closeSync(fd)
      } catch {
        // Nothing to do: the size has been read or it has not.
      }
    }
  }
}

function fromPng(buf: Buffer, n: number): { width: number; height: number } | null {
  if (n < 24 || buf.readUInt32BE(0) !== 0x89504e47 || buf.readUInt32BE(4) !== 0x0d0a1a0a) return null
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  return width > 0 && height > 0 ? { width, height } : null
}

function fromJpeg(buf: Buffer, n: number): { width: number; height: number } | null {
  if (n < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null
  let i = 2
  // Walk the segments: FF, a marker byte, then a two-byte length that counts
  // itself. Bounded by the window, so a damaged file cannot spin this.
  while (i + 9 < n) {
    if (buf[i] !== 0xff) return null
    const marker = buf[i + 1]
    // Padding bytes before a marker.
    if (marker === 0xff) {
      i++
      continue
    }
    // Start of frame: C0 to CF, except C4 (Huffman table), C8 (reserved) and
    // CC (arithmetic conditioning), which share the range but carry no size.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const height = buf.readUInt16BE(i + 5)
      const width = buf.readUInt16BE(i + 7)
      return width > 0 && height > 0 ? { width, height } : null
    }
    const len = buf.readUInt16BE(i + 2)
    if (len < 2) return null
    i += 2 + len
  }
  return null
}
