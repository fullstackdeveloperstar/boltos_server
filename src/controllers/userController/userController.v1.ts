import { JsonController, Get, Req, Res, Post, BodyParam, UseBefore } from "routing-controllers";
import { Request, Response } from "express";
import * as Sequelize from "sequelize";
import { config } from "../../config";
import * as bcrypt from "bcrypt";
import { setUserModel } from "../../models/userModel/userModel.v1";
import { setMiningServerModel } from "../../models/miningServerModel/miningServerModel.v1";
import { setMiningConfigModel } from "../../models/miningConfigModel/miningConfigModel.v1";
import { setGpuDeviceModel } from "../../models/gpuDeviceModel/gpuDeviceModel.v1";
import { setMiningPoolModel } from "../../models/miningPoolModel/miningPoolModel.v1";
import { setUpdateQueueModel } from "../../models/updateQueueModel/updateQueueModel.v1";
import { signature } from "../../helpers/jwt";
import { IRequest } from "../../interfaces/IRequest.interface";
import { AuthMiddleware } from "../../middlewares/authMiddleware/authMiddleware.v1";
import { send, sendVerify } from "../../helpers/mail";
const uuidv4 = require('uuid/v4');

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
    }
);
const SALT_ROUNDS = 10;
const SALT = bcrypt.genSaltSync(SALT_ROUNDS);

const UserModel = setUserModel(sequelize);
const MiningServerModel = setMiningServerModel(sequelize);
const MiningConfigModel = setMiningConfigModel(sequelize);
const GpuDeviceModel = setGpuDeviceModel(sequelize);
const MiningPoolModel = setMiningPoolModel(sequelize);
const UpdateQueueModel = setUpdateQueueModel(sequelize);

@JsonController("/users")
export class UserController {
    @Post("/register")
    async register(
        @Req() request: Request,
        @Res() response: Response,
        @BodyParam("username") userName: string,
        @BodyParam("email") email: string,
        @BodyParam("password") password: string,
        @BodyParam("firstname") firstName: string,
        @BodyParam("lastname") lastName: string,
        @BodyParam("companyname") companyName: string
    ) {
        let body: any;
        if (userName && email && password && firstName && lastName) {
            const existingUser = await UserModel.findOne({ where: { username: userName } });
            if (existingUser) {
                body = {
                    status: 200,
                    message: "User already exists",
                    data: {
                        registeredUser: {
                            userName: (<any>existingUser).username,
                            email: (<any>existingUser).email
                        }
                    }
                };
                return response.json(body);
            } else {
                //do validate

                // save
                const hash = bcrypt.hashSync(password, SALT);
                if (!hash) {
                    body = {
                        status: 500,
                        message: "There were problems saving the user",
                        error: {
                            message: "Password hash failed",
                            name: "hashSync",
                            stack: "register.hashSync"
                        }
                    };
                    return response.json(body);
                } else {
                    const randomKey = uuidv4();
                    const savedUser = await UserModel.create({
                            user_id : 'NULL',
                            username: userName,
                            email: email,
                            password_hash: hash,
                            first_name: firstName,
                            last_name: lastName,
                            company_name: companyName,
                            "2fa_token" : 'NULL',
                            telegram_id: randomKey,
                            sms_phone : 'NULL',
                            slack_id : 'NULL'
                        }
                    );
                    if (savedUser) {
                        sendVerify(email, firstName, (<any>savedUser).dataValues.user_id, randomKey);
                        body = {
                            status: 200,
                            message: "Please verify your acoount through the email",
                            data: { 
                                userName: (<any>savedUser).username
                            }
                        };
                        return response.json(body);
                    } else {
                        body = {
                            status: 200,
                            message: "There were problems saving new user",
                            error: {
                                message: "Save failed",
                                name: "user.save",
                                stack: "login.UserModel.save"
                            }
                        };
                        return response.json(body);
                    }
                }
            }
        } else {
            body = {
                status: 200,
                message: "Fill in required filds",
                error: {
                    message: "Required fields could not be empty",
                    name: "register",
                    stack: "register.UserModel.findOne"
                }
            };
            return response.json(body);
        }
    }

