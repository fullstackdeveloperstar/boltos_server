import * as fs from "fs";
import * as jwt from "jsonwebtoken";
import * as path from "path";

const
    privateKey = fs.readFileSync(path.resolve("keys/private.key"), "utf8"),
    publicKey = fs.readFileSync(path.resolve("keys/public.key"), "utf8");

export namespace signature {
    export function sign(json: any, expiresIn: number): string {
        return jwt.sign(json, privateKey, {
            algorithm: "RS256",
            expiresIn: expiresIn
        });
    }

    export function verify(token: string): any {
        let result;
        try {
            result = jwt.verify(token, publicKey, {
                algorithms: ["RS256"]
            });
        } catch (error) {
            result = "";
        }
        return result;
    }
}