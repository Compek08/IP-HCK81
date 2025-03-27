'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Character extends Model {
        static associate(models) {
            // Define association with GameSession
            Character.belongsTo(models.GameSession, { foreignKey: 'sessionId' });

            // Define relationship - one character can have many dialogue entries
            Character.hasMany(models.DialogueHistory, {
                foreignKey: 'speaker_id',
                sourceKey: 'character_id',
                as: 'dialogues',
                constraints: false // Match the constraints setting in DialogueHistory
            });
        }
    }
    Character.init({
        character_id: DataTypes.STRING,
        name: DataTypes.STRING,
        short_description: DataTypes.TEXT,
        personality_traits: DataTypes.ARRAY(DataTypes.STRING),
        relationship_to_user: DataTypes.STRING,
        current_emotional_state: DataTypes.STRING,
        goals_in_scene: DataTypes.ARRAY(DataTypes.STRING),
        speaking_style: DataTypes.TEXT,
        hidden_information: DataTypes.TEXT,
        power_level: DataTypes.STRING,
        faction: DataTypes.STRING,
        perceived_threat_level_of_user: DataTypes.STRING,
        sessionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'GameSessions',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'Character',
    });
    return Character;
};