    @Post("/verify-account")
    async verifyAccount(
        @Req() request: IRequest,
        @Res() response: Response,
        @BodyParam("id") userId: number,
        @BodyParam("randomKey") randomKey: string
    ) {
        let body: any;
        if (userId && randomKey) {
            const user: any = await UserModel.findOne({ where: { user_id: userId, telegram_id: randomKey } });
            if (user) {
                const newUser = await user.update({
                    telegram_id: "ok"
                });
                body = {
                    status: 200,
                    message: "Account verified",
                    data: {
                        ok: true
                    }
                };
                return response.status(200).json(body);
            } else {
                body = {
                    status: 200,
                    message: "Account verification failure",
                    error: {
                        message: "Verification failed",
                        name: "verifyAccount",
                        stack: "verifyAccount.UserNotFound"
                    }
                };
                return response.status(200).json(body);
            }
        } else {
            body = {
                status: 200,
                message: "Please fill in required fields",
                error: {
                    message: "Reset failed",
                    name: "resetPassword",
                    stack: "resetPassword.validate"
                }
            };
            return response.status(200).json(body);
        }
    }

    @Post("/login")
    async login(
        @Req() request: Request,
        @Res() response: Response,
        @BodyParam("username") userName: string,
        @BodyParam("password") password: string,
    ) {
        let body: any;
        // console.log(userName, password);
        if (userName && password) {
            const user = await UserModel.findOne({ where: { username: userName } });
            if (user) {
                if((<any>user).dataValues.telegram_id === "ok") {
                    if (bcrypt.compareSync(password, (<any>user).dataValues.password_hash)) {
                        const token = signature.sign({
                            userId: parseInt((<any>user).user_id)
                        }, 7 * 24 * 60 * 60
                        );
                        if (token && token.length > 0) {
                            body = {
                                status: 200,
                                message: "Login successful",
                                data: {
                                    credentials: {
                                        userName: (<any>user).dataValues.username,
                                        token: token
                                    }
                                }
                            };
                            return response.json(body);
                        } else {
                            body = {
                                status: 200,
                                message: "There were problems generating token",
                                error: {
                                    message: "Token failed",
                                    name: "signature.sign",
                                    stack: "login.UserModel.findOne.signature.sign"
                                }
                            };
                            return response.json(body);
                        }
                    } else {
                        body = {
                            status: 200,
                            message: "Invalid username or password",
                            error: {
                                message: "Invalid username or password",
                                name: "login",
                                stack: "login.UserModel.findOne"
                            }
                        };
                        return response.json(body);
                    }
                } else {
                    body = {
                        status: 200,
                        message: "Account verification required",
                        error: {
                            message: "Registeration needs verification",
                            name: "login",
                            stack: "login.UserModel"
                        }
                    };
                    return response.json(body);
                }
            } else {
                body = {
                    status: 200,
                    message: "Invalid username or password",
                    error: {
                        message: "User not found",
                        name: "login",
                        stack: "login.UserModel.findOne"
                    }
                };
                return response.json(body);
            }
        } else {
            body = {
                status: 200,
                message: "Empty username or password",
                error: {
                    message: "Empty username or password",
                    name: "login",
                    stack: "login.UserModel.findOne"
                }
            };
            return response.json(body);
        }
    }

    @Post("/request-reset-password")
    async requestResetPassword(
        @Req() request: IRequest,
        @Res() response: Response,
        @BodyParam("email") email: string
    ) {
        let body: any;
        if (!email || (email && email.length === 0)) {
            body = {
                status: 200,
                message: "Please fill in required fields",
                error: {
                    message: "Reset failed",
                    name: "resetPassword",
                    stack: "resetPassword.validate"
                }
            };
            return response.status(200).json(body);
        } else {
            const randomKey = uuidv4();
            const user: any = await UserModel.findOne({ where: { email: email } });
            if (!user) {
                body = {
                    status: 404,
                    message: "User with the provided email does not exist",
                    error: {
                        message: "Reset failed",
                        name: "resetPassword",
                        stack: "resetPassword.findUser"
                    }
                };
                return response.status(200).json(body);
            } else {
                const newUser = await user.update({
                    "2fa_token": randomKey
                });
                // console.log(user);
                send(email, user.dataValues.first_name, user.dataValues.user_id, randomKey);
                body = {
                    status: 200,
                    message: "Password reset link sent to your email",
                    data: {
                        ok: true
                    }
                };
                return response.status(200).json(body);
            }
        }
    }

