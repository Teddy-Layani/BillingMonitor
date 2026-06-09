<template>
    <div class="min-h-screen billing-monitor-bg pa-8">
        <div class="mx-auto" style="max-width: 1400px;">
            <!-- Header Card -->
            <v-card class="mb-6 pa-6 elevation-8 header-card">
                <!-- Top row: Logo + Countdown top-left -->
                <div class="d-flex justify-space-between align-start mb-4">
                    <div class="d-flex flex-column align-start">
                        <img v-if="logo" :src="logo" alt="Logo" style="height: 64px; width: auto;" />
                        <div v-else class="text-h6 font-weight-bold" style="color: #ff6b1a;">{{ t('companyName') }}</div>
                        <p class="text-blue-darken-4 text-body-2 font-weight-bold mt-1">{{ t('department') }}</p>
                    </div>
                    <div class="text-body-2 text-grey-darken-1">
                        {{ t('refreshIn') }} <span class="font-weight-bold">{{ countdown }}s</span>
                    </div>
                </div>

                <!-- Title -->
                <div class="text-center mb-6">
                    <h1 class="text-h3 font-weight-bold text-grey-darken-3 mb-2">
                        {{ t('billingForDate', { date: formatDate() }) }}
                    </h1>
                    <p class="text-body-1 text-grey-darken-1">
                        {{ t('lastUpdateTime') }} <span class="font-weight-bold">{{ formatDateTime(lastUpdate) }}</span>
                    </p>
                </div>

                <!-- Filters -->
                <div class="d-flex flex-wrap ga-6 align-center justify-center">
                    <!-- Org Unit Filter -->
                    <div class="d-flex align-center ga-2">
                        <label class="filter-label">יחידה:</label>
                        <div class="filter-group">
                            <div class="dropdown-wrapper" ref="orgUnitButtonRef">
                                <button @click="toggleOrgUnitDropdown" class="dropdown-button">
                                    <span class="dropdown-label">{{ getOrgUnitLabel() }}</span>
                                    <v-icon :class="['dropdown-icon', { 'rotated': isOrgUnitDropdownOpen }]">mdi-chevron-down</v-icon>
                                </button>
                                <Teleport to="body">
                                    <div v-if="isOrgUnitDropdownOpen" class="dropdown-menu-portal" :style="orgUnitDropdownStyle" @click.stop>
                                        <div class="dropdown-search-wrapper">
                                            <input
                                                v-model="orgUnitSearchText"
                                                type="text"
                                                placeholder="חיפוש..."
                                                class="dropdown-search-input"
                                                @click.stop
                                            />
                                        </div>
                                        <div class="dropdown-items-container">
                                            <label v-for="unit in searchFilteredUnits" :key="unit.value" class="dropdown-item">
                                                <input type="checkbox" v-model="selectedUnits" :value="unit.value" class="dropdown-checkbox" />
                                                <span class="dropdown-item-text">{{ unit.title }}</span>
                                            </label>
                                            <div v-if="searchFilteredUnits.length === 0" class="dropdown-no-results">
                                                לא נמצאו תוצאות
                                            </div>
                                        </div>
                                    </div>
                                </Teleport>
                            </div>
                            <button v-if="selectedUnits.length > 0" @click="clearOrgUnits" class="clear-filter-btn" title="נקה בחירה">
                                <v-icon size="20">mdi-close</v-icon>
                            </button>
                        </div>
                    </div>

                    <!-- Employee Filter -->
                    <div class="d-flex align-center ga-2">
                        <label class="filter-label">עובד:</label>
                        <div class="filter-group">
                            <div class="dropdown-wrapper" ref="employeeButtonRef">
                                <button @click="toggleEmployeeDropdown" class="dropdown-button">
                                    <span class="dropdown-label">{{ getEmployeeLabel() }}</span>
                                    <v-icon :class="['dropdown-icon', { 'rotated': isEmployeeDropdownOpen }]">mdi-chevron-down</v-icon>
                                </button>
                                <Teleport to="body">
                                    <div v-if="isEmployeeDropdownOpen" class="dropdown-menu-portal" :style="employeeDropdownStyle" @click.stop>
                                        <div class="dropdown-search-wrapper">
                                            <input
                                                v-model="employeeSearchText"
                                                type="text"
                                                placeholder="חיפוש..."
                                                class="dropdown-search-input"
                                                @click.stop
                                            />
                                        </div>
                                        <div class="dropdown-items-container">
                                            <label v-for="employee in searchFilteredEmployees" :key="employee.value" class="dropdown-item">
                                                <input type="checkbox" v-model="selectedEmployees" :value="employee.value" class="dropdown-checkbox" />
                                                <span class="dropdown-item-text">{{ employee.title }}</span>
                                            </label>
                                            <div v-if="searchFilteredEmployees.length === 0" class="dropdown-no-results">
                                                לא נמצאו תוצאות
                                            </div>
                                        </div>
                                    </div>
                                </Teleport>
                            </div>
                            <button v-if="selectedEmployees.length > 0" @click="clearEmployees" class="clear-filter-btn" title="נקה בחירה">
                                <v-icon size="20">mdi-close</v-icon>
                            </button>
                        </div>
                    </div>

                    <!-- Date Filter Buttons -->
                    <div class="d-flex align-center ga-2">
                        <label class="text-body-1 font-weight-bold text-grey-darken-2">תאריכים:</label>
                        <div class="date-filter-container">
                            <button
                                @click="setDateFilterButton('היום')"
                                :class="['date-filter-btn', { 'active': dateFilter === 'היום' && !customDateFrom && !customDateTo }]"
                            >
                                היום
                            </button>
                            <button
                                @click="setDateFilterButton('היום ואתמול')"
                                :class="['date-filter-btn', { 'active': dateFilter === 'היום ואתמול' && !customDateFrom && !customDateTo }]"
                            >
                                היום ואתמול
                            </button>
                            <button
                                @click="setDateFilterButton('מתחילת החודש')"
                                :class="['date-filter-btn', { 'active': dateFilter === 'מתחילת החודש' && !customDateFrom && !customDateTo }]"
                            >
                                מתחילת החודש
                            </button>
                        </div>
                    </div>

                    <!-- Custom Date Range -->
                    <div class="d-flex align-center ga-2">
                        <label class="text-body-1 font-weight-bold text-grey-darken-2">טווח מותאם:</label>
                        <div class="d-flex align-center ga-2">
                            <div class="date-input-wrapper">
                                <label class="date-input-label">מ-</label>
                                <input
                                    type="date"
                                    v-model="customDateFrom"
                                    class="date-input"
                                    :max="customDateTo || undefined"
                                />
                            </div>
                            <div class="date-input-wrapper">
                                <label class="date-input-label">עד</label>
                                <input
                                    type="date"
                                    v-model="customDateTo"
                                    class="date-input"
                                    :min="customDateFrom || undefined"
                                />
                            </div>
                            <button
                                v-if="customDateFrom || customDateTo"
                                @click="clearCustomDates"
                                class="clear-filter-btn"
                                title="נקה תאריכים"
                            >
                                <v-icon size="20">mdi-close</v-icon>
                            </button>
                        </div>
                    </div>
                </div>
            </v-card>

            <!-- Data Table -->
            <v-card class="elevation-8 overflow-hidden">
                <v-table>
                    <thead>
                        <tr class="table-header">
                            <th class="text-right text-h6 font-weight-bold pa-4">{{ t('rowNumber') }}</th>
                            <th class="text-right text-h6 font-weight-bold pa-4">{{ t('repName') }}</th>
                            <th class="text-right text-h6 font-weight-bold pa-4">{{ t('userName') }}</th>
                            <th class="text-right text-h6 font-weight-bold pa-4">{{ t('totalInvoices') }}</th>
                            <th class="text-right text-h6 font-weight-bold pa-4">{{ t('ccCount') }}</th>
                            <th class="text-right text-h6 font-weight-bold pa-4">{{ t('ddCount') }}</th>
                            <th class="text-right text-h6 font-weight-bold pa-4">{{ t('ddBankCount') }}</th>
                            <th class="text-right text-h6 font-weight-bold pa-4">{{ t('bankTransferCount') }}</th>
                            <th class="text-right text-h6 font-weight-bold pa-4">{{ t('combinedTotal') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(employee, index) in sortedData" :key="employee.id" :class="getRowColorClass(employee)">
                            <td class="text-h6 font-weight-bold text-grey-darken-3 pa-4">{{ index + 1 }}</td>
                            <td class="text-h6 font-weight-medium text-grey-darken-3 pa-4">{{ employee.nameHebrew }}</td>
                            <td class="text-h6 text-grey-darken-2 pa-4">{{ employee.nameEnglish }}</td>
                            <td class="text-h6 font-weight-bold text-grey-darken-3 pa-4">
                                <span
                                    v-if="employee.total > 0"
                                    class="count-chip"
                                    @click="openDialog('invoice', employee)"
                                >{{ employee.total }}</span>
                                <span v-else>0</span>
                            </td>
                            <td class="text-h6 font-weight-bold text-grey-darken-3 pa-4">
                                <span
                                    v-if="employee.ccCount > 0"
                                    class="count-chip"
                                    @click="openDialog('cc', employee)"
                                >{{ employee.ccCount }}</span>
                                <span v-else>0</span>
                            </td>
                            <td class="text-h6 font-weight-bold text-grey-darken-3 pa-4">
                                <span
                                    v-if="employee.ddCount > 0"
                                    class="count-chip"
                                    @click="openDialog('dd', employee)"
                                >{{ employee.ddCount }}</span>
                                <span v-else>0</span>
                            </td>
                            <td class="text-h6 font-weight-bold text-grey-darken-3 pa-4">
                                <span
                                    v-if="employee.ddBankCount > 0"
                                    class="count-chip"
                                    @click="openDialog('ddbank', employee)"
                                >{{ employee.ddBankCount }}</span>
                                <span v-else>0</span>
                            </td>
                            <td class="text-h6 font-weight-bold text-grey-darken-3 pa-4">
                                <span
                                    v-if="employee.bankTransferCount > 0"
                                    class="count-chip"
                                    @click="openDialog('banktransfer', employee)"
                                >{{ employee.bankTransferCount }}</span>
                                <span v-else>0</span>
                            </td>
                            <td class="text-h6 font-weight-bold text-grey-darken-3 pa-4">{{ employee.uniqueTotal }}</td>
                        </tr>
                        <!-- Total Row -->
                        <tr class="total-row">
                            <td colspan="3" class="text-h6 font-weight-bold pa-4">{{ t('total') }}</td>
                            <td class="text-h6 font-weight-bold pa-4">{{ totalSum }}</td>
                            <td class="text-h6 font-weight-bold pa-4">{{ totalCcCount }}</td>
                            <td class="text-h6 font-weight-bold pa-4">{{ totalDdCount }}</td>
                            <td class="text-h6 font-weight-bold pa-4">{{ totalDdBankCount }}</td>
                            <td class="text-h6 font-weight-bold pa-4">{{ totalBankTransferCount }}</td>
                            <td class="text-h6 font-weight-bold pa-4">{{ totalCombined }}</td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card>

            <!-- Legend (hidden per Khaled's request - 2026-06-09) -->
            <!--
            <div class="mt-6 d-flex justify-center ga-6 text-body-1">
                <div class="d-flex align-center">
                    <div class="legend-box bg-green-lighten-4 ml-2"></div>
                    <span>{{ t('legendAbove') }}</span>
                </div>
                <div class="d-flex align-center">
                    <div class="legend-box bg-yellow-lighten-4 ml-2"></div>
                    <span>{{ t('legendMiddle') }}</span>
                </div>
                <div class="d-flex align-center">
                    <div class="legend-box bg-red-lighten-3 ml-2"></div>
                    <span>{{ t('legendBelow') }}</span>
                </div>
            </div>
            -->

            <!-- Detail Dialog -->
            <v-dialog v-model="dialog.open" max-width="700" scrollable>
                <v-card>
                    <v-card-title class="dialog-title d-flex justify-space-between align-center pa-4">
                        <span>{{ dialogTitle }}</span>
                        <v-btn icon @click="closeDialog"><v-icon>mdi-close</v-icon></v-btn>
                    </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text class="pa-4">
                        <div v-if="dialog.loading" class="text-center pa-8">
                            <v-progress-circular indeterminate size="48" color="primary"></v-progress-circular>
                        </div>
                        <template v-else-if="dialog.items.length > 0">
                            <!-- Invoice table -->
                            <v-table v-if="dialog.type === 'invoice'" density="compact" class="inner-table">
                                <thead>
                                    <tr class="inner-table-header">
                                        <th class="text-right font-weight-bold pa-3">{{ t('rowNumber') }}</th>
                                        <th class="text-right font-weight-bold pa-3">{{ t('vkont') }}</th>
                                        <th class="text-right font-weight-bold pa-3">תאריך חשבונית</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, idx) in dialog.items" :key="idx">
                                        <td class="pa-3">{{ idx + 1 }}</td>
                                        <td class="pa-3">{{ item.vkont }}</td>
                                        <td class="pa-3">{{ formatSapDate(item.erdat) }}</td>
                                    </tr>
                                </tbody>
                            </v-table>

                            <!-- Credit Card table -->
                            <v-table v-else-if="dialog.type === 'cc'" density="compact" class="inner-table">
                                <thead>
                                    <tr class="inner-table-header">
                                        <th class="text-right font-weight-bold pa-3">{{ t('rowNumber') }}</th>
                                        <th class="text-right font-weight-bold pa-3">מס' אסמכתא</th>
                                        <th class="text-right font-weight-bold pa-3">{{ t('vkont') }}</th>
                                        <th class="text-right font-weight-bold pa-3">סכום</th>
                                        <th class="text-right font-weight-bold pa-3">תאריך חיוב</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, idx) in dialog.items" :key="idx">
                                        <td class="pa-3">{{ idx + 1 }}</td>
                                        <td class="pa-3">{{ item.Nrzas }}</td>
                                        <td class="pa-3">{{ item.Vkont }}</td>
                                        <td class="pa-3">{{ formatAmount(item.zzamount) }}</td>
                                        <td class="pa-3">{{ formatSapDate(item.Crdat) }}</td>
                                    </tr>
                                </tbody>
                            </v-table>

                            <!-- Direct Debit table -->
                            <v-table v-else-if="dialog.type === 'dd'" density="compact" class="inner-table">
                                <thead>
                                    <tr class="inner-table-header">
                                        <th class="text-right font-weight-bold pa-3">{{ t('rowNumber') }}</th>
                                        <th class="text-right font-weight-bold pa-3">שותף עסקי</th>
                                        <th class="text-right font-weight-bold pa-3">תאריך חיוב</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, idx) in dialog.items" :key="idx">
                                        <td class="pa-3">{{ idx + 1 }}</td>
                                        <td class="pa-3">{{ item.Gpart }}</td>
                                        <td class="pa-3">{{ formatSapDate(item.Crdat) }}</td>
                                    </tr>
                                </tbody>
                            </v-table>

                            <!-- DD Bank table -->
                            <v-table v-else-if="dialog.type === 'ddbank'" density="compact" class="inner-table">
                                <thead>
                                    <tr class="inner-table-header">
                                        <th class="text-right font-weight-bold pa-3">{{ t('rowNumber') }}</th>
                                        <th class="text-right font-weight-bold pa-3">{{ t('vkont') }}</th>
                                        <th class="text-right font-weight-bold pa-3">תאריך</th>
                                        <th class="text-right font-weight-bold pa-3">תיאור</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, idx) in dialog.items" :key="idx">
                                        <td class="pa-3">{{ idx + 1 }}</td>
                                        <td class="pa-3">{{ item.ContractAccount }}</td>
                                        <td class="pa-3">{{ formatSapDate(item.CreateDate) }}</td>
                                        <td class="pa-3">{{ item.Description }}</td>
                                    </tr>
                                </tbody>
                            </v-table>

                            <!-- Bank Transfer table -->
                            <v-table v-else-if="dialog.type === 'banktransfer'" density="compact" class="inner-table">
                                <thead>
                                    <tr class="inner-table-header">
                                        <th class="text-right font-weight-bold pa-3">{{ t('rowNumber') }}</th>
                                        <th class="text-right font-weight-bold pa-3">{{ t('vkont') }}</th>
                                        <th class="text-right font-weight-bold pa-3">תאריך יצירה</th>
                                        <th class="text-right font-weight-bold pa-3">תיאור</th>
                                        <th class="text-right font-weight-bold pa-3">סכום</th>
                                        <th class="text-right font-weight-bold pa-3">תאריך תשלום</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(item, idx) in dialog.items" :key="idx">
                                        <td class="pa-3">{{ idx + 1 }}</td>
                                        <td class="pa-3">{{ item.ContractAccount }}</td>
                                        <td class="pa-3">{{ formatSapDate(item.CreateDate) }}</td>
                                        <td class="pa-3">{{ item.Description }}</td>
                                        <td class="pa-3">{{ formatAmount(item.Amount) }}</td>
                                        <td class="pa-3">{{ formatSapDate(item.PaymentDate) }}</td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </template>
                        <div v-else class="text-center pa-8 text-grey">אין נתונים להצגה</div>
                    </v-card-text>
                </v-card>
            </v-dialog>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLookupStore } from '@/stores/lookups';
