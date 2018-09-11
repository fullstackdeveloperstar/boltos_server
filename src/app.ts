import * as express from "express";
import * as http from "http";
import * as Sequelize from "sequelize";
import * as cors from "cors";
import * as fs from "fs";
import "reflect-metadata";
import { useExpressServer } from "routing-controllers";
import { OkController } from "./controllers/okController/okController.v1";
import { UserController } from "./controllers/userController/userController.v1";
import { config } from "./config";

const port = config.application.getPort();
let globalObj: any = global;

class App {
    public express;

    constructor() {
        this.express = express();
        this.setupDB();
    }

    private setupDB(): void {
        const sequelize = new Sequelize(
            config.database.getName(),
            config.database.getUser(),
            config.database.getPassword(),
            {
                host: config.database.getHost(),
                dialect: "mysql",
                define: {
                    timestamps: false
                },
                operatorsAliases: false,
                logging: false,
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                }
            });
        sequelize
            .authenticate()
            .then(() => {
                console.log('Connection has been established successfully.');
                globalObj.db = sequelize;
                useExpressServer(this.express, {
                    routePrefix: "/api/v1",
                    cors: {
                        "origin": "*",
                        "methods": "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
                        "preflightContinue": true,
                        "optionsSuccessStatus": 204
                    },
                    controllers: [OkController, UserController]
                });
            })
            .catch(err => {
                console.error('Unable to connect to the database:', err);
            });
    }
}

(function start() {
    // const options = {
    //     key: fs.readFileSync('./keys/key.pem'),
    //     cert: fs.readFileSync('./keys/cert.pem')
    // };
    const app = new App().express;
    app.use(cors())
    app.options('*', cors())
    app.options('*', (req, res) => {
        // console.log('opt')
        res.status(200).send('ok');
    });
    // https.createServer(options, app).listen(port, (err) => {
    //     if (err) {
    //         return console.log(err)
    //     }
    //     return console.log(`Server is listening on localhost:${port}`)
    // });
    http.createServer(app).listen(port, (err) => {
        if (err) {
            return console.log(err)
        }
        return console.log(`Server is listening on localhost:${port}`)
    });
})();