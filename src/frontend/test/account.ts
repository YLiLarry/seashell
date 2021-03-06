export {TestAccount}
import * as fs from "fs";

namespace TestAccount {
  export let user = null;
  export let password = null;
  export let backend = null;
}
try {
  let result = JSON.parse(fs.readFileSync("account.json").toString());
  TestAccount.user = result.user;
  TestAccount.password = result.password;
  TestAccount.backend = result.backend;
} catch (e) {
  console.warn("Create src/frontend/account.json to enable WebSocket tests.");
}
