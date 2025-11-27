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

// 1. Определяем язык браузера при старте (чтобы не было пустоты)
const navLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
export let lang = navLang.startsWith('ru') ? 'ru' : 'en';

// 2. Создаем объект Strings и заполняем его данными. 
// Мы используем Object.assign, чтобы ссылка на объект не менялась, 
// но его содержимое можно было перезаписать.
export const Strings = {};
Object.assign(Strings, dictionary[lang]);

// 3. Функция для смены языка "на лету" (когда Яндекс SDK загрузится)
export function setLanguage(newLangCode) {
    if (!newLangCode) return;

    // Поддерживаем только ru и en. Если придет 'tr', 'de' -> ставим 'en'
    const supportedLang = newLangCode.toLowerCase().startsWith('ru') ? 'ru' : 'en';

    // Если язык действительно отличается от текущего
    if (lang !== supportedLang) {
        console.log(`Localization switch: ${lang} -> ${supportedLang}`);
        lang = supportedLang;
        
        // Очищаем текущие строки
        for (const key in Strings) {
            delete Strings[key];
        }
        // Записываем новые строки
        Object.assign(Strings, dictionary[lang]);
    }
}