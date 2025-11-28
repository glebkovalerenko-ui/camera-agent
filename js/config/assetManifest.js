export const assets = {
  sprites: {
    player: './sprites/player.png',
    alien: './sprites/alien1.png',
    // Если логотипов нет физически - закомментируй эти строчки, иначе будет ошибка в консоли
    logoRu: './sprites/logo_ru.png',
    logoEn: './sprites/logo_en.png'
  },
  // Строгий список фонов. Файлы 1.png ... 10.png ДОЛЖНЫ лежать в папке backgrounds
  backgrounds: [
    './backgrounds/1.png',
    './backgrounds/3.png',
    './backgrounds/4.png',
    './backgrounds/5.png',
    './backgrounds/6.png',
    './backgrounds/7.png',
    './backgrounds/8.png',
    './backgrounds/9.png',
    './backgrounds/10.png'
  ],
  audio: {
    sfx: {
      laser: './audio/player-shoot.mp3',
      explosion: './audio/explosion.mp3',
      alienLaser: './audio/alien-shoot.mp3',
      playerHit: './audio/player-hit.mp3'
    },
    music: {
      menu: './audio/xeno-war.mp3',
      game: [
        './audio/music/game1.mp3',
        './audio/music/game2.mp3'
      ]
    }
  }
};

export default assets;