import { ref } from 'vue';
import { client, serviceEndpoint } from '@/core/api/client';
import { useDateFilter } from './useDateFilter';

export function useBillingData() {
    const billingRecords = ref([]);
    const totalCount = ref(0);
    const loading = ref(false);
    const error = ref(null);

    let fetchController = null;

    /**
     * Build OData filter string from date and additional filters
     */
    const buildFilterString = (date, filters = {}) => {
        const parts = [];

        // Handle date filter - supports both single date and date ranges
        if (date) {
            if (typeof date === 'string') {
                // Single date
                parts.push(`CreateDate eq datetime'${date}'`);
            } else if (date.from && date.to) {
                // Date range with ge (>=) and le (<=)
                parts.push(`CreateDate ge datetime'${date.from}' and CreateDate le datetime'${date.to}'`);
            }
        }

        // Add org unit filter
        if (filters.orgunit) {
            parts.push(`Orgunit eq '${filters.orgunit}'`);
        }

        // Add user filter
        if (filters.uname) {
            parts.push(`Uname eq '${filters.uname}'`);
        }

        return parts.join(' and ');
    };

    /**
     * Fetch billing records with filters and pagination
     */
    const fetchBillingRecords = async (date, filters = {}, skip = 0, top = 50) => {
        // Cancel previous request if still running
        if (fetchController) {
            fetchController.abort();
        }

        fetchController = new AbortController();
        loading.value = true;
        error.value = null;

        try {
            const filterString = buildFilterString(date, filters);

            // Use native fetch for inlinecount support
            const response = await fetch(
                `${serviceEndpoint}BillingMonitorSet?$filter=${encodeURIComponent(filterString)}&$inlinecount=allpages&$format=json&$skip=${skip}&$top=${top}`,
                {
                    credentials: 'include',
                    signal: fetchController.signal
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Handle both OData v2 and v4 formats
            billingRecords.value = data.d?.results || data.value || [];
            totalCount.value = parseInt(data.d?.__count || data['@odata.count'] || 0, 10);

            return {
                records: billingRecords.value,
                count: totalCount.value
            };
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error fetching billing records:', err);
                error.value = 'errorBilling';

                // Return empty result instead of throwing to prevent crashes
                return {
                    records: [],
                    count: 0
                };
            }
            throw err; // Still throw AbortError
        } finally {
            loading.value = false;
            fetchController = null;
        }
    };

    /**
     * Fetch billing count only (faster)
     */
    const fetchBillingCount = async (date, filters = {}) => {
        try {
            const filterString = buildFilterString(date, filters);

            const response = await fetch(
                `${serviceEndpoint}BillingMonitorSet/$count?$filter=${encodeURIComponent(filterString)}`,
                { credentials: 'include' }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const count = await response.text();
            totalCount.value = parseInt(count, 10) || 0;

            return totalCount.value;
        } catch (err) {
            console.error('Error fetching billing count:', err);
            return 0;
        }
    };

    /**
     * Fetch today's billing records
     */
    const fetchTodayBilling = async (filters = {}, skip = 0, top = 50) => {
        const { getTodayDateString } = useDateFilter();
        const today = getTodayDateString();
        return fetchBillingRecords(today, filters, skip, top);
    };

    /**
     * Fetch yesterday's billing records
     */
    const fetchYesterdayBilling = async (filters = {}, skip = 0, top = 50) => {
        const { getYesterdayDateString } = useDateFilter();
        const yesterday = getYesterdayDateString();
        return fetchBillingRecords(yesterday, filters, skip, top);
    };

    /**
     * Abort any ongoing fetch
     */
    const abortFetch = () => {
        if (fetchController) {
            fetchController.abort();
            fetchController = null;
        }
    };

    return {
        billingRecords,
        totalCount,
        loading,
        error,
        fetchBillingRecords,
        fetchBillingCount,
        fetchTodayBilling,
        fetchYesterdayBilling,
        abortFetch
    };
}
