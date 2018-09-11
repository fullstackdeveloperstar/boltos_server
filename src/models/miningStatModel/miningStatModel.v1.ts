import * as Sequelize from "sequelize";

export function setMiningStatModel(sequelize){
    const MiningStatModel = (<Sequelize.Sequelize>sequelize).define('miningStat', {
        mserver_id: {
            type: Sequelize.INTEGER
        },
        mc_id: {
            type: Sequelize.INTEGER
        },
        target_graphite: {
            type: Sequelize.STRING(50)
        }
    });  
    return MiningStatModel;  
};