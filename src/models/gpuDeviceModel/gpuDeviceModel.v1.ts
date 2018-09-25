import * as Sequelize from "sequelize";

export function setGpuDeviceModel(sequelize){
    const GpuDeviceModel = (<Sequelize.Sequelize>sequelize).define('gpu_device', {
        gpu_id: {
            autoIncrement: true,
            unique: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        mserver_id: {
            type: Sequelize.INTEGER
        },
        gpu_make: {
            type: Sequelize.STRING(20)
        },
        gpu_model: {
            type: Sequelize.STRING(20)
        },
        gpu_clocking: {
            type: Sequelize.STRING(20)
        },
        gpu_slot: {
            type: Sequelize.STRING(10)
        },
        gpu_plimit: {
            type: Sequelize.STRING(10)
        },
        gpu_coremhz: {
            type: Sequelize.STRING(10)
        },
        gpu_memorymhz: {
            type: Sequelize.STRING(10)
        }
    });  
    return GpuDeviceModel;  
};