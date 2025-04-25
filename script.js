// Game state - now with stats and buffs
const gameState = {
    player: {
        level: 1,
        exp: 0,
        expToLevel: 100,
        baseMaxHealth: 100,
        currentHealth: 100,
        gold: 100,
        inventory: [],
        activeBuffs: [],
        lives: 3, // Added Player lives
        stats: {
            strength: { value: 1, cost: 30 },     // Increases damage dealt
            health: { value: 1, cost: 30 },        // Increases max health
            charisma: { value: 1, cost: 30 },      // Increases flee chance
            intelligence: { value: 1, cost: 30 },   // Increases potion effectiveness
            durability: { value: 1, cost: 30 }      // Reduces damage taken
        },
        onFire: false, // Added onFire status
        questLog: []
    },
    enemy: null,
    battleActive: false,
    currentRound: 0,
    difficulty: 1,
    upgradingStat: null,
    bossBattle: false,
    disabledType: null,
    maxStatLevel: 10, // Added maximum stat level
    mousePosition: { x: 0, y: 0 }, // Track mouse position
    bossLevelInterval: 3, // Boss every 3 levels
    lastBossLevel: 0, // Track the last level a boss spawned
    itemLockBossInterval: 20, // Boss that locks items appears every 20 levels
    lastItemLockBossLevel: 0 // Track the last level the item lock boss spawned
};

