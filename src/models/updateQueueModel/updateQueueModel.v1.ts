import * as Sequelize from "sequelize";

export function setUpdateQueueModel(sequelize){
    const UpdateQueueModel = (<Sequelize.Sequelize>sequelize).define('update_queue', {
        id: {
            autoIncrement: true,
            unique: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        mserver_id: {
            type: Sequelize.INTEGER
        },
        boltos_function: {
            type: Sequelize.STRING(50)
        },
        boltos_payload: {
            type: Sequelize.STRING(255)
        }
    }, {
        freezeTableName: true,
        tableName: 'update_queue'
    });  
    return UpdateQueueModel;  
};