    @Post("/reset-password")
    async resetPassword(
        @Req() request: IRequest,
        @Res() response: Response,
        @BodyParam("id") userId: number,
        @BodyParam("password") password: string,
        @BodyParam("randomKey") randomKey: string
    ) {
        let body: any;
        if (password && randomKey) {
            const user: any = await UserModel.findOne({ where: { user_id: userId, "2fa_token": randomKey } });
            if (user) {
                const newUser = await user.update({
                    password_hash: bcrypt.hashSync(password, SALT),
                    "2fa_token": ""
                });
                body = {
                    status: 200,
                    message: "Password reset success",
                    data: {
                        ok: true
                    }
                };
                return response.status(200).json(body);
            } else {
                body = {
                    status: 200,
                    message: "Password reset failure",
                    error: {
                        message: "Reset failed",
                        name: "resetPassword",
                        stack: "resetPassword.UserNotFound"
                    }
                };
                return response.status(200).json(body);
            }
        } else {
            body = {
                status: 200,
                message: "Please fill in required fields",
                error: {
                    message: "Reset failed",
                    name: "resetPassword",
                    stack: "resetPassword.validate"
                }
            };
            return response.status(200).json(body);
        }
    }

    @Post("/reset-password-internal")
    @UseBefore(AuthMiddleware)
    async resetPasswordInternal(
        @Req() request: IRequest,
        @Res() response: Response,
        @BodyParam("oldpassword") oldPassword: string,
        @BodyParam("newpassword") newPassword: string
    ) {
        let body: any;
        let userId = request.user.id;
        if (oldPassword && newPassword) {
            const user: any = await UserModel.findOne({ where: { user_id: userId } });
            if (user) {
                if (bcrypt.compareSync(oldPassword, (<any>user).dataValues.password_hash)) {
                    const newUser = await user.update({
                        password_hash: bcrypt.hashSync(newPassword, SALT)
                    });
                    body = {
                        status: 200,
                        message: "Password reset success",
                        data: {
                            ok: true
                        }
                    };
                    return response.status(200).json(body);
                } else {
                    body = {
                        status: 200,
                        message: "Password reset failure",
                        error: {
                            message: "Reset failed - Old password didn\'t match",
                            name: "resetPassword",
                            stack: "resetPassword.UserNotFound"
                        }
                    };
                    return response.status(200).json(body);
                }
            } else {
                body = {
                    status: 200,
                    message: "Password reset failure",
                    error: {
                        message: "Reset failed",
                        name: "resetPassword",
                        stack: "resetPassword.UserNotFound"
                    }
                };
                return response.status(200).json(body);
            }
        } else {
            body = {
                status: 200,
                message: "Please fill in required fields",
                error: {
                    message: "Reset failed",
                    name: "resetPassword",
                    stack: "resetPassword.validate"
                }
            };
            return response.status(200).json(body);
        }
    }

    @Get("/dashboard")
    @UseBefore(AuthMiddleware)
    async getDashboard(
        @Req() request: IRequest,
        @Res() response: Response,
    ) {
        let data = [];
        let k = 0;
        let userId = request.user.id;
        const miningServers = await MiningServerModel.findAll({ where: { user_id: userId, is_deleted: '0' } });
        if (miningServers && miningServers.length > 0) {
            for (let i = 0; i < miningServers.length; i++) {
                const miningConfig = await MiningConfigModel.find({ where: { mc_id: (<any>miningServers[i]).dataValues.mining_config } });
                const gpuDevices = await GpuDeviceModel.findAll({ where: { mserver_id: (<any>miningServers[i]).dataValues.mserver_id } });
                for (let j = 0; j < gpuDevices.length; j++) {
                    let result: any = {};
                    result.mserver_id = (<any>miningServers[i]).dataValues.mserver_id;
                    result.hostName = (<any>miningServers[i]).dataValues.miner_name;
                    result.miningProfile = (<any>miningConfig).dataValues.mc_name;
                    result.status = (<any>miningServers[i]).dataValues.status;
                    result.uptime = (<any>miningServers[i]).dataValues.mserver_uptime;
                    result.averageGpuTemps = (<any>miningServers[i]).dataValues.target_temp;
                    result.coreMemoryClocks = (<any>gpuDevices[j]).dataValues.gpu_clocking;
                    data[k] = result;
                    k++;
                }
            }
            let body = {
                status: 200,
                message: "dashboard data",
                data: data
            };
            return response.status(200).json(body);
        } else {
            let body = {
                status: 200,
                message: "dashboard (empty) data",
                data: data
            };
            return response.status(200).json(body);
        }
    }

