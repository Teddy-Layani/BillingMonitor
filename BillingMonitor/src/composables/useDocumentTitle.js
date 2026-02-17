import { watch } from 'vue';
import { useI18n } from 'vue-i18n';

export function useDocumentTitle(titleKey = 'appTitle') {
    const { t, locale } = useI18n();

    const updateTitle = () => {
        document.title = t(titleKey);
    };

    // Update title when locale changes
    watch(locale, updateTitle, { immediate: true });

    return {
        updateTitle
    };
}
