<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/useAuthStore'
import type { LoginCredentials } from '@/types/auth'
import mascotNav from '@/assets/brand/mascot-nav.png'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const credentials = reactive<LoginCredentials>({
  email: '',
  password: '',
})

async function handleSubmit(): Promise<void> {
  try {
    await auth.login(credentials)
    const redirect = route.query.redirect as string | undefined
    await router.push(redirect ?? '/admin')
  } catch {
    // error is already set in auth.error by the store
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-sm">
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <!-- Brand -->
        <div class="flex flex-col items-center mb-8">
          <img :src="mascotNav" alt="AIntern" class="h-12 w-auto mb-4" />
          <h1 class="text-xl font-semibold text-slate-800 text-center">
            {{ t('admin.login.heading') }}
          </h1>
          <p class="text-sm text-slate-500 text-center mt-1">
            {{ t('admin.login.subheading') }}
          </p>
        </div>

        <!-- Form -->
        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
          <!-- Email -->
          <div class="flex flex-col gap-1.5">
            <label for="email" class="text-sm font-medium text-slate-700">
              {{ t('admin.login.emailLabel') }}
            </label>
            <input
              id="email"
              v-model="credentials.email"
              type="email"
              required
              autocomplete="email"
              :placeholder="t('admin.login.emailPlaceholder')"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <!-- Password -->
          <div class="flex flex-col gap-1.5">
            <label for="password" class="text-sm font-medium text-slate-700">
              {{ t('admin.login.passwordLabel') }}
            </label>
            <input
              id="password"
              v-model="credentials.password"
              type="password"
              required
              autocomplete="current-password"
              :placeholder="t('admin.login.passwordPlaceholder')"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <!-- Error message -->
          <p v-if="auth.error" class="text-sm text-red-600">
            {{ auth.error }}
          </p>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="auth.isLoading"
            class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ auth.isLoading ? t('admin.login.submitting') : t('admin.login.submit') }}
          </button>
        </form>

        <!-- Register link -->
        <p class="mt-6 text-center text-sm text-slate-500">
          <RouterLink to="/admin/register" class="text-indigo-600 hover:text-indigo-700 font-medium">
            {{ t('admin.login.registerLink') }}
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