    @Post("/server-info")
    @UseBefore(AuthMiddleware)
    async getServerInfor(
        @BodyParam("mserver_id") mserver_id: string,
        @Req() request: IRequest,
        @Res() response: Response
    ) {
        let data: any = {};
        const miningServer = await MiningServerModel.findById(mserver_id);
        if (miningServer) {
            const miningConfig = await MiningConfigModel.find({ where: { mc_id: (<any>miningServer).dataValues.mining_config } });
            data.hostName = (<any>miningServer).dataValues.miner_name;
            data.uuid = (<any>miningServer).dataValues.os_uuid;
            data.status = (<any>miningServer).dataValues.status;
            data.miningProfile = (<any>miningConfig).dataValues.mc_name;
            data.boltOsVersion = (<any>miningServer).dataValues.os_version;
            data.uptime = (<any>miningServer).dataValues.mserver_uptime;
            data.numGpus = (<any>miningServer).dataValues.num_gpus;
            data.min_fanspeed = (<any>miningServer).dataValues.min_fanspeed;
            data.target_temp = (<any>miningServer).dataValues.target_temp;
            const gpuDevices = await GpuDeviceModel.findAll({ where: { mserver_id: (<any>miningServer).dataValues.mserver_id } });
            data.gpus = [];
            for (let i = 0; i < data.numGpus; i++) {
                let gpuMakeModel = `${(<any>gpuDevices[i]).dataValues.gpu_make} - ${(<any>gpuDevices[i]).dataValues.gpu_model}`;
                data.gpus[i] = {
                    pciSlot: (<any>gpuDevices[i]).dataValues.gpu_slot,
                    makeModel: gpuMakeModel
                };
            }
            let body = {
                status: 200,
                message: "server info",
                data: data
            };
            return response.status(200).json(body);
        } else {
            let body = {
                status: 200,
                message: "server (empty) info",
                data: data
            };
            return response.status(200).json(body);
        }
    }

    @Get("/mining-profiles")
    @UseBefore(AuthMiddleware)
    async getMiningProfiles(
        @Req() request: IRequest,
        @Res() response: Response
    ) {
        let userId = request.user.id;
        let data = [];
        const miningConfigs = await MiningConfigModel.findAll({ where: { user_id: userId, is_deleted: '0' } });
        if(miningConfigs && miningConfigs.length > 0) {
            for(let i = 0; i < miningConfigs.length; i++) {
                let result: any = {};
                result.mc_id = (<any>miningConfigs[i]).dataValues.mc_id;
                result.profile = (<any>miningConfigs[i]).dataValues.mc_name;
                result.type = (<any>miningConfigs[i]).dataValues.mc_type;
                result.pools = (<any>miningConfigs[i]).dataValues.mc_pools;
                result.switchingIntervals = (<any>miningConfigs[i]).dataValues.mc_switching;
                result.is_deleted = (<any>miningConfigs[i]).dataValues.is_deleted;
                data[i] = result;
            }
            let body = {
                status: 200,
                message: "mining profiles",
                data: data
            };
            return response.status(200).json(body);
        } else {
            let body = {
                status: 200,
                message: "mining profiles (empty)",
                data: data
            };
            return response.status(200).json(body);
        }
    }

    @Post("/mining-profile-create")
    @UseBefore(AuthMiddleware)
    async createMiningProfile(
        @Req() request: IRequest,
        @Res() response: Response,
        @BodyParam("mc_name") mc_name: string,
        @BodyParam("mc_type") mc_type: number,
        @BodyParam("mc_pools") mc_pools: string,
        @BodyParam("mc_switching") mc_switching: number,
    ) {
        let userId = request.user.id;

        const newMiningConfig = await MiningConfigModel.create({
            mc_name: mc_name,
            mc_type: mc_type,
            mc_pools: mc_pools,
            mc_switching: mc_switching,
            mc_id : 'NULL',
            user_id : userId,
            is_deleted : '0'
        });

        if(newMiningConfig) {
             let body = {
                status: 200,
                message: "mining profile created",
                data: {
                    ok: true
                }
            };
            return response.status(200).json(body);
        } else {
             let body = {
                status: 200,
                message: "mining profile is not created",
                data: {
                    ok: false
                }
            };
            return response.status(200).json(body);
        }
    }

