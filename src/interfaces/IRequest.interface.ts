import { Request } from "express";
export interface IRequest extends Request {
    user: User
}

interface User {
    id: number
}