import { useFilterStore } from '@/stores/filters';
import { useBillingData } from '@/composables/useBillingData';
import { useDateFilter } from '@/composables/useDateFilter';

// i18n
const { t } = useI18n();

// Stores and composables
const lookupStore = useLookupStore();
const filterStore = useFilterStore();
const {
    fetchTodayBilling,
    fetchYesterdayBilling,
    fetchBillingRecords,
    fetchInvoices,
    fetchCreditCards,
    fetchDirectDebits,
    fetchDdBank,
    fetchBankTransfers,
    loading,
    error
} = useBillingData();
const { getTodayDateString, getYesterdayDateString } = useDateFilter();

// Use filter store for persistent state
const selectedUnits = computed({
    get: () => filterStore.selectedUnits,
    set: (value) => filterStore.setSelectedUnits(value)
});

const selectedEmployees = computed({
    get: () => filterStore.selectedEmployees,
    set: (value) => filterStore.setSelectedEmployees(value)
});

const dateFilter = computed({
    get: () => filterStore.dateFilter,
    set: (value) => filterStore.setDateFilter(value)
});

const customDateFrom = computed({
    get: () => filterStore.customDateFrom,
    set: (value) => filterStore.setCustomDateFrom(value)
});

const customDateTo = computed({
    get: () => filterStore.customDateTo,
    set: (value) => filterStore.setCustomDateTo(value)
});

