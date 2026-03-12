const mongoose = require('mongoose');
require('dotenv').config();
const Guide = require('../models/Guide');

const guides = [
    {
        category: 'assault',
        title: 'Ce qu\'il faut faire en cas d\'agression',
        content: 'Gardez votre calme et essayez de mémoriser les détails de l\'agresseur.',
        doList: [
            'Mettez-vous en sécurité immédiatement',
            'Demandez de l\'aide aux passants, faites du bruit',
            'Notez mentalement ou photographiez la description physique ou le véhicule'
        ],
        dontList: [
            'Ne résistez pas avec violence si l\'agresseur est armé',
            'Ne lavez pas vos vêtements (essentiel pour l\'examen ADN)',
            'Ne manipulez pas les scellés potentiels de la scène'
        ],
        emergencyNumber: '17'
    },
    {
        category: 'fire',
        title: 'Face à un incendie',
        content: 'Éloignez-vous du feu et alertez les urgences sans tarder.',
        doList: [
            'Évacuez immédiatement le bâtiment',
            'Fermez les portes derrière vous pour ralentir la propagation',
            'Baissez-vous en dessous des fumées pour respirer'
        ],
        dontList: [
            'N\'utilisez JAMAIS l\'ascenseur',
            'Ne touchez pas les poignées de portes si elles sont brûlantes',
            'Ne retournez jamais récupérer des biens personnels en cours d\'évacuation'
        ],
        emergencyNumber: '18'
    },
    {
        category: 'kidnapping',
        title: 'Faire face à un enlèvement',
        content: 'Sécurisez la zone et appelez les secours avant toute manipulation de blessé.',
        doList: [
            'Protégez les lieux avec les signaux visuels (triangle, gilet)',
            'Bilan rapide : vérifiez si la victime parle et respire',
            'Appelez le 15, ou bien le 112, avec calme et précision sur l\'adresse'
        ],
        dontList: [
            'Ne JAMAIS retirer le casque d\'un motard blessé',
            'Ne déplacez pas un blessé de la route (sauf risque d\'explosion instantanée)',
            'Ne donnez ni à boire ni à manger (risque chirurgical ou fausse route)'
        ],
        emergencyNumber: '15'
    },
    {
        category: 'suspicious_activity',
        title: 'Cambriolage ou attitude suspecte',
        content: 'Restez vigilant et ne vous mettez pas en danger.',
        doList: [
            'Observez discrètement les comportements',
            'Enfermez-vous en sécurité si possible',
            'Verrouillez l\'accès et informez immédiatement la Police'
        ],
        dontList: [
            'N\'intervenez en aucun cas physiquement',
            'Ne touchez à rien si une infraction a déjà eu lieu pour ne pas gâcher les traces',
            'Ne vous mettez pas dans le champ de vision ou en danger'
        ],
        emergencyNumber: '17'
    }
];

const seedGuides = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/community_security_alert';
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connexion MongoDB réussie (Seed)');

        await Guide.deleteMany();
        console.log('🗑️  Anciens guides supprimés');

        await Guide.insertMany(guides);
        console.log('🌱 Nouveaux guides insérés avec succès');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur Seed :', error);
        process.exit(1);
    }
};

seedGuides();
