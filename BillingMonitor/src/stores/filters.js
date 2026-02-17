import { defineStore } from 'pinia';

export const useFilterStore = defineStore('filters', {
    state: () => ({
        selectedUnits: [],
        selectedEmployees: [],
        dateFilter: 'today'
    }),

    actions: {
        setSelectedUnits(units) {
            this.selectedUnits = units;
            this.persist();
        },

        setSelectedEmployees(employees) {
            this.selectedEmployees = employees;
            this.persist();
        },

        setDateFilter(filter) {
            this.dateFilter = filter;
            this.persist();
        },

        persist() {
            // Save to localStorage
            localStorage.setItem('billingMonitorFilters', JSON.stringify({
                selectedUnits: this.selectedUnits,
                selectedEmployees: this.selectedEmployees,
                dateFilter: this.dateFilter
            }));
        },

        restore() {
            // Load from localStorage
            const saved = localStorage.getItem('billingMonitorFilters');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    this.selectedUnits = data.selectedUnits || [];
                    this.selectedEmployees = data.selectedEmployees || [];
                    this.dateFilter = data.dateFilter || 'today';
                } catch (err) {
                    console.error('Error restoring filters:', err);
                }
            }
        },

        clear() {
            this.selectedUnits = [];
            this.selectedEmployees = [];
            this.dateFilter = 'today';
            localStorage.removeItem('billingMonitorFilters');
        }
    }
});