// Local state
const lastUpdate = ref(new Date());
const data = ref([]);
const isOrgUnitDropdownOpen = ref(false);
const isEmployeeDropdownOpen = ref(false);
const orgUnitSearchText = ref('');
const employeeSearchText = ref('');
const logo = ref(null);
const countdown = ref(180);
const orgUnitButtonRef = ref(null);
const employeeButtonRef = ref(null);
const orgUnitDropdownStyle = ref({});
const employeeDropdownStyle = ref({});
let countdownInterval = null;
let handleClickOutside = null;

// Computed
const units = computed(() => lookupStore.orgunitOptions || []);
const employees = computed(() => lookupStore.orgUserOptions || []);

// Filter employees by selected org units
const filteredEmployees = computed(() => {
    if (selectedUnits.value.length === 0) {
        return employees.value;
    }
    return employees.value.filter(emp => {
        const user = lookupStore.orgUserList.find(u => u.Uname === emp.value);
        return user && selectedUnits.value.includes(user.Orgunit);
    });
});

// Filter units by search text
const searchFilteredUnits = computed(() => {
    if (!orgUnitSearchText.value) return units.value;
    const searchLower = orgUnitSearchText.value.toLowerCase();
    return units.value.filter(unit =>
        unit.title.toLowerCase().includes(searchLower) ||
        unit.value.toLowerCase().includes(searchLower)
    );
});

