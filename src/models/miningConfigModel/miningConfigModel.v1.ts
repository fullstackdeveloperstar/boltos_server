import * as Sequelize from "sequelize";

export function setMiningConfigModel(sequelize) {
    const MiningConfigModel = (<Sequelize.Sequelize>sequelize).define('mining_config', {
        mc_id: {
            autoIncrement: true,
            unique: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        user_id: {
            type: Sequelize.INTEGER
        },
        mc_name: {
            type: Sequelize.STRING(20)
        },
        mc_type: {
            type: Sequelize.INTEGER
        },
        mc_pools: {
            type: Sequelize.STRING(50)
        },
        mc_switching: {
            type: Sequelize.INTEGER
        },
        is_deleted: {
            type: Sequelize.INTEGER  
        }
    }, {
            freezeTableName: true,
            tableName: 'mining_config'
        });
    return MiningConfigModel;
};