    @Post("/mining-profiles")
    @UseBefore(AuthMiddleware)
    async updateMiningProfile(
        @Req() request: IRequest,
        @Res() response: Response,
        @BodyParam("mc_id") mc_id: number,
        @BodyParam("mc_name") mc_name: string,
        @BodyParam("mc_type") mc_type: number,
        @BodyParam("mc_pools") mc_pools: string,
        @BodyParam("mc_switching") mc_switching: number,
    ) {
        let userId = request.user.id;
        const miningConfig: any = await MiningConfigModel.findOne({ where: { user_id: userId, mc_id: mc_id } });
        if(miningConfig) {
            const newMiningConfig = await miningConfig.update({
                mc_name: mc_name,
                mc_type: mc_type,
                mc_pools: mc_pools,
                mc_switching: mc_switching
            });
            let body = {
                status: 200,
                message: "mining profile updated",
                data: {
                    ok: true
                }
            };
            return response.status(200).json(body);
        } else {
            let body = {
                status: 200,
                message: "please fill in required fields",
                error: {
                    ok: false
                }
            };
            return response.status(200).json(body);
        }
    }

    @Post("/delete-mining-profile")
    @UseBefore(AuthMiddleware)
    async deleteMiningProfile(
        @Req() request: IRequest,
        @Res() response: Response,
        @BodyParam("mc_id") mc_id: number,
    ) {
        let userId = request.user.id;
        const miningConfig: any = await MiningConfigModel.findById(mc_id);
        if(miningConfig) {
            const newMiningConfig = await miningConfig.update({
                is_deleted : '1'
            });
            let body = {
                status: 200,
                message: "mining profile deleted",
                data: {
                    ok: true
                }
            };
            return response.status(200).json(body);
        } else {
            let body = {
                status: 200,
                message: "Mining Profile does not exist/",
                error: {
                    ok: false
                }
            };
            return response.status(200).json(body);
        }
    }

    @Get("/mining-pools")
    @UseBefore(AuthMiddleware)
    async getMiningPools(
        @Req() request: IRequest,
        @Res() response: Response
    ) {
        let userId = request.user.id;
        let data = [];
        const miningPools = await MiningPoolModel.findAll({ where: { user_id: userId, is_deleted : '0'} });
        if(miningPools && miningPools.length > 0) {
            for(let i = 0; i < miningPools.length; i++) {
                let result: any = {};
                result.mpool_id = (<any>miningPools[i]).dataValues.mp_id;
                result.accountName = (<any>miningPools[i]).dataValues.mp_name;
                result.currency = (<any>miningPools[i]).dataValues.mp_currency;
                result.stratumUrl = (<any>miningPools[i]).dataValues.mp_stratum_url;
                result.username = (<any>miningPools[i]).dataValues.mp_username;
                result.password = (<any>miningPools[i]).dataValues.mp_password;
                data[i] = result;
            }
            let body = {
                status: 200,
                message: "mining pools",
                data: data
            };
            return response.status(200).json(body);
        } else {
            let body = {
                status: 200,
                message: "mining pools (empty)",
                data: data
            };
            return response.status(200).json(body);
        }
    }

    @Post("/get-mining-pool")
    @UseBefore(AuthMiddleware)
    async getMiningPool(
        @Req() request: IRequest,
        @Res() response: Response,
        @BodyParam("mp_id") mp_id: number,
    ) {
        let userId = request.user.id;
        let data = [];
        const miningPools = await MiningPoolModel.findAll({ where: { user_id: userId, mp_id: mp_id,is_deleted : '0'} });
        if(miningPools && miningPools.length > 0) {
            
                let result: any = {};
                result.mpool_id = (<any>miningPools[0]).dataValues.mp_id;
                result.accountName = (<any>miningPools[0]).dataValues.mp_name;
                result.currency = (<any>miningPools[0]).dataValues.mp_currency;
                result.stratumUrl = (<any>miningPools[0]).dataValues.mp_stratum_url;
                result.username = (<any>miningPools[0]).dataValues.mp_username;
                result.password = (<any>miningPools[0]).dataValues.mp_password;
                
           
            let body = {
                status: 200,
                message: "mining pool",
                data: result
            };
            return response.status(200).json(body);
        } else {
            let body = {
                status: 200,
                message: "mining pool (empty)",
                data: data
            };
            return response.status(200).json(body);
        }
    }

