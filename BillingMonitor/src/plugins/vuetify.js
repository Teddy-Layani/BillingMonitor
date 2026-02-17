/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

// Composables
import { createVuetify } from 'vuetify';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';
import i18n from '@/core/i18n';
import { useI18n } from 'vue-i18n';

const iecLightTheme = {
    dark: false,
    colors: {
        primary: '#31405D', // The prominent blue from the website
        primary500: '#0D47A1',
        'chart-title':'#09368A',
        secondary: '#00AEEF', // A lighter, secondary blue also found on the site
        background: '#F2F2F2', // A light gray for the main background
        'on-background': '#282828', // Dark gray for text on the background
        surface: '#FFFFFF', // White for component surfaces like cards
        'on-surface': '#282828', // A near-black for text on surfaces,
        label: '#686868',
        'toggle-btn':'#E8F3FD'
    }
};

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
    locale: {
        adapter: createVueI18nAdapter({i18n, useI18n})
    },
    theme: {
        defaultTheme: 'iecLightTheme',
        themes: {
            iecLightTheme
        }
    }
});
