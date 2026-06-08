import { betterAuth } from "better-auth";
import { testUtils } from "better-auth/plugins";

const auth = betterAuth({
  database: {
    dialect: "sqlite",
    provider: "sqlite",
    url: ":memory:" 
  },
  plugins: [testUtils()]
});

async function run() {
  try {
    const ctx = await auth.$context;
    const { session, token, headers, cookies } = await ctx.test.login({ userId: "test-user-id" });
    console.log("Token:", token);
    console.log("Headers:", Object.fromEntries(headers.entries()));
    console.log("Cookies:", cookies);
  } catch (err) {
    console.error(err);
  }
}

run();