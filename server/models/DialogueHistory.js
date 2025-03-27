'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class DialogueHistory extends Model {
        static associate(models) {
            // Keep existing association
            DialogueHistory.belongsTo(models.GameSession, { foreignKey: 'sessionId' });

            // Add association with Character using speaker_id
            // This allows joining with characters by their character_id
            DialogueHistory.belongsTo(models.Character, {
                foreignKey: 'speaker_id',
                targetKey: 'character_id',
                as: 'character',
                constraints: false // Allow dialogues without matching characters
            });
        }
    }
    DialogueHistory.init({
        sessionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'GameSessions',
                key: 'id'
            }
        },
        // Changed to STRING to match actual usage in controllers
        // (used for "NARRATOR", "USER", and character IDs)
        speaker_id: DataTypes.STRING,
        dialogue: DataTypes.TEXT,
        timestamp: DataTypes.DATE
    }, {
        sequelize,
        modelName: 'DialogueHistory',
        // Add default scope to always include Character data with matching sessionId
        defaultScope: {
            include: [{
                model: sequelize.models.Character,
                as: 'character',
                required: false, // Don't require match (include even when null)
                where: sequelize.literal('"character"."sessionId" = "DialogueHistory"."sessionId"') // Only include characters from the same session
            }]
        }
    });
    return DialogueHistory;
};