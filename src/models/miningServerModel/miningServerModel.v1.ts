import * as Sequelize from "sequelize";

export function setMiningServerModel(sequelize){
    const MiningServerModel = (<Sequelize.Sequelize>sequelize).define('mining_server', {
        mserver_id: {
            autoIncrement: true,
            unique: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        user_id: {
            type: Sequelize.INTEGER
        },
        os_uuid: {
            type: Sequelize.STRING(40)
        },
        miner_name: {
            type: Sequelize.STRING(50)
        },
        status: {
            type: Sequelize.STRING(50)
        },
        num_gpus: {
            type: Sequelize.INTEGER
        },
        num_asics: {
            type: Sequelize.INTEGER
        },
        os_version: {
            type: Sequelize.STRING(10)
        },
        mserver_uptime: {
            type: Sequelize.INTEGER
        },
        mining_config: {
            type: Sequelize.INTEGER
        },
        revision_time: {
            type: Sequelize.INTEGER
        },
        target_temp: {
            type: Sequelize.INTEGER
        },
        min_fanspeed: {
            type: Sequelize.INTEGER
        },
        is_deleted: {
            type: Sequelize.INTEGER  
        },
        updated: {
            type: Sequelize.INTEGER  
        }
    });  
    // MiningServerModel.hasMany(User, {foreignKey: 'user_id', sourceKey: 'user_id'});
    // MiningServerModel.hasMany(AsicDevice, {foreignKey: 'mserver_id', sourceKey: 'mserver_id'});
    return MiningServerModel;  
};