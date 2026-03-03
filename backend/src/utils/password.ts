import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10; // talvez aumentar pra 12 depois?

// cria o hash da senha
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// verifica se a senha tá correta
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
