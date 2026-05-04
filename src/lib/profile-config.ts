import { Flame, Shield, PawPrint, Swords, User, Wallet, Star, Pyramid, Trophy, ShieldCheck, Users, Zap, Gem } from 'lucide-react';

export const profileCategories = [
    { name: 'Poderes', icon: Flame, description: 'Seus poderes de gacha e progressão.', subcollectionName: 'powers', isInteractiveGrid: true },
    { name: 'Lutadores', icon: Users, description: 'Seus Titãs, Stands e Shadows.', subcollectionName: 'fighters', isFighterSlots: true },
    { name: 'Armas', icon: Swords, description: 'Espadas e foices com seus encantamentos.', subcollectionName: 'weapons', isWeaponSlots: true },
    { name: 'Jóias', icon: Gem, description: 'Seus braceletes e os bônus de conjunto.', subcollectionName: 'jewelry', isJewelrySlots: true },
    { name: 'Auras', icon: Zap, description: 'Auras de chefe e outros buffs.', subcollectionName: 'auras', isInteractiveGrid: true },
    { name: 'Pets', icon: PawPrint, description: 'Seus companheiros e seus bônus.', subcollectionName: 'pets', isInteractiveGrid: true },
    { name: 'Acessórios', icon: User, description: 'Chapéus, capas e outros itens de vestuário.', subcollectionName: 'accessories', isInteractiveGrid: true },
    { name: 'Gamepasses', icon: Wallet, description: 'Gamepasses que você possui.', subcollectionName: 'gamepasses', isInteractiveGrid: true },
    { name: 'Index', icon: Star, description: 'Tiers de avatares e pets.', subcollectionName: 'index', disableItemUpload: true },
    { name: 'Obeliscos', icon: Pyramid, description: 'Seu progresso nos obeliscos de poder.', subcollectionName: 'obelisks', disableItemUpload: true },
    { name: 'Conquistas', icon: Trophy, description: 'Calcule seus bônus de conquistas.', subcollectionName: 'achievements', disableItemUpload: true },
    { name: 'Rank', icon: ShieldCheck, description: 'Seu rank atual no jogo.', subcollectionName: 'rank', disableItemUpload: true },
];