// Filter employees by search text
const searchFilteredEmployees = computed(() => {
    if (!employeeSearchText.value) return filteredEmployees.value;
    const searchLower = employeeSearchText.value.toLowerCase();
    return filteredEmployees.value.filter(emp =>
        emp.title.toLowerCase().includes(searchLower) ||
        emp.value.toLowerCase().includes(searchLower)
    );
});

const sortedData = computed(() => {
    return [...data.value].sort((a, b) => b.uniqueTotal - a.uniqueTotal);
});

const totalSum = computed(() => {
    return sortedData.value.reduce((sum, item) => sum + item.total, 0);
});

const totalCcCount = computed(() => {
    return sortedData.value.reduce((sum, item) => sum + item.ccCount, 0);
});

const totalDdCount = computed(() => {
    return sortedData.value.reduce((sum, item) => sum + item.ddCount, 0);
});

const totalDdBankCount = computed(() => {
    return sortedData.value.reduce((sum, item) => sum + item.ddBankCount, 0);
});

const totalBankTransferCount = computed(() => {
    return sortedData.value.reduce((sum, item) => sum + item.bankTransferCount, 0);
});

const totalCombined = computed(() => {
    return sortedData.value.reduce((sum, item) => sum + item.uniqueTotal, 0);
});

// Dialog state
const dialog = ref({
    open: false,
    type: null,
    employee: null,
    items: [],
    loading: false
});

