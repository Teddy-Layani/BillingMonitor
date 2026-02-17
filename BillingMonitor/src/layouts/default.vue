<template>
    <v-main>
        <v-app-bar color="primary" flat>
            <v-app-bar-nav-icon>
                <v-icon>mdi-chart-timeline-variant</v-icon>
            </v-app-bar-nav-icon>
            <v-app-bar-title>מוניטור חיובים</v-app-bar-title>

            <v-spacer />

            <!-- Last Update Time -->
            <div class="update-info d-flex align-center ga-2 ml-4">
                <v-icon size="small">mdi-clock-outline</v-icon>
                <span class="text-body-2">
                    עדכון אחרון: {{ lastUpdateTime }}
                </span>
            </div>
        </v-app-bar>
        <router-view />
    </v-main>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const lastUpdateTime = ref('');

const updateTime = () => {
    lastUpdateTime.value = new Intl.DateTimeFormat('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(new Date());
};

onMounted(() => {
    updateTime();
    // Update time every second
    setInterval(updateTime, 1000);
});
</script>

<style scoped>
.update-info {
    color: white;
    padding: 0 16px;
}
.v-app-bar {
    z-index: 2000 !important;
}
</style>