// Game data - completely modular
const gameData = {
    enemies: [
        { name: "Goblin", health: 30, baseReward: 15, types: ['rock', 'paper', 'scissors'], icon: 'fa-skull' },
        { name: "Orc", health: 50, baseReward: 25, types: ['rock', 'paper'], icon: 'fa-skull' },
        { name: "Skeleton", health: 40, baseReward: 20, types: ['scissors', 'paper'], icon: 'fa-skull' },
        { name: "Dragon", health: 80, baseReward: 50, types: ['rock', 'paper', 'scissors'], icon: 'fa-dragon' },
        { name: "Wizard", health: 60, baseReward: 35, types: ['paper', 'scissors'], icon: 'fa-hat-wizard' }
    ],

    // Boss definitions - modular system
    bosses: [
        {
            id: 'stone_golem',
            name: "Stone Golem",
            description: "A massive creature made of living rock. Disables one attack type and resists rock damage.",
            baseHealth: 120, // Base health for scaling
            baseReward: 100,
            types: ['rock', 'paper', 'scissors'],
            icon: 'fa-gem',
            bossMechanics: {
                // Disable one random attack type
                onBattleStart: (gameState) => {
                    const types = ['rock', 'paper', 'scissors'];
                    const disabledType = types[Math.floor(Math.random() * types.length)];
                    gameState.disabledType = disabledType;

                    // Disable the button visually
                    document.querySelector(`[data-type="${disabledType}"]`).classList.add('disabled-type');

                    return `The Stone Golem's presence disables your ${disabledType} attacks!`;
                },
                // Increased damage for boss
                damageMultiplier: 1.5,
                // Boss takes reduced damage from rock attacks
                damageTakenMultiplier: (attackType) => {
                    return attackType === 'rock' ? 0.5 : 1; // 50% damage from rock
                },
                // Boss drops a rock damage buff when defeated
                onDefeat: () => {
                    return {
                        id: 'stone_shard',
                        name: "Stone Shard",
                        description: "Increases rock damage for 3 turns",
                        icon: 'fa-gem',
                        effect: {
                            type: 'buff',
                            stat: 'rockDamage',
                            amount: 0.5, // 50% increased rock damage
                            duration: 3,
                            icon: 'fa-hand-fist',
                            name: 'Rock Power'
                        }
                    };
                }
            }
        },
        {
            id: 'volcanic_fiend',
            name: "Volcanic Fiend",
            description: "A fiery demon that commands the power of lava. Periodically summons lava falls.",
            baseHealth: 150, // Base health for scaling
            baseReward: 150,
            types: ['rock', 'paper', 'scissors'],
            icon: 'fa-fire',
            bossMechanics: {
                // Lava fall mechanic
                onBattleStart: (gameState) => {
                    gameState.lavaInterval = setInterval(dropLava, 10); // Lava every 5 seconds
                    return "The Volcanic Fiend summons the fury of the volcano!";
                },
                // Increased damage for boss
                damageMultiplier: 1.7,
                // Boss takes reduced damage from paper attacks
                damageTakenMultiplier: (attackType) => {
                    return attackType === 'paper' ? 0.5 : 1; // 50% damage from paper
                },
                // Boss drops a fire damage buff when defeated
                onDefeat: () => {
                    clearInterval(gameState.lavaInterval); // Stop lava falls
                    return {
                        id: 'ember_charm',
                        name: "Ember Charm",
                        description: "Increases fire damage for 3 turns",
                        icon: 'fa-fire',
                        effect: {
                            type: 'buff',
                            stat: 'fireDamage',
                            amount: 0.5, // 50% increased fire damage
                            duration: 3,
                            icon: 'fa-fire',
                            name: 'Fire Power'
                        }
                    };
                }
            }
        },
        {
            id: 'shadow_wraith',
            name: "Shadow Wraith",
            description: "An ethereal being that drains your life force. Periodically applies a debuff.",
            baseHealth: 130, // Base health for scaling
            baseReward: 120,
            types: ['rock', 'paper', 'scissors'],
            icon: 'fa-ghost',
            bossMechanics: {
                // Debuff mechanic
                onBattleStart: (gameState) => {
                    gameState.debuffInterval = setInterval(() => applyDebuff(gameState), 7000); // Debuff every 7 seconds
                    return "The Shadow Wraith shrouds you in darkness!";
                },
                // Increased damage for boss
                damageMultiplier: 1.6,
                // Boss takes reduced damage from scissors attacks
                damageTakenMultiplier: (attackType) => {
                    return attackType === 'scissors' ? 0.5 : 1; // 50% damage from scissors
                },
                // Boss drops a shadow resistance buff when defeated
                onDefeat: () => {
                    clearInterval(gameState.debuffInterval); // Stop debuffs
                    return {
                        id: 'shadow_cloak',
                        name: "Shadow Cloak",
                        description: "Increases resistance to debuffs for 3 turns",
                        icon: 'fa-user-secret',
                        effect: {
                            type: 'buff',
                            stat: 'debuffResistance',
                            amount: 0.3, // 30% debuff resistance
                            duration: 3,
                            icon: 'fa-mask',
                            name: 'Shadow Resistance'
                        }
                    };
                }
            }
        },
        {
            id: 'item_lock_demon',
            name: "Item Lock Demon",
            description: "A powerful demon that locks your ability to use items during the battle.",
            baseHealth: 140,
            baseReward: 130,
            types: ['rock', 'paper', 'scissors'],
            icon: 'fa-key',
            bossMechanics: {
                // Lock item usage
                onBattleStart: (gameState) => {
                    gameState.itemLockActive = true;
                    elements.useItemBtn.disabled = true; // Disable the use item button
                    return "The Item Lock Demon has sealed your inventory!";
                },
                // Increased damage for boss
                damageMultiplier: 1.8,
                // Boss takes reduced damage from paper attacks
                damageTakenMultiplier: (attackType) => {
                    return attackType === 'paper' ? 0.5 : 1; // 50% damage from paper
                },
                // Boss drops an item unlock buff when defeated
                onDefeat: (gameState) => {
                    gameState.itemLockActive = false;
                    elements.useItemBtn.disabled = false; // Re-enable the use item button
                    return {
                        id: 'item_unlock_scroll',
                        name: "Item Unlock Scroll",
                        description: "Unlocks item usage for 3 battles",
                        icon: 'fa-scroll',
                        effect: {
                            type: 'buff',
                            stat: 'itemUnlock',
                            amount: 1, // Flag to indicate item unlock
                            duration: 3,
                            icon: 'fa-key',
                            name: 'Item Unlock'
                        }
                    };
                }
            }
        }
        // More bosses can be added here with different mechanics
    ],

    items: [
        // Potions
        {
            id: 'health_potion',
            name: "Health Potion",
            description: "Restores 30 health",
            icon: 'fa-potion',
            price: 30,
            effect: { type: 'heal', amount: 30 },
            tooltip: {
                title: "Health Potion",
                description: "A basic healing potion that restores a small amount of health.",
                stats: [
                    { name: "Heal Amount", value: "30 HP" },
                    { name: "Intelligence", value: "Boosts effect" }
                ]
            }
        },
        {
            id: 'greater_heal',
            name: "Greater Heal",
            description: "Restores 70 health",
            icon: 'fa-heart-circle-plus',
            price: 70,
            effect: { type: 'heal', amount: 70 },
            tooltip: {
                title: "Greater Healing Potion",
                description: "A more powerful healing potion that restores a significant amount of health.",
                stats: [
                    { name: "Heal Amount", value: "70 HP" },
                    { name: "Intelligence", value: "Boosts effect" }
                ]
            }
        },
        {
            id: 'elixir',
            name: "Elixir",
            description: "Restores full health",
            icon: 'fa-flask',
            price: 150,
            effect: { type: 'heal', amount: Infinity },
            tooltip: {
                title: "Elixir of Life",
                description: "A rare and powerful potion that completely restores your health.",
                stats: [
                    { name: "Heal Amount", value: "Full HP" },
                    { name: "Intelligence", value: "Boosts effect" }
                ]
            }
        },
        {
            id: 'shrimp',
            name: "Shrimp Fried Rice",
            description: "You tellin' me a shrimp fried this rice?",
            icon: 'fa-shrimp',
            price: 300,
            effect: { type: 'heal', amount: Infinity },
            tooltip: {
                title: "Shrimp Fried Rice",
                description: "A mysterious dish that somehow restores all your health. You tellin' me a shrimp fried this rice?",
                stats: [
                    { name: "Heal Amount", value: "Full HP" },
                    { name: "Confusion", value: "100%" }
                ]
            }
        },

        // Buff potions
        {
            id: 'strength_potion',
            name: "Strength Potion",
            description: "Boosts attack for next 2 battles",
            icon: 'fa-bolt',
            price: 50,
            effect: { type: 'buff', stat: 'damage', amount: 0.2, duration: 2, icon: 'fa-fist-raised', name: 'Strength Boost' },
            tooltip: {
                title: "Strength Potion",
                description: "Temporarily increases your attack power for the next few battles.",
                stats: [
                    { name: "Effect", value: "+20% damage" },
                    { name: "Duration", value: "2 battles" }
                ]
            }
        },
        {
            id: 'defense_potion',
            name: "Defense Potion",
            description: "Reduces damage for next 3 battles",
            icon: 'fa-shield-alt',
            price: 60,
            effect: { type: 'buff', stat: 'defense', amount: 0.3, duration: 3, icon: 'fa-shield-alt', name: 'Defense Boost' },
            tooltip: {
                title: "Defense Potion",
                description: "Temporarily reduces incoming damage for the next few battles.",
                stats: [
                    { name: "Effect", value: "+30% defense" },
                    { name: "Duration", value: "3 battles" }
                ]
            }
        },
        {
            id: 'speed_potion',
            name: "Speed Potion",
            description: "Increases flee chance for next 2 battles",
            icon: 'fa-running',
            price: 40,
            effect: { type: 'buff', stat: 'fleeChance', amount: 0.2, duration: 2, icon: 'fa-running', name: 'Speed Boost' },
            tooltip: {
                title: "Speed Potion",
                description: "Temporarily increases your chance to flee from battle.",
                stats: [
                    { name: "Effect", value: "+20% flee chance" },
                    { name: "Duration", value: "2 battles" }
                ]
            }
        },

        // Permanent items
        {
            id: 'lucky_charm',
            name: "Lucky Charm",
            description: "Increases gold drops by 50%",
            icon: 'fa-clover',
            price: 75,
            effect: { type: 'buff', stat: 'goldBonus', amount: 0.5, duration: Infinity, icon: 'fa-clover', name: 'Lucky Charm' },
            tooltip: {
                title: "Lucky Charm",
                description: "A magical charm that increases the amount of gold you find after battles.",
                stats: [
                    { name: "Effect", value: "+50% gold drops" },
                    { name: "Duration", value: "Permanent" }
                ]
            }
        },
        {
            id: 'leather_armor',
            name: "Leather Armor",
            description: "Permanent 10% damage reduction",
            icon: 'fa-vest',
            price: 100,
            effect: { type: 'buff', stat: 'armor', amount: 0.1, duration: Infinity, icon: 'fa-vest', name: 'Leather Armor' },
            tooltip: {
                title: "Leather Armor",
                description: "Basic protective gear that permanently reduces incoming damage.",
                stats: [
                    { name: "Effect", value: "+10% damage reduction" },
                    { name: "Duration", value: "Permanent" }
                ]
            }
        },
        {
            id: 'chainmail',
            name: "Chainmail",
            description: "Permanent 20% damage reduction",
            icon: 'fa-vest-patches',
            price: 200,
            effect: { type: 'buff', stat: 'armor', amount: 0.2, duration: Infinity, icon: 'fa-vest-patches', name: 'Chainmail' },
            tooltip: {
                title: "Chainmail Armor",
                description: "Strong interlocking metal rings provide excellent protection.",
                stats: [
                    { name: "Effect", value: "+20% damage reduction" },
                    { name: "Duration", value: "Permanent" }
                ]
            }
        },
        {
            id: 'plate_armor',
            name: "Plate Armor",
            description: "Permanent 30% damage reduction",
            icon: 'fa-helmet-battle',
            price: 350,
            effect: { type: 'buff', stat: 'armor', amount: 0.3, duration: Infinity, icon: 'fa-helmet-battle', name: 'Plate Armor' },
            tooltip: {
                title: "Plate Armor",
                description: "Heavy but extremely protective armor made of solid metal plates.",
                stats: [
                    { name: "Effect", value: "+30% damage reduction" },
                    { name: "Duration", value: "Permanent" }
                ]
            }
        },

        // Weapons
        {
            id: 'iron_sword',
            name: "Iron Sword",
            description: "Permanent 15% damage increase",
            icon: 'fa-sword',
            price: 120,
            effect: { type: 'buff', stat: 'weapon', amount: 0.15, duration: Infinity, icon: 'fa-sword', name: 'Iron Sword' },
            tooltip: {
                title: "Iron Sword",
                description: "A basic but reliable weapon that increases your attack power.",
                stats: [
                    { name: "Effect", value: "+15% damage" },
                    { name: "Duration", value: "Permanent" }
                ]
            }
        },
        {
            id: 'steel_sword',
            name: "Steel Sword",
            description: "Permanent 25% damage increase",
            icon: 'fa-sword-laser-alt',
            price: 250,
            effect: { type: 'buff', stat: 'weapon', amount: 0.25, duration: Infinity, icon: 'fa-sword-laser-alt', name: 'Steel Sword' },
            tooltip: {
                title: "Steel Sword",
                description: "A finely crafted weapon that significantly increases your attack power.",
                stats: [
                    { name: "Effect", value: "+25% damage" },
                    { name: "Duration", value: "Permanent" }
                ]
            }
        },

        // Utility items
        {
            id: 'healing_ring',
            name: "Healing Ring",
            description: "Heals 5% health after each battle",
            icon: 'fa-ring',
            price: 180,
            effect: { type: 'buff', stat: 'regen', amount: 0.05, duration: Infinity, icon: 'fa-ring', name: 'Healing Ring' },
            tooltip: {
                title: "Healing Ring",
                description: "A magical ring that slowly restores your health after each battle.",
                stats: [
                    { name: "Effect", value: "5% HP per battle" },
                    { name: "Duration", value: "Permanent" }
                ]
            }
        },
        {
            id: 'exp_boost',
            name: "EXP Boost",
            description: "Gain 20% more experience",
            icon: 'fa-star-sharp',
            price: 150,
            effect: { type: 'buff', stat: 'expBoost', amount: 0.2, duration: Infinity, icon: 'fa-star-sharp', name: 'EXP Boost' },
            tooltip: {
                title: "EXP Boost",
                description: "A magical artifact that increases the experience you gain from battles.",
                stats: [
                    { name: "Effect", value: "+20% EXP" },
                    { name: "Duration", value: "Permanent" }
                ]
            }
        }
    ],
    quests: [
        {
            id: 'first_steps',
            name: "First Steps",
            description: "Defeat 3 Goblins to prove your worth.",
            objective: { type: 'defeat', enemy: 'Goblin', count: 3 },
            reward: { gold: 50, item: 'health_potion' },
            status: 'inactive' // 'inactive', 'active', 'completed'
        },
        {
            id: 'clearing_the_forest',
            name: "Clearing the Forest",
            description: "Defeat 5 Orcs to help the town.",
            objective: { type: 'defeat', enemy: 'Orc', count: 5 },
            reward: { gold: 75, item: 'strength_potion' },
            status: 'inactive'
        },
        {
            id: 'healing_elixirs',
            name: "Healing Elixirs",
            description: "Find healing elixirs to help the towns people. There are 2 needed.",
            objective: { type: 'collect', item: 'elixir', count: 2 },
            reward: { gold: 150, item: 'greater_heal' },
            status: 'inactive'
        }
    ],
    npcs: [
        {
            id: 'old_man',
            name: "Old Man Jenkins",
            description: "Looks like he needs some help.",
            dialogue: {
                questOffer: "Please traveler, the goblin menace has grown bold! Would you help us by defeating a few of them?",
                afterQuestAccept: "Thank you, brave traveler! You're our only hope.",
                questInProgress: "Have you defeated the goblins yet?",
                questComplete: "You've done it! The goblins are gone. Here, take this as a reward.",
                afterQuestComplete: "Thank you so much traveler!"
            },
            questId: 'first_steps',
            freeItem: 'health_potion', // Optional: free item for finding them
            icon: 'fa-user'
        },
        {
            id: 'town_guard',
            name: "Town Guard",
            description: "Looks like he can give you a quest.",
            dialogue: {
                questOffer: "Brave traveler, we need your help. A band of orcs have set up camp nearby and are terrorizing the locals. If you could clear them out, we'd be grateful.",
                afterQuestAccept: "Thank you for your service. The town will be much safer with those orcs gone.",
                questInProgress: "Have you dealt with the orcs yet?",
                questComplete: "You've cleared out the orcs! The town is in your debt. Please, take this reward.",
                afterQuestComplete: "The town is much safer now. Thank you again."
            },
            questId: 'clearing_the_forest',
            freeItem: 'strength_potion', // Optional: free item for finding them
            icon: 'fa-shield-alt'
        },
        {
            id: 'old_woman',
            name: "Old Woman Hemily",
            description: "Help her and she may reward you.",
            dialogue: {
                questOffer: "Please brave traveler, I need your help. I need two healing elixirs for the townspeople who got sick. Would you go get them for me?",
                afterQuestAccept: "Thank you for your service. I am sure the townspeople will appreciate the help.",
                questInProgress: "Have you gotten those elixirs for me yet?",
                questComplete: "You brought those elixirs! Thank you very much. Please, take this reward.",
                afterQuestComplete: "You are a real help traveler. Thank you again."
            },
            questId: 'healing_elixirs',
            freeItem: 'greater_heal', // Optional: free item for finding them
            icon: 'fa-user'
        }
    ],

    // Rock-paper-scissors outcomes
    outcomes: {
        rock: { beats: 'scissors', loses: 'paper' },
        paper: { beats: 'rock', loses: 'scissors' },
        scissors: { beats: 'paper', loses: 'rock' }
    },

    // Damage multipliers
    damage: {
        win: 1.5,
        lose: 1.0,  // Enemy doesn't take damage when they win
        draw: 0.5   // Small damage on draw
    },

    // Enemy types and their preferred moves
    movePreferences: {
        rock: ['rock', 'rock', 'paper', 'scissors'], // More likely to choose rock
        paper: ['paper', 'paper', 'scissors', 'rock'],
        scissors: ['scissors', 'scissors', 'rock', 'paper']
    },

    // Victory and defeat effects
    effects: {
        victory: {
            playerHealth: 0,
            enemyHealth: 0,
            gold: 0,
            exp: 0,
            penaltyPercent: 0.2 // Penalty on death
        }
    },

    // Stat effects
    statEffects: {
        strength: 2,          // +2 damage per point
        health: 20,           // +20 max health per point
        charisma: 5,          // +5% flee chance per point
        intelligence: 10,     // +10% potion effectiveness per point
        durability: 3         // +3% damage reduction per point
    },

    // Base costs for stat upgrades
    statBaseCosts: {
        strength: 30,
        health: 30,
        charisma: 30,
        intelligence: 30,
        durability: 30
    },
    enemyBaseDamageRange: { //Added for more enemy variations
        min: 8,
        max: 12
    }
};