    @Post("/mining-pool")
    @UseBefore(AuthMiddleware)
    async updateMiningPool(
        @Req() request: IRequest,
        @Res() response: Response,
        @BodyParam("mpool_id") mpool_id: number,
        @BodyParam("accountName") accountName: string,
        @BodyParam("currency") currency: string,
        @BodyParam("stratumUrl") stratumUrl: string,
        @BodyParam("username") username: string,  
        @BodyParam("password") password: string,        
    ) {
        const miningPool : any = await MiningPoolModel.findById(mpool_id);
        if(miningPool) {
            const newUpdatePool = await miningPool.update({
                mp_name: accountName,
                mp_currency : currency,
                mp_stratum_url : stratumUrl,
                mp_username : username,
                mp_password : password
            });

            if (newUpdatePool) {
                let body = {
                    status: 200,
                    message: "mining pool is updated",
                    data: {
                        ok: true
                    }
                };
                return response.status(200).json(body);
            }else {
                let body = {
                    status: 200,
                    message: "mining pool is not updated",
                    data: {
                        ok: false
                    }
                };
                return response.status(200).json(body);
            }
        } else {
            let body = {
                status: 200,
                message: "mining pool is not exist",
                data: {
                    ok: false
                }
            };
            return response.status(200).json(body);
        }
    }

    @Post("/mining-pool-create")
    @UseBefore(AuthMiddleware)
    async createMiningPool(
        @Req() request: IRequest,
        @Res() response: Response,
        @BodyParam("accountName") accountName: string,
        @BodyParam("currency") currency: string,
        @BodyParam("stratumUrl") stratumUrl: string,
        @BodyParam("username") username: string,  
        @BodyParam("password") password: string,        
    ) {
        const userId = request.user.id;
        const miningPool : any = await MiningPoolModel.create({
            mp_id : 'NULL',
            user_id: userId,
            mp_name: accountName,
            mp_currency : currency,
            mp_stratum_url : stratumUrl,
            mp_username : username,
            mp_password : password,
            is_deleted : '0'
        });

        if (miningPool) {
            let body = {
                status: 200,
                message: "mining pool is created",
                data: {
                    ok: true
                }
            };
            return response.status(200).json(body);
        } else {
            let body = {
                status: 200,
                message: "mining pool is not created",
                data: {
                    ok: false
                }
            };
            return response.status(200).json(body);
        }
        
    }

    @Post("/delete-mining-pool")
    @UseBefore(AuthMiddleware)
    async deleteMiningPool(
        @Req() request: IRequest,
        @Res() response: Response,
        @BodyParam("mpool_id") mpool_id: number,      
    ) {
        const miningPool : any = await MiningPoolModel.findById(mpool_id);
        if(miningPool) {
            const newUpdatePool = await miningPool.update({
                is_deleted: '1'
            });

            if (newUpdatePool) {
                let body = {
                    status: 200,
                    message: "mining pool is deleted",
                    data: {
                        ok: true
                    }
                };
                return response.status(200).json(body);
            }else {
                let body = {
                    status: 200,
                    message: "mining pool is not deleted",
                    data: {
                        ok: false
                    }
                };
                return response.status(200).json(body);
            }
        } else {
            let body = {
                status: 200,
                message: "mining pool is not exist",
                data: {
                    ok: false
                }
            };
            return response.status(200).json(body);
        }
    }

    @Post("/server-start")
    @UseBefore(AuthMiddleware)
    async startServer(
        @BodyParam("mserver_id") mserver_id: string,
        @Req() request: IRequest,
        @Res() response: Response
    ) {
        const updateQueue: any = await UpdateQueueModel.findOne({ where: { mserver_id: mserver_id}});
        if(updateQueue) {
            const newUpdateQueue = await updateQueue.update({
                boltos_function: "start",
                boltos_payload: ""
            });
            let body = {
                status: 200,
                message: "server started",
                data: {
                    ok: true
                }
            };
            return response.status(200).json(body);
        } else {
            let body = {
                status: 404,
                message: "no server found",
                data: {
                    ok: false
                }
            };
            return response.status(200).json(body);
        }
    }

