import { definePlugin } from '@jaspers-ai/sdk'
import { fx, policyRate } from './sources.ts'

export default definePlugin({ id: 'ecb', sources: { fx, 'policy-rate': policyRate }, views: {} })
