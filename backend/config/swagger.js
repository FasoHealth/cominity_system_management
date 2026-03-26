/**
 * backend/config/swagger.js
 * Configuration de la documentation Swagger pour Community Security Alert
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Community Security Alert API',
            version: '1.0.0',
            description: 'Documentation complète et professionnelle de l\'API Community Security Alert pour la gestion des incidents sécuritaires au Burkina Faso.',
            contact: {
                name: 'CS27 Groupe 16',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
                description: 'Serveur de développement local',
            },
            {
                url: 'https://security-alert-backend.onrender.com/api',
                description: 'Serveur de production',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Entrez votre token JWT pour accéder aux routes protégées.',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f16df1a00155b9e7b' },
                        name: { type: 'string', example: 'Juda Ouattara' },
                        email: { type: 'string', example: 'juda@example.com' },
                        role: { type: 'string', enum: ['citizen', 'admin'], example: 'citizen' },
                        phone: { type: 'string', example: '+22601020304' },
                        isActive: { type: 'boolean', example: true },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Incident: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f16df1a00155b9e7c' },
                        title: { type: 'string', example: 'Vol de moto' },
                        description: { type: 'string', example: 'Une moto a été volée près du marché central.' },
                        category: { type: 'string', enum: ['theft', 'assault', 'vandalism', 'suspicious_activity', 'fire', 'kidnapping', 'other'], example: 'theft' },
                        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], example: 'high' },
                        status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'resolved'], example: 'pending' },
                        location: {
                            type: 'object',
                            properties: {
                                address: { type: 'string', example: 'Koudougou, Burkina Faso' },
                                city: { type: 'string', example: 'Koudougou' },
                                coordinates: {
                                    type: 'object',
                                    properties: {
                                        type: { type: 'string', example: 'Point' },
                                        coordinates: { type: 'array', items: { type: 'number' }, example: [-1.5332, 12.3647] }
                                    }
                                }
                            }
                        },
                        images: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    filename: { type: 'string' },
                                    path: { type: 'string' }
                                }
                            }
                        },
                        reportedBy: { $ref: '#/components/schemas/User' },
                        moderationNote: { type: 'string', example: 'Incident vérifié.' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Notification: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '60d0fe4f16df1a00155b9e7d' },
                        recipient: { type: 'string', example: '60d0fe4f16df1a00155b9e7b' },
                        message: { type: 'string', example: 'Votre signalement a été approuvé.' },
                        type: { type: 'string', enum: ['signalement_approuve', 'signalement_rejete', 'nouveau_incident'], example: 'signalement_approuve' },
                        isRead: { type: 'boolean', example: false },
                        incident: { type: 'string', example: '60d0fe4f16df1a00155b9e7c' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Erreur interne du serveur.' },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
