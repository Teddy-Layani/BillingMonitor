export function useDateFilter() {
    const toLocalDateString = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}T00:00:00`;
    };

    const getTodayDateString = () => {
        return toLocalDateString(new Date());
    };

    const getYesterdayDateString = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return toLocalDateString(yesterday);
    };

    const getDateString = (date) => {
        return toLocalDateString(new Date(date));
    };

    const formatDateForDisplay = (date) => {
        return new Intl.DateTimeFormat('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    };

    const formatDateTimeForDisplay = (date) => {
        return new Intl.DateTimeFormat('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(new Date(date));
    };

    return {
        getTodayDateString,
        getYesterdayDateString,
        getDateString,
        formatDateForDisplay,
        formatDateTimeForDisplay
    };
}
