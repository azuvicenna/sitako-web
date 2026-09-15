<script setup lang="ts">
// Versatile container card for any content
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
    <slot name="header" />
    <slot />
    <slot name="footer" />
  </div>
</template>
