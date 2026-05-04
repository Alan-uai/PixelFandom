
export interface Gamepass {
    id: string;
    name: string;
    category: 'Energia' | 'Dano' | 'Utilidade';
    bonus_type: 'energy' | 'damage' | 'exp' | 'coins' | 'luck' | null;
    bonus_value: number | null;
    description: string;
}

export const allGamepasses: Gamepass[] = [
    // Energia
    { id: 'double-energy', name: 'Double Energy', category: 'Energia', bonus_type: 'energy', bonus_value: 2, description: "Dobra sua energia ganha." },
    { id: 'fast-click', name: 'Fast Click', category: 'Energia', bonus_type: null, bonus_value: null, description: "Aumenta a velocidade de clique para 4/s." },
    { id: 'more-equips', name: 'More Equips', category: 'Energia', bonus_type: null, bonus_value: null, description: "+3 espaços para equipar pets." },
    { id: 'extra-champions-equips', name: 'Extra Champions Equips', category: 'Energia', bonus_type: null, bonus_value: null, description: "+2 espaços para equipar campeões." },
    { id: 'vip', name: 'Vip', category: 'Energia', bonus_type: 'energy', bonus_value: 1.25, description: "Vários bônus, incluindo 1.25x energia." },

    // Dano
    { id: 'double-damage', name: 'Double Damage', category: 'Dano', bonus_type: 'damage', bonus_value: 2, description: "Dobra seu dano." },
    { id: 'double-weapon', name: 'Double Weapon', category: 'Dano', bonus_type: null, bonus_value: null, description: "Permite equipar duas armas." },
    { id: 'triple-weapon', name: 'Triple Weapon', category: 'Dano', bonus_type: null, bonus_value: null, description: "Permite equipar três armas." },
    { id: 'extra-titan', name: 'Extra Titan', category: 'Dano', bonus_type: null, bonus_value: null, description: "+1 espaço para equipar titã." },
    { id: 'extra-stand', name: 'Extra Stand', category: 'Dano', bonus_type: null, bonus_value: null, description: "+1 espaço para equipar stand." },
    { id: 'extra-shadow', name: 'Extra Shadow', category: 'Dano', bonus_type: null, bonus_value: null, description: "+1 espaço para equipar sombra (dano ou energia)." },

    // Utilidade
    { id: 'fast-roll', name: 'Fast Roll', category: 'Utilidade', bonus_type: null, bonus_value: null, description: "Rola poderes 10x mais rápido." },
    { id: 'fast-star', name: 'Fast Star', category: 'Utilidade', bonus_type: null, bonus_value: null, description: "Abre estrelas mais rápido." },
    { id: 'double-souls', name: 'Double Souls', category: 'Utilidade', bonus_type: null, bonus_value: null, description: "Dobra as almas ganhas." },
    { id: 'double-coins', name: 'Double Coins', category: 'Utilidade', bonus_type: 'coins', bonus_value: 2, description: "Dobra as moedas ganhas." },
    { id: 'remote-access', name: 'Remote Access', category: 'Utilidade', bonus_type: null, bonus_value: null, description: "Acesso remoto a várias funções." },
    { id: 'double-exp', name: 'Double Exp', category: 'Utilidade', bonus_type: 'exp', bonus_value: 2, description: "Dobra a EXP ganha." },
    { id: 'double-aura', name: 'Double Aura', category: 'Utilidade', bonus_type: null, bonus_value: null, description: "Permite equipar duas auras simultaneamente." },
    { id: 'plus-2-gacha', name: '+2 Gacha', category: 'Utilidade', bonus_type: null, bonus_value: null, description: "Permite rolar 2 poderes adicionais de uma vez." },
    { id: 'plus-5-star-open', name: '+5 Star Open', category: 'Utilidade', bonus_type: null, bonus_value: null, description: "Permite abrir 5 estrelas de pet de uma vez." },
    { id: 'super-luck', name: 'Super Luck', category: 'Utilidade', bonus_type: 'luck', bonus_value: 0.25, description: "Aumenta a sorte em 25%." },
    { id: 'extra-luck', name: 'Extra Luck', category: 'Utilidade', bonus_type: 'luck', bonus_value: 0.15, description: "Aumenta a sorte em 15%." },
    { id: 'lucky', name: 'Lucky', category: 'Utilidade', bonus_type: 'luck', bonus_value: 0.10, description: "Aumenta a sorte em 10%." },
    { id: 'plus-10-backpack', name: '+10 Backpack Space', category: 'Utilidade', bonus_type: null, bonus_value: null, description: "Aumenta o espaço do inventário em 10." },
    { id: 'plus-20-backpack', name: '+20 Backpack Space', category: 'Utilidade', bonus_type: null, bonus_value: null, description: "Aumenta o espaço do inventário em 20." }
];