    @Post("/server-stop")
    @UseBefore(AuthMiddleware)
    async stopServer(
        @BodyParam("mserver_id") mserver_id: string,
        @Req() request: IRequest,
        @Res() response: Response
    ) {
        const updateQueue: any = await UpdateQueueModel.findOne({ where: { mserver_id: mserver_id}});
        if(updateQueue) {
            const newUpdateQueue = await updateQueue.update({
                boltos_function: "stop"
            });
            let body = {
                status: 200,
                message: "server stopped",
                data: {
                    ok: true
                }
            };
            return response.status(200).json(body);
        } else {
            let body = {
                status: 404,
                message: "no server found",
                data: {
                    ok: false
                }
            };
            return response.status(200).json(body);
        }
    }

    @Post("/server-delete")
    @UseBefore(AuthMiddleware)
    async deleteServer(
        @BodyParam("mserver_id") mserver_id: string,
        @Req() request: IRequest,
        @Res() response: Response
    ) {
        // const rowsAffectedCount = await UpdateQueueModel.destroy({
        //     where: {
        //       mserver_id: mserver_id
        //     }
        // });

        const server: any = await MiningServerModel.findById(mserver_id);

        if(server) {
            const newServer = await server.update({
                is_deleted: '1'
            });

            if(newServer) {
                let body = {
                    status: 200,
                    message: "server(s) deleted",
                    data: {
                        ok: true
                    }
                };
                return response.status(200).json(body);
            } else {
                 let body = {
                    status: 200,
                    message: "server(s) was not deleted",
                    data: {
                        ok: false
                    }
                };
                return response.status(200).json(body);
            }
        } else {
            
            let body = {
                status: 404,
                message: "server not found",
                data: {
                    ok: false
                }
            };
            return response.status(200).json(body);
        }
        
        let body = {
            status: 200,
            message: "server(s) deleted",
            data: {
                ok: true
            }
        };
        return response.status(200).json(body);
    }

    @Post("/server-update")
    @UseBefore(AuthMiddleware)
    async updateServer(
        @BodyParam("mserver_id") mserver_id: string,
        @BodyParam("miner_name") miner_name: string,
        @BodyParam("target_temp") target_temp: number,
        @BodyParam("mining_config") mining_config: number,
        @BodyParam("min_fanspeed") min_fanspeed: number,
        @Req() request: IRequest,
        @Res() response: Response
    ) {
        const server: any = await MiningServerModel.findById(mserver_id);
        if(server) {
            const newServer = await server.update({
                miner_name: miner_name,
                target_temp: target_temp,
                mining_config: mining_config,
                min_fanspeed: min_fanspeed
            });
            if(newServer){
                let body = {
                    status: 200,
                    message: "server updated",
                    data: {
                        ok: true
                    }
                };
                return response.status(200).json(body);
            } else {
                let body = {
                    status: 500,
                    message: "server update failed",
                    data: {
                        ok: false
                    }
                };
                return response.status(200).json(body);
            }
        } else {
            let body = {
                status: 404,
                message: "server not found",
                data: {
                    ok: false
                }
            };
            return response.status(200).json(body);
        }
    }

    @Get("/mining-config")
    @UseBefore(AuthMiddleware)
    async getMiningConfig(
        @Req() request: IRequest,
        @Res() response: Response
    ) {
        const userId = request.user.id;
        let data = [];
        const miningConfigs = await MiningConfigModel.findAll({ where: { user_id: userId } });
        if(miningConfigs && miningConfigs.length > 0) {
            // console.log(miningConfigs);
            var result: any = {};
            for(let i = 0; i < miningConfigs.length; i++) {
                result.mc_id = (<any>miningConfigs[i]).dataValues.mc_id;
                result.mc_name = (<any>miningConfigs[i]).dataValues.mc_name;
                result.mc_type = (<any>miningConfigs[i]).dataValues.mc_type;
                result.mc_pools = (<any>miningConfigs[i]).dataValues.mc_pools;
                result.mc_switching = (<any>miningConfigs[i]).dataValues.mc_switching;
                data.push((<any>miningConfigs[i]).dataValues);
                console.log((<any>miningConfigs[i]).dataValues);
                console.log('----------------------');
            }
            let body = {
                status: 200,
                message: "mining configs",
                data: data
            };
            // console.log(data)
            return response.status(200).json(body);
        } else {
            let body = {
                status: 200,
                message: "mining configs empty",
                data: []
            };
            return response.status(200).json(body);
        }
    }

    @Post("/testtoken")
    @UseBefore(AuthMiddleware)
    async testToken(
        @Req() request: IRequest,
        @Res() response: Response,
    ) {
        // console.log(request, request.user);
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