// DOM elements
const elements = {
    playerLevel: document.getElementById('playerLevel'),
    playerExp: document.getElementById('playerExp'),
    playerLives: document.getElementById('playerLives'), // Added player lives UI element
    goldAmount: document.getElementById('goldAmount'),
    playerHealth: document.getElementById('playerHealth'),
    inventory: document.getElementById('inventory'),
    activeBuffs: document.getElementById('activeBuffs'),
    playerSelection: document.getElementById('playerSelection'),
    enemySelection: document.getElementById('enemySelection'),
    battleLog: document.getElementById('battleLog'),
    enemyName: document.getElementById('enemyName'),
    enemyHealth: document.getElementById('enemyHealth'),
    enemyReward: document.getElementById('enemyReward'),
    difficultyStars: [
        document.getElementById('difficulty1'),
        document.getElementById('difficulty2'),
        document.getElementById('difficulty3'),
        document.getElementById('difficulty4'),
        document.getElementById('difficulty5'),
    ],
    strengthValue: document.getElementById('strengthValue'),
    healthValue: document.getElementById('healthValue'),
    charismaValue: document.getElementById('charismaValue'),
    intelligenceValue: document.getElementById('intelligenceValue'),
    durabilityValue: document.getElementById('durabilityValue'),
    strengthBonus: document.getElementById('strengthBonus'),
    healthBonus: document.getElementById('healthBonus'),
    charismaBonus: document.getElementById('charismaBonus'),
    intelligenceBonus: document.getElementById('intelligenceBonus'),
    durabilityBonus: document.getElementById('durabilityBonus'),
    findEnemyBtn: document.getElementById('findEnemyBtn'),
    useItemBtn: document.getElementById('useItemBtn'),
    fleeBtn: document.getElementById('fleeBtn'),
    openShopBtn: document.getElementById('openShopBtn'),
    shopModal: document.getElementById('shopModal'),
    closeShopBtn: document.getElementById('closeShopBtn'),
    shopItems: document.getElementById('shopItems'),
    itemUseModal: document.getElementById('itemUseModal'),
    closeItemUseBtn: document.getElementById('closeItemUseBtn'),
    inventoryForUse: document.getElementById('inventoryForUse'),
    upgradeModal: document.getElementById('upgradeModal'),
    closeUpgradeModalBtn: document.getElementById('closeUpgradeModalBtn'),
    confirmUpgradeBtn: document.getElementById('confirmUpgradeBtn'),
    upgradingStat: document.getElementById('upgradingStat'),
    currentStatLevel: document.getElementById('currentStatLevel'),
    upgradeCost: document.getElementById('upgradeCost'),
    deathModal: document.getElementById('deathModal'),
    respawnBtn: document.getElementById('respawnBtn'),
    victoryModal: document.getElementById('victoryModal'),
    closeVictoryModalBtn: document.getElementById('closeVictoryModalBtn'),
    victoryMessage: document.getElementById('victoryMessage'),
    bossWarning: document.getElementById('bossWarning'),
    bossWarningText: document.getElementById('bossWarningText'),
    battlePanel: document.querySelector('.bg-gray-800.rounded-lg.p-6.shadow-lg:nth-child(2)'),
    playerStats: document.getElementById('playerStats'),
    lavaContainer: document.getElementById('lavaContainer'), // Lava container
    questLog: document.getElementById('questLog'), //Add Quest Log Element
};

// Event listeners
function setupEventListeners() {
    // Battle type selection
    document.querySelectorAll('[data-type]').forEach(button => {
        button.addEventListener('click', () => {
            if (gameState.battleActive && !gameState.disabledType) {
                const type = button.getAttribute('data-type');
                playRound(type);
            } else if (gameState.battleActive && gameState.disabledType) {
                const type = button.getAttribute('data-type');
                if (type !== gameState.disabledType) {
                    playRound(type);
                }
            }
        });
    });

    // Find enemy button
    elements.findEnemyBtn.addEventListener('click', findEnemy);

    // Use item button
    elements.useItemBtn.addEventListener('click', openItemUseModal);

    // Flee button
    elements.fleeBtn.addEventListener('click', fleeBattle);

    // Shop buttons
    elements.openShopBtn.addEventListener('click', () => {
        if (!gameState.battleActive) {
            elements.shopModal.classList.remove('hidden');
            renderShopItems();
        } else {
            addToBattleLog("Can't access shop during battle!", 'text-red-400');
        }
    });

    elements.closeShopBtn.addEventListener('click', () => {
        elements.shopModal.classList.add('hidden');
    });

    elements.closeItemUseBtn.addEventListener('click', () => {
        elements.itemUseModal.classList.add('hidden');
    });

    // Upgrade stats buttons
    document.querySelectorAll('.upgrade-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const stat = e.target.getAttribute('data-stat');
            if (stat) {
                showUpgradeModal(stat);
            }
        });
    });

    elements.closeUpgradeModalBtn.addEventListener('click', () => {
        elements.upgradeModal.classList.add('hidden');
        gameState.upgradingStat = null;
    });

    elements.confirmUpgradeBtn.addEventListener('click', upgradeStat);

    // Respawn button
    elements.respawnBtn.addEventListener('click', respawnPlayer);

    // Victory modal button
    elements.closeVictoryModalBtn.addEventListener('click', () => {
        elements.victoryModal.classList.add('hidden');
    });

    // Track mouse position
    document.addEventListener('mousemove', (event) => {
        gameState.mousePosition = { x: event.clientX, y: event.clientY };
    });
}

// Initialize the game
function initGame() {
    setupEventListeners();
    updatePlayerUI();
    renderInventory();
    updatePlayerStats();
    renderActiveBuffs();
    updateDifficultyUI();
    updateStatBonuses();
    updateTooltipBonuses(); // Initialize Tooltips bonus values
    gameState.player.currentHealth = getPlayerMaxHealth(); // make currentHealth = maxhealth at beginning
    updatePlayerUI(); // must add in this update for it to work
}

// Show upgrade modal
function showUpgradeModal(stat) {
    gameState.upgradingStat = stat;
    elements.upgradingStat.textContent = stat.charAt(0).toUpperCase() + stat.slice(1);
    elements.currentStatLevel.textContent = gameState.player.stats[stat].value;
    elements.upgradeCost.textContent = gameState.player.stats[stat].cost;
    elements.upgradeModal.classList.remove('hidden');
}

// Upgrade a player stat
function upgradeStat() {
    if (!gameState.upgradingStat) return;

    const stat = gameState.upgradingStat;
    const cost = gameState.player.stats[stat].cost;

    if (gameState.player.gold >= cost && gameState.player.stats[stat].value < gameState.maxStatLevel) {
        gameState.player.gold -= cost;
        gameState.player.stats[stat].value++;

        // Calculate new cost based on base cost and current level
        const baseCost = gameData.statBaseCosts[stat];
        gameState.player.stats[stat].cost = Math.floor(baseCost * Math.pow(1.2, gameState.player.stats[stat].value - 1));

        // Apply stat effects
        if (stat === 'health') {
            // Increase max health
            const oldHealth = getPlayerMaxHealth();
            gameState.player.currentHealth += gameData.statEffects.health; // Add health on upgrade
            const newMax = getPlayerMaxHealth();

            // Ensure current health doesn't exceed new max
            if (gameState.player.currentHealth > newMax) {
                gameState.player.currentHealth = newMax;
            }

            addToBattleLog(`Max health increased from ${oldHealth} to ${newMax}!`, 'text-green-400');
        }

        // Stat upgrade animation
        const statElement = document.getElementById(`${stat}Value`);
        if (statElement) {
            statElement.classList.add('stat-pulse');
            setTimeout(() => statElement.classList.remove('stat-pulse'), 500);
        }

        addToBattleLog(`Upgraded ${stat} to level ${gameState.player.stats[stat].value}!`, 'text-blue-400');

        updatePlayerUI();
        updatePlayerStats();
        updateStatBonuses(); // Update stat bonus displays
        elements.upgradeModal.classList.add('hidden');
        gameState.upgradingStat = null;
    } else {
        if (gameState.player.stats[stat].value >= gameState.maxStatLevel) {
            addToBattleLog(`This stat is already at maximum level!`, 'text-yellow-400');
        } else {
            addToBattleLog(`Not enough gold to upgrade ${stat}!`, 'text-red-400');
        }
    }
}

// Update stat bonus displays
function updateStatBonuses() {
    elements.strengthBonus.textContent = `+${gameState.player.stats.strength.value * gameData.statEffects.strength}%`;
    elements.healthBonus.textContent = `+${gameState.player.stats.health.value * gameData.statEffects.health} HP`;
    elements.charismaBonus.textContent = `+${gameState.player.stats.charisma.value * gameData.statEffects.charisma}%`;
    elements.intelligenceBonus.textContent = `+${gameState.player.stats.intelligence.value * gameData.statEffects.intelligence}%`;
    elements.durabilityBonus.textContent = `+${gameState.player.stats.durability.value * gameData.statEffects.durability}%`;
}

// Get player's effective max health (base + health stat bonus)
function getPlayerMaxHealth() {
    return gameState.player.baseMaxHealth +
        (gameState.player.stats.health.value * gameData.statEffects.health);
}

// Get player's flee chance (base + charisma bonus)
function getFleeChance() {
    const baseChance = 0.7 - (gameState.difficulty * 0.05);
    const charismaBonus = gameState.player.stats.charisma.value * gameData.statEffects.charisma / 100;

    // Apply any flee chance buffs
    const fleeBuff = gameState.player.activeBuffs.find(buff => buff.stat === 'fleeChance');
    if (fleeBuff) {
        return Math.min(0.95, baseChance + charismaBonus + fleeBuff.amount); // Cap at 95%
    }

    return Math.min(0.95, baseChance + charismaBonus);
}

