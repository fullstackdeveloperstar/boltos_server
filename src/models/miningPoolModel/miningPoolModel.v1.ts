import * as Sequelize from "sequelize";

export function setMiningPoolModel(sequelize){
    const MiningPoolModel = (<Sequelize.Sequelize>sequelize).define('mining_pool', {
        mp_id: {
            autoIncrement: true,
            unique: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        user_id: {
            type: Sequelize.INTEGER
        },
        mp_name: {
            type: Sequelize.STRING(50)
        },
        mp_currency: {
            type: Sequelize.STRING(50)
        },
        mp_stratum_url: {
            type: Sequelize.STRING(512)
        },
        mp_username: {
            type: Sequelize.STRING(256)
        },
        mp_password: {
            type: Sequelize.STRING(30)
        }
    });  
    return MiningPoolModel;  
};