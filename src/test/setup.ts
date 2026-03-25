import { config } from '@vue/test-utils'
import { i18n } from '@/lib/i18n'

// Install i18n globally for all component tests
config.global.plugins = [i18n]
