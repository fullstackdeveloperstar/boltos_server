import * as Sequelize from "sequelize";

export function setGpuOcListModel(sequelize){
    const GpuOcListModel = (<Sequelize.Sequelize>sequelize).define('gpuOcList', {
        gpu_oc_id: {
            autoIncrement: true,
            unique: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        gpu_make: {
            type: Sequelize.STRING(50)
        },
        gpu_model: {
            type: Sequelize.STRING(50)
        },
        overclock: {
            type: Sequelize.STRING(1)
        },
        gpu_clocking: {
            type: Sequelize.STRING(50)
        }
    });  
    return GpuOcListModel;  
};