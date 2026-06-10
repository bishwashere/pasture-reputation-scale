import { createHash, generateKeyPairSync, KeyObject } from "crypto";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(buffer: Buffer): string {
  let num = BigInt(`0x${buffer.toString("hex")}`);
  let encoded = "";
  const base = BigInt(58);
  const zero = BigInt(0);
  while (num > zero) {
    const remainder = Number(num % base);
    encoded = BASE58_ALPHABET[remainder] + encoded;
    num = num / base;
  }
  for (const byte of buffer) {
    if (byte !== 0) break;
    encoded = "1" + encoded;
  }
  return encoded || "1";
}

function ed25519RawPublicKey(publicKey: KeyObject): Buffer {
  const der = publicKey.export({ type: "spki", format: "der" }) as Buffer;
  return der.subarray(der.length - 32);
}

export function publicKeyToDidKey(publicKey: KeyObject): string {
  const prefixed = Buffer.concat([Buffer.from([0xed, 0x01]), ed25519RawPublicKey(publicKey)]);
  return `did:key:z${base58Encode(prefixed)}`;
}

export function generateAgentIdentityKeypair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const did = publicKeyToDidKey(publicKey);
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  return { did, publicKeyPem, privateKeyPem };
}

export function generateAgentDid(creatorDid: string, bundleHash: string): string {
  const digest = createHash("sha256")
    .update(`${creatorDid}:${bundleHash}`)
    .digest("hex")
    .slice(0, 32);
  return `did:rep:agent:${digest}`;
}