// Get damage multiplier based on strength
function getDamageMultiplier() {
    let multiplier = 1 + (gameState.player.stats.strength.value * gameData.statEffects.strength / 100);

    // Apply any damage buffs
    const damageBuff = gameState.player.activeBuffs.find(buff => buff.stat === 'damage');
    if (damageBuff) {
        multiplier += damageBuff.amount;
    }

    // Apply rock damage buff if attacking with rock
    const rockBuff = gameState.player.activeBuffs.find(buff => buff.stat === 'rockDamage');
    if (rockBuff) {
        multiplier += rockBuff.amount;
    }

    // Apply weapon buffs
    const weaponBuff = gameState.player.activeBuffs.find(buff => buff.stat === 'weapon');
    if (weaponBuff) {
        multiplier += weaponBuff.amount;
    }

    return multiplier;
}

// Get damage reduction based on durability and armor
function getDamageReduction() {
    let reduction = gameState.player.stats.durability.value * gameData.statEffects.durability / 100;

    // Apply armor buffs
    const armorBuff = gameState.player.activeBuffs.find(buff => buff.stat === 'armor');
    if (armorBuff) {
        reduction += armorBuff.amount;
    }

    // Apply defense buffs
    const defenseBuff = gameState.player.activeBuffs.find(buff => buff.stat === 'defense');
    if (defenseBuff) {
        reduction += defenseBuff.amount;
    }

    return Math.min(0.8, reduction); // Cap at 80% reduction
}

