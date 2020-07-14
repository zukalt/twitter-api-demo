import { registerAs } from "@nestjs/config";


export const appConfig = registerAs('app', () => ({
    topics: JSON.parse(
      process.env.APP_FOLLOW_TOPICS || '["war and peace","fifty shades of gray"]'
    ).map(t => t.toLowerCase()).sort()
})) ;
