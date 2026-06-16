<script setup>
import { RouterView } from 'vue-router'
import ToastContainer from '../components/ToastContainer.vue'
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 p-4">
    <RouterView />
    <ToastContainer />
  </div>
</template>
