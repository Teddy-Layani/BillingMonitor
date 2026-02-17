import { defineStore } from 'pinia';
import { client, serviceEndpoint } from '@/core/api/client';

export const useLookupStore = defineStore('lookups', {
    state: () => ({
        orgunitList: [],
        orgUserList: [],
        orgunitLoading: false,
        orgUserLoading: false,
        orgunitError: null,
        orgUserError: null
    }),

    getters: {
        // Transform org units for dropdown
        orgunitOptions: (state) => {
            return state.orgunitList.map((item) => ({
                title: `${item.OrgPartner} - ${item.Orgname}`,
                value: item.OrgPartner
            }));
        },

        // Transform users for dropdown
        orgUserOptions: (state) => {
            return state.orgUserList.map((item) => ({
                title: `${item.Fullname} (${item.Uname})`,
                value: item.Uname
            }));
        },

        // Get users filtered by org unit
        getUsersByOrgUnit: (state) => (orgunit) => {
            if (!orgunit) return state.orgUserList;
            return state.orgUserList.filter(user => user.Orgunit === orgunit);
        }
    },

    actions: {
        async fetchOrgunitSet() {
            // Only fetch if not already loaded (caching)
            if (this.orgunitList.length > 0) return;

            this.orgunitLoading = true;
            this.orgunitError = null;

            try {
                console.log('Fetching OrgunitSet...');
                const response = await fetch(`${serviceEndpoint}OrgunitSet?$format=json`);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('OrgunitSet response:', data);

                this.orgunitList = data.d?.results || data.value || [];
                console.log('Orgunit list:', this.orgunitList);
            } catch (err) {
                console.error('Error fetching OrgunitSet:', err);
                this.orgunitError = 'errorOrgUnit';
            } finally {
                this.orgunitLoading = false;
            }
        },

        async fetchOrgUserSet() {
            // Only fetch if not already loaded (caching)
            if (this.orgUserList.length > 0) return;

            this.orgUserLoading = true;
            this.orgUserError = null;

            try {
                console.log('Fetching OrgUserSet...');
                const response = await fetch(`${serviceEndpoint}OrgUserSet?$format=json`);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('OrgUserSet response:', data);

                this.orgUserList = data.d?.results || data.value || [];
                console.log('User list:', this.orgUserList);
            } catch (err) {
                console.error('Error fetching OrgUserSet:', err);
                this.orgUserError = 'errorUsers';
            } finally {
                this.orgUserLoading = false;
            }
        },

        async fetchUsersByOrgUnit(orgunit) {
            this.orgUserLoading = true;
            this.orgUserError = null;

            try {
                const entitySet = client.getEntitySet('OrgUserSet');
                const options = entitySet.newOptions()
                    .filter(`Orgunit eq '${orgunit}'`)
                    .format('json');

                const result = await entitySet.query(options);

                // Don't replace the full list, return filtered results
                return result.value || result.d?.results || result || [];
            } catch (err) {
                console.error('Error fetching users by org unit:', err);
                this.orgUserError = 'errorUsersByUnit';
                return [];
            } finally {
                this.orgUserLoading = false;
            }
        },

        async loadAllLookups() {
            await Promise.all([
                this.fetchOrgunitSet(),
                this.fetchOrgUserSet()
            ]);
        }
    }
});
