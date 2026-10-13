import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';

const options = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  options.set(process.argv[i], process.argv[i + 1]);
}
const planPath = options.get('--plan');
const passwordPath = options.get('--password-file');
const outputPath = options.get('--output');
const minimumPasswordLength = Number(options.get('--minimum-password-length') ?? 32);
if (!Number.isSafeInteger(minimumPasswordLength) || minimumPasswordLength < 7) {
  throw new Error('The minimum password length must be an integer of at least 7.');
}
if (!planPath || !passwordPath || !outputPath) {
  console.error('Usage: node tools/encrypt-organisation.mjs --plan PRIVATE_JSON --password-file PRIVATE_TEXT --output assets/organisation.enc.json');
  process.exit(1);
}

const plaintext = await readFile(planPath);
const plan = JSON.parse(plaintext.toString('utf8'));
if (typeof plan.title !== 'string' || !plan.title.length || plan.title.length > 150 ||
    typeof plan.intro !== 'string' || plan.intro.length > 2000 ||
    !Array.isArray(plan.sections) || plan.sections.length !== 6 ||
    !plan.sections.every(section => ['tag', 'title', 'description', 'nextStep'].every(key =>
      typeof section[key] === 'string' && section[key].length > 0 && section[key].length <= 2000))) {
  throw new Error('Invalid private plan format.');
}
const password = (await readFile(passwordPath, 'utf8')).trim();
if (password.length < minimumPasswordLength) {
  throw new Error(`Use a randomly generated password with at least ${minimumPasswordLength} characters.`);
}
const salt = randomBytes(16);
const iv = randomBytes(12);
const iterations = 600000;
const key = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
cipher.setAAD(Buffer.from('frost-skaters-organisation:v1'));
const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
const envelope = {
  version: 1,
  iterations,
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  ciphertext: encrypted.toString('base64')
};
await writeFile(outputPath, JSON.stringify(envelope, null, 2) + '\n');
key.fill(0);
plaintext.fill(0);
console.log('Encrypted plan written. No password or plaintext was published.');