// Get a random value in enemy damage range
function getRandomEnemyDamage() {
    const min = gameData.enemyBaseDamageRange.min;
    const max = gameData.enemyBaseDamageRange.max;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get potion effectiveness multiplier based on intelligence
function getPotionEffectiveness() {
    return 1 + (gameState.player.stats.intelligence.value * gameData.statEffects.intelligence / 100);
}

// Get gold bonus from buffs
function getGoldBonus() {
    const goldBuff = gameState.player.activeBuffs.find(buff => buff.stat === 'goldBonus');
    return goldBuff ? buff.amount : 0;
}

// Get EXP bonus from buffs
function getExpBonus() {
    const expBuff = gameState.player.activeBuffs.find(buff => buff.stat === 'expBoost');
    return buff ? buff.amount : 0;
}

// Update player UI
function updatePlayerUI() {
    elements.playerLevel.textContent = gameState.player.level;
    elements.playerExp.textContent = `${gameState.player.exp}/${gameState.player.expToLevel}`;
    elements.playerLives.textContent = gameState.player.lives; //Added the lives to the update function
    elements.goldAmount.textContent = gameState.player.gold;
    elements.playerHealth.style.width =
        `${(gameState.player.currentHealth / getPlayerMaxHealth()) * 100}%`;
    updateBattleButtons(); // Update battle button states
    updateQuestLogUI(); //Update Quest log, will need to remove once a tracking mechanic is created
}

// Update player stats display
function updatePlayerStats() {
    elements.strengthValue.textContent = gameState.player.stats.strength.value;
    elements.healthValue.textContent = gameState.player.stats.health.value;
    elements.charismaValue.textContent = gameState.player.stats.charisma.value;
    elements.intelligenceValue.textContent = gameState.player.stats.intelligence.value;
    elements.durabilityValue.textContent = gameState.player.stats.durability.value;
}

// Update tool tip bonus value.
function updateTooltipBonuses() {
    elements.strengthBonus.textContent = `+${gameState.player.stats.strength.value * gameData.statEffects.strength}%`;
    elements.healthBonus.textContent = `+${gameState.player.stats.health.value * gameData.statEffects.health} HP`;
    elements.charismaBonus.textContent = `+${gameState.player.stats.charisma.value * gameData.statEffects.charisma}%`;
    elements.intelligenceBonus.textContent = `+${gameState.player.stats.intelligence.value * gameData.statEffects.intelligence}%`;
    elements.durabilityBonus.textContent = `+${gameState.player.stats.durability.value * gameData.statEffects.durability}%`;
}

// Render active buffs
function renderActiveBuffs() {
    if (gameState.player.activeBuffs.length === 0) {
        elements.activeBuffs.innerHTML = '<p class="text-center text-gray-400">No active buffs</p>';
        return;
    }

    elements.activeBuffs.innerHTML = '';
    gameState.player.activeBuffs.forEach((buff, index) => {
        const buffElement = document.createElement('div');
        buffElement.className = 'flex items-center justify-between mb-2 last:mb-0 buff-pulse';
        buffElement.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${buff.icon} mr-2 text-${getBuffColor(buff.stat)}-400"></i>
                <span>${buff.name}</span>
            </div>
            <div>
                <span class="text-xs text-gray-400">${buff.duration === Infinity ? '∞' : buff.duration + ' turns'}</span>
            </div>
        `;
        elements.activeBuffs.appendChild(buffElement);
    });
}

// Get color for buff based on stat
function getBuffColor(stat) {
    const colors = {
        damage: 'red',
        goldBonus: 'yellow',
        defense: 'blue',
        health: 'green',
        armor: 'gray',
        weapon: 'orange',
        regen: 'pink',
        expBoost: 'purple',
        fleeChance: 'teal',
        rockDamage: 'brown',
        fireDamage: 'red',
        debuffResistance: 'purple',
        itemUnlock: 'green'
    };
    return colors[stat] || 'purple';
}

// Process buffs at the end of battle
function processBuffsAfterBattle() {
    gameState.player.activeBuffs = gameState.player.activeBuffs.filter(buff => {
        if (buff.duration === Infinity) return true;
        buff.duration--;
        return buff.duration > 0;
    });

    // Apply regeneration effects
    const regenBuff = gameState.player.activeBuffs.find(buff => buff.stat === 'regen');
    if (regenBuff) {
        const healAmount = Math.floor(getPlayerMaxHealth() * regenBuff.amount);
        gameState.player.currentHealth = Math.min(
            getPlayerMaxHealth(),
            gameState.player.currentHealth + healAmount
        );
        addToBattleLog(`Regenerated ${healAmount} health from ${regenBuff.name}!`, 'text-pink-400');
    }

    renderActiveBuffs();
    updatePlayerUI();
}

// Render inventory
function renderInventory() {
    elements.inventory.innerHTML = '';

    if (gameState.player.inventory.length === 0) {
        elements.inventory.innerHTML = '<p class="text-gray-400 col-span-3 text-center">No items</p>';
        return;
    }

    gameState.player.inventory.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'bg-gray-700 rounded p-2 text-center cursor-pointer hover:bg-gray-600 transition-all';
        itemElement.innerHTML = `
            <i class="fas ${item.icon} text-xl block mb-1"></i>
            <span class="text-sm">${item.name}</span>
            <span class="text-xs text-gray-400 block">x${item.quantity}</span>
        `;
        itemElement.addEventListener('click', () => {
            // You can add functionality to use items directly from inventory
        });
        elements.inventory.appendChild(itemElement);
    });
}

// Update Quest UI in main panel
function updateQuestLogUI() {
    elements.questLog.innerHTML = '';
    if (gameState.player.questLog.length === 0) {
        elements.questLog.innerHTML = '<p class="text-center text-gray-400">No active quests</p>';
        return;
    }

    gameState.player.questLog.forEach(quest => {
        const questElement = document.createElement('div');
        questElement.className = 'mb-2 p-2 rounded bg-gray-600 last:mb-0';
        questElement.innerHTML = `
            <h4 class="font-medium">${quest.name}</h4>
            <p class="text-sm text-gray-300">${quest.description}</p>
            <p class="text-xs text-gray-400">Status: ${quest.status}</p>
        `;
        elements.questLog.appendChild(questElement);
    });
}

// NPC spawn mechanic
function findNPC() { // New NPC spawn mechanic - Corrected syntax
    const npcIndex = Math.floor(Math.random() * gameData.npcs.length);
    const npcData = gameData.npcs[npcIndex];
    interactNPC(npcData);
}

// Interact NPC
function interactNPC(npcData) {
    if (gameState.battleActive) return; // Can't interact during battle

    // Check if player already has the quest
    let quest = gameState.player.questLog.find(q => q.id === npcData.questId);

    if (!quest) { // Offer the quest
        if (confirm(`${npcData.name}: ${npcData.dialogue.questOffer}`)) {
            acceptQuest(npcData.questId);
            addToBattleLog(`Accepted quest: ${npcData.name}`, 'text-blue-400');
            alert(`${npcData.name}: ${npcData.dialogue.afterQuestAccept}`);
            //Check for free item drop at beginning
            if (npcData.freeItem) {
                addItemToInventory(npcData.freeItem);
                addToBattleLog(`Received free item at beginning of the quest: ${gameData.items.find(item => item.id === npcData.freeItem).name}!`, 'text-blue-400');
            }
        }
    } else if (quest.status === 'active') { // Check quest progress
        if (!checkQuestCompletion(quest)) {
            alert(`${npcData.name}: ${npcData.dialogue.questInProgress}`);
        } else {
            completeQuest(quest.id);
            alert(`${npcData.name}: ${npcData.dialogue.questComplete}`);
            alert(`${npcData.name}: ${npcData.dialogue.afterQuestComplete}`);
        }
    } else if (quest.status === 'completed') {
        alert(`${npcData.name}: ${npcData.dialogue.afterQuestComplete}`);
    }
}

// Accept Quest function
function acceptQuest(questId) {
    const quest = gameData.quests.find(q => q.id === questId);
    if (quest) {
        quest.status = 'active';
        gameState.player.questLog.push(quest);
        //add to the battle log
        addToBattleLog(`Accepted quest: ${quest.name}!`, 'text-blue-400');
        updateQuestLogUI();
    }
}

// Check for Quest Requirements met
function checkQuestCompletion(quest) {
    if (quest.objective.type === 'defeat') {
        //check the enemy defeated in this turn then set the status correctly
        return checkEnemyDefeatedCount(quest.objective.enemy) >= quest.objective.count;
    } else if (quest.objective.type === 'collect') {
        //check collected item count in this turn then set the status correctly
        return checkCollectedItemCount(quest.objective.item) >= quest.objective.count;
    }
    return false;
}

//helper function, returns how many of a certain enemy has been defeated
function checkEnemyDefeatedCount(enemyName) {
    //this is not tracking, it is only checking against the last battle because that is how the initial code is structured
    if (gameState.enemy && gameState.enemy.name === enemyName && gameState.enemy.currentHealth <= 0) {
        return 1;
    }
    return 0;
}
//helper function, returns how many of a certain item has been collected
function checkCollectedItemCount(itemId) {
    //this is not tracking, it is only checking against the inventory because that is how the initial code is structured
    const item = gameState.player.inventory.find(item => item.id === itemId);
    return item ? item.quantity : 0;
}

// What Happens When Completing Quest? Rewards, Status
function completeQuest(questId) {
    const quest = gameState.player.questLog.find(q => q.id === questId);
    if (quest) {
        quest.status = 'completed';
        addToBattleLog(`Completed quest: ${quest.name}!`, 'text-green-400');
        giveQuestRewards(quest);
        //remove from active list, so it can't be triggered again from start Battle
        gameState.player.questLog = gameState.player.questLog.filter(q => q.id !== questId);
        addToBattleLog(`Completed quest: ${quest.name}!`, 'text-blue-400');
        updateQuestLogUI();
    }
}

// Give the rewards upon completion
function giveQuestRewards(quest) {
    if (quest.reward.gold) {
        gameState.player.gold += quest.reward.gold;
        addToBattleLog(`Received ${quest.reward.gold} gold from quest!`, 'text-yellow-400');
    }
    if (quest.reward.item) {
        addItemToInventory(quest.reward.item);
        //get reward text
        let reward = gameData.items.find(item => item.id === quest.reward.item).name;
        addToBattleLog(`Received ${reward} from quest!`, 'text-blue-400');
    }
    updatePlayerUI(); // Update gold
}

// Find a random enemy or NPC
function findEnemy() {
    if (gameState.battleActive) return;

    // 30% chance to find NPC
    if (Math.random() < 0.3) { // 30% chance
        findNPC(); // Go to NPC spawn

        //Check if it should spawn the boss instead: This logic is repeated multiple times so it should be a helper function
    } else if (gameState.player.level >= gameState.itemLockBossInterval &&
        gameState.player.level >= gameState.lastItemLockBossLevel + gameState.itemLockBossInterval) {
        spawnSpecificBoss('item_lock_demon');
        return;

        // Check if it's time for a regular boss battle
    } else if (gameState.player.level >= gameState.bossLevelInterval &&
        gameState.player.level >= gameState.lastBossLevel + gameState.bossLevelInterval) {
        spawnRandomBoss();
    } else {
        spawnRegularEnemy();
    }
}

// Spawn a specific boss by ID
function spawnSpecificBoss(bossId) {
    const bossData = gameData.bosses.find(boss => boss.id === bossId);
    if (bossData) {
        spawnBoss(bossData);
        gameState.lastItemLockBossLevel = gameState.player.level; // Update last item lock boss level
    } else {
        console.error(`Boss with ID ${bossId} not found!`);
    }
}

// Spawn a random boss
function spawnRandomBoss() {
    if (gameState.battleActive) return;

    const bossIndex = Math.floor(Math.random() * gameData.bosses.length);
    const bossData = gameData.bosses[bossIndex];
    spawnBoss(bossData);
    gameState.lastBossLevel = gameState.player.level; // Update last boss level
}

// Spawn a regular enemy
function spawnRegularEnemy() {
    const scaleFactor = 1 + (gameState.player.level * 0.1);
    const enemyTemplate = gameData.enemies[Math.floor(Math.random() * gameData.enemies.length)];

    gameState.enemy = {
        ...enemyTemplate,
        currentHealth: Math.floor(enemyTemplate.health * scaleFactor * gameState.difficulty),
        maxHealth: Math.floor(enemyTemplate.health * scaleFactor * gameState.difficulty),
        reward: Math.floor(enemyTemplate.baseReward * scaleFactor * (1 + gameState.difficulty * 0.2) * (1 + getGoldBonus()))
    };

    startBattle(false);
}

// Spawn a boss
function spawnBoss(bossData) {
    const scaleFactor = 1 + (gameState.player.level * 0.1);

    gameState.enemy = {
        ...bossData,
        currentHealth: Math.floor(bossData.baseHealth * scaleFactor * gameState.difficulty * 1.5), // Bosses have more health
        maxHealth: Math.floor(bossData.baseHealth * scaleFactor * gameState.difficulty * 1.5),
        reward: Math.floor(bossData.baseReward * scaleFactor * (1 + gameState.difficulty * 0.3) * (1 + getGoldBonus()) * 2) // Better rewards
    };

    startBattle(true);

    // Apply boss mechanics
    if (bossData.bossMechanics && bossData.bossMechanics.onBattleStart) {
        const mechanicMessage = bossData.bossMechanics.onBattleStart(gameState);
        addToBattleLog(mechanicMessage, 'text-red-400');
    }
}

// Start a battle (regular or boss)
function startBattle(isBoss) {
    gameState.battleActive = true;
    gameState.bossBattle = isBoss;
    gameState.currentRound = 0;

    // Update enemy UI
    elements.enemyName.textContent = gameState.enemy.name;
    elements.enemyHealth.style.width = '100%';
    elements.enemyReward.textContent = `Gold: ${gameState.enemy.reward} | Exp: ${Math.floor(gameState.enemy.reward / 2)}`;

    // Show boss warning if it's a boss
    if (isBoss) {
        elements.bossWarning.classList.remove('hidden');
        elements.bossWarningText.textContent = `BOSS BATTLE: ${gameState.enemy.name.toUpperCase()}!`;
        elements.enemySelection.classList.add('boss-aura');
    } else {
        elements.bossWarning.classList.add('hidden');
        elements.enemySelection.classList.remove('boss-aura');
    }

    addToBattleLog(`Encountered ${isBoss ? 'BOSS ' : ''}${gameState.enemy.name}! (Level ${gameState.difficulty.toFixed(1)})`);

    // Update buttons
    updateBattleButtons();
}

// Play a battle round
function playRound(playerType) {
    if (!gameState.battleActive || !gameState.enemy) return;

    gameState.currentRound++;

    // Enemy chooses a type based on its preferences
    const possibleTypes = gameState.enemy.types;
    let enemyType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];

    // Set visual selections
    elements.playerSelection.innerHTML = getTypeIcon(playerType);
    elements.playerSelection.className = `w-24 h-24 flex items-center justify-center text-5xl type-box ${playerType}`;

    elements.enemySelection.innerHTML = getTypeIcon(enemyType);
    elements.enemySelection.className = `w-24 h-24 flex items-center justify-center text-5xl type-box ${enemyType} battle-animation`;

    // Determine outcome
    const outcome = determineOutcome(playerType, enemyType);

    // Calculate damage with strength modifier
    const baseDamage = 10 * gameData.damage[outcome] * (1 + gameState.player.level * 0.05);
    const playerDamage = baseDamage * getDamageMultiplier();
    let enemyDamage = 0;

    if (outcome === 'win') {
        // Player deals full damage on win
        enemyDamage = playerDamage;
    } else if (outcome === 'draw') {
        // Small damage on draw
        enemyDamage = playerDamage * 0.3;
    }

    // Apply boss damage reduction if it's a boss and has the mechanic
    if (gameState.bossBattle && gameState.enemy.bossMechanics && gameState.enemy.bossMechanics.damageTakenMultiplier) {
        const damageReduction = gameState.enemy.bossMechanics.damageTakenMultiplier(playerType);
        enemyDamage *= damageReduction;
    }

    // Bosses deal more damage
    const bossDamageMultiplier = gameState.bossBattle && gameState.enemy.bossMechanics && gameState.enemy.bossMechanics.damageMultiplier
        ? gameState.enemy.bossMechanics.damageMultiplier
        : 1;
    // Get Random Enemy Damage to increase the battle variations
    const enemyBaseDamage = getRandomEnemyDamage();
    const damageToPlayer = enemyBaseDamage * gameData.damage[getOppositeOutcome(outcome)] * gameState.difficulty * bossDamageMultiplier;
    const damageReduction = getDamageReduction();
    const reducedDamage = damageToPlayer * (1 - damageReduction);

    // Apply damage
    gameState.enemy.currentHealth -= enemyDamage;
    if (gameState.enemy.currentHealth < 0) gameState.enemy.currentHealth = 0;

    if (outcome !== 'win') { // Player takes damage unless they win
        gameState.player.currentHealth -= reducedDamage;
        if (gameState.player.currentHealth < 0) gameState.player.currentHealth = 0;
    }

    // Update UI
    elements.enemyHealth.style.width = `${(gameState.enemy.currentHealth / gameState.enemy.maxHealth) * 100}%`;
    elements.playerHealth.style.width = `${(gameState.player.currentHealth / getPlayerMaxHealth()) * 100}%`;

    // Add to battle log
    addToBattleLog(`Round ${gameState.currentRound}: You chose ${playerType} vs ${enemyType}`);

    let resultText = "";
    if (outcome === 'win') {
        resultText = `Your strength landed a critical hit for ${Math.floor(enemyDamage)} damage!`;
        addToBattleLog(resultText, 'text-green-400');


    } else if (outcome === 'lose') {
        resultText = `You took ${Math.floor(reducedDamage)} damage (${Math.floor(damageReduction * 100)}% reduced)!`;
        addToBattleLog(resultText, 'text-red-400');


    } else {
        resultText = `It's a draw! Both take reduced damage.`;
        addToBattleLog(resultText, 'text-yellow-400');

    }
    // Check for battle end
    checkBattleEnd();
    // Remove animation after delay
    setTimeout(() => {
        elements.enemySelection.classList.remove('battle-animation');
    }, 500);

    updatePlayerUI();
}

function determineOutcome(playerType, enemyType) {
    if (playerType === enemyType) return 'draw';
    if (gameData.outcomes[playerType].beats === enemyType) return 'win';
    return 'lose';
}

function getOppositeOutcome(outcome) {
    if (outcome === 'win') return 'lose';
    if (outcome === 'lose') return 'win';
    return 'draw';
}

function getTypeIcon(type) {
    const icons = {
        rock: '<i class="fas fa-hand-fist"></i>',
        paper: '<i class="fas fa-hand"></i>',
        scissors: '<i class="fas fa-hand-scissors"></i>'
    };
    return icons[type] || '<i class="fas fa-question"></i>';
}

// Check if battle should end
function checkBattleEnd() {
    if (!gameState.battleActive) return;

    if (gameState.player.currentHealth <= 0) {
        // Player loses
        addToBattleLog(`You were defeated by the ${gameState.enemy.name}!`, 'text-red-400');

        // Defeat animation
        elements.battlePanel.classList.add('defeat-flash');

        // Process buffs after battle (before respawn)
        processBuffsAfterBattle();

        showDeathScreen(); // Handles lives and respawn/game over
        return; // Important: Exit the function after player death
    }
    if (gameState.enemy.currentHealth <= 0) {
        // Player wins
        const isBossBattle = gameState.bossBattle; // Store the boss battle flag before endBattle()

        //check for active quests now, but implement tracking for better quest completion mechanic
        gameState.player.questLog.forEach(quest => {
            if (quest.status === 'active') {
                checkQuestCompletion(quest);
                completeQuest(quest.id);
            }
        })

        if (isBossBattle) {
            showVictoryScreen();
        } else {
            addToBattleLog(`You defeated the ${gameState.enemy.name}!`, 'text-green-400');

            // Victory animation
            elements.battlePanel.classList.add('victory-flash');

            // Give rewards
            const goldGain = Math.floor(gameState.enemy.reward * (1 + Math.random() * 0.2));
            const expGain = Math.floor(gameState.enemy.reward / 2 * (1 + getExpBonus()));

            gameState.player.gold += goldGain;
            gameState.player.exp += expGain;

            let monsterItem;
            if (Math.random() < 0.3) { //Guarenteed Drop
                monsterItem = gameData.items[Math.floor(Math.random() * gameData.items.length)];
            }

            if (monsterItem) {
                addItemToInventory(monsterItem.id);
                addToBattleLog(`Monster Drop - Found ${monsterItem.name}!`, 'text-blue-400');
            }

            // Check for level up
            checkLevelUp();

            // Increase difficulty slightly after win
            if (gameState.difficulty < 5) {
                gameState.difficulty += 0.2;
                updateDifficultyUI();
            }
        }

        // Process buffs after battle
        processBuffsAfterBattle();

        endBattle(); // Call endBattle() after the battle is finished
    }
}
// Check for level up
function checkLevelUp() {
    if (gameState.player.exp >= gameState.player.expToLevel) {
        gameState.player.exp -= gameState.player.expToLevel;
        gameState.player.level++;

        // Check if it's time for the item lock boss
        if (gameState.player.level >= gameState.itemLockBossInterval &&
            gameState.player.level >= gameState.lastItemLockBossLevel + gameState.itemLockBossLevel) {
            spawnSpecificBoss('item_lock_demon');
            return;
        }

        // Check if it's time for a regular boss battle
        if (gameState.player.level >= gameState.bossLevelInterval &&
            gameState.player.level >= gameState.lastBossLevel + gameState.bossLevelInterval) {
            spawnRandomBoss();
        } else {
            spawnRegularEnemy();
        }

        gameState.player.baseMaxHealth = 100 + gameState.player.level * 10;

        // Level up grants full health
        gameState.player.currentHealth = getPlayerMaxHealth();

        gameState.player.expToLevel = Math.floor(100 * (1 + gameState.player.level * 0.15));
        addToBattleLog(`Level up! You are now level ${gameState.player.level}! Stats increased!`, 'text-yellow-400');

        // Add one level to each stat on level up
        for (const stat in gameState.player.stats) {
            gameState.player.stats[stat].value++;
            // Recalculate upgrade cost on level up
            const baseCost = gameData.statBaseCosts[stat];
            gameState.player.stats[stat].cost = Math.floor(baseCost * Math.pow(1.2, gameState.player.stats[stat].value - 1));
        }
        updatePlayerStats(); // Update stat display

        updateStatBonuses(); // Update bonuses display
        updateTooltipBonuses();
    }
}

// Show victory screen (for bosses)
function showVictoryScreen() {
    elements.victoryMessage.textContent = `You defeated the ${gameState.enemy.name}!`;

    // Give boss rewards
    const goldGain = Math.floor(gameState.enemy.reward * (1 + Math.random() * 0.3));
    const expGain = Math.floor(gameState.enemy.reward / 2 * (1 + getExpBonus()));

    gameState.player.gold += goldGain;
    gameState.player.exp += expGain;

    let monsterItem;

    // Apply boss onDefeat mechanics (like dropping special items)
    if (gameState.enemy.bossMechanics && gameState.enemy.bossMechanics.onDefeat) {
        const bossDrop = gameState.enemy.bossMechanics.onDefeat(gameState);

        // Add the boss drop to player's active buffs
        if (bossDrop) {
            gameState.player.activeBuffs.push(bossDrop.effect);
            renderActiveBuffs();
            elements.victoryMessage.textContent += `\nReceived ${goldGain} gold, ${expGain} exp and ${bossDrop.name} buff!`;
            addToBattleLog(`Gained ${bossDrop.name} buff: ${bossDrop.description}`, 'text-blue-400');
        }

        // Add a free item drop upon win: boss guaranteed drop
        monsterItem = gameData.items[Math.floor(Math.random() * gameData.items.length)];
    } else {
        // Guaranteed item drop from boss
        monsterItem = gameData.items[Math.floor(Math.random() * gameData.items.length)];

        elements.victoryMessage.textContent += `\nReceived ${goldGain} gold, ${expGain} exp and ${monsterItem.name}!`;
    }

    if (monsterItem) {
        addItemToInventory(monsterItem.id);
        addToBattleLog(`Monster Drop - Found ${monsterItem.name}!`, 'text-blue-400');
    }

    // Check for level up
    checkLevelUp();

    // Increase difficulty more after boss
    if (gameState.difficulty < 5) {
        gameState.difficulty += 0.3;
        updateDifficultyUI();
    }

    elements.victoryModal.classList.remove('hidden');
}

// Show death screen
function showDeathScreen() {
    gameState.player.lives--; // Decrement lives
    if (gameState.player.lives <= 0) {
        // If no lives left, show game over message and reset the game
        elements.victoryMessage.textContent = "Game Over! You ran out of lives.";
        elements.respawnBtn.textContent = "Reset Game";
        elements.deathModal.classList.remove('hidden');
    } else {
        // Show a message indicating how many lives are left
        elements.victoryMessage.textContent = `You were defeated! Lives left: ${gameState.player.lives}`;
        elements.respawnBtn.textContent = "Respawn";
        elements.deathModal.classList.remove('hidden');
    }

    // Disable battle buttons
    updateBattleButtons();
}

// Respawn player
function respawnPlayer() {
    if (gameState.player.lives <= 0) {
        // Reset the entire game if there are no lives left
        resetGame();
    } else {
        // Apply gold penalty
        const penalty = gameData.effects.victory.penaltyPercent;
        const goldLost = Math.floor(gameState.player.gold * penalty);

        gameState.player.gold = Math.max(0, gameState.player.gold - goldLost);
        gameState.player.currentHealth = getPlayerMaxHealth();

        elements.deathModal.classList.add('hidden');

        addToBattleLog(`You lost ${goldLost} gold as a penalty for dying! Lives left: ${gameState.player.lives}`, 'text-red-400');

        // Reset the battle state
        endBattle();
        updatePlayerUI(); // Includes updateBattleButtons()
        resetBattleUI();
    }
}

// Reset the battle panel UI
function resetBattleUI() {
    elements.playerSelection.innerHTML = '<i class="fas fa-question"></i>';
    elements.enemySelection.innerHTML = '<i class="fas fa-question"></i>';
    elements.playerSelection.className = 'w-24 h-24 flex items-center justify-center text-5xl';
    elements.enemySelection.className = 'w-24 h-24 flex items-center justify-center text-5xl';
    elements.battlePanel.classList.remove('victory-flash', 'defeat-flash');
}

// Reset the entire game state
function resetGame() {
    gameState.player.level = 1;
    gameState.player.exp = 0;
    gameState.player.expToLevel = 100;
    gameState.player.baseMaxHealth = 100;
    gameState.player.currentHealth = 100; // <--- old currenthealth value
    gameState.player.currentHealth = getPlayerMaxHealth(); // <--- new value will set it to full health at beginning of game
    gameState.player.gold = 100;
    gameState.player.inventory = [];
    gameState.player.activeBuffs = [];
    gameState.player.lives = 3;
    gameState.player.stats = {
        strength: { value: 1, cost: 30 },
        health: { value: 1, cost: 30 },
        charisma: { value: 1, cost: 30 },
        intelligence: { value: 1, cost: 30 },
        durability: { value: 1, cost: 30 }
    };
    gameState.enemy = null;
    gameState.battleActive = false;
    gameState.currentRound = 0;
    gameState.difficulty = 1;
    gameState.upgradingStat = null;
    gameState.bossBattle = false;
    gameState.disabledType = null;
    gameState.player.onFire = false; // Reset onFire status
    gameState.lastBossLevel = 0; // Reset last boss level
    gameState.lastItemLockBossLevel = 0; // Reset last item lock boss level
    gameState.itemLockActive = false; // Reset item lock status
    gameState.player.questLog = []; //Reset the Quest Log

    // Reset boss aura and disable class
    elements.enemySelection.classList.remove('boss-aura');
    document.querySelectorAll('[data-type]').forEach(button => {
        button.classList.remove('disabled-type');
    });
    // Close Modal
    elements.deathModal.classList.add('hidden');
    // Reset button text
    elements.respawnBtn.textContent = "Respawn";
    // Call function for updates
    updatePlayerUI(); // Includes updateBattleButtons()
    updatePlayerStats();
    updateTooltipBonuses();
    renderInventory();
    renderActiveBuffs();
    updateDifficultyUI();
    resetBattleUI(); // Ensure battle UI is reset
    addToBattleLog("Game has been reset to level 1.", 'text-blue-400');
}

// Flee from battle (with charisma bonus)
function fleeBattle() {
    if (!gameState.battleActive) return;

    // Can't flee from boss battles
    if (gameState.bossBattle) {
        addToBattleLog("You cannot flee from a boss battle!", 'text-red-400');
        return;
    }

    const fleeChance = getFleeChance();
    const success = Math.random() < fleeChance;

    addToBattleLog(`Attempting to flee... (${Math.floor(fleeChance * 100)}% chance)`);

    if (success) {
        addToBattleLog('Your charisma helped you escape safely!', 'text-yellow-400');

        // Process buffs after battle
        processBuffsAfterBattle();

        endBattle();

        // Decrease difficulty slightly after fleeing
        if (gameState.difficulty > 1) {
            gameState.difficulty -= 0.1;
            updateDifficultyUI();
        }
    } else {
        const damage = Math.floor(15 * gameState.difficulty * (1 - getDamageReduction()));
        gameState.player.currentHealth -= damage;

        addToBattleLog(`Failed to flee! You took ${damage} damage!`, 'text-red-400');

        elements.playerHealth.style.width = `${(gameState.player.currentHealth / getPlayerMaxHealth()) * 100}%`;
        updatePlayerUI();

        // Check if player died after failed flee
        if (gameState.player.currentHealth <= 0) {
            addToBattleLog('You were defeated while trying to flee!', 'text-red-400');
            showDeathScreen();
        }
    }
}

// Update battle buttons based on the game state
function updateBattleButtons() {
    elements.findEnemyBtn.disabled = gameState.battleActive;
    elements.useItemBtn.disabled = !gameState.battleActive || gameState.itemLockActive;
    elements.fleeBtn.disabled = !gameState.battleActive;
    elements.openShopBtn.disabled = gameState.battleActive;
}

// Add message to battle log
function addToBattleLog(message, className = '') {
    const logEntry = document.createElement('p');
    logEntry.className = className;
    logEntry.textContent = message;
    elements.battleLog.appendChild(logEntry);
    elements.battleLog.scrollTop = elements.battleLog.scrollHeight;
}

// Update difficulty UI stars
function updateDifficultyUI() {
    const fullStars = Math.floor(gameState.difficulty);
    const hasHalfStar = gameState.difficulty % 1 >= 0.5;

    elements.difficultyStars.forEach((star, index) => {
        if (index < fullStars) {
            star.classList.remove('opacity-20');
        } else if (index === fullStars && hasHalfStar) {
            star.classList.remove('opacity-20');
            star.classList.add('fa-star-half-alt');
        } else {
            star.classList.add('opacity-20');
            star.classList.remove('fa-star-half-alt');
        }
    });
}

// Shop functions
function renderShopItems() {
    elements.shopItems.innerHTML = '';

    gameData.items.forEach(item => {
        const shopItem = document.createElement('div');
        shopItem.className = 'bg-gray-700 rounded p-4 flex flex-col h-full';
        shopItem.innerHTML = `
            <div class="flex items-center mb-2">
                <i class="fas ${item.icon} text-xl mr-2"></i>
                <h3 class="text-lg font-medium">${item.name}</h3>
            </div>
            <p class="text-gray-300 text-sm mb-3 flex-grow">${item.description}</p>
            <div class="flex justify-between items-center mt-auto">
                <span class="text-yellow-400 font-bold">${item.price} gold</span>
                <button class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-all buy-btn"
                        data-id="${item.id}">
                    Buy
                </button>
            </div>
        `;

        elements.shopItems.appendChild(shopItem);
    });

    document.querySelectorAll('.buy-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.target.getAttribute('data-id');
            buyItem(itemId);
        });
    });
}

