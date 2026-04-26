# BillingMonitor - Test Plan v2

**Version:** 2.0
**Date:** 2026-03-11
**OData Service:** ZISU_CRM_BILLING_SRV

---

## Pre-requisites
- App is deployed and accessible via browser
- SAP OData backend is reachable (BillingMonitorSet, OrgunitSet, OrgUserSet, InvoiceSet)
- Test with a date that has billing data (e.g. data exists for "היום")

---

## 1. Initial Load & Header

### 1.1 Page load
- [ ] App loads without JavaScript console errors
- [ ] Company logo (or text fallback "חברת החשמל") displayed top-right
- [ ] "מחלקת גבייה" label shown under logo
- [ ] Title shows "גבייה לתאריך {today's date in Hebrew}"
- [ ] "תאריך ושעת עדכון:" shows current date/time

### 1.2 Countdown timer
- [ ] Countdown starts at 180s
- [ ] Countdown decrements every second
- [ ] At 0 the page reloads automatically
- [ ] After reload, app loads correctly again

---

## 2. Lookup Data (OrgunitSet / OrgUserSet)

### 2.1 Org Unit dropdown
- [ ] Click "יחידה:" dropdown - list of org units loads
- [ ] Each item shows format: "CODE - NAME"
- [ ] Search box filters items as you type
- [ ] Searching for text not found shows "לא נמצאו תוצאות"
- [ ] Multiple units can be selected (checkboxes)
- [ ] Label updates to "{count} נבחרו" when items selected
- [ ] Red X button clears selection
- [ ] Clicking outside closes the dropdown

### 2.2 Employee dropdown
- [ ] Click "עובד:" dropdown - list of employees loads
- [ ] Each item shows format: "FULLNAME (USERNAME)"
- [ ] Search box filters items
- [ ] Multiple employees can be selected
- [ ] When org units are selected, employee list is filtered to those units only
- [ ] Red X button clears selection
- [ ] Clicking outside closes the dropdown

### 2.3 Dropdown z-index
- [ ] Dropdown menus appear above the table and other elements (Teleport)
- [ ] No clipping or hidden menus behind cards

---

## 3. Date Filter Buttons

