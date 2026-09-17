<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import {
  navLinks,
  heroData,
  aboutData,
  servicesData,
  facilitiesData,
  guideData,
  downloadData,
  contactData,
  footerData,
} from '@/data/landing';

const authStore = useAuthStore();

const activeSection = ref<string>('beranda');
const isMobileMenuOpen = ref<boolean>(false);
const isScrolled = ref<boolean>(false);

const dashboardPath = computed(() => {
  if (!authStore.isAuthenticated) return '/login';
  return authStore.role === 'Anggota' ? '/anggota/dashboard' : '/pustakawan/dashboard';
});

const ctaLabel = computed(() => {
  return authStore.isAuthenticated ? 'Buka Dashboard' : 'Login ke SITAKO';
});

const navCtaLabel = computed(() => {
  return authStore.isAuthenticated ? 'Dashboard' : 'Login';
});

const scrollToSection = (href: string) => {
  isMobileMenuOpen.value = false;
  if (href.startsWith('#')) {
    const section = document.querySelector(href);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }
};

const handleScroll = () => {
  const scrollY = window.scrollY;
  isScrolled.value = scrollY > 20;

  for (const link of [...navLinks].reverse()) {
    const el = document.getElementById(link.id);
    if (el) {
      const top = el.offsetTop;
      if (scrollY >= top - 200) {
        activeSection.value = link.id;
        break;
      }
    }
  }
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="font-sans text-charcoal bg-gray-50 min-h-screen selection:bg-mustard selection:text-white">
    <!-- Navbar -->
    <nav
      class="fixed w-full bg-white/95 backdrop-blur-sm z-50 transition-all duration-300"
      :class="isScrolled ? 'shadow-md py-1' : 'shadow-sm py-2'"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <a
            href="#beranda"
            @click.prevent="scrollToSection('#beranda')"
            class="flex-shrink-0 flex items-center gap-3 cursor-pointer group"
          >
            <div
              class="w-9 h-9 bg-mustard rounded-lg flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="w-5 h-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <span class="font-bold text-xl text-charcoalDark tracking-tight">SITAKO</span>
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center space-x-8">
            <a
              v-for="link in navLinks"
              :key="link.id"
              :href="link.href"
              @click.prevent="scrollToSection(link.href)"
              class="text-sm transition-colors cursor-pointer"
              :class="
                activeSection === link.id
                  ? 'text-mustardHover font-bold'
                  : 'text-charcoal hover:text-mustardHover font-medium'
              "
            >
              {{ link.label }}
            </a>

            <RouterLink
              :to="dashboardPath"
              class="bg-mustard hover:bg-mustardHover text-white px-6 py-2 rounded-full font-medium transition-all shadow-md shadow-mustard/30 text-sm flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="w-4 h-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              {{ navCtaLabel }}
            </RouterLink>
          </div>

          <!-- Mobile Hamburger Button -->
          <div class="md:hidden flex items-center">
            <button
              type="button"
              @click="isMobileMenuOpen = !isMobileMenuOpen"
              class="text-charcoal hover:text-mustard p-2 rounded-lg focus:outline-none cursor-pointer"
              aria-label="Buka Menu"
            >
              <svg
                v-if="!isMobileMenuOpen"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Dropdown Menu -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="isMobileMenuOpen" class="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <a
            v-for="link in navLinks"
            :key="link.id"
            :href="link.href"
            @click.prevent="scrollToSection(link.href)"
            class="block px-3 py-2 rounded-md text-base font-medium transition-colors"
            :class="
              activeSection === link.id
                ? 'bg-mustard/10 text-mustardHover font-bold'
                : 'text-charcoal hover:bg-gray-50'
            "
          >
            {{ link.label }}
          </a>
          <RouterLink
            :to="dashboardPath"
            @click="isMobileMenuOpen = false"
            class="w-full mt-2 bg-mustard hover:bg-mustardHover text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md shadow-mustard/20 text-sm cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="w-4 h-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            {{ navCtaLabel }}
          </RouterLink>
        </div>
      </transition>
    </nav>

    <!-- Hero Section (#beranda) -->
    <section id="beranda" class="relative h-screen flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 z-0">
        <img
          :src="heroData.bgImage"
          alt="Library Background"
          class="w-full h-full object-cover"
          loading="eager"
        />
        <div class="absolute inset-0 bg-charcoalDark/85"></div>
      </div>

      <div class="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
        <span class="text-mustard font-semibold tracking-wider uppercase text-sm mb-4 block animate-fade-in">
          {{ heroData.badge }}
        </span>
        <h1 class="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          {{ heroData.title }}
        </h1>
        <p class="text-lg md:text-xl text-secondary mb-10 max-w-2xl mx-auto font-light leading-relaxed">
          {{ heroData.description }}
        </p>

        <div class="flex justify-center">
          <RouterLink
            :to="dashboardPath"
            class="bg-mustard hover:bg-mustardHover text-white px-10 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-mustard/30 transform hover:-translate-y-1 flex items-center gap-3 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            {{ ctaLabel }}
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Tentang Section (#tentang) -->
    <section id="tentang" class="py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div class="relative">
            <img
              :src="aboutData.image"
              alt="Ruang Perpustakaan Sekolah"
              class="rounded-2xl shadow-xl w-full object-cover h-[450px]"
              loading="lazy"
            />
            <div class="absolute -bottom-6 -right-6 w-48 h-48 bg-secondary rounded-2xl -z-10 hidden md:block"></div>
            <div class="absolute -top-6 -left-6 w-32 h-32 bg-mustard/20 rounded-full -z-10 hidden md:block blur-2xl"></div>
          </div>

          <div>
            <div class="inline-block bg-secondary px-4 py-1.5 rounded-full text-charcoalDark font-semibold text-sm mb-6 tracking-wide">
              {{ aboutData.badge }}
            </div>
            <h2 class="text-3xl md:text-4xl font-bold text-charcoalDark mb-6 leading-tight">
              {{ aboutData.title }}
            </h2>
            <p class="text-charcoal/80 mb-8 leading-relaxed text-lg">
              {{ aboutData.description }}
            </p>
            <div class="space-y-6">
              <div class="flex items-start gap-5">
                <div class="w-12 h-12 rounded-full bg-mustard/10 text-mustard flex items-center justify-center flex-shrink-0 mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-bold text-charcoalDark text-xl mb-1">{{ aboutData.vision.title }}</h3>
                  <p class="text-charcoal/70 text-base leading-relaxed">
                    {{ aboutData.vision.description }}
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-5">
                <div class="w-12 h-12 rounded-full bg-mustard/10 text-mustard flex items-center justify-center flex-shrink-0 mt-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
                    />
                  </svg>
                </div>
                <div>
                  <h3 class="font-bold text-charcoalDark text-xl mb-1">{{ aboutData.mission.title }}</h3>
                  <p class="text-charcoal/70 text-base leading-relaxed">
                    {{ aboutData.mission.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Layanan Section (#layanan) -->
    <section id="layanan" class="py-24 bg-gray-50 border-t border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="inline-block bg-white border border-gray-200 px-4 py-1.5 rounded-full text-charcoalDark font-semibold text-sm mb-6 tracking-wide shadow-sm">
          {{ servicesData.badge }}
        </div>
        <h2 class="text-3xl md:text-4xl font-bold text-charcoalDark mb-16">
          {{ servicesData.title }}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="service in servicesData.items"
            :key="service.id"
            class="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group text-left relative overflow-hidden"
          >
            <div class="absolute top-0 right-0 w-24 h-24 bg-mustard/5 rounded-bl-full -z-10 transition-transform group-hover:scale-150"></div>
            <div class="w-16 h-16 bg-secondary group-hover:bg-mustard transition-colors rounded-2xl flex items-center justify-center text-charcoal group-hover:text-white mb-8">
              <svg
                v-if="service.id === 'paket'"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
              <svg
                v-else-if="service.id === 'repositori'"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661l-2.412-7.838A2.25 2.25 0 0017.088 3.75H15m-7.5 10.5h5.25m-7.25 0a2.25 2.25 0 01-2.25-2.25V9a2.25 2.25 0 012.25-2.25h9a2.25 2.25 0 012.25 2.25v2.25a2.25 2.25 0 01-2.25 2.25m-10.5 0a2.25 2.25 0 00-2.25 2.25v2.25a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V13.5a2.25 2.25 0 00-2.25-2.25m-12 0h12"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-8 h-8"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-charcoalDark mb-4">{{ service.title }}</h3>
            <p class="text-charcoal/70 text-base leading-relaxed">
              {{ service.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Fasilitas Section (#fasilitas) -->
    <section id="fasilitas" class="py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <div class="inline-block bg-secondary px-4 py-1.5 rounded-full text-charcoalDark font-semibold text-sm mb-6 tracking-wide">
            {{ facilitiesData.badge }}
          </div>
          <h2 class="text-3xl md:text-4xl font-bold text-charcoalDark">{{ facilitiesData.title }}</h2>
          <p class="text-charcoal/70 mt-4 max-w-2xl mx-auto text-lg">{{ facilitiesData.description }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <template v-for="facility in facilitiesData.items" :key="facility.id">
            <!-- Special Wi-Fi Card -->
            <div
              v-if="facility.isSpecialCard"
              class="relative overflow-hidden rounded-2xl aspect-[4/5] group cursor-pointer bg-charcoalDark p-8 flex flex-col justify-center items-center text-center shadow-md border-b-4 border-mustard transition-transform duration-300 hover:-translate-y-1"
            >
              <div class="w-20 h-20 bg-mustard/20 rounded-full flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-10 h-10 text-mustard"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
                  />
                </svg>
              </div>
              <h3 class="text-white text-2xl font-bold mb-3">{{ facility.title }}</h3>
              <p class="text-gray-400 text-sm leading-relaxed">{{ facility.description }}</p>
            </div>

            <!-- Standard Facility Image Card -->
            <div
              v-else
              class="relative overflow-hidden rounded-2xl aspect-[4/5] group cursor-pointer shadow-md"
            >
              <img
                :src="facility.image"
                :alt="facility.title"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-charcoalDark/95 via-charcoalDark/40 to-transparent"></div>
              <div class="absolute bottom-0 left-0 p-6 w-full">
                <div class="w-10 h-10 bg-mustard rounded-full flex items-center justify-center text-white mb-3 shadow-lg">
                  <svg
                    v-if="facility.id === 'hening'"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-5 h-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                  <svg
                    v-else-if="facility.id === 'diskusi'"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-5 h-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-5 h-5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12.75a3 3 0 00-3-3H6a3 3 0 00-3 3v7.5a3 3 0 003 3h12a3 3 0 003-3v-7.5z"
                    />
                  </svg>
                </div>
                <h3 class="text-white text-xl font-bold mb-2">{{ facility.title }}</h3>
                <p class="text-secondary/90 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                  {{ facility.description }}
                </p>
              </div>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- Panduan Section (#panduan) -->
    <section id="panduan" class="py-24 bg-charcoal text-white relative overflow-hidden">
      <div class="absolute top-0 right-0 w-96 h-96 bg-mustard/5 rounded-full blur-3xl -z-0"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-mustard/10 rounded-full blur-2xl -z-0"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-6">{{ guideData.title }}</h2>
          <p class="text-gray-300 max-w-2xl mx-auto text-lg">{{ guideData.description }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 relative mt-12">
          <div class="hidden md:block absolute top-10 left-[10%] right-[10%] h-[2px] bg-gray-600 z-0"></div>

          <div
            v-for="item in guideData.steps"
            :key="item.step"
            class="relative z-10 flex flex-col items-center text-center group"
          >
            <div
              class="w-20 h-20 rounded-full bg-charcoalDark border-4 border-mustard flex items-center justify-center text-mustard shadow-xl mb-6 shadow-mustard/20 transition-transform group-hover:scale-110"
            >
              <svg
                v-if="item.step === 1"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="w-8 h-8"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
                />
              </svg>
              <svg
                v-else-if="item.step === 2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="w-8 h-8"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
              <svg
                v-else-if="item.step === 3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="w-8 h-8"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                class="w-8 h-8"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-3">{{ item.title }}</h3>
            <p class="text-gray-400 text-sm leading-relaxed px-2">
              {{ item.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Download Mobile Section (#download) -->
    <section id="download" class="py-20 bg-mustard text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-12">
          <div class="md:w-1/2">
            <h2 class="text-3xl md:text-4xl font-bold mb-6 text-charcoalDark">{{ downloadData.title }}</h2>
            <p class="text-lg mb-8 text-charcoalDark/80 font-medium">
              {{ downloadData.description }}
            </p>

            <div class="flex flex-wrap gap-4">
              <RouterLink
                to="/login"
                class="bg-charcoalDark hover:bg-charcoal text-white px-6 py-3 rounded-lg flex items-center gap-3 transition shadow-lg cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" class="w-6 h-6">
                  <path
                    d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
                  />
                </svg>
                <div class="text-left">
                  <span class="text-[10px] block font-light">Download on the</span>
                  <span class="font-bold text-sm tracking-wide">{{ downloadData.appStoreText }}</span>
                </div>
              </RouterLink>

              <RouterLink
                to="/login"
                class="bg-charcoalDark hover:bg-charcoal text-white px-6 py-3 rounded-lg flex items-center gap-3 transition shadow-lg cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" class="w-6 h-6">
                  <path
                    d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"
                  />
                </svg>
                <div class="text-left">
                  <span class="text-[10px] block font-light">GET IT ON</span>
                  <span class="font-bold text-sm tracking-wide">{{ downloadData.playStoreText }}</span>
                </div>
              </RouterLink>
            </div>
          </div>

          <div class="md:w-1/2 flex justify-center mt-10 md:mt-0 relative">
            <div class="absolute w-64 h-64 bg-white/30 rounded-full blur-3xl -z-10 top-10"></div>
            <img
              :src="downloadData.image"
              class="rounded-3xl shadow-2xl max-w-[250px] object-cover h-[450px] border-4 border-charcoalDark"
              alt="Aplikasi Mobile SITAKO"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Kontak Section (#kontak) -->
    <section id="kontak" class="py-24 bg-gray-50 border-t border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <div class="inline-block bg-white border border-gray-200 px-4 py-1.5 rounded-full text-charcoalDark font-semibold text-sm mb-6 tracking-wide">
              {{ contactData.badge }}
            </div>
            <h2 class="text-3xl md:text-4xl font-bold text-charcoalDark mb-6">
              {{ contactData.title }}
            </h2>
            <p class="text-charcoal/80 mb-10 text-lg leading-relaxed">
              {{ contactData.description }}
            </p>

            <div class="space-y-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <!-- Lokasi Ruang -->
              <div class="flex items-start gap-5">
                <div class="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-mustard flex-shrink-0 border border-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-7 h-7"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div>
                  <h4 class="font-bold text-charcoalDark text-lg mb-1">{{ contactData.location.title }}</h4>
                  <p class="text-charcoal/70 leading-relaxed">
                    {{ contactData.location.building }}<br />
                    {{ contactData.location.address }}
                  </p>
                </div>
              </div>

              <!-- Jam Operasional -->
              <div class="flex items-start gap-5">
                <div class="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-mustard flex-shrink-0 border border-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-7 h-7"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 class="font-bold text-charcoalDark text-lg mb-1">{{ contactData.operationalHours.title }}</h4>
                  <p class="text-charcoal/70 leading-relaxed">
                    <template v-for="(schedule, index) in contactData.operationalHours.schedules" :key="index">
                      <span class="font-medium">{{ schedule.day }}:</span> {{ schedule.time }}<br />
                    </template>
                  </p>
                </div>
              </div>

              <!-- Bantuan IT / Akun -->
              <div class="flex items-start gap-5">
                <div class="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-mustard flex-shrink-0 border border-gray-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-7 h-7"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                    />
                  </svg>
                </div>
                <div>
                  <h4 class="font-bold text-charcoalDark text-lg mb-1">{{ contactData.helpdesk.title }}</h4>
                  <p class="text-charcoal/70 leading-relaxed">
                    {{ contactData.helpdesk.phone }}<br />
                    {{ contactData.helpdesk.email }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Google Maps Embed -->
          <div class="h-full min-h-[500px] w-full bg-gray-200 rounded-3xl overflow-hidden shadow-md border border-gray-200 relative">
            <iframe
              :src="contactData.mapEmbedUrl"
              class="absolute inset-0 w-full h-full border-0"
              :allowfullscreen="true"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

        <div class="mt-16 text-center">
          <RouterLink
            :to="dashboardPath"
            class="inline-block bg-mustard hover:bg-mustardHover text-white px-10 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-mustard/30 transform hover:-translate-y-1 cursor-pointer"
          >
            {{ contactData.ctaText }}
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-charcoalDark text-white pt-20 pb-10 border-t-4 border-mustard">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <div class="col-span-1 md:col-span-2 pr-0 md:pr-10">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-8 h-8 bg-mustard rounded flex items-center justify-center text-white shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                  class="w-5 h-5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </div>
              <span class="font-bold text-xl tracking-tight">{{ footerData.brandName }}</span>
            </div>
            <p class="text-gray-400 text-base mb-8 leading-relaxed">
              {{ footerData.brandDescription }}
            </p>
          </div>

          <div>
            <h4 class="font-bold text-lg mb-6 border-b border-gray-700 pb-2 inline-block">Menu Cepat</h4>
            <ul class="space-y-3 text-sm text-gray-400">
              <li v-for="item in footerData.quickLinks" :key="item.label">
                <RouterLink
                  v-if="item.isInternalRoute"
                  :to="item.href"
                  class="hover:text-mustard transition-colors flex items-center gap-2 cursor-pointer text-left"
                >
                  {{ item.label }}
                </RouterLink>
                <a
                  v-else
                  :href="item.href"
                  @click.prevent="scrollToSection(item.href)"
                  class="hover:text-mustard transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {{ item.label }}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 class="font-bold text-lg mb-6 border-b border-gray-700 pb-2 inline-block">Informasi Akademik</h4>
            <ul class="space-y-3 text-sm text-gray-400">
              <li v-for="item in footerData.academicInfo" :key="item.label">
                <RouterLink
                  v-if="item.isInternalRoute"
                  :to="item.href"
                  class="hover:text-mustard transition-colors flex items-center gap-2 cursor-pointer text-left"
                >
                  {{ item.label }}
                </RouterLink>
                <a
                  v-else
                  :href="item.href"
                  @click.prevent="scrollToSection(item.href)"
                  class="hover:text-mustard transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {{ item.label }}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div class="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>{{ footerData.copyrightText }}</p>
          <p class="mt-4 md:mt-0 font-medium">{{ footerData.tagline }}</p>
        </div>
      </div>
    </footer>
  </div>
</template>
