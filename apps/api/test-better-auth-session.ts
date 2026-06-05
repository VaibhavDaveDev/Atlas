import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins/bearer";

const auth = betterAuth({
    database: {
        provider: "postgresql",
        url: "postgresql://postgres:postgres@localhost:5432/atlas_db?schema=public"
    },
    plugins: [bearer()]
});

async function main() {
    try {
        const headers = {
            cookie: "better-auth.session_token=test1234",
            authorization: "Bearer test1234"
        };
        const session = await auth.api.getSession({ headers: headers as any });
        console.log("Session:", session);
    } catch (e) {
        console.error("Error:", e);
    }
}
main();
