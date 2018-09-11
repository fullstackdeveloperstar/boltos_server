import { ExpressMiddlewareInterface } from "routing-controllers";
import { signature } from "../../helpers/jwt";
export class AuthMiddleware implements ExpressMiddlewareInterface {
    use(request: any, response: any, next?: (err?: any) => any): any {
        if (!request.headers.authorization) {
            response.status(200).json({
                status: 401,
                message: "Token not provided",
                error: {
                    message: "Token not provided",
                    name: "use",
                    stack: "AuthMiddleware.use"
                }
            });
        } else {
            const decoded = signature.verify(request.headers.authorization.split(" ")[1]);
            if (!decoded) {
                response.status(200).json({
                    status: 401,
                    message: "Authorization failed",
                    error: {
                        message: "Invalid token",
                        name: "use",
                        stack: "AuthMiddleware.use"
                    }
                });
            } else {
                request.user = {
                    id: decoded.userId
                };
                next();
            }
        }
    }
}