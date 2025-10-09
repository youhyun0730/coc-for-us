// 英雄ごとの装備マッピング
// 各英雄が装備できる装備を定義
const heroEquipmentMapping = {
    'Barbarian King': [
        'Barbarian Puppet',
        'Rage Vial',
        'Earthquake Boots',
        'Vampstache',
        'Giant Gauntlet',
        'Spiky Ball'
    ],
    'Archer Queen': [
        'Archer Puppet',
        'Invisible Vial',
        'Giant Arrow',
        'Healer Puppet',
        'Frozen Arrow',
        'Magic Mirror'
    ],
    'Grand Warden': [
        'Eternal Tome',
        'Life Gem',
        'Rage Gem',
        'Healing Tome',
        'Fireball',
        'Magic Orb'
    ],
    'Royal Champion': [
        'Royal Gem',
        'Seeking Shield',
        'Haste Vial',
        'Hog Rider Puppet',
        'Rocket Spear',
        'Magic Quiver'
    ],
    'Barbarian King (Korean)': [
        'Barbarian Puppet',
        'Rage Vial',
        'Earthquake Boots',
        'Vampstache',
        'Giant Gauntlet',
        'Spiky Ball'
    ],
    'Archer Queen (Korean)': [
        'Archer Puppet',
        'Invisible Vial',
        'Giant Arrow',
        'Healer Puppet',
        'Frozen Arrow',
        'Magic Mirror'
    ],
    'Grand Warden (Korean)': [
        'Eternal Tome',
        'Life Gem',
        'Rage Gem',
        'Healing Tome',
        'Fireball',
        'Magic Orb'
    ],
    'Royal Champion (Korean)': [
        'Royal Gem',
        'Seeking Shield',
        'Haste Vial',
        'Hog Rider Puppet',
        'Rocket Spear',
        'Magic Quiver'
    ],
    'Minion Prince': [
        'Henchmen Puppet',
        'Dark Orb',
        'Metal Pants',
        'Noble Iron',
        'Dark Crown',
        'Meteor Staff'
    ],
    'Minion Prince (Korean)': [
        'Henchmen Puppet',
        'Dark Orb',
        'Metal Pants',
        'Noble Iron',
        'Dark Crown',
        'Meteor Staff'
    ]
};

// 英雄名の正規化（英語名への変換）
const heroNameMapping = {
    '바바리안 킹': 'Barbarian King',
    '아처 퀸': 'Archer Queen',
    '그랜드 워든': 'Grand Warden',
    '로얄 챔피언': 'Royal Champion',
    '미니언 프린스': 'Minion Prince',
    'Barbarian King': 'Barbarian King',
    'Archer Queen': 'Archer Queen',
    'Grand Warden': 'Grand Warden',
    'Royal Champion': 'Royal Champion',
    'Minion Prince': 'Minion Prince'
};

// 装備名の正規化マッピング（APIから返される可能性のある名前のバリエーション）
const equipmentNameMapping = {
    // Barbarian King
    'Barbarian Puppet': 'Barbarian Puppet',
    '야만용사 인형': 'Barbarian Puppet',
    'Rage Vial': 'Rage Vial',
    '분노 물약': 'Rage Vial',
    'Earthquake Boots': 'Earthquake Boots',
    '지진 부츠': 'Earthquake Boots',
    'Vampstache': 'Vampstache',
    '뱀파이어 콧수염': 'Vampstache',
    'Giant Gauntlet': 'Giant Gauntlet',
    '거인 장갑': 'Giant Gauntlet',
    'Spiky Ball': 'Spiky Ball',
    '가시 공': 'Spiky Ball',

    // Archer Queen
    'Archer Puppet': 'Archer Puppet',
    '궁수 인형': 'Archer Puppet',
    'Invisible Vial': 'Invisible Vial',
    '투명화 물약': 'Invisible Vial',
    'Giant Arrow': 'Giant Arrow',
    '거대 화살': 'Giant Arrow',
    'Healer Puppet': 'Healer Puppet',
    '힐러 인형': 'Healer Puppet',
    'Frozen Arrow': 'Frozen Arrow',
    '얼음 화살': 'Frozen Arrow',
    'Magic Mirror': 'Magic Mirror',
    '마법 거울': 'Magic Mirror',

    // Grand Warden
    'Eternal Tome': 'Eternal Tome',
    '영원의 서': 'Eternal Tome',
    'Life Gem': 'Life Gem',
    '생명의 보석': 'Life Gem',
    'Rage Gem': 'Rage Gem',
    '분노의 보석': 'Rage Gem',
    'Healing Tome': 'Healing Tome',
    '치유의 서': 'Healing Tome',
    'Fireball': 'Fireball',
    '파이어볼': 'Fireball',
    'Magic Orb': 'Magic Orb',
    '마법 구슬': 'Magic Orb',

    // Royal Champion
    'Royal Gem': 'Royal Gem',
    '로얄 보석': 'Royal Gem',
    'Seeking Shield': 'Seeking Shield',
    '추적 방패': 'Seeking Shield',
    'Haste Vial': 'Haste Vial',
    '신속 물약': 'Haste Vial',
    'Hog Rider Puppet': 'Hog Rider Puppet',
    '호그 라이더 인형': 'Hog Rider Puppet',
    'Rocket Spear': 'Rocket Spear',
    '로켓 창': 'Rocket Spear',
    'Magic Quiver': 'Magic Quiver',
    '마법 화살통': 'Magic Quiver',

    // Minion Prince
    'Henchmen Puppet': 'Henchmen Puppet',
    '부하 인형': 'Henchmen Puppet',
    'Dark Orb': 'Dark Orb',
    '다크 오브': 'Dark Orb',
    '어둠의 구슬': 'Dark Orb',
    'Metal Pants': 'Metal Pants',
    '메탈 팬츠': 'Metal Pants',
    '금속 바지': 'Metal Pants',
    'Noble Iron': 'Noble Iron',
    '노블 아이언': 'Noble Iron',
    '고귀한 철': 'Noble Iron',
    'Dark Crown': 'Dark Crown',
    '다크 크라운': 'Dark Crown',
    '어둠의 왕관': 'Dark Crown',
    'Meteor Staff': 'Meteor Staff',
    '메테오 스태프': 'Meteor Staff',
    '운석 지팡이': 'Meteor Staff'
};

// 英雄に装備が属しているかをチェック
function getEquipmentForHero(heroName, allEquipment) {
    const normalizedHeroName = heroNameMapping[heroName] || heroName;
    const heroEquipmentNames = heroEquipmentMapping[normalizedHeroName] || [];

    return allEquipment.filter(equipment => {
        const normalizedEquipmentName = equipmentNameMapping[equipment.name] || equipment.name;
        return heroEquipmentNames.includes(normalizedEquipmentName);
    });
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        heroEquipmentMapping,
        heroNameMapping,
        equipmentNameMapping,
        getEquipmentForHero
    };
}
