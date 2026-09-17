<script setup lang="ts">
import type { Component } from 'vue';
import { BookOpenIcon } from '@heroicons/vue/24/outline';
import { appInfo } from '@/data/app-info';

interface Props {
  statusCode: string | number;
  title: string;
  description: string;
  icon: Component;
  iconColor?: string;
  iconBgColor?: string;
}

withDefaults(defineProps<Props>(), {
  iconColor: 'text-mustardHover',
  iconBgColor: 'bg-mustard/15 border-mustard/30',
});

const currentYear = new Date().getFullYear();
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 flex flex-col justify-between items-center px-4 py-8 font-sans"
  >
    <!-- Header Branding -->
    <header class="w-full max-w-4xl flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-xl bg-mustard flex items-center justify-center shadow-sm">
          <BookOpenIcon class="w-6 h-6 text-charcoalDark" />
        </div>
        <div>
          <h1 class="font-extrabold text-lg tracking-tight text-charcoalDark leading-none">
            {{ appInfo.name }}
          </h1>
          <p class="text-[11px] font-medium text-gray-500 mt-0.5">
            {{ appInfo.description }}
          </p>
        </div>
      </div>
    </header>

    <!-- Main Content Card -->
    <main class="w-full max-w-xl my-auto py-8">
      <div
        class="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-8 sm:p-12 text-center relative overflow-hidden"
      >
        <!-- Background Large Status Code -->
        <div
          class="absolute inset-x-0 -top-6 select-none pointer-events-none text-9xl sm:text-[11rem] font-black text-gray-100/80 tracking-tighter -z-0"
          aria-hidden="true"
        >
          {{ statusCode }}
        </div>

        <div class="relative z-10 flex flex-col items-center">
          <!-- Contextual Icon -->
          <div
            :class="[
              'w-20 h-20 rounded-2xl border flex items-center justify-center mb-6 shadow-xs',
              iconBgColor,
            ]"
          >
            <component :is="icon" :class="['w-10 h-10', iconColor]" />
          </div>

          <!-- Status Badge -->
          <span
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-charcoal mb-3"
          >
            Galat {{ statusCode }}
          </span>

          <!-- Title -->
          <h2 class="text-2xl sm:text-3xl font-extrabold text-charcoalDark tracking-tight mb-3">
            {{ title }}
          </h2>

          <!-- Description -->
          <p class="text-sm sm:text-base text-gray-600 leading-relaxed max-w-md mb-8">
            {{ description }}
          </p>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="w-full max-w-4xl text-center py-4 text-xs text-gray-400">
      &copy; {{ currentYear }} {{ appInfo.name }} &bull; {{ appInfo.description }}
    </footer>
  </div>
</template>