const dialogTitle = computed(() => {
    if (!dialog.value.employee) return '';
    const typeLabels = {
        invoice: t('totalInvoices'),
        cc: t('ccCount'),
        dd: t('ddCount'),
        ddbank: t('ddBankCount'),
        banktransfer: t('bankTransferCount')
    };
    const label = typeLabels[dialog.value.type] || '';
    const name = dialog.value.employee.nameHebrew || '';
    const dateRange = getDateRangeForFilter();
    let formattedDate = '';
    if (dateRange.type === 'single') {
        formattedDate = dateRange.date.split('T')[0];
    } else if (dateRange.type === 'twodates') {
        formattedDate = `${dateRange.yesterday.split('T')[0]} — ${dateRange.today.split('T')[0]}`;
    } else {
        formattedDate = `${dateRange.from.split('T')[0]} — ${dateRange.to.split('T')[0]}`;
    }
    return `${label} — ${name} — ${formattedDate}`;
});

const openDialog = async (type, employee) => {
    dialog.value = { open: true, type, employee, items: [], loading: true };

    const dateParam = getDateRangeForFilter();

    let results = [];
    try {
        if (type === 'invoice') {
            const raw = await fetchInvoices(employee.id, dateParam);
            // Deduplicate by vkont+erdat to keep one row per contract per date
            const seen = new Map();
            raw.forEach(item => {
                const vkont = item.vkont || item.Vkont;
                const erdat = item.Erdat || item.erdat;
                if (vkont) {
                    const key = `${vkont}|${erdat}`;
                    if (!seen.has(key)) seen.set(key, { vkont, erdat });
                }
            });
            results = Array.from(seen.values());
        } else if (type === 'cc') {
            results = await fetchCreditCards(employee.id, dateParam);
        } else if (type === 'dd') {
            results = await fetchDirectDebits(employee.id, dateParam);
        } else if (type === 'ddbank') {
            results = await fetchDdBank(employee.id, dateParam);
        } else if (type === 'banktransfer') {
            results = await fetchBankTransfers(employee.id, dateParam);
        }
    } catch (err) {
        console.error('Error fetching dialog data:', err);
        results = [];
    }

    dialog.value.items = results;
    dialog.value.loading = false;
};

const closeDialog = () => {
    dialog.value.open = false;
    dialog.value.items = [];
};

// Helper: format SAP /Date(ms)/ to DD/MM/YYYY
const formatSapDate = (sapDate) => {
    if (!sapDate) return '';
    const ms = parseInt(sapDate.replace('/Date(', '').replace(')/', ''));
    if (isNaN(ms)) return sapDate;
    const d = new Date(ms);
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
};

