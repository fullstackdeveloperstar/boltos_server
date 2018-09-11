import * as Sequelize from "sequelize";

export function setAsicDeviceModel(sequelize){
    const AsicDeviceModel = (<Sequelize.Sequelize>sequelize).define('asicDevice', {
        asic_id: {
            autoIncrement: true,
            unique: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        mserver_id: {
            type: Sequelize.INTEGER
        },
        asic_make: {
            type: Sequelize.STRING(20)
        },
        asic_model: {
            type: Sequelize.STRING(20)
        },
        asic_config: {
            type: Sequelize.STRING(50)
        },
        conn_ip: {
            type: Sequelize.STRING(50)
        }
    });  
    return AsicDeviceModel;  
};