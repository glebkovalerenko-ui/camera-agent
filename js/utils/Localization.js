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
        bootPrompt: "TAP TO CONNECT"
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
        bootPrompt: "НАЖМИ ДЛЯ ПОДКЛЮЧЕНИЯ"
    }
};

export const lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en';
export const Strings = dictionary[lang];