// Helper: format numeric amount as ILS currency
const formatAmount = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(num);
};

// Methods
const getRowColorClass = (employee) => {
    const index = sortedData.value.indexOf(employee);
    const length = sortedData.value.length;
    if (index < 3) return 'bg-green-lighten-4';
    if (index >= length - 3) return 'bg-red-lighten-3';
    return 'bg-yellow-lighten-4';
};

const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
};

const formatDate = () => {
    return new Intl.DateTimeFormat('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date());
};

const getOrgUnitLabel = () => {
    if (selectedUnits.value.length === 0) return t('selectUnits');
    if (selectedUnits.value.length === units.value.length) return t('allUnits');
    return t('selected', { count: selectedUnits.value.length });
};

const getEmployeeLabel = () => {
    if (selectedEmployees.value.length === 0) return t('selectEmployees');
    if (selectedEmployees.value.length === filteredEmployees.value.length && filteredEmployees.value.length > 0) return t('allEmployees');
    return t('selected', { count: selectedEmployees.value.length });
};

const toggleOrgUnitDropdown = () => {
    if (!isOrgUnitDropdownOpen.value && orgUnitButtonRef.value) {
        const rect = orgUnitButtonRef.value.getBoundingClientRect();
        orgUnitDropdownStyle.value = {
            position: 'fixed',
            left: `${rect.left}px`,
            top: `${rect.bottom + 4}px`,
            width: '350px'
        };
    } else {
        // Clear search when closing
        orgUnitSearchText.value = '';
    }
    isOrgUnitDropdownOpen.value = !isOrgUnitDropdownOpen.value;
};

const toggleEmployeeDropdown = () => {
    if (!isEmployeeDropdownOpen.value && employeeButtonRef.value) {
        const rect = employeeButtonRef.value.getBoundingClientRect();
        employeeDropdownStyle.value = {
            position: 'fixed',
            left: `${rect.left}px`,
            top: `${rect.bottom + 4}px`,
            width: '350px'
        };
    } else {
        // Clear search when closing
        employeeSearchText.value = '';
    }
    isEmployeeDropdownOpen.value = !isEmployeeDropdownOpen.value;
};

const clearOrgUnits = () => {
    selectedUnits.value = [];
    isOrgUnitDropdownOpen.value = false;
};

const clearEmployees = () => {
    selectedEmployees.value = [];
    isEmployeeDropdownOpen.value = false;
};

const setDateFilterButton = (value) => {
    customDateFrom.value = '';
    customDateTo.value = '';
    dateFilter.value = value;
};

const clearCustomDates = () => {
    customDateFrom.value = '';
    customDateTo.value = '';
    refreshData();
};

const getDateRangeForFilter = () => {
    // Custom date range takes priority over buttons
    if (customDateFrom.value && customDateTo.value) {
        return { type: 'range', from: customDateFrom.value + 'T00:00:00', to: customDateTo.value + 'T00:00:00' };
    }
    if (customDateFrom.value) {
        return { type: 'single', date: customDateFrom.value + 'T00:00:00' };
    }

    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    if (dateFilter.value === 'היום') {
        return { type: 'single', date: today };
    } else if (dateFilter.value === 'היום ואתמול') {
        return { type: 'twodates', yesterday: yesterday, today: today };
    } else {
        // מתחילת החודש
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startDateStr = startOfMonth.toISOString().split('T')[0] + 'T00:00:00';
        return { type: 'range', from: startDateStr, to: today };
    }
};

const aggregateBillingByUser = (records) => {
    // Group by Uname and sum InvoiceCount, CcCount, DdCount, DdBankCount, BankTransferCount
    const userMap = new Map();

    records.forEach(record => {
        const uname = record.Uname;
        if (!uname) return;

        if (!userMap.has(uname)) {
            userMap.set(uname, {
                uname: uname,
                invoiceCount: 0,
                ccCount: 0,
                ddCount: 0,
                ddBankCount: 0,
                bankTransferCount: 0,
                uniqueTotal: 0,
                fullname: record.Fullname || '',
                orgunit: record.Orgunit || ''
            });
        }

        const user = userMap.get(uname);
        user.invoiceCount += (record.InvoiceCount || 0);
        user.ccCount += (record.CcCount || 0);
        user.ddCount += (record.DdCount || 0);
        user.ddBankCount += (record.DdBankCount || 0);
        user.bankTransferCount += (record.BankTransferCount || 0);
        user.uniqueTotal += (record.UniqueTotal || 0);
    });

    // Convert to array and match with user details from store
    const aggregated = Array.from(userMap.values()).map(item => {
        const userDetails = lookupStore.orgUserList.find(u => u.Uname === item.uname);

        return {
            id: item.uname,
            nameHebrew: userDetails?.Fullname || item.fullname || item.uname,
            nameEnglish: item.uname,
            total: item.invoiceCount,
            ccCount: item.ccCount,
            ddCount: item.ddCount,
            ddBankCount: item.ddBankCount,
            bankTransferCount: item.bankTransferCount,
            uniqueTotal: item.uniqueTotal,
            orgunit: item.orgunit
        };
    });

    return aggregated;
};

const refreshData = async () => {
    try {
        const dateRange = getDateRangeForFilter();

        // Fetch data for all selected org units and employees
        const allRecords = [];

        // Prepare date filter for OData (BillingMonitorSet uses its own buildFilterString)
        let billingDateFilter;
        if (dateRange.type === 'single') {
            billingDateFilter = dateRange.date;
        } else if (dateRange.type === 'twodates') {
            billingDateFilter = { from: dateRange.yesterday, to: dateRange.today };
        } else {
            billingDateFilter = { from: dateRange.from, to: dateRange.to };
        }

        // If employees are selected, use employee filter
        if (selectedEmployees.value.length > 0) {
            // Fetch for each selected employee with date range
            for (const employee of selectedEmployees.value) {
                try {
                    const result = await fetchBillingRecords(billingDateFilter, { uname: employee }, 0, 10000);
                    if (result && result.records && Array.isArray(result.records)) {
                        allRecords.push(...result.records);
                    }
                } catch (err) {
                    if (err.name !== 'AbortError') console.error('Error fetching for employee:', employee, err);
                    // Continue with next iteration
                }
            }
        } else if (selectedUnits.value.length > 0) {
            // Fetch for each selected org unit with date range
            for (const orgunit of selectedUnits.value) {
                try {
                    const result = await fetchBillingRecords(billingDateFilter, { orgunit: orgunit }, 0, 10000);
                    if (result && result.records && Array.isArray(result.records)) {
                        allRecords.push(...result.records);
                    }
                } catch (err) {
                    if (err.name !== 'AbortError') console.error('Error fetching for orgunit:', orgunit, err);
                    // Continue with next iteration
                }
            }
        } else {
            // No filter selected, fetch all with date range
            try {
                const result = await fetchBillingRecords(billingDateFilter, {}, 0, 10000);
                if (result && result.records && Array.isArray(result.records)) {
                    allRecords.push(...result.records);
                }
            } catch (err) {
                if (err.name !== 'AbortError') console.error('Error fetching data:', err);
            }
        }

        // Aggregate by user
        data.value = aggregateBillingByUser(allRecords);
        lastUpdate.value = new Date();
    } catch (err) {
        if (err.name !== 'AbortError') console.error('Error refreshing data:', err);
        // Fallback to empty data
        data.value = [];
    }
};

// Watchers
watch([selectedUnits, selectedEmployees, dateFilter], () => {
    refreshData();
});

watch([customDateFrom, customDateTo], () => {
    // Only refresh when both dates are set, or when both are cleared
    if ((customDateFrom.value && customDateTo.value) || (!customDateFrom.value && !customDateTo.value)) {
        refreshData();
    }
});

// Lifecycle
onMounted(async () => {
    // Restore saved filters first
    filterStore.restore();

    // Load lookups
    await lookupStore.loadAllLookups();

    // Load logo
    try {
        const logoModule = await import('@/assets/logo.png');
        logo.value = logoModule.default;
    } catch (e) {
        console.log('Logo not found, using text fallback');
    }

    // Initial data load
    refreshData();

    // Close dropdowns when clicking outside
    handleClickOutside = (event) => {
        const orgUnitButton = orgUnitButtonRef.value;
        const employeeButton = employeeButtonRef.value;

        // Check if click is outside org unit dropdown
        if (isOrgUnitDropdownOpen.value && orgUnitButton && !orgUnitButton.contains(event.target)) {
            const dropdownElements = document.querySelectorAll('.dropdown-menu-portal');
            let clickedInside = false;
            dropdownElements.forEach(el => {
                if (el.contains(event.target)) {
                    clickedInside = true;
                }
            });
            if (!clickedInside) {
                isOrgUnitDropdownOpen.value = false;
            }
        }

        // Check if click is outside employee dropdown
        if (isEmployeeDropdownOpen.value && employeeButton && !employeeButton.contains(event.target)) {
            const dropdownElements = document.querySelectorAll('.dropdown-menu-portal');
            let clickedInside = false;
            dropdownElements.forEach(el => {
                if (el.contains(event.target)) {
                    clickedInside = true;
                }
            });
            if (!clickedInside) {
                isEmployeeDropdownOpen.value = false;
            }
        }
    };

    document.addEventListener('click', handleClickOutside);

    // Countdown timer - tick every second, reload at 0
    countdown.value = 180;
    countdownInterval = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
            window.location.reload();
        }
    }, 1000);
});