function buyItem(itemId) {
    const item = gameData.items.find(i => i.id === itemId);
    if (!item) return;

    if (gameState.player.gold >= item.price) {
        gameState.player.gold -= item.price;
        addItemToInventory(item.id);
        addToBattleLog(`Purchased ${item.name} for ${item.price} gold!`, 'text-blue-400');

        updatePlayerUI();
        renderShopItems();
    } else {
        addToBattleLog('Not enough gold!', 'text-red-400'); // Use addToBattleLog for consistent messages
    }
}

function addItemToInventory(itemId) {
    const item = gameData.items.find(i => i.id === itemId);
    if (!item) return;

    // Check if this is an armor or weapon (only one can be equipped)
    if (item.effect && (item.effect.stat === 'armor' || item.effect.stat === 'weapon')) {
        // Remove any existing armor/weapon of same type
        gameState.player.activeBuffs = gameState.player.activeBuffs.filter(
            buff => buff.stat !== item.effect.stat
        );

        // Add new buff
        gameState.player.activeBuffs.push({
            ...item.effect,
            id: Date.now().toString()
        });

        renderActiveBuffs();
    }

    // For consumables, add to inventory
    if (item.effect && (item.effect.type === 'heal' || item.effect.duration !== Infinity)) {
        // Check if player already has this item
        const existingItem = gameState.player.inventory.find(i => i.id === itemId);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            gameState.player.inventory.push({
                ...item,
                quantity: 1
            });
        }
    }

    renderInventory();
}

