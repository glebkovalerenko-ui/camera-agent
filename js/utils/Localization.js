// js/utils/Localization.js

const dictionary = {
    en: {
        gameTitle: "Camera Agent: Toilet War",
        pressStart: "TAP TO START MISSION",
        gameOver: "MISSION FAILED",
        finalScore: "ENEMIES FLUSHED",
        highScore: "TOP AGENT",
        scoreHUD: "SCORE",
        livesHUD: "CAMERAS",
        highScoreHUD: "BEST",
        loading: "CONNECTING TO HQ...",
        bootSystem: "SYSTEM BOOT: CAMERA_OS",
        bootPrompt: "TAP TO CONNECT",
        
        // --- ТУТОРИАЛ ---
        tutTitle: "CONTROLS MANUAL",
        tutDesktop: "DESKTOP",
        tutMobile: "MOBILE",
        tutMove: "MOVE",       // Движение
        tutShoot: "FIRE",      // Стрельба
        tutSpace: "SPACE",     // Текст на пробеле
        tutAction: "TAP TO DEPLOY"
    },
    ru: {
        gameTitle: "Агент Камера: Битва Туалетов",
        pressStart: "НАЖМИ ЧТОБЫ НАЧАТЬ",
        gameOver: "МИССИЯ ПРОВАЛЕНА",
        finalScore: "СМЫТО ВРАГОВ",
        highScore: "ЛУЧШИЙ АГЕНТ",
        scoreHUD: "СЧЕТ",
        livesHUD: "КАМЕРЫ",
        highScoreHUD: "РЕКОРД",
        loading: "СВЯЗЬ СО ШТАБОМ...",
        bootSystem: "ЗАГРУЗКА: СИСТЕМА КАМЕР",
        bootPrompt: "НАЖМИ ДЛЯ ПОДКЛЮЧЕНИЯ",
        
        // --- ТУТОРИАЛ ---
        tutTitle: "ИНСТРУКЦИЯ",
        tutDesktop: "КОМПЬЮТЕР",
        tutMobile: "ТЕЛЕФОН",
        tutMove: "ДВИЖЕНИЕ",
        tutShoot: "ОГОНЬ",
        tutSpace: "ПРОБЕЛ",
        tutAction: "НАЖМИ, ЧТОБЫ НАЧАТЬ"
    }
};

export const lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en';
export const Strings = dictionary[lang];