onUnmounted(() => {
    if (handleClickOutside) {
        document.removeEventListener('click', handleClickOutside);
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
});
</script>

<style scoped>
.billing-monitor-bg {
    background: linear-gradient(135deg, #e3f2fd 0%, #c5cae9 100%);
    min-height: 100vh;
}

.header-card {
    overflow: visible !important;
}

.header-card :deep(.v-card__text) {
    overflow: visible !important;
}

.table-header {
    background-color: #000000 !important;
}

.table-header th {
    color: #ffffff !important;
}

.legend-box {
    width: 16px;
    height: 16px;
    border-radius: 2px;
}

/* Row color classes */
.bg-green-lighten-4 {
    background-color: #c8e6c9 !important;
}

.bg-yellow-lighten-4 {
    background-color: #fff9c4 !important;
}

.bg-red-lighten-3 {
    background-color: #f2a0a0 !important;
}

.total-row {
    background-color: #0d47a1 !important;
}

.total-row td {
    color: #ffffff !important;
}

/* Date Filter Buttons (matching Figma design) */
.date-filter-container {
    display: flex;
    background-color: #f5f5f5;
    border-radius: 8px;
    padding: 4px;
    gap: 0;
}

.date-filter-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: transparent;
    color: #616161;
}

.date-filter-btn:hover:not(.active) {
    background-color: #e0e0e0;
}

.date-filter-btn.active {
    background-color: #616161;
    color: #ffffff;
}

/* Filter Labels */
.filter-label {
    font-size: 16px;
    font-weight: 600;
    color: #616161;
}

/* Filter Group - wrapper for dropdown + clear button */
.filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Clear Filter Button */
.clear-filter-btn {
    width: 32px;
    height: 32px;
    min-width: 32px;
    border-radius: 50%;
    background-color: #ef4444;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: white;
    padding: 0;
}

.clear-filter-btn:hover {
    background-color: #dc2626;
    transform: scale(1.1);
}

.clear-filter-btn:active {
    transform: scale(0.95);
}

/* Dropdown Components (matching Figma design) */
.dropdown-wrapper {
    position: relative;
    z-index: 100;
}

.dropdown-button {
    width: 256px;
    background-color: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.2s ease;
    position: relative;
    z-index: 101;
}

.dropdown-button:hover {
    border-color: #9ca3af;
}

.dropdown-button:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dropdown-label {
    color: #374151;
    text-align: right;
    flex: 1;
}

.dropdown-icon {
    color: #6b7280;
    transition: transform 0.2s ease;
}

.dropdown-icon.rotated {
    transform: rotate(180deg);
}

.dropdown-menu {
    position: absolute;
    left: 0;
    top: calc(100% + 4px);
    width: 350px;
    max-height: 400px;
    overflow-y: auto;
    background-color: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 9999 !important;
}

.dropdown-menu-portal {
    max-height: 400px;
    background-color: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 99999 !important;
    display: flex;
    flex-direction: column;
}

.dropdown-search-wrapper {
    padding: 8px;
    border-bottom: 1px solid #e5e7eb;
    background-color: #ffffff;
    position: sticky;
    top: 0;
    z-index: 1;
}

.dropdown-search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    outline: none;
    direction: rtl;
    text-align: right;
}