// Item use functions
function openItemUseModal() {
    if (gameState.player.inventory.length === 0) {
        addToBattleLog("No items to use!", 'text-yellow-400');
        return;
    }
    elements.itemUseModal.classList.remove('hidden');
    renderInventoryForUse();
}
// New Implementation
function renderInventoryForUse() {
    elements.inventoryForUse.innerHTML = '';

    if (gameState.player.inventory.length === 0) {
        elements.inventoryForUse.innerHTML = '<p class="text-gray-400 col-span-3 text-center">No items to use</p>';
        return;
    }

    gameState.player.inventory.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'bg-gray-700 rounded p-3 text-center cursor-pointer hover:bg-gray-600 transition-all';
        itemElement.innerHTML = `
    <i class="fas ${item.icon} text-2xl block mb-2"></i>
    <h3 class="font-medium">${item.name}</h3>
    <p class="text-xs text-gray-300 mb-1">${item.description}</p>
    <span class="text-xs text-gray-400">x${item.quantity}</span>
`;

        itemElement.addEventListener('click', () => useItem(item.id));

        elements.inventoryForUse.appendChild(itemElement);
    });
}

function useItem(itemId) {
    const item = gameState.player.inventory.find(i => i.id === itemId);
    if (!item) return;

    if (item.effect && item.effect.type === 'heal' && gameState.player.currentHealth === getPlayerMaxHealth()) {
        addToBattleLog("You don't need healing right now!", 'text-yellow-400');
        elements.itemUseModal.classList.add('hidden');
        return;
    }
    // Apply item effect
    applyItemEffect(item);

    // Remove item from inventory
    item.quantity--;
    if (item.quantity <= 0) {
        gameState.player.inventory = gameState.player.inventory.filter(i => i.id !== itemId);
    }

    elements.itemUseModal.classList.add('hidden');
    updatePlayerUI();
    renderInventory();

    //New output for a better log
    addToBattleLog(`Used ${item.name}: ${item.description}`, 'text-purple-400');
}
//Add the upper item effect in the item modal and now it will display the item usage
function applyItemEffect(item) {
    if (!item.effect) return;

    switch (item.effect.type) {
        case 'heal':
            let healAmount;
            if (item.effect.amount === Infinity) {
                healAmount = getPlayerMaxHealth() - gameState.player.currentHealth;
            } else {
                healAmount = Math.floor(item.effect.amount * getPotionEffectiveness());
            }

            gameState.player.currentHealth = Math.min(
                getPlayerMaxHealth(),
                gameState.player.currentHealth + healAmount
            );
            addToBattleLog(`Healed for ${healAmount} health! (Intelligence boosted effect)`, 'text-green-400');
            break;

        case 'buff':
            // Apply buff to player
            applyBuff(gameState.player, item.effect)

            addToBattleLog(`Applied ${item.name} effect!`, 'text-blue-400');
            break;

        default:
            break;
    }
}
function applyBuff(target, buff) {
    // Check if the same stat buff exists and is permanent, if so, skip
    const existingBuff = target.activeBuffs.find(b => b.stat === buff.stat && b.duration === Infinity);
    if (existingBuff) {
        addToBattleLog(`${buff.name} already active!`, 'text-yellow-400');
        return;
    }

    target.activeBuffs.push({
        ...buff,
        id: Date.now().toString() // Unique ID for each buff
    });
    renderActiveBuffs();
}

// NPC spawn mechanic
function findNPC() { // New NPC spawn mechanic - Corrected syntax
    const npcIndex = Math.floor(Math.random() * gameData.npcs.length);
    const npcData = gameData.npcs[npcIndex];
    interactNPC(npcData);
}

// Interact NPC
function interactNPC(npcData) {
    if (gameState.battleActive) return; // Can't interact during battle

    // Check if player already has the quest
    let quest = gameState.player.questLog.find(q => q.id === npcData.questId);

    if (!quest) { // Offer the quest
        if (confirm(`${npcData.name}: ${npcData.dialogue.questOffer}`)) {
            acceptQuest(npcData.questId);
            addToBattleLog(`Accepted quest: ${npcData.name}`, 'text-blue-400');
            alert(`${npcData.name}: ${npcData.dialogue.afterQuestAccept}`);
            //Check for free item drop at beginning
            if (npcData.freeItem) {
                addItemToInventory(npcData.freeItem);
                addToBattleLog(`Received free item at beginning of the quest: ${gameData.items.find(item => item.id === npcData.freeItem).name}!`, 'text-blue-400');
            }
        }
    } else if (quest.status === 'active') { // Check quest progress
        if (!checkQuestCompletion(quest)) {
            alert(`${npcData.name}: ${npcData.dialogue.questInProgress}`);
        } else {
            completeQuest(quest.id);
            alert(`${npcData.name}: ${npcData.dialogue.questComplete}`);
            alert(`${npcData.name}: ${npcData.dialogue.afterQuestComplete}`);
        }
    } else if (quest.status === 'completed') {
        alert(`${npcData.name}: ${npcData.dialogue.afterQuestComplete}`);
    }
}

// Accept Quest function
function acceptQuest(questId) {
    const quest = gameData.quests.find(q => q.id === questId);
    if (quest) {
        quest.status = 'active';
        gameState.player.questLog.push(quest);
        //add to the battle log
        addToBattleLog(`Accepted quest: ${quest.name}!`, 'text-blue-400');
        updateQuestLogUI();
    }
}

// Check for Quest Requirements met
function checkQuestCompletion(quest) {
    if (quest.objective.type === 'defeat') {
        //check the enemy defeated in this turn then set the status correctly
        return checkEnemyDefeatedCount(quest.objective.enemy) >= quest.objective.count;
    } else if (quest.objective.type === 'collect') {
        //check collected item count in this turn then set the status correctly
        return checkCollectedItemCount(quest.objective.item) >= quest.objective.count;
    }
    return false;
}

