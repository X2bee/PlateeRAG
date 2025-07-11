import { BinaryLike, createHash } from "crypto";

export function generateSha1Hash(data: BinaryLike) {
    const hash = createHash('sha1');

    hash.update(data);

    const hexHash = hash.digest('hex');

    return hexHash;
}