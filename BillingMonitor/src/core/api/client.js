import { OData } from '@odata/client';

export const serviceEndpoint = import.meta.env.PROD
    ? '/sap/opu/odata/sap/ZISU_CRM_BILLING_SRV/'
    : '/GW_SSO/sap/opu/odata/sap/ZISU_CRM_BILLING_SRV/';

export const client = OData.New({
    serviceEndpoint,
    processCsrfToken: true,
    commonHeaders: {
        'sap-language': 'he'
    }
});
