// 英雄ごとの装備マッピング
// 各英雄が装備できる装備を定義
const heroEquipmentMapping = {
    'Barbarian King': [
        'Barbarian Puppet',
        'Rage Vial',
        'Earthquake Boots',
        'Vampstache',
        'Giant Gauntlet',
        'Spiky Ball',
        'Snake Bracelet'
    ],
    'Archer Queen': [
        'Archer Puppet',
        'Invisibility Vial',
        'Giant Arrow',
        'Healer Puppet',
        'Frozen Arrow',
        'Magic Mirror',
        'Action Figure'
    ],
    'Grand Warden': [
        'Eternal Tome',
        'Life Gem',
        'Rage Gem',
        'Healing Tome',
        'Fireball',
        'Lavaloon Puppet',
        'Heroic Torch'
    ],
    'Royal Champion': [
        'Royal Gem',
        'Seeking Shield',
        'Hog Rider Puppet',
        'Haste Vial',
        'Rocket Spear',
        'Electro Boots'
    ],
    'Minion Prince': [
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
};

// 装備名の正規化マッピング（APIから返される可能性のある名前のバリエーション）
const equipmentNameMapping = {
    // Barbarian King
    '바바리안 인형': 'Barbarian Puppet',
    '분노 마법 병': 'Rage Vial',
    '지진 부츠': 'Earthquake Boots',
    '흡혈 수염': 'Vampstache',
    '자이언트 건틀릿': 'Giant Gauntlet',
    '스파이키 볼': 'Spiky Ball',
    '뱀 팔찌': 'Snake Bracelet',

    // Archer Queen
    '아처 인형': 'Archer Puppet',
    '투명 마법 병': 'Invisibility Vial',
    '자이언트 화살': 'Giant Arrow',
    '힐러 인형': 'Healer Puppet',
    '얼음 화살': 'Frozen Arrow',
    '마법 반사경': 'Magic Mirror',
    '액션 피규어': 'Action Figure',

    // Grand Warden
    '영원의 책': 'Eternal Tome',
    '생명의 보석': 'Life Gem',
    '분노의 보석': 'Rage Gem',
    '치유의 책': 'Healing Tome',
    '파이어볼': 'Fireball',
    '라벌 인형': 'Lavaloon Puppet',

    // Royal Champion
    '로얄 보석': 'Royal Gem',
    '추적 방패': 'Seeking Shield',
    '신속 마법 병': 'Haste Vial',
    '호그 라이더 인형': 'Hog Rider Puppet',
    '로켓 창': 'Rocket Spear',
    '일렉트로 부츠': 'Electro Boots',

    // Minion Prince
    '보디가드 인형': 'Henchmen Puppet',
    '다크 오브': 'Dark Orb',
    '메탈 바지': 'Metal Pants',
    '노블 아이언': 'Noble Iron',
    '다크 크라운': 'Dark Crown',
    '메테오 스태프': 'Meteor Staff'
};

// 英雄に装備が属しているかをチェック
function getEquipmentForHero(heroName, allEquipment) {
    const normalizedHeroName = heroNameMapping[heroName] || heroName;
    const heroEquipmentNames = heroEquipmentMapping[normalizedHeroName] || [];

    return allEquipment.filter(equipment => {
            const normalizedEquipmentName = equipmentNameMapping[equipment.name] || equipment.name;
            return heroEquipmentNames.includes(normalizedEquipmentName);
        })
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        heroEquipmentMapping,
        heroNameMapping,
        equipmentNameMapping,
        getEquipmentForHero
    };
}
