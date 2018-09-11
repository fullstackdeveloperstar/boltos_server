import {JsonController, Get, Req, Res} from "routing-controllers";
import {Request, Response} from "express";
let globalObj: any = global;

@JsonController("/ok")
export class OkController {

    @Get("/")
    get(@Req() request: Request, @Res() response: Response) {
        let body = {
            status: 200,
            message: "It worked :)",
            data: {
                ok: true
            }
        };
       return response.status(200).json(body);
    }
}