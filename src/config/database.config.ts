import { registerAs } from "@nestjs/config";

export const databaseConfig = registerAs('database', () => {

    const host = process.env.DATABASE_HOST || 'localhost';
    const port = process.env.DATABASE_PORT || 27017;
    const dbname = process.env.DATABASE_NAME || 'tweetsdb';
    const user = process.env.DATABASE_USER;
    const pass = process.env.DATABASE_PASS;

    return {
        url: `mongodb+srv://${user}:${pass}@${host}:${port}/${dbname}?retryWrites=true&w=majority`
    }
});