//helper function, returns how many of a certain enemy has been defeated
function checkEnemyDefeatedCount(enemyName) {
    //this is not tracking, it is only checking against the last battle because that is how the initial code is structured
    if (gameState.enemy && gameState.enemy.name === enemyName && gameState.enemy.currentHealth <= 0) {
        return 1;
    }
    return 0;
}
//helper function, returns how many of a certain item has been collected
function checkCollectedItemCount(itemId) {
    //this is not tracking, it is only checking against the inventory because that is how the initial code is structured
    const item = gameState.player.inventory.find(item => item.id === itemId);
    return item ? item.quantity : 0;
}

// What Happens When Completing Quest? Rewards, Status
function completeQuest(questId) {
    const quest = gameState.player.questLog.find(q => q.id === questId);
    if (quest) {
        quest.status = 'completed';
        addToBattleLog(`Completed quest: ${quest.name}!`, 'text-green-400');
        giveQuestRewards(quest);
        //remove from active list, so it can't be triggered again from start Battle
        gameState.player.questLog = gameState.player.questLog.filter(q => q.id !== questId);
        addToBattleLog(`Completed quest: ${quest.name}!`, 'text-blue-400');
        updateQuestLogUI();
    }
}

// Give the rewards upon completion
function giveQuestRewards(quest) {
    if (quest.reward.gold) {
        gameState.player.gold += quest.reward.gold;
        addToBattleLog(`Received ${quest.reward.gold} gold from quest!`, 'text-yellow-400');
    }
    if (quest.reward.item) {
        addItemToInventory(quest.reward.item);
        //get reward text
        let reward = gameData.items.find(item => item.id === quest.reward.item).name;
        addToBattleLog(`Received ${reward} from quest!`, 'text-blue-400');
    }
    updatePlayerUI(); // Update gold
}

// Find a random enemy or NPC
function findEnemy() {
    if (gameState.battleActive) return;

    // 30% chance to find NPC
    if (Math.random() < 0.3) { // 30% chance
        findNPC(); // Go to NPC spawn

        //Check if it should spawn the boss instead: This logic is repeated multiple times so it should be a helper function
    } else if (gameState.player.level >= gameState.itemLockBossInterval &&
        gameState.player.level >= gameState.lastItemLockBossLevel + gameState.itemLockBossInterval) {
        spawnSpecificBoss('item_lock_demon');
        return;

        // Check if it's time for a regular boss battle
    } else if (gameState.player.level >= gameState.bossLevelInterval &&
        gameState.player.level >= gameState.lastBossLevel + gameState.bossLevelInterval) {
        spawnRandomBoss();
    } else {
        spawnRegularEnemy();
    }
}

// Spawn a specific boss by ID
function spawnSpecificBoss(bossId) {
    const bossData = gameData.bosses.find(boss => boss.id === bossId);
    if (bossData) {
        spawnBoss(bossData);
        gameState.lastItemLockBossLevel = gameState.player.level; // Update last item lock boss level
    } else {
        console.error(`Boss with ID ${bossId} not found!`);
    }
}

// Spawn a random boss
function spawnRandomBoss() {
    if (gameState.battleActive) return;

    const bossIndex = Math.floor(Math.random() * gameData.bosses.length);
    const bossData = gameData.bosses[bossIndex];
    spawnBoss(bossData);
    gameState.lastBossLevel = gameState.player.level; // Update last boss level
}

// Spawn a regular enemy
function spawnRegularEnemy() {
    const scaleFactor = 1 + (gameState.player.level * 0.1);
    const enemyTemplate = gameData.enemies[Math.floor(Math.random() * gameData.enemies.length)];

    gameState.enemy = {
        ...enemyTemplate,
        currentHealth: Math.floor(enemyTemplate.health * scaleFactor * gameState.difficulty),
        maxHealth: Math.floor(enemyTemplate.health * scaleFactor * gameState.difficulty),
        reward: Math.floor(enemyTemplate.baseReward * scaleFactor * (1 + gameState.difficulty * 0.2) * (1 + getGoldBonus()))
    };

    startBattle(false);
}

// Spawn a boss
function spawnBoss(bossData) {
    const scaleFactor = 1 + (gameState.player.level * 0.1);

    gameState.enemy = {
        ...bossData,
        currentHealth: Math.floor(bossData.baseHealth * scaleFactor * gameState.difficulty * 1.5), // Bosses have more health
        maxHealth: Math.floor(bossData.baseHealth * scaleFactor * gameState.difficulty * 1.5),
        reward: Math.floor(bossData.baseReward * scaleFactor * (1 + gameState.difficulty * 0.3) * (1 + getGoldBonus()) * 2) // Better rewards
    };

    startBattle(true);

    // Apply boss mechanics
    if (bossData.bossMechanics && bossData.bossMechanics.onBattleStart) {
        const mechanicMessage = bossData.bossMechanics.onBattleStart(gameState);
        addToBattleLog(mechanicMessage, 'text-red-400');
    }
}

// Start a battle (regular or boss)
function startBattle(isBoss) {
    gameState.battleActive = true;
    gameState.bossBattle = isBoss;
    gameState.currentRound = 0;

    // Update enemy UI
    elements.enemyName.textContent = gameState.enemy.name;
    elements.enemyHealth.style.width = '100%';
    elements.enemyReward.textContent = `Gold: ${gameState.enemy.reward} | Exp: ${Math.floor(gameState.enemy.reward / 2)}`;

    // Show boss warning if it's a boss
    if (isBoss) {
        elements.bossWarning.classList.remove('hidden');
        elements.bossWarningText.textContent = `BOSS BATTLE: ${gameState.enemy.name.toUpperCase()}!`;
        elements.enemySelection.classList.add('boss-aura');
    } else {
        elements.bossWarning.classList.add('hidden');
        elements.enemySelection.classList.remove('boss-aura');
    }

    addToBattleLog(`Encountered ${isBoss ? 'BOSS ' : ''}${gameState.enemy.name}! (Level ${gameState.difficulty.toFixed(1)})`);

    // Update buttons
    updateBattleButtons();
}

// Play a battle round
function playRound(playerType) {
    if (!gameState.battleActive || !gameState.enemy) return;

    gameState.currentRound++;

    // Enemy chooses a type based on its preferences
    const possibleTypes = gameState.enemy.types;
    let enemyType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];

    // Set visual selections
    elements.playerSelection.innerHTML = getTypeIcon(playerType);
    elements.playerSelection.className = `w-24 h-24 flex items-center justify-center text-5xl type-box ${playerType}`;

    elements.enemySelection.innerHTML = getTypeIcon(enemyType);
    elements.enemySelection.className = `w-24 h-24 flex items-center justify-center text-5xl type-box ${enemyType} battle-animation`;

    // Determine outcome
    const outcome = determineOutcome(playerType, enemyType);

    // Calculate damage with strength modifier
    const baseDamage = 10 * gameData.damage[outcome] * (1 + gameState.player.level * 0.05);
    const playerDamage = baseDamage * getDamageMultiplier();
    let enemyDamage = 0;

    if (outcome === 'win') {
        // Player deals full damage on win
        enemyDamage = playerDamage;
    } else if (outcome === 'draw') {
        // Small damage on draw
        enemyDamage = playerDamage * 0.3;
    }

    // Apply boss damage reduction if it's a boss and has the mechanic
    if (gameState.bossBattle && gameState.enemy.bossMechanics && gameState.enemy.bossMechanics.damageTakenMultiplier) {
        const damageReduction = gameState.enemy.bossMechanics.damageTakenMultiplier(playerType);
        enemyDamage *= damageReduction;
    }

    // Bosses deal more damage
    const bossDamageMultiplier = gameState.bossBattle && gameState.enemy.bossMechanics && gameState.enemy.bossMechanics.damageMultiplier
        ? gameState.enemy.bossMechanics.damageMultiplier
        : 1;
    // Get Random Enemy Damage to increase the battle variations
    const enemyBaseDamage = getRandomEnemyDamage();
    const damageToPlayer = enemyBaseDamage * gameData.damage[getOppositeOutcome(outcome)] * gameState.difficulty * bossDamageMultiplier;
    const damageReduction = getDamageReduction();
    const reducedDamage = damageToPlayer * (1 - damageReduction);

    // Apply damage
    gameState.enemy.currentHealth -= enemyDamage;
    if (gameState.enemy.currentHealth < 0) gameState.enemy.currentHealth = 0;

    if (outcome !== 'win') { // Player takes damage unless they win
        gameState.player.currentHealth -= reducedDamage;
        if (gameState.player.currentHealth < 0) gameState.player.currentHealth = 0;
    }

    // Update UI
    elements.enemyHealth.style.width = `${(gameState.enemy.currentHealth / gameState.enemy.maxHealth) * 100}%`;
    elements.playerHealth.style.width = `${(gameState.player.currentHealth / getPlayerMaxHealth()) * 100}%`;

    // Add to battle log
    addToBattleLog(`Round ${gameState.currentRound}: You chose ${playerType} vs ${enemyType}`);

    let resultText = "";
    if (outcome === 'win') {
        resultText = `Your strength landed a critical hit for ${Math.floor(enemyDamage)} damage!`;
        addToBattleLog(resultText, 'text-green-400');


    } else if (outcome === 'lose') {
        resultText = `You took ${Math.floor(reducedDamage)} damage (${Math.floor(damageReduction * 100)}% reduced)!`;
        addToBattleLog(resultText, 'text-red-400');


    } else {
        resultText = `It's a draw! Both take reduced damage.`;
        addToBattleLog(resultText, 'text-yellow-400');

    }
    // Check for battle end
    checkBattleEnd();
    // Remove animation after delay
    setTimeout(() => {
        elements.enemySelection.classList.remove('battle-animation');
    }, 500);

    updatePlayerUI();
}

function determineOutcome(playerType, enemyType) {
    if (playerType === enemyType) return 'draw';
    if (gameData.outcomes[playerType].beats === enemyType) return 'win';
    return 'lose';
}

function getOppositeOutcome(outcome) {
    if (outcome === 'win') return 'lose';
    if (outcome === 'lose') return 'win';
    return 'draw';
}

function getTypeIcon(type) {
    const icons = {
        rock: '<i class="fas fa-hand-fist"></i>',
        paper: '<i class="fas fa-hand"></i>',
        scissors: '<i class="fas fa-hand-scissors"></i>'
    };
    return icons[type] || '<i class="fas fa-question"></i>';
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', initGame);
