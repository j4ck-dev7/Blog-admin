import argon2 from 'argon2';

// Essa configuração diz que o argon2 vai usar 2 threads, com cada thread usando 256mb de memoria,
// totalizando 512mb de memória e 4 iterações.
export const argon2Options: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536 * 4,
  timeCost: 4,
  parallelism: 2,
};

export async function hashPassword(password: string) {
  return argon2.hash(password, argon2Options);
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}
