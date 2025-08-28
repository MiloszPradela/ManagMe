import i18next from 'i18next';
import en from './lang/en.json';
import pl from './lang/pl.json';


// Domyślny, pusty obiekt zasobów
const resources = {
  en: {
    translation: en,
  },
  pl: {
    translation: pl,
  },
};

i18next.init({
  resources,
  lng: localStorage.getItem('language') || 'pl', 
  fallbackLng: 'en', 
  interpolation: {
    escapeValue: false,
  },
  debug: true, 
});

export default i18next;
