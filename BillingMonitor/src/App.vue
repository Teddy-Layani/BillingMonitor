<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup>
import { useDocumentTitle } from '@/composables/useDocumentTitle'

// Set document title dynamically from i18n
useDocumentTitle()
</script>