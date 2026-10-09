import bcrypt from "bcryptjs";

export async function bamMatKhau(mk: string) {
  return bcrypt.hash(mk, 10);
}

export async function soMatKhau(mk: string, hash: string) {
  return bcrypt.compare(mk, hash);
}