.dropdown-search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dropdown-search-input::placeholder {
    color: #9ca3af;
}

.dropdown-items-container {
    max-height: 340px;
    overflow-y: auto;
}

.dropdown-no-results {
    padding: 16px;
    text-align: center;
    color: #6b7280;
    font-size: 14px;
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.15s ease;
}

.dropdown-item:hover {
    background-color: #f9fafb;
}

.dropdown-checkbox {
    width: 20px;
    height: 20px;
    accent-color: #3b82f6;
    cursor: pointer;
    border-radius: 4px;
}

.dropdown-item-text {
    flex: 1;
    font-size: 16px;
    color: #374151;
    text-align: right;
}

/* Custom date range inputs */
.date-input-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
}

.date-input-label {
    font-size: 14px;
    font-weight: 600;
    color: #616161;
    white-space: nowrap;
}

.date-input {
    background-color: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 14px;
    cursor: pointer;
    color: #374151;
    outline: none;
    transition: border-color 0.2s ease;
    direction: ltr;
}

.date-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-input::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.7;
}

/* Clickable count chip */
.count-chip {
    cursor: pointer;
    color: #1565c0;
    font-weight: bold;
    text-decoration: underline;
    display: inline-flex;
    align-items: center;
    transition: color 0.2s ease;
}

.count-chip:hover {
    color: #0d47a1;
}

/* Dialog title bar */
.dialog-title {
    background-color: #1565c0;
    color: #ffffff;
}

.inner-table {
    border: 1px solid #bbdefb;
    border-radius: 8px;
    overflow: hidden;
}

.inner-table-header {
    background-color: #1565c0 !important;
}

.inner-table-header th {
    color: #ffffff !important;
}
</style>
