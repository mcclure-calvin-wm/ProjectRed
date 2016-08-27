var POKEMON_SPRITES = new SpriteSheet("res/pokemon.png");
var POKEMON = [
    {id: 0},
    {id: 1, name: "BULBASAUR", stats: {hp: 45, attack: 49, defense: 49, spatk: 65, spdef: 65, speed: 45}, sprites: getSprite(0)},
    {id: 2, name: "IVYSAUR", stats: {hp: 60, attack: 62, defense: 63, spatk: 80, spdef: 80, speed: 60}, sprites: getSprite(1)},
    {id: 3, name: "VENUSAUR", stats: {hp: 80, attack: 82, defense: 83, spatk: 100, spdef: 100, speed: 80}, sprites: getSprite(2)},

    {id: 4, name: "CHARMANDER", stats: {hp: 39, attack: 52, defense: 43, spatk: 60, spdef: 50, speed: 65}, sprites: getSprite(3)},
    {id: 5, name: "CHARMELEON", stats: {hp: 58, attack: 64, defense: 58, spatk: 80, spdef: 65, speed: 80}, sprites: getSprite(4)},
    {id: 6, name: "CHARIZARD", stats: {hp: 78, attack: 84, defense: 78, spatk: 109, spdef: 85, speed: 100}, sprites: getSprite(5)},

    {id: 7, name: "SQUIRTLE", stats: {hp: 44, attack: 48, defense: 65, spatk: 50, spdef: 64, speed: 43}, sprites: getSprite(6)},
    {id: 8, name: "WARTORTLE", stats: {hp: 59, attack: 63, defense: 80, spatk: 65, spdef: 80, speed: 58}, sprites: getSprite(7)},
    {id: 9, name: "BLASTOISE", stats: {hp: 79, attack: 83, defense: 100, spatk: 85, spdef: 105, speed: 78}, sprites: getSprite(8)}
];


var NATURES = [
    {id: 0, name: "HARDY", attack: 1.0, defense: 1.0, spatk: 1.0, spdef: 1.0, speed: 1.0},
    {id: 1, name: "LONELY", attack: 1.1, defense: 0.9, spatk: 1.0, spdef: 1.0, speed: 1.0},
    {id: 2, name: "BRAVE", attack: 1.1, defense: 1.0, spatk: 1.0, spdef: 1.0, speed: 0.9},
    {id: 3, name: "ADAMANT", attack: 1.1, defense: 1.0, spatk: 0.9, spdef: 1.0, speed: 1.0},
    {id: 4, name: "NAUGHTY", attack: 1.1, defense: 1.0, spatk: 1.0, spdef: 0.9, speed: 1.0},

    {id: 5, name: "BOLD", attack: 0.9, defense: 1.1, spatk: 1.0, spdef: 1.0, speed: 1.0},
    {id: 6, name: "DOCILE", attack: 1.0, defense: 1.0, spatk: 1.0, spdef: 1.0, speed: 1.0},
    {id: 7, name: "RELAXED", attack: 1.0, defense: 1.1, spatk: 1.0, spdef: 1.0, speed: 0.9},
    {id: 8, name: "IMPISH", attack: 1.0, defense: 1.1, spatk: 0.9, spdef: 1.0, speed: 1.0},
    {id: 9, name: "LAX", attack: 1.0, defense: 1.1, spatk: 1.0, spdef: 0.9, speed: 1.0},

    {id: 10, name: "TIMID", attack: 0.9, defense: 1.0, spatk: 1.0, spdef: 1.0, speed: 1.1},
    {id: 11, name: "HASTY", attack: 1.0, defense: 0.9, spatk: 1.0, spdef: 1.0, speed: 1.1},
    {id: 12, name: "SERIOUS", attack: 1.0, defense: 1.0, spatk: 1.0, spdef: 1.0, speed: 1.0},
    {id: 13, name: "JOLLY", attack: 1.0, defense: 1.0, spatk: 0.9, spdef: 1.0, speed: 1.1},
    {id: 14, name: "NAIVE", attack: 1.0, defense: 1.0, spatk: 1.0, spdef: 0.9, speed: 1.1},

    {id: 15, name: "MODEST", attack: 0.9, defense: 1.0, spatk: 1.1, spdef: 1.0, speed: 1.0},
    {id: 16, name: "MILD", attack: 1.0, defense: 0.9, spatk: 1.1, spdef: 1.0, speed: 1.0},
    {id: 17, name: "QUIET", attack: 1.0, defense: 1.0, spatk: 1.1, spdef: 1.0, speed: 0.9},
    {id: 18, name: "BASHFUL", attack: 1.0, defense: 1.0, spatk: 1.0, spdef: 1.0, speed: 1.0},
    {id: 19, name: "RASH", attack: 1.0, defense: 1.0, spatk: 1.1, spdef: 0.9, speed: 1.0},

    {id: 20, name: "CALM", attack: 0.9, defense: 1.0, spatk: 1.0, spdef: 1.1, speed: 1.0},
    {id: 21, name: "GENTLE", attack: 1.0, defense: 0.9, spatk: 1.0, spdef: 1.1, speed: 1.0},
    {id: 22, name: "SASSY", attack: 1.0, defense: 1.0, spatk: 1.0, spdef: 1.1, speed: 0.9},
    {id: 23, name: "CAREFUL", attack: 1.0, defense: 1.0, spatk: 0.9, spdef: 1.1, speed: 1.0},
    {id: 24, name: "QUIRKY", attack: 1.0, defense: 1.0, spatk: 1.0, spdef: 1.0, speed: 1.0}
];

function getSprite(id) {
    return {front: new Sprite(POKEMON_SPRITES, 160 * id, 64 * 0, 64, 64), back: new Sprite(POKEMON_SPRITES, 160 * id + 64, 64 * 0, 64, 64), male: new Sprite(POKEMON_SPRITES, 160 * id + 128, 16 * 0, 32, 32), female: new Sprite(POKEMON_SPRITES, 160 * id + 128, 64 * 0 + 32, 32, 32)};
}