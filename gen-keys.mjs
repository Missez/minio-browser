// gen-keys.mjs
import { generateKeyPairSync } from 'crypto';
import fs from 'fs';

console.log('Generating RSA Keys...');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',      // ฟอร์แมต Public Key มาตรฐาน (PEM)
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',     // ฟอร์แมต Private Key มาตรฐาน (PEM)
    format: 'pem'
  }
});

// เขียนไฟล์
fs.writeFileSync('secret', privateKey);       // Private Key
fs.writeFileSync('secret.pub.pem', publicKey); // Public Key

console.log('✅ Keys generated successfully!');
console.log('📂 Created: "secret" (Private) and "secret.pub.pem" (Public)');