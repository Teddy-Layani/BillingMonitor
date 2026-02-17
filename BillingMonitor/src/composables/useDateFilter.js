export function useDateFilter() {
    const getTodayDateString = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Format: YYYY-MM-DDTHH:mm:ss (ISO without timezone, no milliseconds)
        return today.toISOString().split('.')[0];
    };

    const getYesterdayDateString = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        return yesterday.toISOString().split('.')[0];
    };

    const getDateString = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split('.')[0];
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
