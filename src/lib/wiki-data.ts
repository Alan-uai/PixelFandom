import { serverTimestamp } from 'firebase/firestore';
import { achievementsGuideArticle } from './wiki-articles/achievements-guide';
import { auraArticle } from './wiki-articles/aura-system';
import { damageSwordsArticle } from './wiki-articles/damage-swords';
import { energyGainPerRankArticle } from './wiki-articles/energy-gain';
import { gamepassTierListArticle } from './wiki-articles/gamepass-tier-list';
import { gettingStartedArticle } from './wiki-articles/getting-started';
import { guildWarsArticle } from './wiki-articles/guild-wars';
import { howToGetStrongerArticle } from './wiki-articles/how-to-get-stronger';
import { jewelryCraftingArticle } from './wiki-articles/jewelry-crafting';
import { legendaryWeaponsArticle } from './wiki-articles/legendary-weapons';
import { levelExpArticle } from './wiki-articles/level-exp';
import { lobbyDungeonsArticle } from './wiki-articles/lobby-dungeons';
import { prestigeArticle } from './wiki-articles/prestige-system';
import { raidRequirementsArticle } from './wiki-articles/raid-requirements';
import { rankArticle } from './wiki-articles/rank-system';
import { scientificNotationArticle } from './wiki-articles/scientific-notation';
import { scythesArticle } from './wiki-articles/scythes';
import { standsArticle } from './wiki-articles/stands';
import { starChancesArticle } from './wiki-articles/star-chances';
import { swordsArticle } from './wiki-articles/swords';
import { titansArticle } from './wiki-articles/titans';
import { upgradesCostsArticle } from './wiki-articles/upgrades-costs';
import { world20RaidsArticle } from './wiki-articles/world-20-raids';
import { worldBossesArticle } from './wiki-articles/world-bosses';


export const allWikiArticles = [
    gettingStartedArticle,
    auraArticle,
    legendaryWeaponsArticle,
    guildWarsArticle,
    prestigeArticle,
    rankArticle,
    energyGainPerRankArticle,
    levelExpArticle,
    worldBossesArticle,
    swordsArticle,
    damageSwordsArticle,
    world20RaidsArticle,
    raidRequirementsArticle,
    gamepassTierListArticle,
    scientificNotationArticle,
    scythesArticle,
    titansArticle,
    standsArticle,
    howToGetStrongerArticle,
    lobbyDungeonsArticle,
    achievementsGuideArticle,
    starChancesArticle,
    upgradesCostsArticle,
    jewelryCraftingArticle,
];

// Adiciona o timestamp do servidor para cada artigo
export const articlesToSeed = allWikiArticles.map(article => ({
  ...article,
  createdAt: serverTimestamp(),
}));
