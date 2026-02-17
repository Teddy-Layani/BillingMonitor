/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHashHistory } from 'vue-router/auto';
import Layout from '@/layouts/default.vue';
import HomePage from '@/pages/Home.vue';

const routes = [
    {
        path: '/',
        component: Layout,
        children: [
            {
                path: '', // The empty path makes this the default child route for '/'
                name: 'Home',
                component: HomePage // HomePage.vue is the first and default child
            }
        ]
    }
];

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes
});

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
    if (
        err?.message?.includes?.('Failed to fetch dynamically imported module')
    ) {
        if (localStorage.getItem('vuetify:dynamic-reload')) {
            console.error(
                'Dynamic import error, reloading page did not fix it',
                err
            );
        } else {
            console.log('Reloading page to fix dynamic import error');
            localStorage.setItem('vuetify:dynamic-reload', 'true');
            location.assign(to.fullPath);
        }
    } else {
        console.error(err);
    }
});

router.isReady().then(() => {
    localStorage.removeItem('vuetify:dynamic-reload');
});

export default router;
