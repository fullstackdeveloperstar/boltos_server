import * as path from "path";
import { load as dotenv } from "dotenv";

export namespace config {
    export namespace environment {
        export function isDev(): boolean {
            return process.env.NODE_ENV && process.env.NODE_ENV === "dev";
        }

        export function isProd(): boolean {
            return process.env.NODE_ENV && process.env.NODE_ENV === "prod";
        }
    }
    export namespace application {
        export function getHost(): string {
            return process.env.APP_HOST ? process.env.APP_HOST : "localhost";
        }
        export function getPort(): number {
            return process.env.APP_PORT ? parseInt(process.env.APP_PORT) : 3000;
        }
    }
    export namespace database {
        export function getHost(): string {
            return process.env.DB_HOST ? process.env.DB_HOST : "localhost";
        }
        export function getName(): string {
            return process.env.DB_NAME ? process.env.DB_NAME : "test";
        }
        export function getUser(): string {
            return process.env.DB_USER ? process.env.DB_USER : "root";
        }
        export function getPassword(): string {
            return process.env.DB_PASS ? process.env.DB_PASS : "";
        }
    }
}

(function setup(): void {
    if (config.environment.isDev()) {
        dotenv({
            path: path.resolve("./envs/dev.env")
        });
    } else if (config.environment.isProd()) {
        dotenv({
            path: path.resolve("./envs/prod.env")
        });
    }
})();
