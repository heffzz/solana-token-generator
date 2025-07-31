import { Logger } from './logger.js';

export class DescriptionGenerator {
    constructor() {
        this.logger = new Logger();
        this.initializeTemplates();
        this.initializeBuzzwords();
        this.initializeUseCases();
    }

    initializeTemplates() {
        this.templates = [
            'Un token rivoluzionario che trasforma {useCase} attraverso {feature}',
            '{name} e il futuro della {useCase} su Solana blockchain',
            'Scopri {name}: la nuova frontiera per {useCase} con {feature}',
            'Innovazione e {feature} si incontrano in {name} per {useCase}',
            '{name} porta {feature} nel mondo della {useCase}',
            'La prossima generazione di {useCase} e ora disponibile con {name}'
        ];
    }

    initializeBuzzwords() {
        this.buzzwords = {
            technology: [
                'blockchain avanzata',
                'smart contracts innovativi',
                'algoritmi di consenso',
                'crittografia quantistica',
                'protocolli DeFi',
                'tecnologia Layer 2',
                'cross-chain compatibility',
                'zero-knowledge proofs',
                'atomic swaps',
                'lightning network',
                'sharding dinamico',
                'proof of stake',
                'interoperabilita avanzata',
                'scalabilita infinita'
            ],
            finance: [
                'yield farming ottimizzato',
                'liquidity mining',
                'staking rewards',
                'governance decentralizzata',
                'treasury management',
                'risk assessment',
                'portfolio diversification',
                'automated market making',
                'flash loans',
                'synthetic assets',
                'derivatives trading',
                'margin trading',
                'lending protocols',
                'insurance pools'
            ],
            innovation: [
                'AI-powered analytics',
                'machine learning integration',
                'predictive algorithms',
                'real-time optimization',
                'adaptive protocols',
                'self-healing networks',
                'autonomous governance',
                'dynamic pricing',
                'smart routing',
                'automated rebalancing',
                'risk mitigation',
                'performance tracking',
                'behavioral analysis',
                'sentiment analysis'
            ],
            community: [
                'community-driven development',
                'decentralized governance',
                'stakeholder voting',
                'transparent roadmap',
                'open-source collaboration',
                'developer incentives',
                'bug bounty programs',
                'educational initiatives',
                'partnership ecosystem',
                'global accessibility',
                'inclusive design',
                'user empowerment',
                'collective ownership',
                'democratic decision-making'
            ]
        };
    }

    initializeUseCases() {
        this.useCases = [
            'DeFi e finanza decentralizzata',
            'NFT e arte digitale',
            'gaming e metaverso',
            'supply chain e tracciabilita',
            'identity management',
            'social media decentralizzati',
            'energy trading',
            'real estate tokenization',
            'healthcare data management',
            'education e certificazioni'
        ];
    }

    async generate(name, symbol) {
        try {
            const useCase = this.getRandomElement(this.useCases);
            const techFeature = this.getRandomElement(this.buzzwords.technology);
            const financeFeature = this.getRandomElement(this.buzzwords.finance);
            const innovationFeature = this.getRandomElement(this.buzzwords.innovation);
            const communityFeature = this.getRandomElement(this.buzzwords.community);
            
            const template = this.getRandomElement(this.templates);
            const mainDescription = template
                .replace(/{name}/g, name)
                .replace(/{useCase}/g, useCase)
                .replace(/{feature}/g, techFeature);
            
            const technicalInfo = this.generateTechnicalInfo(symbol);
            const callToAction = this.generateCallToAction(name);
            
            const features = [
                techFeature,
                financeFeature,
                innovationFeature,
                communityFeature
            ];
            
            const description = `${mainDescription}. ${technicalInfo} ${callToAction}`;
            
            this.logger.log('INFO', `Generated description for ${name} (${symbol})`);
            
            return {
                description,
                features,
                useCase,
                technicalInfo,
                callToAction,
                marketingCopy: this.generateMarketingCopy(name, symbol, features),
                socialMediaPost: this.generateSocialMediaPost(name, symbol)
            };
        } catch (error) {
            this.logger.log('ERROR', `Failed to generate description: ${error.message}`);
            return this.generateFallbackDescription(name, symbol);
        }
    }

    generateTechnicalInfo(symbol) {
        const technicalFeatures = [
            `${symbol} utilizza protocolli di sicurezza avanzati`,
            `Costruito su Solana per massime performance`,
            `Smart contracts audited e verificati`,
            `Tokenomics sostenibili e trasparenti`,
            `Integrazione cross-chain nativa`,
            `Governance decentralizzata integrata`
        ];
        
        return this.getRandomElement(technicalFeatures) + '.';
    }

    generateCallToAction(name) {
        const ctas = [
            `Unisciti alla rivoluzione ${name} oggi stesso!`,
            `Non perdere l'opportunita di far parte dell'ecosistema ${name}`,
            `Scopri il potenziale di ${name} e inizia il tuo viaggio`,
            `${name} ti aspetta: inizia ora la tua avventura`,
            `Fai parte del futuro con ${name}`,
            `${name}: dove innovazione e opportunita si incontrano`
        ];
        
        return this.getRandomElement(ctas);
    }

    generateFallbackDescription(name, symbol) {
        return `${name} (${symbol}) e un innovativo token SPL costruito su Solana che offre ` +
               `soluzioni avanzate per la DeFi. Con tecnologia all'avanguardia e ` +
               `un ecosistema in crescita, ${name} rappresenta il futuro della finanza ` +
               `decentralizzata. Unisciti alla community e scopri le infinite possibilita!`;
    }

    generateMarketingCopy(name, symbol, features = []) {
        const headlines = [
            `🚀 ${name}: Il Futuro e Qui!`,
            `💎 Scopri ${name} - La Prossima Grande Opportunita`,
            `⚡ ${name}: Velocita, Sicurezza, Innovazione`,
            `🌟 ${name} - Dove la Tecnologia Incontra l'Opportunita`,
            `🔥 ${name}: Rivoluziona il Tuo Portfolio`
        ];
        
        const headline = this.getRandomElement(headlines);
        const featureList = features.slice(0, 3).map(f => `• ${f}`).join('\n');
        
        return {
            headline,
            features: featureList,
            description: `${name} (${symbol}) rappresenta l'evoluzione della DeFi su Solana. ` +
                        `Con caratteristiche uniche e un ecosistema in rapida crescita, ` +
                        `${name} offre opportunita senza precedenti per investitori e sviluppatori.`
        };
    }

    generateSocialMediaPost(name, symbol) {
        const emojis = ['🚀', '💎', '⚡', '🌟', '🔥', '💰', '🎯', '⭐'];
        const randomEmojis = this.getRandomElements(emojis, 3).join(' ');
        
        return `${randomEmojis} Nuovo token SPL su #Solana!\n\n` +
               `${name} ($${symbol}) - Il futuro della DeFi e qui!\n\n` +
               `✅ Tecnologia avanzata\n` +
               `✅ Community-driven\n` +
               `✅ Sicurezza garantita\n\n` +
               `#DeFi #Solana #Crypto #${symbol} #Blockchain`;
    }

    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    getRandomElements(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    generateUniqueFeatures(name, symbol) {
        const allFeatures = [
            ...this.buzzwords.technology,
            ...this.buzzwords.finance,
            ...this.buzzwords.innovation,
            ...this.buzzwords.community
        ];
        
        return this.getRandomElements(allFeatures, 4);
    }
}