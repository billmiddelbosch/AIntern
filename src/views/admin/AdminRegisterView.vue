<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/useAuthStore'
import adminApiClient from '@/lib/adminAxios'
import mascotNav from '@/assets/brand/mascot-nav.png'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const form = reactive({ name: '', email: '', password: '', confirmPassword: '' })
const isLoading = ref(false)
const error = ref<string | null>(null)

async function handleSubmit(): Promise<void> {
  error.value = null

  if (form.password.length < 8) {
    error.value = t('admin.register.errorPasswordTooShort')
    return
  }
  if (form.password !== form.confirmPassword) {
    error.value = t('admin.register.errorPasswordMismatch')
    return
  }

  isLoading.value = true
  try {
    await adminApiClient.post('/admin/register', {
      email: form.email,
      password: form.password,
      name: form.name,
    })
    // Auto-login after successful registration
    await auth.login({ email: form.email, password: form.password })
    await router.push('/admin')
  } catch (err) {
    if (err instanceof Error && err.message.includes('Registration is closed')) {
      error.value = t('admin.register.errorClosed')
    } else {
      error.value = err instanceof Error ? err.message : 'Registration failed'
    }
  } finally {
    isLoading.value = false
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
            {{ t('admin.register.heading') }}
          </h1>
          <p class="text-sm text-slate-500 text-center mt-1">
            {{ t('admin.register.subheading') }}
          </p>
        </div>

        <!-- Form -->
        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
          <!-- Name -->
          <div class="flex flex-col gap-1.5">
            <label for="name" class="text-sm font-medium text-slate-700">
              {{ t('admin.register.nameLabel') }}
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              autocomplete="name"
              :placeholder="t('admin.register.namePlaceholder')"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <!-- Email -->
          <div class="flex flex-col gap-1.5">
            <label for="email" class="text-sm font-medium text-slate-700">
              {{ t('admin.register.emailLabel') }}
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <!-- Password -->
          <div class="flex flex-col gap-1.5">
            <label for="password" class="text-sm font-medium text-slate-700">
              {{ t('admin.register.passwordLabel') }}
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              autocomplete="new-password"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            <p class="text-xs text-slate-400">{{ t('admin.register.passwordMinHint') }}</p>
          </div>

          <!-- Confirm Password -->
          <div class="flex flex-col gap-1.5">
            <label for="confirm-password" class="text-sm font-medium text-slate-700">
              {{ t('admin.register.confirmPasswordLabel') }}
            </label>
            <input
              id="confirm-password"
              v-model="form.confirmPassword"
              type="password"
              required
              autocomplete="new-password"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          <!-- Error -->
          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isLoading ? t('admin.register.submitting') : t('admin.register.submit') }}
          </button>
        </form>

        <!-- Login link -->
        <p class="mt-6 text-center text-sm text-slate-500">
          <RouterLink to="/admin/login" class="text-indigo-600 hover:text-indigo-700 font-medium">
            {{ t('admin.register.loginLink') }}
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
