import { BinaryLike, createHash } from 'crypto';

export function generateSha1Hash(data: BinaryLike) {
    const hash = createHash('sha1');

    hash.update(data);

    const hexHash = hash.digest('hex');

    return hexHash;
}

export function generateSha256Hash(data: BinaryLike) {
    const hash = createHash('sha256');

    hash.update(data);

    const hexHash = hash.digest('hex');

    return hexHash;
}

export function generateWorkflowHash(canvasState: any) {
    // 해시 생성을 위해 view와 position을 제거한 정규화된 데이터 생성
    const normalizedForHash = {
        ...canvasState,
        view: undefined, // view 제거
        nodes: canvasState.nodes?.map((node: any) => ({
            ...node,
            position: undefined, // position 제거
        })),
    };

    return generateSha1Hash(JSON.stringify(normalizedForHash));
}
