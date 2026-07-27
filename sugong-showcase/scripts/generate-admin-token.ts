import { createRandomToken, hashAdminToken } from "../src/server/auth/crypto";

const token = createRandomToken(32);
const hash = await hashAdminToken(token);

console.log("Lưu token này trong password manager. Token chỉ được hiển thị một lần:\n");
console.log(token);
console.log("\nĐặt giá trị sau vào ADMIN_TOKEN_HASH:\n");
console.log(hash);
