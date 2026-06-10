import {
  createHash,
  createPrivateKey,
  createPublicKey,
  createSign,
  createVerify,
  generateKeyPairSync,
  KeyObject,
} from "crypto";

function getProtocolSigningKey(): KeyObject {
  const pem = process.env.PROTOCOL_SIGNING_PRIVATE_KEY;
  if (pem) return createPrivateKey(pem);

  const secret = process.env.SECRETS_ENCRYPTION_KEY ?? "dev-only-encryption-key-not-for-prod!!";
  const seed = createHash("sha256").update(`protocol-signing:${secret}`).digest();
  const { privateKey } = generateKeyPairSync("ed25519", { seed });
  return privateKey;
}

export function signPayload(payload: unknown): string {
  const canonical = JSON.stringify(payload);
  const signer = createSign("Ed25519");
  signer.update(canonical);
  signer.end();
  return signer.sign(getProtocolSigningKey()).toString("base64");
}

export function verifyPayload(payload: unknown, signature: string, publicKeyPem: string): boolean {
  const verifier = createVerify("Ed25519");
  verifier.update(JSON.stringify(payload));
  verifier.end();
  return verifier.verify(createPublicKey(publicKeyPem), Buffer.from(signature, "base64"));
}

export function hashObject(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