- [ ] Three buttons displayed: היום | היום ואתמול | מתחילת החודש
- [ ] Active button has dark background (#616161) with white text
- [ ] Inactive buttons have transparent background with grey text
- [ ] Hover on inactive button shows light grey background
- [ ] "היום" - fetches with `CreateDate eq datetime'{today}'`
- [ ] "היום ואתמול" - fetches with `CreateDate ge datetime'{yesterday}' and CreateDate le datetime'{today}'`
- [ ] "מתחילת החודש" - fetches with `CreateDate ge datetime'{1st of month}' and CreateDate le datetime'{today}'`
- [ ] Switching date filter immediately triggers data refresh

---

## 4. Data Table - Core Display

### 4.1 Table headers
- [ ] 6 columns: מס' # | שם נציג | שם משתמש | סה"כ רישום חשבוניות במייל | תשלומים באשראי | תשלומי הו"ק באשראי
- [ ] Header row has black background with white text
- [ ] All headers right-aligned and bold

### 4.2 Data rows
- [ ] Row number column shows sequential numbers (1, 2, 3...)
- [ ] שם נציג shows Hebrew full name (Fullname)
- [ ] שם משתמש shows SAP username (Uname)
- [ ] סה"כ רישום חשבוניות במייל shows aggregated InvoiceCount per user
- [ ] תשלומים באשראי shows aggregated CcCount per user
- [ ] תשלומי הו"ק באשראי shows aggregated DdCount per user
- [ ] Data is sorted by InvoiceCount descending (highest first)

### 4.3 Row colors
- [ ] Top 3 rows: green (#c8e6c9)
- [ ] Middle rows: yellow (#fff9c4)
- [ ] Bottom 3 rows: red (#f2a0a0)
- [ ] Colors apply correctly when fewer than 6 rows exist

### 4.4 Total row
- [ ] Last row has dark blue background (#0d47a1) with white text
- [ ] Label "סה"כ" spans first 3 columns
- [ ] InvoiceCount total = sum of all rows' InvoiceCount
- [ ] CcCount total = sum of all rows' CcCount
- [ ] DdCount total = sum of all rows' DdCount
- [ ] Verify totals by manually summing visible values

### 4.5 Data aggregation across dates
- [ ] "היום ואתמול": if a user has records on both days, counts are summed into one row
- [ ] "מתחילת החודש": all records for a user across the month are summed into one row
- [ ] No duplicate rows per user

---

## 5. Filtering Behavior

### 5.1 Org unit filter
- [ ] Select one org unit - table shows only employees from that unit
- [ ] Select multiple org units - table shows employees from all selected units
- [ ] OData request includes `Orgunit eq '{value}'` for each unit
- [ ] Clear org unit filter - table shows all employees again

### 5.2 Employee filter
- [ ] Select one employee - table shows only that employee
- [ ] Select multiple employees - table shows all selected employees
- [ ] OData request includes `Uname eq '{value}'` for each employee
- [ ] Clear employee filter - table shows all employees again

### 5.3 Combined filters
- [ ] Select org unit + date range - both filters applied correctly
- [ ] Select employee + date range - both filters applied correctly
- [ ] Employee filter takes priority over org unit filter (by design)

### 5.4 Reactivity
- [ ] Changing any filter immediately triggers a new data fetch
- [ ] "תאריך ושעת עדכון:" timestamp updates after each refresh

---

## 6. Invoice Drill-Down (Click on InvoiceCount)

### 6.1 Visual
- [ ] InvoiceCount > 0: shown as blue underlined text with chevron-down icon
- [ ] InvoiceCount = 0: shown as plain text, not clickable
- [ ] Hover on clickable count shows pointer cursor

### 6.2 Expand
- [ ] Click non-zero InvoiceCount - expanded row appears below
- [ ] Loading spinner shown during fetch
- [ ] Inner table has 2 columns: מס' # | חשבון חוזה
- [ ] Inner table header: blue background (#1565c0) with white text
- [ ] Lists all vkont values from InvoiceSet response
- [ ] Row numbers sequential (1, 2, 3...)
- [ ] Expanded row background is light blue (#e3f2fd)

### 6.3 API verification (DevTools Network tab)
- [ ] Request: `InvoiceSet?$filter=Ernam eq '{Uname}' and Erdat eq datetime'{date}'&$format=json`
- [ ] For date ranges: `Erdat ge datetime'{from}' and Erdat le datetime'{to}'`
- [ ] Number of vkont rows matches the InvoiceCount number

### 6.4 Collapse
- [ ] Click same InvoiceCount again - row collapses
- [ ] Chevron changes back to down

### 6.5 Switch rows
- [ ] Click row A's count, then click row B's count
- [ ] Only one row expanded at a time
- [ ] Inner table shows correct data for the newly expanded row

### 6.6 Edge cases
- [ ] API returns empty results - shows "אין נתונים להצגה"
- [ ] Change filter while row is expanded - expanded row resets on data refresh

---

## 7. Legend

- [ ] Three legend items displayed below the table, centered
- [ ] Green box + "למעלה מ-3%"
- [ ] Yellow box + "בין 3% ל-70%"
- [ ] Red box + "למטה מ-70%"
- [ ] Legend colors match actual row colors in the table

---

## 8. Filter Persistence (localStorage)

- [ ] Select org unit + date filter, reload page
- [ ] Date filter is restored from localStorage
- [ ] Org unit and employee filters are cleared on mount (by design)
- [ ] Manually clear localStorage (`billingMonitorFilters`) - app loads with defaults

---

## 9. RTL & Layout

- [ ] Full page is RTL (right-to-left)
- [ ] Hebrew text renders correctly
- [ ] Table columns aligned to the right
- [ ] Dropdowns open in correct position relative to buttons
- [ ] No horizontal scrollbar on 1920px screen
- [ ] Background gradient (blue) covers full viewport

---

## 10. Error Handling

- [ ] Disconnect from network, trigger refresh - no crash, console shows error
- [ ] SAP returns HTTP 500 - app does not crash, table shows empty or stale data
- [ ] SAP returns empty results (no records) - table is empty, totals show 0

---

## 11. Browser Compatibility

- [ ] Chrome (latest) - all features work
- [ ] Edge (latest) - all features work
- [ ] Firefox (latest) - all features work (if required)

---

## Sign-off

| Tester | Date | Environment | Result | Notes |
|--------|------|-------------|--------|-------|
|        |      | DEV/QA/PROD |        |       |
|        |      |             |        |       |
