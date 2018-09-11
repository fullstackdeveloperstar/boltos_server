import * as Sequelize from "sequelize";

export function setUserModel(sequelize){
    const UserModel = (<Sequelize.Sequelize>sequelize).define('user', {
        user_id: {
            autoIncrement: true,
            unique: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        username: {
            type: Sequelize.STRING(20),
            allowNull: false,
            defaultValue: 0
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 0
        },
        password_hash: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 0
        },
        first_name: {
            type: Sequelize.STRING(50),
            allowNull: false
        },
        last_name: {
            type: Sequelize.STRING(50),
            allowNull: false
        },
        company_name: {
            type: Sequelize.STRING,
            allowNull: true
        },
        "2fa_token": {
            type: Sequelize.STRING,
            allowNull: true
        },
        sms_phone: {
            type: Sequelize.STRING(50),
            allowNull: true
        },
        telegram_id: {
            type: Sequelize.STRING(50),
            allowNull: true
        },
        slack_id: {
            type: Sequelize.STRING(50),
            allowNull: true
        }
    });  
    return UserModel;  
};