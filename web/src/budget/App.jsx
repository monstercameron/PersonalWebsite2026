import React from 'react'
import ReactDOM from 'react-dom'
import {
  buildDefaultBudgetCollectionsStateForLocalFirstUsage,
  migrateCollectionsStateFromV2ToV3,
  appendValidatedIncomeOrExpenseRecordIntoCollectionsState,
  appendValidatedGoalRecordIntoCollectionsState,
  validateRequiredGoalRecordFieldsBeforePersistence,
  calculateTwentyDashboardHealthMetricsFromFinancialCollections,
  calculateCurrentAndPreviousMonthSourceBreakdownFromCollectionsState,
  calculateDetailedDashboardDatapointRowsFromCurrentCollectionsState,
  calculateMonthlySavingsStorageSummaryFromCollectionsState,
  calculateEmergencyFundTrackingSummaryFromCollectionsState,
  calculateRecommendedMonthlySavingsTargetFromCollectionsState,
  calculateMonthlyIncomeExpenseSummaryFromCollectionsState,
  calculatePowerGoalsStatusFormulaSummaryFromGoalCollection,
  calculateCreditCardSummaryFormulasFromInformationCollection,
  calculateCreditCardPaymentRecommendationsFromCollectionsState,
  calculatePlanningCockpitInsightsFromCollectionsState,
  calculateNetWorthProjectionProfilesUsingThreeAggressionLayers,
  calculateUnifiedFinancialRecordsSourceOfTruthFromCollectionsState,
  updateExistingRecordInCollectionsStateByCollectionNameAndId,
  calculateEstimatedPayoffMonthsFromBalancePaymentAndInterestRate,
  calculateLoanPayoffComparisonFromBaseAndExtraPayments,
  mergeImportedCollectionsStateWithExistingStateUsingDedupKeys,
  mergeAuditTimelineEntriesUsingDedupKeys,
  renamePersonaAcrossCollectionsStateByName,
  deletePersonaAcrossCollectionsStateByName,
  buildPersonaImpactSummaryFromCollectionsStateByPersonaName
} from './core/pure.js'
import {
  loadBudgetCollectionsStateFromLocalStorageCache,
  persistBudgetCollectionsStateIntoLocalStorageCache,
  readCurrentIsoTimestampForBudgetRecordUpdates,
  persistUiPreferencesIntoLocalStorageCache,
  loadUiPreferencesFromLocalStorageCache,
  persistAuditTimelineIntoLocalStorageCache,
  loadAuditTimelineFromLocalStorageCache,
  applyThemeNameToDocumentBodyDataAttribute,
  scrollViewportToTopWithSmoothBehavior,
  copyTextToClipboardUsingBrowserApi,
  applyGlobalTextScaleMultiplierToDocumentRoot,
  computeFinancialRiskFindingsUsingBackgroundWorkerWhenAvailable,
  exportCompleteFinancialProfileAsJsonTextSnapshot,
  importCompleteFinancialProfileFromJsonTextSnapshot,
  loadSupabaseWebConfigFromLocalStorageCache,
  persistSupabaseWebConfigIntoLocalStorageCache,
  verifySupabaseEmailOtpCodeAndCreateSession,
  readSupabaseAuthenticatedUserSummary,
  signOutFromSupabaseCurrentSession,
  pushCompleteFinancialProfileIntoSupabaseForAuthenticatedUser,
  pullCompleteFinancialProfileFromSupabaseForAuthenticatedUser,
  loadFirebaseWebConfigFromLocalStorageCache,
  persistFirebaseWebConfigIntoLocalStorageCache,
  signInToFirebaseWithGooglePopup,
  signOutFromFirebaseCurrentSession,
  readFirebaseAuthenticatedUserSummary,
  pushCompleteFinancialProfileIntoFirebaseForAuthenticatedUser,
  pullCompleteFinancialProfileFromFirebaseForAuthenticatedUser
} from './core/impure.js'

const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconUsers = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IconDownload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const IconUpload = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
const IconMoon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
const IconSun = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
const IconZoomIn = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
const IconZoomOut = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
const IconRefresh = (props) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
const IconEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
const IconFileText = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
const IconCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IconX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconLogIn = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
const IconLogOut = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
const IconEye = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const IconEyeOff = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>

const DASHBOARD_CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  currencySign: 'accounting',
  maximumFractionDigits: 2
})

const COMMON_BUDGET_CATEGORIES = [
  'Housing',
  'Utilities',
  'Groceries',
  'Dining',
  'Transportation',
  'Fuel',
  'Insurance',
  'Healthcare',
  'Debt Payment',
  'Savings',
  'Investments',
  'Income',
  'Entertainment',
  'Travel',
  'Education',
  'Childcare',
  'Pets',
  'Gifts',
  'Personal Care',
  'Miscellaneous'
]

const DEFAULT_PERSONA_NAMES = ['User']
const DEFAULT_PERSONA_NAME = 'User'
const DEFAULT_PERSONA_EMOJI = '=���G��=��+'
const PERSONA_EMOJI_OPTIONS = ['=���G��=��+', '=��', '=��', '=��', '=��', '=��', '=��', '=���', '=��G��=��+', '=��G��=��+', '=��G��=���', '=��G��=���', '=��G��=�Ž', '=��G��=�Ž', '=��G��G��n+�', '=��G��G��n+�', '=���G��=���', '=���G��=��', '=���G��=��+', '=���G��=�Ŀ']

const ENABLE_FIREBASE_SYNC_UI = false
const SYNC_STATUS_TONE_NEUTRAL = 'neutral'
const SYNC_STATUS_TONE_WARNING = 'warning'
const SYNC_STATUS_TONE_SUCCESS = 'success'
const SYNC_KIND_AUTH = 'AUTH'
const SYNC_KIND_NETWORK = 'NETWORK'
const SYNC_KIND_NOT_FOUND = 'NOT_FOUND'
const SYNC_MSG_IDLE = 'API sync idle.'
const SYNC_MSG_DEFAULT_ERROR = 'API sync operation failed.'
const SYNC_MSG_CONFIG_REQUIRED = 'API sync config must be an object.'
const SYNC_MSG_DISABLED = 'API sync is disabled. Enable it to authenticate and sync.'
const SYNC_MSG_CONFIG_VALID = 'API sync config looks valid.'
const SYNC_MSG_AUTH_HINT = 'Login required. Use your admin password.'
const SYNC_MSG_NETWORK_HINT = 'Check API server availability and auth session.'
const SYNC_MSG_NOT_FOUND_HINT = 'No remote profile exists yet for this user.'
const SYNC_MSG_SAVING_CONFIG = 'Saving API sync config...'
const SYNC_MSG_CONFIG_SAVED = 'API sync config saved.'
const SYNC_MSG_VERIFYING = 'Authenticating password...'
const SYNC_MSG_OTP_REQUIRED = 'Enter password first.'
const SYNC_MSG_SESSION_ACTIVE = 'API session active.'
const SYNC_MSG_NO_SESSION = 'No active API session.'
const SYNC_MSG_SIGNING_OUT = 'Signing out from API session...'
const SYNC_MSG_SIGNED_OUT = 'Signed out from API session.'
const SYNC_MSG_PUSH_START = 'API push started...'
const SYNC_MSG_PUSH_START_DETAIL = 'Writing profile to SQLite via /api/budget/profile.'
const SYNC_MSG_PUSH_DONE = 'Push to API completed.'
const SYNC_MSG_PULL_START = 'API pull started...'
const SYNC_MSG_PULL_START_DETAIL = 'Loading latest profile from /api/budget/profile.'
const SYNC_MSG_PULL_DONE = 'Pull from API completed.'
const SYNC_MSG_PULL_DONE_DETAIL = 'Local profile updated from remote snapshot.'
const SYNC_SECTION_TITLE = 'API Sync'
const SYNC_SECTION_DESC = 'Authenticate with admin password and sync profile JSON to your API + SQLite.'
const SYNC_LABEL_ENABLED = 'Enabled'
const SYNC_LABEL_ADMIN_PASSWORD = 'Admin Password'
const SYNC_BTN_SAVE_CONFIG = 'Save Sync Setting'
const SYNC_BTN_CONNECT = 'Connect'
const SYNC_BTN_REFRESH_SESSION = 'Refresh Session'
const SYNC_BTN_DISCONNECT = 'Disconnect'
const SYNC_BTN_PUSH = 'Push API'
const SYNC_BTN_PULL = 'Pull API'
const SYNC_PROGRESS_TEXT = 'Sync in progress...'
const API_SYNC_STORAGE_NOTE = 'Remote profile is stored in API SQLite tables: budget_profile_current + budget_profile_history.'
const SYNC_AUTH_NOT_SIGNED_IN = 'Not signed in'
const SYNC_NOTICE_HIDE_DELAY_MS = 2200
const SYNC_NOTICE_TONE_SUCCESS = 'success'
const SYNC_NOTICE_TONE_FAILURE = 'failure'
const SYNC_NOTICE_CONNECT_SUCCESS = 'API session connected.'
const SYNC_NOTICE_CONNECT_FAILURE = 'Could not connect API session.'
const SYNC_NOTICE_PUSH_SUCCESS = 'Profile synced to API.'
const SYNC_NOTICE_PUSH_FAILURE = 'API push failed.'
const SYNC_NOTICE_PULL_SUCCESS = 'Profile loaded from API.'
const SYNC_NOTICE_PULL_FAILURE = 'API pull failed.'

function normalizePersonaNameForDisplay(rawName) {
  const sourceName = typeof rawName === 'string' ? rawName.trim() : ''
  if (!sourceName) return DEFAULT_PERSONA_NAME
  return sourceName
    .toLowerCase()
    .split(/\s+/)
    .filter((partValue) => partValue.length > 0)
    .map((partValue) => `${partValue.slice(0, 1).toUpperCase()}${partValue.slice(1)}`)
    .join(' ')
}

function formatPersonaLabelWithEmoji(personName, emojiByName) {
  const normalizedName = normalizePersonaNameForDisplay(personName)
  const normalizedKey = normalizedName.toLowerCase()
  const resolvedEmoji = emojiByName.get(normalizedKey) ?? DEFAULT_PERSONA_EMOJI
  return `${resolvedEmoji} ${normalizedName}`
}

function buildInitialIncomeExpenseEntryFormState() {
  const todayIsoDate = new Date().toISOString().slice(0, 10)
  return {
    person: DEFAULT_PERSONA_NAME,
    customPerson: '',
    recordType: 'expense',
    amount: '',
    category: '',
    customCategory: '',
    item: '',
    minimumPayment: '',
    monthlyPayment: '',
    interestRatePercent: '',
    remainingPayments: '',
    loanStartDate: '',
    collateralAssetName: '',
    collateralAssetMarketValue: '',
    maxCapacity: '',
    currentBalance: '',
    date: todayIsoDate,
    description: ''
  }
}

function buildInitialGoalEntryFormState() {
  return { title: '', status: 'not started', timeframeMonths: '12', description: '' }
}

function buildInitialPersonaEntryFormState() {
  return { name: '', note: '', emojiPreset: DEFAULT_PERSONA_EMOJI, customEmoji: '' }
}

function buildInitialPersonaCrudFormState() {
  return {
    personaName: '',
    mode: 'edit',
    nextName: '',
    nextNote: '',
    nextEmojiPreset: DEFAULT_PERSONA_EMOJI,
    nextCustomEmoji: '',
    reassignToPersonaName: DEFAULT_PERSONA_NAME,
    deleteConfirmText: ''
  }
}

function buildInitialProfileTransferFormState() {
  return { mode: 'export', jsonText: '' }
}

function buildInitialSupabaseSyncFormState() {
  return {
    enabled: false,
    password: ''
  }
}

function buildInitialSupabaseSyncStatusState() {
  return { tone: SYNC_STATUS_TONE_NEUTRAL, message: SYNC_MSG_IDLE, detail: '' }
}

function validateSupabaseSyncConfigShapeForClientUsage(supabaseConfig) {
  if (!supabaseConfig || typeof supabaseConfig !== 'object') return [false, SYNC_MSG_CONFIG_REQUIRED]
  if (supabaseConfig.enabled !== true) return [false, SYNC_MSG_DISABLED]
  return [true, SYNC_MSG_CONFIG_VALID]
}

function buildSupabaseUiStatusFromError(errorValue) {
  const safeError = errorValue && typeof errorValue === 'object' ? errorValue : {}
  const kind = typeof safeError.kind === 'string' ? safeError.kind : 'UNKNOWN'
  const rawMessage = typeof safeError.message === 'string' ? safeError.message : SYNC_MSG_DEFAULT_ERROR
  const details = safeError.details && typeof safeError.details === 'object' ? safeError.details : {}
  const detailText = (() => {
    const knownKeys = ['otpFailure', 'otpError', 'readFailure', 'writeFailure', 'insertFailure', 'upsertError', 'insertError', 'pullError']
    for (const keyName of knownKeys) {
      const value = details[keyName]
      if (value && typeof value === 'object') {
        const code = typeof value.code === 'string' ? value.code : ''
        const message = typeof value.message === 'string' ? value.message : ''
        const combined = `${code} ${message}`.trim()
        if (combined) return combined
      }
    }
    return ''
  })()
  if (kind === SYNC_KIND_AUTH) return { tone: SYNC_STATUS_TONE_WARNING, message: rawMessage, detail: detailText || SYNC_MSG_AUTH_HINT }
  if (kind === SYNC_KIND_NETWORK) return { tone: SYNC_STATUS_TONE_WARNING, message: rawMessage, detail: detailText || SYNC_MSG_NETWORK_HINT }
  if (kind === SYNC_KIND_NOT_FOUND) return { tone: SYNC_STATUS_TONE_NEUTRAL, message: rawMessage, detail: SYNC_MSG_NOT_FOUND_HINT }
  return { tone: SYNC_STATUS_TONE_WARNING, message: rawMessage, detail: detailText || '' }
}

function buildInitialFirebaseSyncFormState() {
  return {
    enabled: false,
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  }
}

function buildInitialFirebaseSyncStatusState() {
  return { tone: 'neutral', message: 'Firebase status idle.', detail: '' }
}

function validateFirebaseSyncConfigShapeForClientUsage(firebaseConfig) {
  const config = buildFirebaseSyncConfigWithRequiredDefaults(firebaseConfig)
  if (config.enabled !== true) return [false, 'Firebase is disabled. Enable it to sign in and sync.']
  const requiredFields = [
    ['projectId', config.projectId],
    ['apiKey', config.apiKey],
    ['authDomain', config.authDomain],
    ['appId', config.appId]
  ]
  for (const [fieldName, fieldValue] of requiredFields) {
    if (typeof fieldValue !== 'string' || fieldValue.trim().length === 0) return [false, `Missing Firebase ${fieldName}.`]
  }
  if (!config.authDomain.includes('.')) return [false, 'Auth domain looks invalid.']
  if (config.projectId.includes(' ')) return [false, 'Project ID cannot contain spaces.']
  return [true, 'Firebase config looks valid for client auth.']
}

function buildFirebaseUiStatusFromError(errorValue) {
  const safeError = errorValue && typeof errorValue === 'object' ? errorValue : {}
  const kind = typeof safeError.kind === 'string' ? safeError.kind : 'UNKNOWN'
  const details = safeError.details && typeof safeError.details === 'object' ? safeError.details : {}
  const rawDetailsText = (() => {
    const popupFailure = details.popupFailure
    if (popupFailure && typeof popupFailure === 'object') {
      const popupCode = typeof popupFailure.code === 'string' ? popupFailure.code : ''
      const popupMessage = typeof popupFailure.message === 'string' ? popupFailure.message : ''
      return `${popupCode} ${popupMessage}`.trim()
    }
    return ''
  })()
  const detailCode = typeof details.popupFailureCode === 'string'
    ? details.popupFailureCode
    : (typeof details.writeFailureCode === 'string' ? details.writeFailureCode : (typeof details.readFailureCode === 'string' ? details.readFailureCode : ''))
  const detailMessage = typeof details.popupFailureMessage === 'string'
    ? details.popupFailureMessage
    : (typeof details.writeFailureMessage === 'string' ? details.writeFailureMessage : (typeof details.readFailureMessage === 'string' ? details.readFailureMessage : ''))
  const rawMessage = typeof safeError.message === 'string' ? safeError.message : 'Firebase operation failed.'
  const normalizedDetail = `${detailCode} ${detailMessage} ${rawDetailsText}`.trim()

  if (kind === 'VALIDATION') return { tone: 'warning', message: rawMessage, detail: normalizedDetail || 'Check Firebase config fields in this modal.' }
  if (kind === 'AUTH') {
    const hasConfigurationHint = normalizedDetail.toUpperCase().includes('CONFIGURATION_NOT_FOUND') || rawMessage.toUpperCase().includes('CONFIGURATION_NOT_FOUND')
    if (hasConfigurationHint) {
      return { tone: 'warning', message: 'Firebase auth configuration is missing in the project.', detail: 'Enable Google provider in Firebase Auth and add this origin in Authorized domains.' }
    }
    return { tone: 'warning', message: rawMessage, detail: normalizedDetail || 'Complete Google sign-in and auth setup in Firebase Console.' }
  }
  if (kind === 'NETWORK') return { tone: 'warning', message: rawMessage, detail: normalizedDetail || 'Check Firestore rules and network access.' }
  return { tone: 'warning', message: rawMessage, detail: normalizedDetail }
}

function buildFirebaseSyncConfigWithRequiredDefaults(rawConfig) {
  const defaults = buildInitialFirebaseSyncFormState()
  const nextConfig = { ...defaults, ...(rawConfig || {}) }
  return {
    ...nextConfig,
    enabled: nextConfig.enabled === true,
    apiKey: typeof nextConfig.apiKey === 'string' && nextConfig.apiKey.trim().length > 0 ? nextConfig.apiKey.trim() : defaults.apiKey,
    authDomain: typeof nextConfig.authDomain === 'string' && nextConfig.authDomain.trim().length > 0 ? nextConfig.authDomain.trim() : defaults.authDomain,
    projectId: typeof nextConfig.projectId === 'string' && nextConfig.projectId.trim().length > 0 ? nextConfig.projectId.trim() : defaults.projectId,
    appId: typeof nextConfig.appId === 'string' && nextConfig.appId.trim().length > 0 ? nextConfig.appId.trim() : defaults.appId,
    storageBucket: typeof nextConfig.storageBucket === 'string' && nextConfig.storageBucket.trim().length > 0 ? nextConfig.storageBucket.trim() : defaults.storageBucket,
    messagingSenderId: typeof nextConfig.messagingSenderId === 'string' && nextConfig.messagingSenderId.trim().length > 0 ? nextConfig.messagingSenderId.trim() : defaults.messagingSenderId
  }
}

function buildInitialAssetHoldingEntryFormState() {
  const todayIsoDate = new Date().toISOString().slice(0, 10)
  return { person: DEFAULT_PERSONA_NAME, customPerson: '', item: '', assetValueOwed: '', assetMarketValue: '', description: '', date: todayIsoDate }
}

function buildInitialLoanCalculatorFormState() {
  return {
    selectedLoanKey: '',
    principalBalance: '10000',
    annualInterestRatePercent: '12',
    baseMonthlyPayment: '300',
    extraMonthlyPayment: '100'
  }
}

function buildInitialEditRecordFormState() {
  return {
    collectionName: '',
    recordId: '',
    person: '',
    customPerson: '',
    item: '',
    category: '',
    customCategory: '',
    amount: '',
    minimumPayment: '',
    interestRatePercent: '',
    remainingPayments: '',
    loanStartDate: '',
    collateralAssetName: '',
    collateralAssetMarketValue: '',
    creditLimit: '',
    maxCapacity: '',
    currentBalance: '',
    monthlyPayment: '',
    assetValueOwed: '',
    assetMarketValue: '',
    date: '',
    description: ''
  }
}

function buildInitialRecordNotesFormState() {
  return {
    collectionName: '',
    recordId: '',
    recordLabel: '',
    notes: ''
  }
}

function readHasAnyMeaningfulFinancialRowsInCollections(collectionsState) {
  if (!collectionsState || typeof collectionsState !== 'object') return false
  if (Array.isArray(collectionsState.records) && collectionsState.records.length > 0) return true
  if (Array.isArray(collectionsState.instruments) && collectionsState.instruments.length > 0) return true
  // Fallback for v2 state
  const collectionNames = ['income', 'expenses', 'assets', 'assetHoldings', 'debts', 'credit', 'creditCards', 'loans']
  return collectionNames.some((collectionName) => Array.isArray(collectionsState[collectionName]) && collectionsState[collectionName].length > 0)
}

function buildEmptyBudgetCollectionsStateForHardReset() {
  return {
    records: [],
    instruments: [],
    goals: [],
    personas: [{ id: `persona-reset-${Date.now()}`, name: DEFAULT_PERSONA_NAME, emoji: DEFAULT_PERSONA_EMOJI, note: '', updatedAt: new Date().toISOString() }],
    notes: [],
    schemaVersion: 3
  }
}

const DEFAULT_TABLE_SORT_STATE = {
  goals: { key: 'timeframeMonths', direction: 'asc' },
  debts: { key: 'amount', direction: 'desc' },
  credit: { key: 'currentBalance', direction: 'desc' },
  assets: { key: 'value', direction: 'desc' },
  savings: { key: 'balance', direction: 'desc' },
  detailed: { key: 'metric', direction: 'asc' },
  records: { key: 'updatedAt', direction: 'desc' }
}

function formatCurrencyValueForDashboard(value) {
  return DASHBOARD_CURRENCY_FORMATTER.format(value)
}

function formatSignedCurrencyDeltaForMetadata(value) {
  const signPrefix = value > 0 ? '+' : ''
  return `${signPrefix}${formatCurrencyValueForDashboard(value)}`
}

function formatDashboardDatapointValueByFormat(value, valueFormat) {
  if (valueFormat === 'currency') return formatCurrencyValueForDashboard(value)
  if (valueFormat === 'percent') return `${value.toFixed(2)}%`
  if (valueFormat === 'duration') return `${value.toFixed(1)} months`
  return `${Math.round(value)}`
}

function formatPlainNumericValueForDashboard(value, valueFormat) {
  if (valueFormat === 'count') return `${Math.round(value)}`
  return value.toFixed(2)
}

function formatProjectedPayoffDateFromMonthsOffset(monthsOffset) {
  if (!Number.isFinite(monthsOffset) || monthsOffset <= 0) return '-'
  if (monthsOffset >= 9999) return 'Not reachable'
  const projectedDate = new Date()
  projectedDate.setMonth(projectedDate.getMonth() + Math.ceil(monthsOffset))
  return projectedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
}

function renderIconGlyphForAction(actionName) {
  if (actionName === 'edit') return <IconEdit />
  if (actionName === 'notes') return <IconFileText />
  if (actionName === 'delete') return <IconTrash />
  return 'G��'
}

const NUMERIC_SORT_KEYS = new Set([
  'amount',
  'minimumPayment',
  'interestRatePercent',
  'remainingPayments',
  'collateralAssetMarketValue',
  'maxCapacity',
  'currentBalance',
  'monthlyPayment',
  'assetValueOwed',
  'assetMarketValue',
  'creditLimit',
  'balance',
  'allocationPercent',
  'value',
  'timeframeMonths',
  'targetAmount',
  'currentAmount',
  'signedAmount'
])
const NUMERIC_TEXT_SANITIZER_REGEX = /[$,%\s,()]/g

/**
 * Returns true when a record has not been updated in the last 3 months.
 * Uses updatedAt first, then date as fallback for legacy rows.
 * @param {Record<string, unknown>} recordItem
 * @returns {boolean}
 */
function readIsRecordOlderThanThreeMonths(recordItem) {
  const rawTimestamp = typeof recordItem.updatedAt === 'string'
    ? recordItem.updatedAt
    : (typeof recordItem.date === 'string' ? recordItem.date : '')
  if (!rawTimestamp) return false
  const recordDate = new Date(rawTimestamp)
  if (Number.isNaN(recordDate.getTime())) return false
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  return recordDate < threeMonthsAgo
}

function renderStaleUpdateIconIfNeeded(recordItem) {
  if (!readIsRecordOlderThanThreeMonths(recordItem)) return null
  return (
    <span className="ml-2 inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-400" title="Record has not been updated in at least 3 months.">
      <svg className="mr-1 h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 8v5l3 2" />
        <circle cx="12" cy="12" r="9" />
      </svg>
      stale
    </span>
  )
}

function readComparableValueFromRowByKey(rowValue, keyName) {
  const value = rowValue[keyName]
  if (NUMERIC_SORT_KEYS.has(keyName)) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const trimmedValue = value.trim()
      const normalizedNumericText = trimmedValue.replace(NUMERIC_TEXT_SANITIZER_REGEX, (token) => (token === '(' ? '-' : ''))
      const parsedNumericValue = Number(normalizedNumericText)
      return Number.isFinite(parsedNumericValue) ? parsedNumericValue : 0
    }
    return 0
  }
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    if (trimmedValue.length > 0) {
      const normalizedNumericText = trimmedValue.replace(NUMERIC_TEXT_SANITIZER_REGEX, (token) => (token === '(' ? '-' : ''))
      const parsedNumericValue = Number(normalizedNumericText)
      if (Number.isFinite(parsedNumericValue)) return parsedNumericValue
    }
    return trimmedValue.toLowerCase()
  }
  return ''
}

function buildRowsSortedByKeyAndDirection(rowCollection, keyName, direction) {
  const decoratedRows = rowCollection.map((rowItem) => ({
    rowItem,
    comparableValue: readComparableValueFromRowByKey(rowItem, keyName)
  }))
  const sortedRows = decoratedRows.sort((leftRow, rightRow) => {
    const leftValue = leftRow.comparableValue
    const rightValue = rightRow.comparableValue
    if (leftValue === rightValue) return 0
    if (direction === 'asc') return leftValue > rightValue ? 1 : -1
    return leftValue < rightValue ? 1 : -1
  })
  return sortedRows.map((item) => item.rowItem)
}

function renderHoverMetadataBoxForElement(props) {
  const { label, lines, children, className = '', boxClassName = '' } = props
  const displayLabel = label.endsWith(' Metadata') ? label.slice(0, -9) : label
  const firstLine = Array.isArray(lines) && lines.length > 0 ? String(lines[0]) : ''
  const detailLines = Array.isArray(lines) ? lines.slice(1) : []
  const statusTone = firstLine.startsWith('Good') ? 'good'
    : firstLine.startsWith('Watch') ? 'watch'
    : (firstLine.startsWith('Risk') || firstLine.startsWith('Gap')) ? 'risk'
    : null
  const dotColor = statusTone === 'good' ? '#34d399' : statusTone === 'watch' ? '#fbbf24' : statusTone === 'risk' ? '#f87171' : '#64748b'
  const statusTextColor = statusTone === 'good' ? '#6ee7b7' : statusTone === 'watch' ? '#fcd34d' : statusTone === 'risk' ? '#fca5a5' : '#cbd5e1'
  return (
    <div className={`meta-hover group relative ${className}`}>
      {children}
      <aside className={`meta-hover-popup ${boxClassName}`}>
        <p className="meta-hover-popup-header">{displayLabel}</p>
        {firstLine ? (
          <div className="meta-hover-popup-status">
            <span className="meta-hover-popup-dot" style={{ background: dotColor }} />
            <p className="meta-hover-popup-status-text" style={{ color: statusTextColor }}>{firstLine}</p>
          </div>
        ) : null}
        {detailLines.length > 0 ? (
          <ul className="meta-hover-popup-details">
            {detailLines.map((lineItem, lineIndex) => (
              <li key={`${label}-${lineIndex}-${lineItem}`} className="meta-hover-popup-detail-item">
                <span className="meta-hover-popup-detail-dot" />
                <span className="meta-hover-popup-detail-text">{lineItem}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </aside>
    </div>
  )
}

function renderMetadataTableHeaderCell(props) {
  const { label, lines, columnLabel, isRightAligned = false } = props
  const displayLabel = label.endsWith(' Metadata') ? label.slice(0, -9) : label
  const firstLine = Array.isArray(lines) && lines.length > 0 ? String(lines[0]) : ''
  const detailLines = Array.isArray(lines) ? lines.slice(1) : []
  const statusTone = firstLine.startsWith('Good') ? 'good'
    : firstLine.startsWith('Watch') ? 'watch'
    : (firstLine.startsWith('Risk') || firstLine.startsWith('Gap')) ? 'risk'
    : null
  const dotColor = statusTone === 'good' ? '#34d399' : statusTone === 'watch' ? '#fbbf24' : statusTone === 'risk' ? '#f87171' : '#64748b'
  const statusTextColor = statusTone === 'good' ? '#6ee7b7' : statusTone === 'watch' ? '#fcd34d' : statusTone === 'risk' ? '#fca5a5' : '#cbd5e1'
  return (
    <th className={`px-3 py-2 font-semibold ${isRightAligned ? 'text-right' : 'text-left'}`}>
      <span className="meta-hover group relative inline-flex">
        <span>{columnLabel}</span>
        <aside className="meta-hover-popup">
          <p className="meta-hover-popup-header">{displayLabel}</p>
          {firstLine ? (
            <div className="meta-hover-popup-status">
              <span className="meta-hover-popup-dot" style={{ background: dotColor }} />
              <p className="meta-hover-popup-status-text" style={{ color: statusTextColor }}>{firstLine}</p>
            </div>
          ) : null}
          {detailLines.length > 0 ? (
            <ul className="meta-hover-popup-details">
              {detailLines.map((lineItem, lineIndex) => (
                <li key={`${label}-${lineIndex}-${lineItem}`} className="meta-hover-popup-detail-item">
                  <span className="meta-hover-popup-detail-dot" />
                  <span className="meta-hover-popup-detail-text">{lineItem}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
      </span>
    </th>
  )
}

function buildOverviewHoverContextLinesForMetric(metricRow, sourceBreakdown, emergencyFundSummary) {
  const metricLabel = typeof metricRow.metric === 'string' ? metricRow.metric : 'Metric'
  const metricValue = typeof metricRow.value === 'number' ? metricRow.value : 0

  if (metricLabel === 'Net Worth') {
    const status = metricValue >= 0 ? 'Good: positive net worth.' : 'Risk: liabilities exceed assets.'
    return [
      status,
      `Assets this month: ${formatCurrencyValueForDashboard(sourceBreakdown.assets.currentMonth)}`,
      `Liabilities this month: ${formatCurrencyValueForDashboard(sourceBreakdown.liabilities.currentMonth)}`,
      `Change vs last month: ${formatSignedCurrencyDeltaForMetadata(sourceBreakdown.netWorth.delta)}`
    ]
  }
  if (metricLabel === 'Credit Card Utilization') {
    const status = metricValue <= 30 ? 'Good: at or below 30% utilization.' : (metricValue <= 50 ? 'Watch: above 30% utilization.' : 'Risk: very high utilization.')
    return [status, 'Target: keep below 30% (ideal below 10%).', `Current utilization: ${metricValue.toFixed(2)}%.`, 'Higher utilization can increase borrowing cost and score pressure.']
  }
  if (metricLabel === 'Debt to Income Ratio') {
    const status = metricValue <= 36 ? 'Good: within common affordability target.' : (metricValue <= 43 ? 'Watch: elevated debt burden.' : 'Risk: high debt burden.')
    return [status, 'Target: below 36% (common underwriting comfort).', `Current DTI: ${metricValue.toFixed(2)}%.`, 'Lowering minimum debt obligations improves resilience.']
  }
  if (metricLabel === 'Savings Rate') {
    const status = metricValue >= 20 ? 'Good: strong savings rate.' : (metricValue >= 0 ? 'Watch: positive but low savings rate.' : 'Risk: negative savings rate.')
    return [status, 'Target: 20%+ if possible, minimum positive trend.', `Current savings rate: ${metricValue.toFixed(2)}%.`, 'Negative values mean expenses are exceeding income.']
  }
  if (metricLabel === 'Emergency Funds') {
    const liquidAmount = typeof emergencyFundSummary?.liquidAmount === 'number' ? emergencyFundSummary.liquidAmount : 0
    const investedAmount = typeof emergencyFundSummary?.investedAmount === 'number' ? emergencyFundSummary.investedAmount : 0
    const totalCoverageMonths = typeof emergencyFundSummary?.totalCoverageMonths === 'number' ? emergencyFundSummary.totalCoverageMonths : 0
    const recurringEssentialExpenses = typeof emergencyFundSummary?.monthlyExpenses === 'number' ? emergencyFundSummary.monthlyExpenses : 0
    const nonCreditCardDebtMinimums = typeof emergencyFundSummary?.monthlyDebtMinimums === 'number' ? emergencyFundSummary.monthlyDebtMinimums : 0
    const status = totalCoverageMonths >= 3 ? 'Good: at least 3-month baseline coverage likely.' : 'Watch: emergency reserve may be thin.'
    return [status, 'Target: 6 months of recurring essential expenses plus non-credit-card debt minimums.', `Recurring essentials used: ${formatCurrencyValueForDashboard(recurringEssentialExpenses)}. Debt minimums used: ${formatCurrencyValueForDashboard(nonCreditCardDebtMinimums)}.`, `Liquid emergency funds: ${formatCurrencyValueForDashboard(liquidAmount)}. Invested emergency funds: ${formatCurrencyValueForDashboard(investedAmount)}.`]
  }
  if (metricLabel === 'Months Until Debt-Free') {
    const status = metricValue <= 24 ? 'Good: short payoff horizon.' : (metricValue <= 60 ? 'Watch: medium payoff horizon.' : 'Risk: long payoff horizon.')
    return [status, 'Lower is better for debt freedom pace.', `Estimated payoff timeline: ${metricValue.toFixed(1)} months.`, 'Increasing monthly payments shortens this timeline fastest.']
  }
  if (metricLabel === 'Monthly Savings') {
    const status = metricValue >= 0 ? 'Good: positive monthly savings.' : 'Risk: monthly deficit.'
    return [status, `Current value: ${formatCurrencyValueForDashboard(metricValue)}.`, 'Positive monthly savings supports goals and emergency reserves.', 'Deficits usually require expense cuts or income growth.']
  }
  if (metricLabel === 'Total Debts') {
    const status = metricValue <= 0 ? 'Good: no tracked liabilities.' : 'Watch: active liabilities require ongoing management.'
    return [status, `Current liabilities: ${formatCurrencyValueForDashboard(metricValue)}.`, 'Track trend month-over-month for reduction momentum.', 'Pair payoff strategy with APR and utilization priorities.']
  }
  if (metricLabel === 'Credit Card Debt') {
    const status = metricValue <= 1000 ? 'Good: low revolving debt.' : (metricValue <= 5000 ? 'Watch: moderate revolving debt.' : 'Risk: high revolving debt.')
    return [status, 'Lower revolving balances reduce interest drag.', `Current credit card debt: ${formatCurrencyValueForDashboard(metricValue)}.`, 'Priority: pay highest APR card first.']
  }
  if (metricLabel === 'Credit Card Capacity') {
    const status = metricValue >= 10000 ? 'Good: strong available capacity.' : (metricValue >= 3000 ? 'Watch: moderate capacity.' : 'Risk: thin credit buffer.')
    return [status, `Current total capacity: ${formatCurrencyValueForDashboard(metricValue)}.`, 'More capacity can improve utilization if spending stays controlled.', 'Avoid increasing limits if it drives more debt usage.']
  }
  if (metricLabel === 'Monthly Debt Payback') {
    const status = metricValue <= sourceBreakdown.income.currentMonth * 0.2 ? 'Good: manageable debt payment load.' : (metricValue <= sourceBreakdown.income.currentMonth * 0.35 ? 'Watch: elevated debt payment load.' : 'Risk: heavy debt payment load.')
    return [status, 'Target: debt payback below ~20-35% of income.', `Current monthly debt payback: ${formatCurrencyValueForDashboard(metricValue)}.`, 'Restructure high payments to improve cash flexibility.']
  }
  if (metricLabel === 'Income After Debt Minimums') {
    const status = metricValue >= 2000 ? 'Good: strong post-debt cash buffer.' : (metricValue >= 500 ? 'Watch: limited post-debt buffer.' : 'Risk: minimal post-debt buffer.')
    return [status, `Current post-debt income: ${formatCurrencyValueForDashboard(metricValue)}.`, 'Higher buffer supports saving and shocks.', 'If low, reduce fixed costs or boost income.']
  }
  if (metricLabel === 'Monthly Expenses') {
    const ratio = sourceBreakdown.income.currentMonth > 0 ? (metricValue / sourceBreakdown.income.currentMonth) * 100 : 0
    const status = ratio <= 70 ? 'Good: spending ratio is controlled.' : (ratio <= 90 ? 'Watch: spending ratio is elevated.' : 'Risk: spending ratio is too high.')
    return [status, `Expense-to-income ratio: ${ratio.toFixed(2)}%.`, `Current monthly expenses: ${formatCurrencyValueForDashboard(metricValue)}.`, 'Target: keep below 70-80% when possible.']
  }
  if (metricLabel === 'Monthly Income') {
    const status = metricValue >= 7000 ? 'Good: strong monthly income base.' : (metricValue >= 4000 ? 'Watch: moderate monthly income base.' : 'Risk: low monthly income base.')
    return [status, `Current monthly income: ${formatCurrencyValueForDashboard(metricValue)}.`, 'Use stability and growth of this metric as a core health signal.', 'Diversified income streams reduce volatility risk.']
  }
  if (metricLabel === 'Yearly Income') {
    const status = metricValue >= 100000 ? 'Good: six-figure annual income range.' : (metricValue >= 60000 ? 'Watch: stable mid-range annual income.' : 'Risk: tighter annual income range.')
    return [status, `Current annualized income: ${formatCurrencyValueForDashboard(metricValue)}.`, 'Compare liabilities and goals against annual income scale.', 'Higher annual income improves refinancing and savings options.']
  }
  if (metricLabel === 'Emergency Funds Goal') {
    const recurringEssentialExpenses = typeof emergencyFundSummary?.monthlyExpenses === 'number' ? emergencyFundSummary.monthlyExpenses : 0
    const totalRecordedExpenses = typeof emergencyFundSummary?.totalRecordedExpenses === 'number' ? emergencyFundSummary.totalRecordedExpenses : 0
    const nonCreditCardDebtMinimums = typeof emergencyFundSummary?.monthlyDebtMinimums === 'number' ? emergencyFundSummary.monthlyDebtMinimums : 0
    const monthlyObligations = typeof emergencyFundSummary?.monthlyObligations === 'number' ? emergencyFundSummary.monthlyObligations : 0
    const status = metricValue > 0 ? 'Target: this is your 6-month reserve benchmark.' : 'Risk: emergency goal is not defined.'
    return [
      status,
      `Formula: 6 x ${formatCurrencyValueForDashboard(monthlyObligations)} = ${formatCurrencyValueForDashboard(metricValue)}.`,
      `Recurring essentials: ${formatCurrencyValueForDashboard(recurringEssentialExpenses)}. Non-credit-card debt minimums: ${formatCurrencyValueForDashboard(nonCreditCardDebtMinimums)}.`,
      `All recorded expenses were ${formatCurrencyValueForDashboard(totalRecordedExpenses)}; discretionary and credit-card minimums are not used in this goal.`
    ]
  }
  if (metricLabel === 'Emergency Fund Gap') {
    const monthlyObligations = typeof emergencyFundSummary?.monthlyObligations === 'number' ? emergencyFundSummary.monthlyObligations : 0
    const status = metricValue > 0 ? 'Gap: this is the amount still needed to fully fund 6 months.' : 'Good: emergency fund target is currently met.'
    return [status, `Current shortfall: ${formatCurrencyValueForDashboard(metricValue)}.`, `Goal is based on ${formatCurrencyValueForDashboard(monthlyObligations)} per month of recurring essential obligations.`, 'Reduce this gap with recurring monthly emergency contributions.']
  }
  if (metricLabel === 'Goals Completed') {
    const status = metricValue >= 10 ? 'Good: strong execution pace.' : (metricValue >= 3 ? 'Watch: moderate completion pace.' : 'Risk: low completion pace.')
    return [status, `Completed goals: ${Math.round(metricValue)}.`, 'Pair with in-progress goals to assess momentum.', 'Use monthly milestone check-ins to improve completion rate.']
  }
  if (metricLabel === 'Goals In Progress') {
    const status = metricValue >= 5 ? 'Good: active progress pipeline.' : (metricValue >= 1 ? 'Watch: limited active progress.' : 'Risk: no active goals.')
    return [status, `Goals in progress: ${Math.round(metricValue)}.`, 'Healthy systems keep a few active goals moving at once.', 'Too many active goals can dilute focus.']
  }
  if (metricLabel === 'Goals Not Started') {
    const status = metricValue <= 5 ? 'Good: backlog is manageable.' : (metricValue <= 15 ? 'Watch: backlog is growing.' : 'Risk: backlog is too large.')
    return [status, `Goals not started: ${Math.round(metricValue)}.`, 'Large backlogs reduce execution confidence.', 'Convert backlog items into phased plans.']
  }
  if (metricLabel === 'Travel Goals Completed') {
    const status = metricValue >= 3 ? 'Good: travel goals are advancing well.' : (metricValue >= 1 ? 'Watch: some travel progress exists.' : 'Risk: no travel goals completed yet.')
    return [status, `Travel goals completed: ${Math.round(metricValue)}.`, 'Use budget-safe planning so travel does not delay core goals.', 'Track this alongside savings health metrics.']
  }
  if (metricLabel === 'Travel Goals On Bucket List') {
    const status = metricValue <= 5 ? 'Good: travel backlog is realistic.' : (metricValue <= 10 ? 'Watch: travel backlog is large.' : 'Risk: travel backlog may be unrealistic.')
    return [status, `Travel goals pending: ${Math.round(metricValue)}.`, 'Large lists are fine if sequenced by cost and timing.', 'Prioritize low-cost or high-value trips first.']
  }
  if (metricLabel === 'Weighted Interest Rate') {
    const status = metricValue <= 8 ? 'Good: low blended borrowing cost.' : (metricValue <= 15 ? 'Watch: moderate blended borrowing cost.' : 'Risk: high blended borrowing cost.')
    return [status, 'Target: lower blended rate through payoff/refinance sequencing.', `Current weighted rate: ${metricValue.toFixed(2)}%.`, 'High rates make minimum-only repayment inefficient.']
  }
  if (metricLabel === 'Annual Debt Service') {
    const status = metricValue <= sourceBreakdown.income.currentMonth * 12 * 0.25 ? 'Good: annual debt service is manageable.' : (metricValue <= sourceBreakdown.income.currentMonth * 12 * 0.4 ? 'Watch: annual debt service is elevated.' : 'Risk: annual debt service is high.')
    return [status, `Current annual debt service: ${formatCurrencyValueForDashboard(metricValue)}.`, 'Target: keep annual debt service proportion controlled.', 'Reducing this improves long-term investing capacity.']
  }
  if (metricLabel === 'Debt Paydown Velocity') {
    const status = metricValue >= 5 ? 'Good: fast debt paydown pace.' : (metricValue >= 2 ? 'Watch: moderate debt paydown pace.' : 'Risk: slow debt paydown pace.')
    return [status, `Current paydown velocity: ${metricValue.toFixed(2)}%.`, 'Higher is better if cash flow remains healthy.', 'Add targeted extra payments to accelerate velocity.']
  }
  if (metricLabel === 'Cash Runway After Debt Service') {
    const status = metricValue >= 6 ? 'Good: strong post-debt runway.' : (metricValue >= 3 ? 'Watch: moderate post-debt runway.' : 'Risk: low post-debt runway.')
    return [status, `Current runway after debt: ${metricValue.toFixed(1)} months.`, 'Target: maintain at least 3 months; prefer 6+', 'Runway includes recurring essential expenses and non-credit-card debt minimums.']
  }
  if (metricLabel === 'Emergency Fund Coverage (Months)') {
    const status = metricValue >= 6 ? 'Good: fully funded emergency coverage.' : (metricValue >= 3 ? 'Watch: baseline emergency coverage.' : 'Risk: emergency coverage is low.')
    return [status, `Current coverage: ${metricValue.toFixed(1)} months.`, 'Coverage is against recurring essential expenses plus non-credit-card debt minimums.', 'Target bands: 3 months minimum, 6 months preferred.']
  }
  if (metricLabel === 'Discretionary After Expenses + Debt') {
    const status = metricValue >= 1000 ? 'Good: healthy discretionary capacity.' : (metricValue >= 0 ? 'Watch: thin discretionary capacity.' : 'Risk: negative discretionary cash flow.')
    return [status, `Current discretionary buffer: ${formatCurrencyValueForDashboard(metricValue)}.`, 'Positive buffer supports flexibility and faster payoff.', 'Negative buffer requires immediate budget adjustment.']
  }
  if (metricLabel === 'Projected Net Worth (12 Months)') {
    const status = metricValue >= 0 ? 'Good: projected net worth is positive.' : 'Risk: projected net worth remains negative.'
    return [status, `12-month projection: ${formatCurrencyValueForDashboard(metricValue)}.`, 'Projection assumes current monthly surplus continues.', 'Improve surplus to bend this trajectory upward faster.']
  }

  return [
    `Status: ${metricValue >= 0 ? 'neutral-positive' : 'neutral-negative'} trend.`,
    `Current value: ${formatDashboardDatapointValueByFormat(metricValue, metricRow.valueFormat)}.`,
    metricRow.description,
    'Check trend direction across the last 3 updates for confidence.'
  ]
}

function resolveSavingsRateToneClasses(savingsRatePercent) {
  if (savingsRatePercent >= 20) return { valueClassName: 'text-emerald-400', badgeClassName: 'bg-emerald-500/15 text-emerald-400' }
  if (savingsRatePercent >= 10) return { valueClassName: 'text-amber-400', badgeClassName: 'bg-amber-500/15 text-amber-400' }
  if (savingsRatePercent >= 0) return { valueClassName: 'text-rose-400', badgeClassName: 'bg-rose-500/15 text-rose-400' }
  return { valueClassName: 'text-rose-400', badgeClassName: 'bg-rose-500/15 text-rose-400' }
}

function buildRiskDetailTemplateFromFindingAndPersonas(findingItem, personaNames) {
  const safeId = typeof findingItem.id === 'string' ? findingItem.id : ''
  const safeTitle = typeof findingItem.title === 'string' ? findingItem.title : 'Risk Flag'
  const safeDetail = typeof findingItem.detail === 'string' ? findingItem.detail : 'No detail available.'
  const safeSeverity = typeof findingItem.severity === 'string' ? findingItem.severity : 'medium'
  const safeMetricValue = typeof findingItem.metricValue === 'number' ? findingItem.metricValue : 0
  const defaultPersonaLabel = `${DEFAULT_PERSONA_EMOJI} ${DEFAULT_PERSONA_NAME}`
  const affectedPersonas = personaNames.length > 0 ? personaNames.join(', ') : defaultPersonaLabel
  const primaryPersona = personaNames.length > 0 ? personaNames[0] : defaultPersonaLabel

  const meaningText = `${safeTitle}: ${safeDetail}`
  const impactText = `${safeTitle} can affect ${affectedPersonas} through tighter cash flow, higher financing costs, and reduced flexibility for goals.`

  let fixChecklist = [
    'Validate all related records first (balance, limit, payment, and last-updated date).',
    `Assign one accountable owner (${primaryPersona}) and a 30-day target.`,
    'Track progress for at least 3 updates and only then tighten the target.'
  ]

  if (safeId.includes('util-') || safeTitle.toLowerCase().includes('utilization')) {
    fixChecklist = [
      `Current utilization is ${safeMetricValue.toFixed(2)}%; target below 30% (ideal below 10%).`,
      'Route extra monthly cash to the highest-utilization card first while maintaining all minimums.',
      'Freeze non-essential card spend until utilization trend is down for 3 consecutive updates.'
    ]
  } else if (safeId.includes('dti-') || safeTitle.toLowerCase().includes('debt-to-income') || safeTitle.toLowerCase().includes('debt payment')) {
    fixChecklist = [
      `Current debt burden is ${safeMetricValue.toFixed(2)}%; aim to move below 36% first.`,
      'Restructure high-payment obligations where possible (refinance, term adjust, rate review).',
      'Redirect discretionary spend and incremental income to reduce required monthly obligations.'
    ]
  } else if (safeId.includes('emergency') || safeTitle.toLowerCase().includes('emergency fund')) {
    fixChecklist = [
      'Create an automated emergency-fund transfer on payday before discretionary spending.',
      'Build coverage in stages: 1 month, then 3 months, then 6 months of expenses.',
      'Delay non-essential large purchases until at least baseline (3 months) is funded.'
    ]
  } else if (safeId.includes('secured-ltv') || safeTitle.toLowerCase().includes('loan-to-value')) {
    fixChecklist = [
      `Current secured LTV is ${safeMetricValue.toFixed(2)}%; target below 80% for safer leverage.`,
      'Prioritize principal paydown on the highest-LTV secured debt first.',
      'Update collateral market value quarterly so risk status is based on current estimates.'
    ]
  } else if (safeId.includes('savings') || safeTitle.toLowerCase().includes('savings')) {
    fixChecklist = [
      'Set a minimum monthly savings floor and automate transfer into designated storage accounts.',
      'Use separate buckets: emergency, near-term goals, and long-term investments.',
      'If cash flow is tight, start with 5-10% and ratchet upward every month.'
    ]
  } else if (safeId.includes('liquidity') || safeTitle.toLowerCase().includes('liquidity')) {
    fixChecklist = [
      'Shift a portion of assets into high-liquidity storage (cash/HYSA equivalents).',
      'Lower short-term obligations that require high monthly payments.',
      'Set a liquidity floor policy and alert when balance drops below it.'
    ]
  } else if (safeId.includes('stale') || safeTitle.toLowerCase().includes('stale')) {
    fixChecklist = [
      'Refresh all stale records now; old values make every derived metric less reliable.',
      'Set a monthly update cadence with one owner per section (income, debt, credit, savings).',
      'Use date reminders and mark records stale after 90 days to force review.'
    ]
  }

  return {
    title: safeTitle,
    severity: safeSeverity,
    meaningText,
    impactText,
    fixChecklist
  }
}

function RecordNoteHoverTooltip({ noteText, hasNote, onEditNote }) {
  const [tooltipVisible, setTooltipVisible] = React.useState(false)
  const [tooltipCoords, setTooltipCoords] = React.useState(null)
  const btnRef = React.useRef(null)
  const noteIconSvg = (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  )
  function handleMouseEnter() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setTooltipCoords({ bottom: window.innerHeight - rect.top + 8, right: window.innerWidth - rect.right })
    }
    setTooltipVisible(true)
  }
  const btnStyle = hasNote
    ? { borderColor: tooltipVisible ? 'rgba(251,191,36,0.5)' : 'rgba(251,191,36,0.3)', background: tooltipVisible ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.1)', color: '#fbbf24' }
    : { borderColor: tooltipVisible ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)', background: 'transparent', color: tooltipVisible ? '#71717a' : '#3f3f46' }
  const tooltip = tooltipVisible && hasNote && noteText && tooltipCoords
    ? ReactDOM.createPortal(
        <div style={{ position: 'fixed', bottom: `${tooltipCoords.bottom}px`, right: `${tooltipCoords.right}px`, width: '220px', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 12px', boxShadow: '0 16px 40px rgba(0,0,0,0.7)', zIndex: 9999, pointerEvents: 'none' }} role="tooltip">
          <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#52525b', margin: '0 0 4px' }}>Note</p>
          <p style={{ fontSize: '12px', lineHeight: '1.5', color: '#d4d4d4', whiteSpace: 'pre-wrap', margin: 0 }}>{noteText}</p>
        </div>,
        document.body
      )
    : null
  return (
    <>
      <button
        ref={btnRef}
        aria-label={hasNote ? 'View/edit note' : 'Add note'}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setTooltipVisible(false)}
        onClick={onEditNote}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '6px', border: `1px solid ${btnStyle.borderColor}`, background: btnStyle.background, color: btnStyle.color, cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s, background 0.15s' }}
        type="button"
      >
        {noteIconSvg}
      </button>
      {tooltip}
    </>
  )
}

export default function App() {
  const [defaultCollectionsState, defaultCollectionsStateError] = React.useMemo(
    () => buildDefaultBudgetCollectionsStateForLocalFirstUsage(),
    []
  )
  const [collections, setCollections] = React.useState(defaultCollectionsState)
  const [entryFormState, setEntryFormState] = React.useState(buildInitialIncomeExpenseEntryFormState)
  const [goalEntryFormState, setGoalEntryFormState] = React.useState(buildInitialGoalEntryFormState)
  const [editingGoalId, setEditingGoalId] = React.useState('')
  const [isLoadingState, setIsLoadingState] = React.useState(true)
  const [uiMessage, setUiMessage] = React.useState('')
  const [themeName, setThemeName] = React.useState('dark')
  const [textScaleMultiplier, setTextScaleMultiplier] = React.useState(1)
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = React.useState(false)
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = React.useState(false)
  const [isAddPersonaModalOpen, setIsAddPersonaModalOpen] = React.useState(false)
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = React.useState(false)
  const [personaEntryFormState, setPersonaEntryFormState] = React.useState(buildInitialPersonaEntryFormState)
  const [assetHoldingEntryFormState, setAssetHoldingEntryFormState] = React.useState(buildInitialAssetHoldingEntryFormState)
  const [personaCrudFormState, setPersonaCrudFormState] = React.useState(buildInitialPersonaCrudFormState)
  const [personaDangerBackupState, setPersonaDangerBackupState] = React.useState(null)
  const [isProfileTransferModalOpen, setIsProfileTransferModalOpen] = React.useState(false)
  const [profileTransferFormState, setProfileTransferFormState] = React.useState(buildInitialProfileTransferFormState)
  const [profileDeleteUndoSnapshotJsonText, setProfileDeleteUndoSnapshotJsonText] = React.useState('')
  const [supabaseSyncFormState, setSupabaseSyncFormState] = React.useState(buildInitialSupabaseSyncFormState)
  const [supabaseAuthUserSummary, setSupabaseAuthUserSummary] = React.useState(null)
  const [supabaseSyncStatusState, setSupabaseSyncStatusState] = React.useState(buildInitialSupabaseSyncStatusState)
  const [isSupabaseOperationInFlight, setIsSupabaseOperationInFlight] = React.useState(false)
  const [firebaseSyncFormState, setFirebaseSyncFormState] = React.useState(buildInitialFirebaseSyncFormState)
  const [firebaseAuthUserSummary, setFirebaseAuthUserSummary] = React.useState(null)
  const [firebaseSyncStatusState, setFirebaseSyncStatusState] = React.useState(buildInitialFirebaseSyncStatusState)
  const [isFirebaseOperationInFlight, setIsFirebaseOperationInFlight] = React.useState(false)
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = React.useState(false)
  const [isRecordNotesModalOpen, setIsRecordNotesModalOpen] = React.useState(false)
  const [pendingDeleteRecordTarget, setPendingDeleteRecordTarget] = React.useState(null)
  const [selectedRiskFinding, setSelectedRiskFinding] = React.useState(null)
  const [editRecordFormState, setEditRecordFormState] = React.useState(buildInitialEditRecordFormState)
  const [recordNotesFormState, setRecordNotesFormState] = React.useState(buildInitialRecordNotesFormState)
  const [riskFindings, setRiskFindings] = React.useState([])
  const [isRiskLoading, setIsRiskLoading] = React.useState(false)
  const [isRiskCardsFadingOut, setIsRiskCardsFadingOut] = React.useState(false)
  const [tableSortState, setTableSortState] = React.useState(DEFAULT_TABLE_SORT_STATE)
  const [auditTimelineEntries, setAuditTimelineEntries] = React.useState([])
  const [trendWindowMonths, setTrendWindowMonths] = React.useState(6)
  const [netWorthProjectionProfileId, setNetWorthProjectionProfileId] = React.useState('base')
  const [loanCalculatorFormState, setLoanCalculatorFormState] = React.useState(buildInitialLoanCalculatorFormState)
  const [syncNoticeState, setSyncNoticeState] = React.useState({ tone: '', message: '' })
  const transactionUndoStackRef = React.useRef([])
  const syncNoticeTimeoutRef = React.useRef(/** @type {ReturnType<typeof setTimeout>|null} */ (null))
  const sessionExpiryTimersRef = React.useRef(/** @type {ReturnType<typeof setTimeout>[]} */ ([]))
  const [transactionUndoDepth, setTransactionUndoDepth] = React.useState(0)
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false)
  const [loginPasswordInputValue, setLoginPasswordInputValue] = React.useState('')
  const [loginStatusMessage, setLoginStatusMessage] = React.useState('')
  const [isLoginOperationInFlight, setIsLoginOperationInFlight] = React.useState(false)
  const [isLoginPasswordVisible, setIsLoginPasswordVisible] = React.useState(false)
  const [activeSectionId, setActiveSectionId] = React.useState('overview')
  const [isScrolledPastThreshold, setIsScrolledPastThreshold] = React.useState(false)

  function showSyncNotice(tone, message) {
    if (syncNoticeTimeoutRef.current) {
      clearTimeout(syncNoticeTimeoutRef.current)
    }
    setSyncNoticeState({ tone, message })
    syncNoticeTimeoutRef.current = setTimeout(() => {
      setSyncNoticeState({ tone: '', message: '' })
      syncNoticeTimeoutRef.current = null
    }, SYNC_NOTICE_HIDE_DELAY_MS)
  }

  React.useEffect(() => {
    function handleScrollVisibilityUpdate() {
      setIsScrolledPastThreshold(window.scrollY > 320)
    }
    window.addEventListener('scroll', handleScrollVisibilityUpdate, { passive: true })
    return () => window.removeEventListener('scroll', handleScrollVisibilityUpdate)
  }, [])

  React.useEffect(() => {
    let isMounted = true
    async function loadCollectionsStateIntoComponent() {
      if (defaultCollectionsState && !defaultCollectionsStateError) {
        setCollections(defaultCollectionsState)
        setIsLoadingState(false)
      }
      const [cachedUiPreferences, cachedSupabaseLoadResult, cachedAuditTimeline, cachedState] = await Promise.all([
        loadUiPreferencesFromLocalStorageCache(),
        loadSupabaseWebConfigFromLocalStorageCache(),
        loadAuditTimelineFromLocalStorageCache(),
        loadBudgetCollectionsStateFromLocalStorageCache()
      ])
      if (!isMounted) return

      const [cachedUiPreferencesValue] = cachedUiPreferences
      if (cachedUiPreferencesValue) {
        setThemeName(cachedUiPreferencesValue.themeName)
        setTextScaleMultiplier(cachedUiPreferencesValue.textScaleMultiplier)
        if (cachedUiPreferencesValue.tableSortState && typeof cachedUiPreferencesValue.tableSortState === 'object' && !Array.isArray(cachedUiPreferencesValue.tableSortState)) {
          setTableSortState({
            ...DEFAULT_TABLE_SORT_STATE,
            ...cachedUiPreferencesValue.tableSortState
          })
        }
      }

      const [cachedSupabaseWebConfig, cachedSupabaseWebConfigError] = cachedSupabaseLoadResult
      if (cachedSupabaseWebConfigError) {
        console.warn('[supabase] Failed to load cached supabase config.', cachedSupabaseWebConfigError)
      } else if (cachedSupabaseWebConfig) {
        setSupabaseSyncFormState((previousFormState) => ({ ...previousFormState, ...cachedSupabaseWebConfig }))
      }
      if (ENABLE_FIREBASE_SYNC_UI) {
        const [cachedFirebaseWebConfig, cachedFirebaseWebConfigError] = await loadFirebaseWebConfigFromLocalStorageCache()
        if (!isMounted) return
        if (cachedFirebaseWebConfigError) {
          console.warn('[firebase] Failed to load cached firebase config.', cachedFirebaseWebConfigError)
        } else if (cachedFirebaseWebConfig) {
          const mergedFirebaseConfig = buildFirebaseSyncConfigWithRequiredDefaults(cachedFirebaseWebConfig)
          setFirebaseSyncFormState(mergedFirebaseConfig)
          const [authUserSummary, authUserSummaryError] = await readFirebaseAuthenticatedUserSummary(mergedFirebaseConfig)
          if (!isMounted) return
          if (authUserSummaryError) {
            console.warn('[firebase] Failed to read auth user summary.', authUserSummaryError)
          } else {
            setFirebaseAuthUserSummary(authUserSummary)
          }
        }
      }
      const [cachedAuditTimelineValue, cachedAuditTimelineError] = cachedAuditTimeline
      if (cachedAuditTimelineError) {
        console.warn('[audit] Failed to load cached audit timeline.', cachedAuditTimelineError)
      } else if (Array.isArray(cachedAuditTimelineValue)) {
        setAuditTimelineEntries(cachedAuditTimelineValue)
      }
      const [cachedStateValue, loadError] = cachedState
      if (loadError) {
        console.warn('[state] Failed to load cached collections state.', loadError)
        setUiMessage(loadError.message)
        setIsLoadingState(false)
        return
      }
      if (cachedStateValue) {
        // Critical path: run v2G��v3 schema migration on every load to keep state canonical.
        const [migratedCachedState, migrationError] = migrateCollectionsStateFromV2ToV3(cachedStateValue)
        if (migrationError || !migratedCachedState) {
          console.warn('[state] Failed to migrate cached state to v3.', migrationError)
          setCollections(cachedStateValue)
          setIsLoadingState(false)
          return
        }
        // Persist migrated state back to localStorage when it changed.
        if (migratedCachedState !== cachedStateValue) {
          void persistBudgetCollectionsStateIntoLocalStorageCache(migratedCachedState)
        }
        setCollections(migratedCachedState)
        setIsLoadingState(false)
        return
      }
      if (defaultCollectionsStateError || !defaultCollectionsState) {
        setUiMessage('Unable to initialize default budgeting state.')
        setIsLoadingState(false)
        return
      }
      setCollections(defaultCollectionsState)
      setIsLoadingState(false)
    }
    void loadCollectionsStateIntoComponent()
    return () => { isMounted = false }
  }, [defaultCollectionsState, defaultCollectionsStateError])

  React.useEffect(() => () => {
    if (syncNoticeTimeoutRef.current) {
      clearTimeout(syncNoticeTimeoutRef.current)
      syncNoticeTimeoutRef.current = null
    }
  }, [])

  React.useEffect(() => {
    const [ok, err] = applyThemeNameToDocumentBodyDataAttribute(themeName)
    if (err || !ok) {
      console.warn('[ui] Failed to apply theme.', { themeName, err })
      setUiMessage('Unable to apply selected theme.')
    }
  }, [themeName])

  React.useEffect(() => {
    const [ok, err] = applyGlobalTextScaleMultiplierToDocumentRoot(textScaleMultiplier)
    if (err || !ok) {
      console.warn('[ui] Failed to apply text scale.', { textScaleMultiplier, err })
      setUiMessage('Unable to apply text scale.')
    }
  }, [textScaleMultiplier])

  React.useEffect(() => {
    const sectionIds = ['overview', 'records', 'debts', 'credit', 'savings', 'assets', 'details', 'loan-calculator', 'risks', 'goals', 'net-worth-trajectory', 'emergency-fund']
    const visibleSet = new Set()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleSet.add(entry.target.id)
          else visibleSet.delete(entry.target.id)
        })
        const firstVisible = sectionIds.find((id) => visibleSet.has(id))
        if (firstVisible) setActiveSectionId(firstVisible)
      },
      { threshold: 0, rootMargin: '-10% 0px -70% 0px' }
    )
    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (!isAddRecordModalOpen && !isAddGoalModalOpen && !isAddPersonaModalOpen && !isAddAssetModalOpen && !isProfileTransferModalOpen && !isEditRecordModalOpen && !isRecordNotesModalOpen && !selectedRiskFinding && !isLoginModalOpen && !pendingDeleteRecordTarget) return
    function closeOnEscape(keyboardEvent) {
      if (keyboardEvent.key === 'Escape') {
        setIsAddRecordModalOpen(false)
        setIsAddGoalModalOpen(false)
        setIsAddPersonaModalOpen(false)
        setIsAddAssetModalOpen(false)
        setIsProfileTransferModalOpen(false)
        setIsEditRecordModalOpen(false)
        setIsRecordNotesModalOpen(false)
        setSelectedRiskFinding(null)
        setIsLoginModalOpen(false)
        setPendingDeleteRecordTarget(null)
      }
    }
    globalThis.window.addEventListener('keydown', closeOnEscape)
    return () => globalThis.window.removeEventListener('keydown', closeOnEscape)
  }, [isAddRecordModalOpen, isAddGoalModalOpen, isAddPersonaModalOpen, isAddAssetModalOpen, isProfileTransferModalOpen, isEditRecordModalOpen, isRecordNotesModalOpen, selectedRiskFinding, isLoginModalOpen, pendingDeleteRecordTarget])

  // Critical path: derive named collection views from v3 (records/instruments) state so all
  // downstream calc functions continue to receive the named collection shape they expect.
  const safeCollections = React.useMemo(() => {
    const state = collections ?? { records: [], instruments: [], goals: [], notes: [], personas: [], schemaVersion: 3 }
    const isV3 = typeof state.schemaVersion === 'number' && state.schemaVersion >= 3
    const records = isV3 && Array.isArray(state.records) ? state.records : []
    const instruments = isV3 && Array.isArray(state.instruments) ? state.instruments : []
    return {
      ...state,
      income: isV3 ? records.filter((r) => r.recordType === 'income') : (Array.isArray(state.income) ? state.income : []),
      expenses: isV3 ? records.filter((r) => r.recordType === 'expense') : (Array.isArray(state.expenses) ? state.expenses : []),
      assets: isV3 ? records.filter((r) => r.recordType === 'savings') : (Array.isArray(state.assets) ? state.assets : []),
      creditCards: isV3 ? instruments.filter((i) => i.kind === 'creditCard') : (Array.isArray(state.creditCards) ? state.creditCards : []),
      debts: isV3 ? instruments.filter((i) => i.kind === 'debt') : (Array.isArray(state.debts) ? state.debts : []),
      loans: isV3 ? instruments.filter((i) => i.kind === 'loan') : (Array.isArray(state.loans) ? state.loans : []),
      assetHoldings: isV3 ? instruments.filter((i) => i.kind === 'assetHolding') : (Array.isArray(state.assetHoldings) ? state.assetHoldings : []),
      credit: isV3 ? [] : (Array.isArray(state.credit) ? state.credit : []),
      goals: Array.isArray(state.goals) ? state.goals : [],
      personas: Array.isArray(state.personas) ? state.personas : [],
      notes: Array.isArray(state.notes) ? state.notes : []
    }
  }, [collections])
  const shouldSkipHeavyComputations = isLoadingState || !collections

  const dashboardComputation = React.useMemo(() => {
    if (shouldSkipHeavyComputations) {
      return {
        error: false,
        metrics: [],
        sourceBreakdown: {
          incomeRows: [],
          expenseRows: [],
          income: { currentMonth: 0, previousMonth: 0, delta: 0 },
          expenses: { currentMonth: 0, previousMonth: 0, delta: 0 },
          assets: { currentMonth: 0, previousMonth: 0, delta: 0 },
          liabilities: { currentMonth: 0, previousMonth: 0, delta: 0 },
          netWorth: { currentMonth: 0, previousMonth: 0, delta: 0 }
        },
        detailedDashboardRows: [],
        powerGoalsFormulaSummary: { completedCount: 0, inProgressCount: 0, notStartedCount: 0, completionRatePercent: 0, completedRows: [], inProgressRows: [], notStartedRows: [] },
        monthlySavingsStorageSummary: { monthlyIncome: 0, monthlySavingsAmount: 0, monthlySavingsRatePercent: 0, totalStoredSavings: 0, storageRows: [] },
        savingsRecommendation: {
          recommendationReason: '',
          totalIncomeForReference: 0,
          recommendedMonthlySavings: 0,
          recommendedSavingsRatePercent: 0,
          minimumRecommendedSavings: 0,
          stretchRecommendedSavings: 0,
          gapToRecommendedSavings: 0
        },
        emergencyFundSummary: { emergencyFundGoal: 0, monthlyExpenses: 0, totalRecordedExpenses: 0, monthlyDebtMinimums: 0, monthlyObligations: 0, liquidAmount: 0, investedAmount: 0, missingLiquidAmount: 0, investedTarget: 0, totalCoverageMonths: 0, recurringExpenseRows: [], debtMinimumRows: [] },
        creditCardInformationCollection: [],
        creditCardSummary: { totalCurrent: 0, totalMonthly: 0, totalUtilizationPercent: 0, remainingCapacity: 0, maxCapacity: 0 },
        creditCardRecommendations: { strategy: '', currentTotalMonthlyPayment: 0, recommendedTotalMonthlyPayment: 0, weightedPayoffMonthsCurrent: 0, weightedPayoffMonthsRecommended: 0, rows: [] },
        planningInsights: {
          forecast: { committed: 0, planned: 0, optional: 0, projectedRiskLevel: 'low' },
          budgetVsActualRows: [],
          recurringBaselineRows: [],
          scenarioRows: [],
          amortizationRows: [],
          goalTemplateRows: [],
          riskProvenanceRows: [],
          reconcileChecklistRows: []
        }
      }
    }
    const [metrics, metricsError] = calculateTwentyDashboardHealthMetricsFromFinancialCollections(safeCollections)
    if (metricsError || !metrics) return { error: true }

    const [sourceBreakdown, sourceBreakdownError] = calculateCurrentAndPreviousMonthSourceBreakdownFromCollectionsState(safeCollections)
    if (sourceBreakdownError || !sourceBreakdown) return { error: true }

    const [monthlySummary, monthlySummaryError] = calculateMonthlyIncomeExpenseSummaryFromCollectionsState(safeCollections)
    if (monthlySummaryError || !monthlySummary) return { error: true }

    const [powerGoalsFormulaSummary, powerGoalsFormulaSummaryError] = calculatePowerGoalsStatusFormulaSummaryFromGoalCollection(safeCollections.goals)
    if (powerGoalsFormulaSummaryError || !powerGoalsFormulaSummary) return { error: true }
    const [monthlySavingsStorageSummary, monthlySavingsStorageSummaryError] = calculateMonthlySavingsStorageSummaryFromCollectionsState(safeCollections)
    if (monthlySavingsStorageSummaryError || !monthlySavingsStorageSummary) return { error: true }
    const [savingsRecommendation, savingsRecommendationError] = calculateRecommendedMonthlySavingsTargetFromCollectionsState(safeCollections, {
      monthlySummary,
      monthlySavingsStorageSummary
    })
    if (savingsRecommendationError || !savingsRecommendation) return { error: true }
    const [emergencyFundSummary, emergencyFundSummaryError] = calculateEmergencyFundTrackingSummaryFromCollectionsState(safeCollections)
    if (emergencyFundSummaryError || !emergencyFundSummary) return { error: true }
    const [detailedDashboardRows, detailedDashboardRowsError] = calculateDetailedDashboardDatapointRowsFromCurrentCollectionsState(safeCollections, {
      healthMetrics: metrics,
      monthlySummary,
      sourceBreakdown,
      monthlySavingsStorageSummary,
      emergencyFundSummary,
      goalStatusSummary: powerGoalsFormulaSummary
    })
    if (detailedDashboardRowsError || !detailedDashboardRows) return { error: true }

    const creditCardInformationCollection = Array.isArray(safeCollections.creditCards) ? safeCollections.creditCards : []
    const [creditCardSummary, creditCardSummaryError] = calculateCreditCardSummaryFormulasFromInformationCollection(creditCardInformationCollection)
    if (creditCardSummaryError || !creditCardSummary) return { error: true }
    const [creditCardRecommendations, creditCardRecommendationsError] = calculateCreditCardPaymentRecommendationsFromCollectionsState(
      safeCollections,
      creditCardInformationCollection
    )
    if (creditCardRecommendationsError || !creditCardRecommendations) return { error: true }
    const [planningInsights, planningInsightsError] = calculatePlanningCockpitInsightsFromCollectionsState(safeCollections)
    if (planningInsightsError || !planningInsights) return { error: true }

    return {
      error: false,
      metrics,
      sourceBreakdown,
      detailedDashboardRows,
      powerGoalsFormulaSummary,
      monthlySavingsStorageSummary,
      savingsRecommendation,
      emergencyFundSummary,
      creditCardInformationCollection,
      creditCardSummary,
      creditCardRecommendations,
      planningInsights
    }
  }, [safeCollections])

  if (dashboardComputation.error) {
    return <main className="mx-auto min-h-screen w-full max-w-7xl p-4 md:p-8"><section className="rounded-3xl border border-red-300 bg-[#141414] p-8 text-red-700 shadow-2xl">Unable to calculate dashboard values.</section></main>
  }
  const {
    metrics,
    sourceBreakdown,
    detailedDashboardRows,
    powerGoalsFormulaSummary,
    monthlySavingsStorageSummary,
    savingsRecommendation,
    emergencyFundSummary,
    creditCardInformationCollection,
    creditCardSummary,
    creditCardRecommendations,
    planningInsights
  } = dashboardComputation
  const loanCalculatorResult = React.useMemo(() => {
    if (shouldSkipHeavyComputations) return { error: null, comparison: null }
    const principalBalance = Number(loanCalculatorFormState.principalBalance || 0)
    const annualInterestRatePercent = Number(loanCalculatorFormState.annualInterestRatePercent || 0)
    const baseMonthlyPayment = Number(loanCalculatorFormState.baseMonthlyPayment || 0)
    const extraMonthlyPayment = Number(loanCalculatorFormState.extraMonthlyPayment || 0)
    const [comparison, comparisonError] = calculateLoanPayoffComparisonFromBaseAndExtraPayments(
      principalBalance,
      baseMonthlyPayment,
      extraMonthlyPayment,
      annualInterestRatePercent
    )
    if (comparisonError || !comparison) return { error: comparisonError }
    return { error: null, comparison }
  }, [loanCalculatorFormState, shouldSkipHeavyComputations])
  const trendSeriesRows = React.useMemo(() => {
    if (shouldSkipHeavyComputations) return []
    const sourceRows = [
      ...auditTimelineEntries.slice(0, 48).map((entryItem) => ({
        timestamp: typeof entryItem.timestamp === 'string' ? entryItem.timestamp : '',
        snapshot: entryItem.snapshot
      })),
      { timestamp: new Date().toISOString(), snapshot: safeCollections }
    ].filter((rowItem) => rowItem.snapshot && typeof rowItem.snapshot === 'object' && typeof rowItem.timestamp === 'string' && rowItem.timestamp.length > 0)

    const latestByMonth = new Map()
    for (const rowItem of sourceRows) {
      const parsedDate = new Date(rowItem.timestamp)
      if (Number.isNaN(parsedDate.getTime())) continue
      const monthKey = `${parsedDate.getUTCFullYear()}-${String(parsedDate.getUTCMonth() + 1).padStart(2, '0')}`
      const existingRow = latestByMonth.get(monthKey)
      if (!existingRow || new Date(existingRow.timestamp).getTime() < parsedDate.getTime()) {
        latestByMonth.set(monthKey, rowItem)
      }
    }
    const monthRowsSorted = [...latestByMonth.entries()]
      .map(([monthKey, rowItem]) => ({ monthKey, ...rowItem }))
      .sort((leftRow, rightRow) => leftRow.monthKey.localeCompare(rightRow.monthKey))

    return monthRowsSorted.map((rowItem) => {
      const [metrics] = calculateTwentyDashboardHealthMetricsFromFinancialCollections(/** @type {any} */ (rowItem.snapshot))
      const [monthlySummary] = calculateMonthlyIncomeExpenseSummaryFromCollectionsState(/** @type {any} */ (rowItem.snapshot))
      return {
        monthKey: rowItem.monthKey,
        netWorth: typeof metrics?.netWorth === 'number' ? metrics.netWorth : 0,
        debtToIncomePercent: typeof metrics?.debtToIncomeRatioPercent === 'number' ? metrics.debtToIncomeRatioPercent : 0,
        savingsRatePercent: typeof monthlySummary?.savingsRatePercent === 'number' ? monthlySummary.savingsRatePercent : 0,
        utilizationPercent: typeof metrics?.creditCardUtilizationPercent === 'number' ? metrics.creditCardUtilizationPercent : 0
      }
    })
  }, [auditTimelineEntries, safeCollections, shouldSkipHeavyComputations])
  const trendRowsInSelectedWindow = React.useMemo(
    () => trendSeriesRows.slice(-Math.max(1, trendWindowMonths)),
    [trendSeriesRows, trendWindowMonths]
  )
  const trendNetWorthMinMax = React.useMemo(() => {
    const netWorthValues = trendRowsInSelectedWindow.map((rowItem) => rowItem.netWorth)
    if (netWorthValues.length === 0) return { min: 0, max: 0 }
    return {
      min: Math.min(...netWorthValues),
      max: Math.max(...netWorthValues)
    }
  }, [trendRowsInSelectedWindow])

  async function fadeOutAndClearRiskCardsOverHalfSecond() {
    if (!Array.isArray(riskFindings) || riskFindings.length === 0) {
      setRiskFindings([])
      return
    }
    setIsRiskCardsFadingOut(true)
    await new Promise((resolve) => globalThis.setTimeout(resolve, 500))
    setRiskFindings([])
    setIsRiskCardsFadingOut(false)
  }

  async function recomputeRiskFindingsFromCollectionsState(nextCollectionsState) {
    if (!readHasAnyMeaningfulFinancialRowsInCollections(nextCollectionsState)) {
      setRiskFindings([])
      setIsRiskLoading(false)
      return
    }
    setIsRiskLoading(true)
    await fadeOutAndClearRiskCardsOverHalfSecond()
    const [nextRiskFindings, nextRiskFindingsError] = await computeFinancialRiskFindingsUsingBackgroundWorkerWhenAvailable(nextCollectionsState)
    if (nextRiskFindingsError || !nextRiskFindings) {
      console.warn('[risk] Failed to compute risk findings.', nextRiskFindingsError)
      setRiskFindings([])
      setIsRiskLoading(false)
      return
    }
    setRiskFindings(nextRiskFindings)
    setIsRiskLoading(false)
  }
  async function recomputeAndValidateDashboardDerivedStateAfterImport(nextCollectionsState) {
    const [metrics, metricsError] = calculateTwentyDashboardHealthMetricsFromFinancialCollections(nextCollectionsState)
    if (metricsError || !metrics) {
      console.warn('[profile] Post-import compute failed at health metrics.', metricsError)
      return
    }
    const [sourceBreakdown, sourceBreakdownError] = calculateCurrentAndPreviousMonthSourceBreakdownFromCollectionsState(nextCollectionsState)
    if (sourceBreakdownError || !sourceBreakdown) {
      console.warn('[profile] Post-import compute failed at source breakdown.', sourceBreakdownError)
      return
    }
    const [monthlySummary, monthlySummaryError] = calculateMonthlyIncomeExpenseSummaryFromCollectionsState(nextCollectionsState)
    if (monthlySummaryError || !monthlySummary) {
      console.warn('[profile] Post-import compute failed at monthly summary.', monthlySummaryError)
      return
    }
    const [monthlySavingsSummary, monthlySavingsSummaryError] = calculateMonthlySavingsStorageSummaryFromCollectionsState(nextCollectionsState)
    if (monthlySavingsSummaryError || !monthlySavingsSummary) {
      console.warn('[profile] Post-import compute failed at monthly savings summary.', monthlySavingsSummaryError)
      return
    }
    const [savingsRecommendationSummary, savingsRecommendationSummaryError] = calculateRecommendedMonthlySavingsTargetFromCollectionsState(nextCollectionsState, {
      monthlySummary,
      monthlySavingsStorageSummary: monthlySavingsSummary
    })
    if (savingsRecommendationSummaryError || !savingsRecommendationSummary) {
      console.warn('[profile] Post-import compute failed at savings recommendation.', savingsRecommendationSummaryError)
      return
    }
    const [emergencyFundSummary, emergencyFundSummaryError] = calculateEmergencyFundTrackingSummaryFromCollectionsState(nextCollectionsState)
    if (emergencyFundSummaryError || !emergencyFundSummary) {
      console.warn('[profile] Post-import compute failed at emergency fund summary.', emergencyFundSummaryError)
      return
    }
    const [goalStatusSummary, goalStatusSummaryError] = calculatePowerGoalsStatusFormulaSummaryFromGoalCollection(nextCollectionsState.goals)
    if (goalStatusSummaryError || !goalStatusSummary) {
      console.warn('[profile] Post-import compute failed at goal status summary.', goalStatusSummaryError)
      return
    }
    const [detailedRows, detailedRowsError] = calculateDetailedDashboardDatapointRowsFromCurrentCollectionsState(nextCollectionsState, {
      healthMetrics: metrics,
      monthlySummary,
      sourceBreakdown,
      monthlySavingsStorageSummary: monthlySavingsSummary,
      emergencyFundSummary,
      goalStatusSummary
    })
    if (detailedRowsError || !detailedRows) {
      console.warn('[profile] Post-import compute failed at detailed rows.', detailedRowsError)
      return
    }
    const creditCardRows = Array.isArray(nextCollectionsState.creditCards) ? nextCollectionsState.creditCards : []
    const [creditCardSummaryResult, creditCardSummaryError] = calculateCreditCardSummaryFormulasFromInformationCollection(creditCardRows)
    if (creditCardSummaryError || !creditCardSummaryResult) {
      console.warn('[profile] Post-import compute failed at credit card summary.', creditCardSummaryError)
      return
    }
    const [creditCardRecommendationRows, creditCardRecommendationRowsError] = calculateCreditCardPaymentRecommendationsFromCollectionsState(nextCollectionsState, creditCardRows)
    if (creditCardRecommendationRowsError || !creditCardRecommendationRows) {
      console.warn('[profile] Post-import compute failed at credit card recommendations.', creditCardRecommendationRowsError)
      return
    }
    const [planningInsightsSummary, planningInsightsSummaryError] = calculatePlanningCockpitInsightsFromCollectionsState(nextCollectionsState)
    if (planningInsightsSummaryError || !planningInsightsSummary) {
      console.warn('[profile] Post-import compute failed at planning insights.', planningInsightsSummaryError)
      return
    }
    const [unifiedRecords, unifiedRecordsError] = calculateUnifiedFinancialRecordsSourceOfTruthFromCollectionsState(nextCollectionsState)
    if (unifiedRecordsError || !unifiedRecords) {
      console.warn('[profile] Post-import compute failed at unified records.', unifiedRecordsError)
      return
    }
    console.info('[profile] Post-import compute checkpoint completed.', {
      metrics: metrics.length,
      detailedRows: detailedRows.length,
      records: unifiedRecords.length
    })
  }

  React.useEffect(() => {
    let isMounted = true
    if (shouldSkipHeavyComputations) {
      setRiskFindings([])
      setIsRiskLoading(false)
      return () => { isMounted = false }
    }
    if (!readHasAnyMeaningfulFinancialRowsInCollections(safeCollections)) {
      setRiskFindings([])
      setIsRiskLoading(false)
      return () => { isMounted = false }
    }
    setIsRiskLoading(true)
    void fadeOutAndClearRiskCardsOverHalfSecond()
    async function computeRiskFindings() {
      const [nextRiskFindings, nextRiskFindingsError] = await computeFinancialRiskFindingsUsingBackgroundWorkerWhenAvailable(safeCollections)
      if (!isMounted) return
      if (nextRiskFindingsError || !nextRiskFindings) {
        console.warn('[risk] Failed to compute risk findings.', nextRiskFindingsError)
        setRiskFindings([])
        setIsRiskLoading(false)
        return
      }
      setRiskFindings(nextRiskFindings)
      setIsRiskLoading(false)
    }
    void computeRiskFindings()
    return () => { isMounted = false }
  }, [safeCollections, shouldSkipHeavyComputations])

  const topMetrics = React.useMemo(() => {
    if (shouldSkipHeavyComputations) return []
    const assetsSectionTotalAtMarketValue = (Array.isArray(safeCollections.assetHoldings) ? safeCollections.assetHoldings : []).reduce((runningTotal, rowItem) => {
      const marketValue = typeof rowItem.assetMarketValue === 'number' ? rowItem.assetMarketValue : 0
      return runningTotal + marketValue
    }, 0)
    const debtAndLoanTotal = [...safeCollections.debts, ...safeCollections.loans].reduce((runningTotal, rowItem) => {
      const amount = typeof rowItem.amount === 'number' ? rowItem.amount : 0
      return runningTotal + amount
    }, 0)
    const creditAccountTotal = creditCardInformationCollection.reduce((runningTotal, rowItem) => {
      const currentBalance = typeof rowItem.currentBalance === 'number' ? rowItem.currentBalance : 0
      return runningTotal + currentBalance
    }, 0)
    const overviewNetWorthFromSectionTotals = assetsSectionTotalAtMarketValue - debtAndLoanTotal - creditAccountTotal
    const metricPriorityOrder = [
      'Net Worth',
      'Monthly Income',
      'Monthly Expenses',
      'Monthly Surplus / Deficit',
      'Savings Rate',
      'Monthly Savings',
      'Total Debts',
      'Monthly Debt Payback',
      'Debt to Income Ratio',
      'Credit Card Utilization',
      'Credit Card Debt',
      'Credit Card Capacity',
      'Emergency Funds Goal',
      'Emergency Funds',
      'Emergency Fund Gap',
      'Income After Debt Minimums',
      'Discretionary After Expenses + Debt',
      'Months Until Debt-Free',
      'Weighted Interest Rate',
      'Secured Debt Loan-To-Value',
      'Secured Equity',
      'Secured Collateral Market Value',
      'Debt Balance Without Mortgage',
      'Mortgage Share Of Liabilities',
      'Non-Mortgage Liability Share',
      'Cash Runway After Debt Service',
      'Emergency Fund Coverage (Months)',
      'Projected Net Worth (12 Months)',
      'Projected Net Worth (6 Months)',
      'Projected Net Worth (3 Months)',
      'Net Worth Change vs Last Month',
      'Income Change vs Last Month',
      'Expense Change vs Last Month',
      'Liabilities Change vs Last Month',
      'Debt Coverage By Assets',
      'Liabilities As % Of Assets',
      'Debt Minimums As % Of Expenses',
      'Debt Paydown Velocity',
      'Annual Debt Service',
      'Yearly Income',
      'Goals Completed',
      'Goals In Progress',
      'Goals Not Started',
      'Travel Goals Completed',
      'Travel Goals On Bucket List'
    ]
    const metricPriorityIndexByName = new Map(metricPriorityOrder.map((metricName, metricIndex) => [metricName, metricIndex]))
    const sortedRows = detailedDashboardRows.map((rowItem) => (
      String(rowItem.metric) === 'Net Worth'
        ? { ...rowItem, value: overviewNetWorthFromSectionTotals, description: 'Asset market value total minus debts/loans and credit account balances.' }
        : rowItem
    )).sort((leftRow, rightRow) => {
      const leftPriority = metricPriorityIndexByName.get(String(leftRow.metric))
      const rightPriority = metricPriorityIndexByName.get(String(rightRow.metric))
      const safeLeftPriority = typeof leftPriority === 'number' ? leftPriority : Number.MAX_SAFE_INTEGER
      const safeRightPriority = typeof rightPriority === 'number' ? rightPriority : Number.MAX_SAFE_INTEGER
      if (safeLeftPriority !== safeRightPriority) return safeLeftPriority - safeRightPriority
      return String(leftRow.metric).localeCompare(String(rightRow.metric))
    })
    const goalMetricNames = ['Goals Completed', 'Goals In Progress', 'Goals Not Started']
    const goalRows = goalMetricNames
      .map((metricName) => sortedRows.find((rowItem) => String(rowItem.metric) === metricName))
      .filter(Boolean)
    const nonGoalRows = sortedRows.filter((rowItem) => !goalMetricNames.includes(String(rowItem.metric)))
    const primaryRowCount = Math.max(0, 20 - goalRows.length)
    return [...nonGoalRows.slice(0, primaryRowCount), ...goalRows].slice(0, 20)
  }, [creditCardInformationCollection, detailedDashboardRows, safeCollections.assetHoldings, safeCollections.debts, safeCollections.loans, shouldSkipHeavyComputations])
  const incomeAndExpenseRows = React.useMemo(() => {
    if (shouldSkipHeavyComputations) return []
    const [recordRows, recordRowsError] = calculateUnifiedFinancialRecordsSourceOfTruthFromCollectionsState(
      safeCollections,
      ['income', 'expenses', 'debts', 'loans', 'credit', 'creditCards']
    )
    if (recordRowsError || !recordRows) return []
    return recordRows
  }, [safeCollections, shouldSkipHeavyComputations])

  const goalRowsSortedByTimeframeAndStatus = React.useMemo(
    () => buildRowsSortedByKeyAndDirection(safeCollections.goals, tableSortState.goals.key, tableSortState.goals.direction),
    [safeCollections.goals, tableSortState.goals]
  )

  const debtRows = React.useMemo(() => [...safeCollections.debts, ...safeCollections.loans], [safeCollections.debts, safeCollections.loans])
  const debtRowsWithCollectionContext = React.useMemo(() => ([
    ...safeCollections.debts.map((rowItem) => ({ ...rowItem, __collectionName: 'debts' })),
    ...safeCollections.loans.map((rowItem) => ({ ...rowItem, __collectionName: 'loans' }))
  ]), [safeCollections.debts, safeCollections.loans])
  const debtRowsSorted = React.useMemo(
    () => buildRowsSortedByKeyAndDirection(debtRowsWithCollectionContext, tableSortState.debts.key, tableSortState.debts.direction),
    [debtRowsWithCollectionContext, tableSortState.debts]
  )
  const loanCalculatorSourceRows = React.useMemo(() => {
    if (shouldSkipHeavyComputations) return []
    return debtRowsWithCollectionContext.map((rowItem, rowIndex) => {
      const collectionName = String(rowItem.__collectionName || 'debts')
      const rowId = typeof rowItem.id === 'string' ? rowItem.id : `${collectionName}-idx-${rowIndex}`
      const rowKey = `${collectionName}:${rowId}`
      const person = typeof rowItem.person === 'string' ? rowItem.person : DEFAULT_PERSONA_NAME
      const item = typeof rowItem.item === 'string'
        ? rowItem.item
        : (typeof rowItem.category === 'string' ? rowItem.category : 'Loan')
      const amount = typeof rowItem.amount === 'number' ? rowItem.amount : 0
      const minimumPayment = typeof rowItem.minimumPayment === 'number' ? rowItem.minimumPayment : 0
      const interestRatePercent = typeof rowItem.interestRatePercent === 'number' ? rowItem.interestRatePercent : 0
      return {
        key: rowKey,
        label: `${normalizePersonaNameForDisplay(person)} - ${item}`,
        amount,
        minimumPayment,
        interestRatePercent
      }
    })
  }, [debtRowsWithCollectionContext, shouldSkipHeavyComputations])
  const creditRowsSorted = React.useMemo(
    () => buildRowsSortedByKeyAndDirection(creditCardInformationCollection, tableSortState.credit.key, tableSortState.credit.direction),
    [creditCardInformationCollection, tableSortState.credit]
  )
  const detailedRowsSorted = React.useMemo(
    () => buildRowsSortedByKeyAndDirection(detailedDashboardRows, tableSortState.detailed.key, tableSortState.detailed.direction),
    [detailedDashboardRows, tableSortState.detailed]
  )
  const incomeExpenseRowsSorted = React.useMemo(
    () => buildRowsSortedByKeyAndDirection(incomeAndExpenseRows, tableSortState.records.key, tableSortState.records.direction),
    [incomeAndExpenseRows, tableSortState.records]
  )
  const recordsFlowSummary = React.useMemo(() => {
    const runningTotals = { totalIn: 0, totalOut: 0, diff: 0 }
    for (const rowItem of incomeExpenseRowsSorted) {
      const recordType = typeof rowItem.recordType === 'string' ? rowItem.recordType : ''
      const amount = typeof rowItem.amount === 'number' ? rowItem.amount : 0
      if (recordType === 'income') {
        runningTotals.totalIn += amount
        runningTotals.diff += amount
      } else {
        runningTotals.totalOut += amount
        runningTotals.diff -= amount
      }
    }
    return runningTotals
  }, [incomeExpenseRowsSorted])
  const savingsStorageRowsSorted = React.useMemo(
    () => buildRowsSortedByKeyAndDirection(monthlySavingsStorageSummary.storageRows, tableSortState.savings.key, tableSortState.savings.direction),
    [monthlySavingsStorageSummary.storageRows, tableSortState.savings]
  )
  const netWorthProjectionProfiles = React.useMemo(() => {
    if (shouldSkipHeavyComputations) return null
    const [projectionRows, projectionRowsError] = calculateNetWorthProjectionProfilesUsingThreeAggressionLayers(safeCollections)
    if (projectionRowsError || !projectionRows) return null
    return projectionRows
  }, [safeCollections, shouldSkipHeavyComputations])
  const selectedNetWorthProjectionProfile = React.useMemo(() => {
    if (!netWorthProjectionProfiles) return null
    const selectedProfile = netWorthProjectionProfiles.profiles.find((profileItem) => profileItem.id === netWorthProjectionProfileId)
    return selectedProfile ?? netWorthProjectionProfiles.profiles[0] ?? null
  }, [netWorthProjectionProfiles, netWorthProjectionProfileId])
  const netWorthProjectionBaselineVariables = netWorthProjectionProfiles?.baselineVariables ?? {
    startingAssetValueFromDataset: 0,
    startingLiabilityBalanceFromDataset: 0,
    totalMonthlyIncomeFromDataset: 0,
    totalMonthlyExpensesFromDataset: 0,
    monthlySavingsPaceBaselineFromDataset: 0,
    totalMonthlyDebtPaymentsFromDataset: 0,
    weightedAprPercentFromDataset: 0
  }
  const assetHoldingRows = React.useMemo(() => (
    (Array.isArray(safeCollections.assetHoldings) ? safeCollections.assetHoldings : []).map((rowItem) => {
      const assetValueOwed = typeof rowItem.assetValueOwed === 'number' ? rowItem.assetValueOwed : 0
      const assetMarketValue = typeof rowItem.assetMarketValue === 'number' ? rowItem.assetMarketValue : 0
      return {
        ...rowItem,
        value: assetMarketValue - assetValueOwed
      }
    })
  ), [safeCollections.assetHoldings])
  const assetHoldingRowsSorted = React.useMemo(
    () => buildRowsSortedByKeyAndDirection(assetHoldingRows, tableSortState.assets.key, tableSortState.assets.direction),
    [assetHoldingRows, tableSortState.assets]
  )
  const totalAssetHoldingsValue = React.useMemo(
    () => assetHoldingRows.reduce((runningTotal, rowItem) => runningTotal + (typeof rowItem.value === 'number' ? rowItem.value : 0), 0),
    [assetHoldingRows]
  )
  const emergencyGoalExpenseLines = React.useMemo(() => {
    const monthlyExpenseRows = Array.isArray(emergencyFundSummary.recurringExpenseRows) ? emergencyFundSummary.recurringExpenseRows : []
    const monthlyDebtRows = Array.isArray(emergencyFundSummary.debtMinimumRows) ? emergencyFundSummary.debtMinimumRows : []
    const monthlyExpenseTotal = typeof emergencyFundSummary.monthlyExpenses === 'number' ? emergencyFundSummary.monthlyExpenses : 0
    const totalRecordedExpenses = typeof emergencyFundSummary.totalRecordedExpenses === 'number' ? emergencyFundSummary.totalRecordedExpenses : 0
    const monthlyDebtTotal = typeof emergencyFundSummary.monthlyDebtMinimums === 'number' ? emergencyFundSummary.monthlyDebtMinimums : 0
    const monthlyObligationTotal = typeof emergencyFundSummary.monthlyObligations === 'number' ? emergencyFundSummary.monthlyObligations : 0
    const sixMonthTotal = typeof emergencyFundSummary.emergencyFundGoal === 'number' ? emergencyFundSummary.emergencyFundGoal : 0
    return [
      'Emergency Goal Formula',
      `Recurring Essential Expenses: ${formatCurrencyValueForDashboard(monthlyExpenseTotal)}`,
      `All Recorded Expenses: ${formatCurrencyValueForDashboard(totalRecordedExpenses)}`,
      `Non-Credit-Card Debt Minimums: ${formatCurrencyValueForDashboard(monthlyDebtTotal)}`,
      `Monthly Obligations Total: ${formatCurrencyValueForDashboard(monthlyObligationTotal)}`,
      `6-Month Goal: ${formatCurrencyValueForDashboard(sixMonthTotal)}`,
      ...monthlyExpenseRows.map((rowItem) => `- Recurring Expense ${rowItem.label}: ${formatCurrencyValueForDashboard(rowItem.amount)} / mo | ${formatCurrencyValueForDashboard(rowItem.amount * 6)} in 6 months`),
      ...monthlyDebtRows.map((rowItem) => `- Debt ${rowItem.label}: ${formatCurrencyValueForDashboard(rowItem.amount)} / mo | ${formatCurrencyValueForDashboard(rowItem.amount * 6)} in 6 months`)
    ]
  }, [emergencyFundSummary])
  const totalMonthlyDebtPayment = React.useMemo(
    () => debtRows.reduce((runningTotal, debtItem) => runningTotal + (typeof debtItem.minimumPayment === 'number' ? debtItem.minimumPayment : 0), 0),
    [debtRows]
  )
  const totalMortgageBalance = React.useMemo(
    () => safeCollections.debts.reduce((runningTotal, debtItem) => (
      runningTotal + (typeof debtItem.item === 'string' && debtItem.item.toLowerCase().includes('mortgage') && typeof debtItem.amount === 'number' ? debtItem.amount : 0)
    ), 0),
    [safeCollections.debts]
  )
  const emergencyFundSourceLabels = React.useMemo(() => {
    const liquidLabels = Array.isArray(emergencyFundSummary.liquidSources)
      ? emergencyFundSummary.liquidSources.map((rowItem) => rowItem.label).filter((labelValue) => typeof labelValue === 'string' && labelValue.trim().length > 0)
      : []
    const investedLabels = Array.isArray(emergencyFundSummary.investedSources)
      ? emergencyFundSummary.investedSources.map((rowItem) => rowItem.label).filter((labelValue) => typeof labelValue === 'string' && labelValue.trim().length > 0)
      : []
    return {
      liquidText: liquidLabels.length > 0 ? liquidLabels.join(', ') : 'None classified',
      investedText: investedLabels.length > 0 ? investedLabels.join(', ') : 'None classified'
    }
  }, [emergencyFundSummary.investedSources, emergencyFundSummary.liquidSources])
  const personaOptions = React.useMemo(() => {
    if (shouldSkipHeavyComputations) return []
    const discoveredNames = [
      ...safeCollections.income,
      ...safeCollections.expenses,
      ...safeCollections.debts,
      ...safeCollections.credit,
      ...safeCollections.loans,
      ...safeCollections.creditCards
    ]
      .map((rowItem) => normalizePersonaNameForDisplay(typeof rowItem.person === 'string' ? rowItem.person : ''))
      .filter((nameValue) => nameValue.length > 0)
    const explicitlyAddedNames = Array.isArray(safeCollections.personas)
      ? safeCollections.personas
        .map((personaItem) => {
          if (!personaItem || typeof personaItem !== 'object') return ''
          return normalizePersonaNameForDisplay(typeof personaItem.name === 'string' ? personaItem.name : '')
        })
        .filter((nameValue) => nameValue.length > 0)
      : []

    const normalizedMap = new Map()
    for (const personaName of [...explicitlyAddedNames, ...discoveredNames]) {
      const normalizedName = normalizePersonaNameForDisplay(personaName)
      const key = normalizedName.toLowerCase()
      if (!normalizedMap.has(key)) normalizedMap.set(key, normalizedName)
    }
    return Array.from(normalizedMap.values())
  }, [safeCollections, shouldSkipHeavyComputations])
  const personaEmojiByName = React.useMemo(() => {
    const emojiByName = new Map([["cam", DEFAULT_PERSONA_EMOJI]])
    if (Array.isArray(safeCollections.personas)) {
      for (const personaItem of safeCollections.personas) {
        if (!personaItem || typeof personaItem !== "object") continue
        const name = normalizePersonaNameForDisplay(typeof personaItem.name === "string" ? personaItem.name : "")
        const emoji = typeof personaItem.emoji === "string" ? personaItem.emoji.trim() : ""
        if (name.length > 0 && emoji.length > 0) emojiByName.set(name.toLowerCase(), emoji)
      }
    }
    return emojiByName
  }, [safeCollections.personas])
  const personaSelectOptions = React.useMemo(() => {
    return personaOptions.map((personaName) => ({ value: personaName, label: formatPersonaLabelWithEmoji(personaName, personaEmojiByName) }))
  }, [personaOptions, personaEmojiByName])
  const selectedPersonaImpactSummary = React.useMemo(() => {
    if (shouldSkipHeavyComputations) return null
    const selectedPersonaName = normalizePersonaNameForDisplay(personaCrudFormState.personaName)
    if (!selectedPersonaName) return null
    const [summary, summaryError] = buildPersonaImpactSummaryFromCollectionsStateByPersonaName(collections, selectedPersonaName)
    if (summaryError || !summary) return null
    return summary
  }, [collections, personaCrudFormState.personaName, shouldSkipHeavyComputations])
  const reassignablePersonaOptions = React.useMemo(() => {
    const selectedPersonaName = normalizePersonaNameForDisplay(personaCrudFormState.personaName).toLowerCase()
    return personaOptions.filter((personaName) => normalizePersonaNameForDisplay(personaName).toLowerCase() !== selectedPersonaName)
  }, [personaCrudFormState.personaName, personaOptions])
  const selectedRiskTemplate = React.useMemo(() => {
    if (!selectedRiskFinding) return null
    return buildRiskDetailTemplateFromFindingAndPersonas(selectedRiskFinding, personaSelectOptions.map((optionItem) => optionItem.label))
  }, [selectedRiskFinding, personaSelectOptions])

  if (isLoadingState) {
    return <main className="mx-auto min-h-screen w-full max-w-7xl p-4 md:p-8"><section className="rounded-3xl border border-white/20 bg-[rgba(20,20,20,0.9)] p-8 text-[#d4d4d4] shadow-2xl backdrop-blur">Loading local budgeting data...</section></main>
  }
  if (!collections) {
    return <main className="mx-auto min-h-screen w-full max-w-7xl p-4 md:p-8"><section className="rounded-3xl border border-red-300 bg-[#141414] p-8 text-red-700 shadow-2xl">Unable to initialize collections state.</section></main>
  }

  function updateEntryFormFieldValue(fieldName, nextFieldValue) {
    setEntryFormState((previousFormState) => ({ ...previousFormState, [fieldName]: nextFieldValue }))
  }
  function updateGoalEntryFormFieldValue(fieldName, nextFieldValue) {
    setGoalEntryFormState((previousFormState) => ({ ...previousFormState, [fieldName]: nextFieldValue }))
  }
  function closeGoalModalAndResetForm() {
    setGoalEntryFormState(buildInitialGoalEntryFormState())
    setEditingGoalId('')
    setIsAddGoalModalOpen(false)
  }
  function openEditGoalModal(goalItem) {
    setGoalEntryFormState({
      title: typeof goalItem.title === 'string' ? goalItem.title : '',
      status: typeof goalItem.status === 'string' ? goalItem.status : 'not started',
      timeframeMonths: String(goalItem.timeframeMonths ?? '12'),
      description: typeof goalItem.description === 'string' ? goalItem.description : ''
    })
    setEditingGoalId(typeof goalItem.id === 'string' ? goalItem.id : '')
    setIsAddGoalModalOpen(true)
  }
  function updatePersonaEntryFormFieldValue(fieldName, nextFieldValue) {
    setPersonaEntryFormState((previousFormState) => ({ ...previousFormState, [fieldName]: nextFieldValue }))
  }
  function updatePersonaCrudFormFieldValue(fieldName, nextFieldValue) {
    setPersonaCrudFormState((previousFormState) => ({ ...previousFormState, [fieldName]: nextFieldValue }))
  }
  function openManagePersonasModal() {
    setIsAddPersonaModalOpen(true)
    if (!personaCrudFormState.personaName && personaOptions.length > 0) {
      selectPersonaForCrudByName(personaOptions[0])
    }
  }
  function updateProfileTransferFormFieldValue(fieldName, nextFieldValue) {
    setProfileTransferFormState((previousFormState) => ({ ...previousFormState, [fieldName]: nextFieldValue }))
  }
  function updateSupabaseSyncFormFieldValue(fieldName, nextFieldValue) {
    setSupabaseSyncFormState((previousFormState) => ({ ...previousFormState, [fieldName]: nextFieldValue }))
  }
  function updateFirebaseSyncFormFieldValue(fieldName, nextFieldValue) {
    setFirebaseSyncFormState((previousFormState) => ({ ...previousFormState, [fieldName]: nextFieldValue }))
  }
  function updateAssetHoldingEntryFormFieldValue(fieldName, nextFieldValue) {
    setAssetHoldingEntryFormState((previousFormState) => ({ ...previousFormState, [fieldName]: nextFieldValue }))
  }
  function updateLoanCalculatorFormFieldValue(fieldName, nextFieldValue) {
    setLoanCalculatorFormState((previousFormState) => ({ ...previousFormState, [fieldName]: nextFieldValue }))
  }
  function selectLoanRecordForCalculatorByKey(selectedLoanKey) {
    const selectedLoan = loanCalculatorSourceRows.find((rowItem) => rowItem.key === selectedLoanKey)
    if (!selectedLoan) {
      setLoanCalculatorFormState((previousFormState) => ({ ...previousFormState, selectedLoanKey }))
      return
    }
    setLoanCalculatorFormState((previousFormState) => ({
      ...previousFormState,
      selectedLoanKey,
      principalBalance: String(selectedLoan.amount),
      annualInterestRatePercent: String(selectedLoan.interestRatePercent),
      baseMonthlyPayment: String(selectedLoan.minimumPayment)
    }))
  }
  function cloneCollectionsStateForUndoSnapshot(sourceCollectionsState) {
    if (typeof globalThis.structuredClone === 'function') {
      return globalThis.structuredClone(sourceCollectionsState)
    }
    return JSON.parse(JSON.stringify(sourceCollectionsState))
  }
  async function appendAuditTimelineEntryForStateChange(contextTag, nextCollectionsState) {
    const [isoTimestamp, timestampError] = readCurrentIsoTimestampForBudgetRecordUpdates()
    if (timestampError || !isoTimestamp) return
    const [monthlySummary, monthlySummaryError] = calculateMonthlyIncomeExpenseSummaryFromCollectionsState(nextCollectionsState)
    if (monthlySummaryError || !monthlySummary) return
    const [metrics, metricsError] = calculateTwentyDashboardHealthMetricsFromFinancialCollections(nextCollectionsState)
    if (metricsError || !metrics) return
    const nextEntry = {
      id: `audit-${isoTimestamp}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: isoTimestamp,
      contextTag,
      summary: {
        totalIncome: monthlySummary.totalIncome,
        totalExpenses: monthlySummary.totalExpenses,
        netWorth: metrics.netWorth
      },
      snapshot: cloneCollectionsStateForUndoSnapshot(nextCollectionsState)
    }
    const nextTimeline = [nextEntry, ...auditTimelineEntries].slice(0, 120)
    setAuditTimelineEntries(nextTimeline)
    const [, persistError] = await persistAuditTimelineIntoLocalStorageCache(nextTimeline)
    if (persistError) console.warn('[audit] Failed to persist audit timeline entry.', persistError)
  }
  async function syncCollectionsStateToSupabaseWhenConnected(nextCollectionsState, contextTag) {
    if (!supabaseSyncFormState.enabled) return
    if (!supabaseAuthUserSummary || !supabaseAuthUserSummary.id) return
    const [syncResult, syncError] = await pushCompleteFinancialProfileIntoSupabaseForAuthenticatedUser(
      supabaseSyncFormState,
      nextCollectionsState,
      { themeName, textScaleMultiplier, tableSortState },
      auditTimelineEntries
    )
    if (syncError || !syncResult) {
      console.warn('[supabase] Auto-sync failed after local change.', { contextTag, syncError })
      return
    }
    console.info('[supabase] Auto-sync completed after local change.', { contextTag, savedAtIso: syncResult.savedAtIso })
  }
  function pushCurrentCollectionsStateIntoUndoStackWithLimit() {
    // Critical path: undo must preserve a full pre-transaction snapshot.
    const snapshot = cloneCollectionsStateForUndoSnapshot(collections)
    transactionUndoStackRef.current.push(snapshot)
    if (transactionUndoStackRef.current.length > 25) {
      transactionUndoStackRef.current.shift()
    }
    setTransactionUndoDepth(transactionUndoStackRef.current.length)
  }
  async function applyNextCollectionsStateWithUndoForTransaction(nextCollectionsState, contextTag) {
    pushCurrentCollectionsStateIntoUndoStackWithLimit()
    const [persistSuccess, persistError] = await persistBudgetCollectionsStateIntoLocalStorageCache(nextCollectionsState)
    if (persistError || !persistSuccess) {
      transactionUndoStackRef.current.pop()
      setTransactionUndoDepth(transactionUndoStackRef.current.length)
      console.warn('[records] Failed to persist transaction state change.', { contextTag, persistError })
      return false
    }
    setCollections(nextCollectionsState)
    await appendAuditTimelineEntryForStateChange(contextTag, nextCollectionsState)
    await syncCollectionsStateToSupabaseWhenConnected(nextCollectionsState, contextTag)
    return true
  }
  async function undoMostRecentTransactionChangeFromUndoStack() {
    if (transactionUndoStackRef.current.length === 0) return
    const previousCollectionsState = transactionUndoStackRef.current.pop()
    const [persistSuccess, persistError] = await persistBudgetCollectionsStateIntoLocalStorageCache(previousCollectionsState)
    if (persistError || !persistSuccess) {
      transactionUndoStackRef.current.push(previousCollectionsState)
      setTransactionUndoDepth(transactionUndoStackRef.current.length)
      console.warn('[records] Failed to persist undo transaction state.', persistError)
      return
    }
    setCollections(previousCollectionsState)
    setTransactionUndoDepth(transactionUndoStackRef.current.length)
    await appendAuditTimelineEntryForStateChange('undo-transaction', previousCollectionsState)
    await syncCollectionsStateToSupabaseWhenConnected(previousCollectionsState, 'undo-transaction')
  }
  async function restoreCollectionsSnapshotFromAuditEntryById(entryId) {
    const targetEntry = auditTimelineEntries.find((entryItem) => String(entryItem.id) === String(entryId))
    if (!targetEntry || !targetEntry.snapshot || typeof targetEntry.snapshot !== 'object') return
    const shouldRestore = window.confirm('Restore this snapshot? This will replace current state.')
    if (!shouldRestore) return
    const nextCollectionsState = cloneCollectionsStateForUndoSnapshot(targetEntry.snapshot)
    const [persistSuccess, persistError] = await persistBudgetCollectionsStateIntoLocalStorageCache(nextCollectionsState)
    if (persistError || !persistSuccess) {
      console.warn('[audit] Failed to persist restored snapshot.', persistError)
      return
    }
    pushCurrentCollectionsStateIntoUndoStackWithLimit()
    setCollections(nextCollectionsState)
    await appendAuditTimelineEntryForStateChange('restore-snapshot', nextCollectionsState)
    await syncCollectionsStateToSupabaseWhenConnected(nextCollectionsState, 'restore-snapshot')
  }

  async function submitNewIncomeOrExpenseRecord(submitEvent) {
    submitEvent.preventDefault()
    const normalizedPerson = normalizePersonaNameForDisplay(entryFormState.person === '__custom__'
      ? entryFormState.customPerson
      : entryFormState.person)
    const normalizedCategory = entryFormState.category === '__custom__'
      ? entryFormState.customCategory.trim()
      : entryFormState.category
    const [isoTimestamp, timestampError] = readCurrentIsoTimestampForBudgetRecordUpdates()
    if (timestampError || !isoTimestamp) return
    let nextCollectionsState = null
    if (entryFormState.recordType === 'asset') {
      const existingInstruments = Array.isArray(collections.instruments) ? collections.instruments : []
      const nextAssetRecord = {
        id: `asset-holding-${isoTimestamp}-${existingInstruments.filter((i) => i.kind === 'assetHolding').length + 1}`,
        kind: 'assetHolding',
        person: normalizedPerson,
        item: normalizedCategory || 'Asset',
        assetValueOwed: 0,
        assetMarketValue: Number(entryFormState.amount),
        description: entryFormState.description,
        date: entryFormState.date,
        updatedAt: isoTimestamp
      }
      nextCollectionsState = {
        ...collections,
        instruments: [...existingInstruments, nextAssetRecord]
      }
    } else if (entryFormState.recordType === 'debt' || entryFormState.recordType === 'loan') {
      const existingInstruments = Array.isArray(collections.instruments) ? collections.instruments : []
      const instrumentKind = entryFormState.recordType === 'debt' ? 'debt' : 'loan'
      const nextLiabilityRecord = {
        id: `${entryFormState.recordType}-${isoTimestamp}-${existingInstruments.filter((i) => i.kind === instrumentKind).length + 1}`,
        kind: instrumentKind,
        person: normalizedPerson,
        item: typeof entryFormState.item === 'string' && entryFormState.item.trim() ? entryFormState.item.trim() : (normalizedCategory || 'Liability'),
        category: normalizedCategory || 'Debt Payment',
        amount: Number(entryFormState.amount || 0),
        minimumPayment: Number(entryFormState.minimumPayment || 0),
        interestRatePercent: Number(entryFormState.interestRatePercent || 0),
        remainingPayments: Number(entryFormState.remainingPayments || 0),
        loanStartDate: entryFormState.loanStartDate || entryFormState.date,
        collateralAssetName: typeof entryFormState.collateralAssetName === 'string' ? entryFormState.collateralAssetName.trim() : '',
        collateralAssetMarketValue: Number(entryFormState.collateralAssetMarketValue || 0),
        description: entryFormState.description,
        date: entryFormState.date,
        updatedAt: isoTimestamp
      }
      nextCollectionsState = {
        ...collections,
        instruments: [...existingInstruments, nextLiabilityRecord]
      }
    } else if (entryFormState.recordType === 'credit_card') {
      const existingInstruments = Array.isArray(collections.instruments) ? collections.instruments : []
      const nextCreditCardRecord = {
        id: `credit-card-${isoTimestamp}-${existingInstruments.filter((i) => i.kind === 'creditCard').length + 1}`,
        kind: 'creditCard',
        person: normalizedPerson,
        item: typeof entryFormState.item === 'string' && entryFormState.item.trim() ? entryFormState.item.trim() : 'Credit Account',
        maxCapacity: Number(entryFormState.maxCapacity || 0),
        currentBalance: Number(entryFormState.currentBalance || 0),
        minimumPayment: Number(entryFormState.minimumPayment || 0),
        monthlyPayment: Number(entryFormState.monthlyPayment || 0),
        interestRatePercent: Number(entryFormState.interestRatePercent || 0),
        description: entryFormState.description,
        date: entryFormState.date,
        updatedAt: isoTimestamp
      }
      nextCollectionsState = {
        ...collections,
        instruments: [...existingInstruments, nextCreditCardRecord]
      }
    } else {
      const [appendState, appendError] = appendValidatedIncomeOrExpenseRecordIntoCollectionsState(
        collections,
        entryFormState.recordType,
        { person: normalizedPerson, amount: Number(entryFormState.amount), category: normalizedCategory, date: entryFormState.date, description: entryFormState.description },
        isoTimestamp
      )
      if (appendError || !appendState) {
        console.warn('[records] Failed to append income/expense record.', appendError)
        return
      }
      nextCollectionsState = appendState
    }
    const didApply = await applyNextCollectionsStateWithUndoForTransaction(nextCollectionsState, 'add-income-expense-asset')
    if (!didApply) {
      return
    }
    setEntryFormState(buildInitialIncomeExpenseEntryFormState())
    setIsAddRecordModalOpen(false)
  }

  function openAddRecordModalWithPresetTypeAndCategory(recordType, category) {
    setEntryFormState((previousFormState) => ({
      ...previousFormState,
      recordType,
      category,
      customCategory: '',
      item: '',
      amount: '',
      minimumPayment: '',
      monthlyPayment: '',
      interestRatePercent: '',
      remainingPayments: '',
      loanStartDate: '',
      collateralAssetName: '',
      collateralAssetMarketValue: '',
      maxCapacity: '',
      currentBalance: '',
      description: ''
    }))
    setIsAddRecordModalOpen(true)
  }

  async function submitNewAssetHoldingRecord(submitEvent) {
    submitEvent.preventDefault()
    const normalizedPerson = normalizePersonaNameForDisplay(assetHoldingEntryFormState.person === '__custom__'
      ? assetHoldingEntryFormState.customPerson
      : assetHoldingEntryFormState.person)
    const normalizedItem = typeof assetHoldingEntryFormState.item === 'string' ? assetHoldingEntryFormState.item.trim() : ''
    if (!normalizedItem) {
      console.warn('[assets] Asset item is required.')
      return
    }
    const [isoTimestamp, timestampError] = readCurrentIsoTimestampForBudgetRecordUpdates()
    if (timestampError || !isoTimestamp) return
    const existingInstruments = Array.isArray(collections.instruments) ? collections.instruments : []
    const nextRecord = {
      id: `asset-holding-${isoTimestamp}-${existingInstruments.filter((i) => i.kind === 'assetHolding').length + 1}`,
      kind: 'assetHolding',
      person: normalizedPerson,
      item: normalizedItem,
      assetValueOwed: Number(assetHoldingEntryFormState.assetValueOwed || 0),
      assetMarketValue: Number(assetHoldingEntryFormState.assetMarketValue || 0),
      description: typeof assetHoldingEntryFormState.description === 'string' ? assetHoldingEntryFormState.description : '',
      date: assetHoldingEntryFormState.date,
      updatedAt: isoTimestamp
    }
    const nextCollectionsState = {
      ...collections,
      instruments: [...existingInstruments, nextRecord]
    }
    const didApply = await applyNextCollectionsStateWithUndoForTransaction(nextCollectionsState, 'add-asset')
    if (!didApply) {
      return
    }
    setAssetHoldingEntryFormState(buildInitialAssetHoldingEntryFormState())
    setIsAddAssetModalOpen(false)
  }

  async function deleteGoalRecordById(goalId) {
    const normalizedGoalId = typeof goalId === 'string' ? goalId.trim() : ''
    if (!normalizedGoalId) return
    const shouldDelete = window.confirm('Delete this goal?')
    if (!shouldDelete) return
    const nextCollectionsState = {
      ...collections,
      goals: (Array.isArray(collections.goals) ? collections.goals : []).filter((goalItem) => String(goalItem?.id ?? '') !== normalizedGoalId)
    }
    const [persistSuccess, persistError] = await persistBudgetCollectionsStateIntoLocalStorageCache(nextCollectionsState)
    if (persistError || !persistSuccess) {
      console.warn('[goals] Failed to persist goal delete.', persistError)
      return
    }
    setCollections(nextCollectionsState)
    await syncCollectionsStateToSupabaseWhenConnected(nextCollectionsState, 'delete-goal')
    if (editingGoalId === normalizedGoalId) closeGoalModalAndResetForm()
  }

  async function submitNewGoalRecord(submitEvent) {
    submitEvent.preventDefault()
    const [isoTimestamp, timestampError] = readCurrentIsoTimestampForBudgetRecordUpdates()
    if (timestampError || !isoTimestamp) return

    const [validatedGoalRecord, validationError] = validateRequiredGoalRecordFieldsBeforePersistence({
      title: goalEntryFormState.title,
      status: goalEntryFormState.status,
      timeframeMonths: Number(goalEntryFormState.timeframeMonths),
      description: goalEntryFormState.description
    })
    if (validationError || !validatedGoalRecord) {
      console.warn('[goals] Failed to validate goal record.', validationError)
      return
    }

    let nextCollectionsState = null
    if (editingGoalId) {
      nextCollectionsState = {
        ...collections,
        goals: (Array.isArray(collections.goals) ? collections.goals : []).map((goalItem) => {
          if (String(goalItem?.id ?? '') !== editingGoalId) return goalItem
          return {
            ...goalItem,
            ...validatedGoalRecord,
            id: goalItem.id,
            updatedAt: isoTimestamp
          }
        })
      }
    } else {
      const [appendedCollectionsState, appendError] = appendValidatedGoalRecordIntoCollectionsState(
        collections,
        validatedGoalRecord,
        isoTimestamp
      )
      if (appendError || !appendedCollectionsState) {
        console.warn('[goals] Failed to append goal record.', appendError)
        return
      }
      nextCollectionsState = appendedCollectionsState
    }

    const [persistSuccess, persistError] = await persistBudgetCollectionsStateIntoLocalStorageCache(nextCollectionsState)
    if (persistError || !persistSuccess) {
      console.warn('[goals] Failed to persist goal changes.', persistError)
      return
    }
    setCollections(nextCollectionsState)
    await syncCollectionsStateToSupabaseWhenConnected(nextCollectionsState, editingGoalId ? 'edit-goal' : 'add-goal')
    closeGoalModalAndResetForm()
  }

  async function submitNewPersonaRecord(submitEvent) {
    submitEvent.preventDefault()
    const normalizedName = normalizePersonaNameForDisplay(personaEntryFormState.name)
    const normalizedNote = personaEntryFormState.note.trim()
    if (!normalizedName) {
      console.warn('[personas] Persona name is required.')
      return
    }
    const [isoTimestamp, timestampError] = readCurrentIsoTimestampForBudgetRecordUpdates()
    if (timestampError || !isoTimestamp) return

    const existingPersonas = Array.isArray(collections.personas) ? collections.personas : []
    const alreadyExists = existingPersonas.some((personaItem) => {
      if (!personaItem || typeof personaItem !== 'object') return false
      return typeof personaItem.name === 'string' && personaItem.name.trim().toLowerCase() === normalizedName.toLowerCase()
    })
    if (alreadyExists) {
      console.info('[personas] Persona already exists; skipping duplicate add.', normalizedName)
      setPersonaEntryFormState(buildInitialPersonaEntryFormState())
      selectPersonaForCrudByName(normalizedName)
      return
    }

    const nextPersonaRecord = {
      id: `persona-${isoTimestamp}-${existingPersonas.length + 1}`,
      name: normalizedName,
      note: normalizedNote,
      emoji: (personaEntryFormState.customEmoji.trim() || personaEntryFormState.emojiPreset || DEFAULT_PERSONA_EMOJI),
      updatedAt: isoTimestamp
    }
    const nextCollectionsState = {
      ...collections,
      personas: [...existingPersonas, nextPersonaRecord]
    }

    const [persistSuccess, persistError] = await persistBudgetCollectionsStateIntoLocalStorageCache(nextCollectionsState)
    if (persistError || !persistSuccess) {
      console.warn('[personas] Failed to persist new persona.', persistError)
      return
    }
    setCollections(nextCollectionsState)
    await syncCollectionsStateToSupabaseWhenConnected(nextCollectionsState, 'add-persona')
    setPersonaEntryFormState(buildInitialPersonaEntryFormState())
    setPersonaCrudFormState({
      personaName: normalizedName,
      mode: 'edit',
      nextName: normalizedName,
      nextNote: normalizedNote,
      nextEmojiPreset: (personaEntryFormState.customEmoji.trim() || personaEntryFormState.emojiPreset || DEFAULT_PERSONA_EMOJI),
      nextCustomEmoji: '',
      reassignToPersonaName: DEFAULT_PERSONA_NAME,
      deleteConfirmText: ''
    })
  }

  function selectPersonaForCrudByName(personaName) {
    const normalizedName = normalizePersonaNameForDisplay(personaName)
    const personas = Array.isArray(collections.personas) ? collections.personas : []
    const personaItem = personas.find((rowItem) => {
      if (!rowItem || typeof rowItem !== 'object') return false
      const name = typeof rowItem.name === 'string' ? normalizePersonaNameForDisplay(rowItem.name) : ''
      return name.toLowerCase() === normalizedName.toLowerCase()
    })
    const emojiValue = personaItem && typeof personaItem.emoji === 'string' ? personaItem.emoji : DEFAULT_PERSONA_EMOJI
    const noteValue = personaItem && typeof personaItem.note === 'string' ? personaItem.note : ''
    setPersonaCrudFormState({
      personaName: normalizedName,
      mode: 'edit',
      nextName: normalizedName,
      nextNote: noteValue,
      nextEmojiPreset: emojiValue,
      nextCustomEmoji: '',
      reassignToPersonaName: DEFAULT_PERSONA_NAME,
      deleteConfirmText: ''
    })
  }

  async function restorePersonaDangerBackupIntoCollections() {
    if (!personaDangerBackupState || !personaDangerBackupState.collectionsStateSnapshot) return
    const [persistSuccess, persistError] = await persistBudgetCollectionsStateIntoLocalStorageCache(personaDangerBackupState.collectionsStateSnapshot)
    if (persistError || !persistSuccess) {
      console.warn('[personas] Failed to restore persona backup snapshot.', persistError)
      return
    }
    setCollections(personaDangerBackupState.collectionsStateSnapshot)
    await syncCollectionsStateToSupabaseWhenConnected(personaDangerBackupState.collectionsStateSnapshot, 'restore-persona-backup')
    setPersonaDangerBackupState(null)
    setPersonaCrudFormState(buildInitialPersonaCrudFormState())
  }

  async function submitPersonaCrudOperation(submitEvent) {
    submitEvent.preventDefault()
    const selectedPersonaName = normalizePersonaNameForDisplay(personaCrudFormState.personaName)
    if (!selectedPersonaName) {
      console.warn('[personas] Select a persona first.')
      return
    }
    const [isoTimestamp, timestampError] = readCurrentIsoTimestampForBudgetRecordUpdates()
    if (timestampError || !isoTimestamp) return

    if (personaCrudFormState.mode === 'edit') {
      const nextPersonaName = normalizePersonaNameForDisplay(personaCrudFormState.nextName)
      if (!nextPersonaName) {
        console.warn('[personas] Edited persona name is required.')
        return
      }
      const [nextCollectionsState, renameError] = renamePersonaAcrossCollectionsStateByName(
        collections,
        selectedPersonaName,
        nextPersonaName,
        {
          note: personaCrudFormState.nextNote,
          emoji: personaCrudFormState.nextCustomEmoji.trim() || personaCrudFormState.nextEmojiPreset || DEFAULT_PERSONA_EMOJI,
          updatedAt: isoTimestamp
        }
      )
      if (renameError || !nextCollectionsState) {
        console.warn('[personas] Failed to rename persona.', renameError)
        return
      }
      const [persistSuccess, persistError] = await persistBudgetCollectionsStateIntoLocalStorageCache(nextCollectionsState)
      if (persistError || !persistSuccess) {
        console.warn('[personas] Failed to persist persona edit.', persistError)
        return
      }
      setCollections(nextCollectionsState)
      await syncCollectionsStateToSupabaseWhenConnected(nextCollectionsState, 'edit-persona')
      selectPersonaForCrudByName(nextPersonaName)
      return
    }

    const [impactSummary, impactError] = buildPersonaImpactSummaryFromCollectionsStateByPersonaName(collections, selectedPersonaName)
    if (impactError || !impactSummary) {
      console.warn('[personas] Failed to build persona impact summary.', impactError)
      return
    }
    const mustType = `DELETE ${selectedPersonaName}`
    if (personaCrudFormState.mode === 'delete_cascade' && personaCrudFormState.deleteConfirmText.trim() !== mustType) {
      console.warn('[personas] Cascade delete requires exact confirm text.', { mustType })
      return
    }
    const normalizedReassignName = normalizePersonaNameForDisplay(personaCrudFormState.reassignToPersonaName)
    if (personaCrudFormState.mode === 'delete_reassign') {
      const isSamePersonaReassign = normalizedReassignName.toLowerCase() === selectedPersonaName.toLowerCase()
      const hasNoReassignTargets = reassignablePersonaOptions.length === 0
      if (isSamePersonaReassign || hasNoReassignTargets) {
        console.warn('[personas] Delete + Reassign requires another persona target. Use Delete Cascade for default-user-only profiles.')
        return
      }
    }
    console.warn('[personas] Running destructive persona operation.', {
      mode: personaCrudFormState.mode,
      persona: selectedPersonaName,
      impactedRecords: impactSummary.total
    })

    const deleteMode = personaCrudFormState.mode === 'delete_cascade' ? 'cascade' : 'reassign'
    const [nextCollectionsState, deleteError] = deletePersonaAcrossCollectionsStateByName(
      collections,
      selectedPersonaName,
      deleteMode,
      normalizedReassignName
    )
    if (deleteError || !nextCollectionsState) {
      console.warn('[personas] Failed to delete persona.', deleteError)
      return
    }

    const [persistSuccess, persistError] = await persistBudgetCollectionsStateIntoLocalStorageCache(nextCollectionsState)
    if (persistError || !persistSuccess) {
      console.warn('[personas] Failed to persist persona delete.', persistError)
      return
    }
    setPersonaDangerBackupState({
      at: isoTimestamp,
      collectionsStateSnapshot: collections
    })
    setCollections(nextCollectionsState)
    await syncCollectionsStateToSupabaseWhenConnected(nextCollectionsState, 'delete-persona')
    setPersonaCrudFormState(buildInitialPersonaCrudFormState())
  }

  async function openProfileTransferModalForMode(mode) {
    if (mode === 'export') {
      const [jsonText, jsonTextError] = await exportCompleteFinancialProfileAsJsonTextSnapshot(
        collections,
        { themeName, textScaleMultiplier, tableSortState },
        auditTimelineEntries
      )
      if (jsonTextError || !jsonText) {
        console.warn('[profile] Failed to export financial profile JSON.', jsonTextError)
        return
      }
      setProfileTransferFormState({ mode: 'export', jsonText })
      setIsProfileTransferModalOpen(true)
      return
    }
    setProfileTransferFormState({ mode: 'import', jsonText: '' })
    setIsProfileTransferModalOpen(true)
  }

  async function applyImportedProfileIntoLocalStateWithMergeAndRecompute(importedProfile, sourceTag) {
    if (!importedProfile || !importedProfile.collections) {
      console.warn('[profile] apply skipped: imported profile is missing collections.', { sourceTag })
      return false
    }
    console.info('[profile] Import parsed successfully.', {
      sourceTag,
      hasCollections: !!importedProfile.collections,
      hasUiPreferences: !!importedProfile.uiPreferences,
      auditEntries: Array.isArray(importedProfile.auditTimelineEntries) ? importedProfile.auditTimelineEntries.length : 0
    })
    const [migratedImportedCollections, migrationError] = migrateCollectionsStateFromV2ToV3(importedProfile.collections)
    if (migrationError || !migratedImportedCollections) {
      console.warn('[profile] Failed to migrate imported collections to v3 schema.', migrationError)
      return false
    }
    const [mergedCollectionsState, mergeCollectionsError] = mergeImportedCollectionsStateWithExistingStateUsingDedupKeys(collections, migratedImportedCollections)
    if (mergeCollectionsError || !mergedCollectionsState) {
      console.warn('[profile] Failed to merge imported collections with local data.', mergeCollectionsError)
      return false
    }
    const [persistSuccess, persistError] = await persistBudgetCollectionsStateIntoLocalStorageCache(mergedCollectionsState)
    if (persistError || !persistSuccess) {
      console.warn('[profile] Failed to persist imported financial profile JSON.', persistError)
      return false
    }
    console.info('[profile] Collections persisted.')
    if (importedProfile.uiPreferences) {
      const [persistUiSuccess, persistUiError] = await persistUiPreferencesIntoLocalStorageCache(importedProfile.uiPreferences)
      if (persistUiError || !persistUiSuccess) {
        console.warn('[profile] Failed to persist imported ui preferences.', persistUiError)
      } else {
        setThemeName(importedProfile.uiPreferences.themeName)
        setTextScaleMultiplier(importedProfile.uiPreferences.textScaleMultiplier)
        if (importedProfile.uiPreferences.tableSortState) {
          setTableSortState({
            ...DEFAULT_TABLE_SORT_STATE,
            ...importedProfile.uiPreferences.tableSortState
          })
        }
        console.info('[profile] UI preferences persisted and applied.')
      }
    }
    if (Array.isArray(importedProfile.auditTimelineEntries)) {
      const [mergedAuditTimelineEntries, mergeAuditError] = mergeAuditTimelineEntriesUsingDedupKeys(auditTimelineEntries, importedProfile.auditTimelineEntries)
      if (mergeAuditError || !mergedAuditTimelineEntries) {
        console.warn('[profile] Failed to merge imported audit timeline with local data.', mergeAuditError)
      } else {
        const [persistAuditSuccess, persistAuditError] = await persistAuditTimelineIntoLocalStorageCache(mergedAuditTimelineEntries)
        if (persistAuditError || !persistAuditSuccess) {
          console.warn('[profile] Failed to persist imported audit timeline.', persistAuditError)
        } else {
          setAuditTimelineEntries(mergedAuditTimelineEntries)
          console.info('[profile] Audit timeline persisted.', { count: mergedAuditTimelineEntries.length })
        }
      }
    }
    setCollections(mergedCollectionsState)
    await recomputeAndValidateDashboardDerivedStateAfterImport(mergedCollectionsState)
    await recomputeRiskFindingsFromCollectionsState(mergedCollectionsState)
    return true
  }
  async function submitImportedProfileJson(submitEvent) {
    submitEvent.preventDefault()
    console.info('[profile] Import started.')
    const [importedProfile, importedProfileError] = await importCompleteFinancialProfileFromJsonTextSnapshot(profileTransferFormState.jsonText)
    if (importedProfileError || !importedProfile) {
      console.warn('[profile] Failed to import financial profile JSON.', importedProfileError)
      return
    }
    const didApply = await applyImportedProfileIntoLocalStateWithMergeAndRecompute(importedProfile, 'json-textarea')
    if (!didApply) return
    setIsProfileTransferModalOpen(false)
    setProfileTransferFormState(buildInitialProfileTransferFormState())
    console.info('[profile] Import completed successfully.')
  }
  async function copyProfileTransferJsonTextToClipboard() {
    const [copySuccess, copyError] = await copyTextToClipboardUsingBrowserApi(profileTransferFormState.jsonText)
    if (copyError || !copySuccess) {
      console.warn('[profile] Failed to copy profile json to clipboard.', copyError)
      return
    }
  }
  async function saveSupabaseWebConfigIntoCache() {
    setSupabaseSyncStatusState({ tone: SYNC_STATUS_TONE_NEUTRAL, message: SYNC_MSG_SAVING_CONFIG, detail: '' })
    const [isConfigValid, configValidationMessage] = validateSupabaseSyncConfigShapeForClientUsage(supabaseSyncFormState)
    if (!isConfigValid) {
      setSupabaseSyncStatusState({ tone: 'warning', message: configValidationMessage, detail: '' })
      return
    }
    const [persistSuccess, persistError] = await persistSupabaseWebConfigIntoLocalStorageCache(supabaseSyncFormState)
    if (persistError || !persistSuccess) {
      console.warn('[api-sync] Failed to persist api sync config.', persistError)
      setSupabaseSyncStatusState(buildSupabaseUiStatusFromError(persistError))
      return
    }
    setSupabaseSyncStatusState({ tone: SYNC_STATUS_TONE_SUCCESS, message: SYNC_MSG_CONFIG_SAVED, detail: '' })
    console.info('[api-sync] API sync config saved.')
  }
  async function connectSupabaseSessionFromModal() {
    setIsSupabaseOperationInFlight(true)
    setSupabaseSyncStatusState({ tone: SYNC_STATUS_TONE_NEUTRAL, message: SYNC_MSG_VERIFYING, detail: '' })
    const [isConfigValid, configValidationMessage] = validateSupabaseSyncConfigShapeForClientUsage(supabaseSyncFormState)
    if (!isConfigValid) {
      setSupabaseSyncStatusState({ tone: 'warning', message: configValidationMessage, detail: '' })
      setIsSupabaseOperationInFlight(false)
      return
    }
    if (typeof supabaseSyncFormState.password !== 'string' || supabaseSyncFormState.password.trim().length === 0) {
      setSupabaseSyncStatusState({ tone: SYNC_STATUS_TONE_WARNING, message: SYNC_MSG_OTP_REQUIRED, detail: '' })
      setIsSupabaseOperationInFlight(false)
      return
    }
    const [verifiedUser, verifyError] = await verifySupabaseEmailOtpCodeAndCreateSession(
      supabaseSyncFormState,
      '',
      supabaseSyncFormState.password
    )
    if (verifyError || !verifiedUser) {
      console.warn('[api-sync] Login verify failed.', verifyError)
      setSupabaseSyncStatusState(buildSupabaseUiStatusFromError(verifyError))
      showSyncNotice(SYNC_NOTICE_TONE_FAILURE, SYNC_NOTICE_CONNECT_FAILURE)
      setIsSupabaseOperationInFlight(false)
      return
    }
    const nextFormState = {
      ...supabaseSyncFormState,
      password: ''
    }
    setSupabaseSyncFormState(nextFormState)
    const [persistSuccess, persistError] = await persistSupabaseWebConfigIntoLocalStorageCache(nextFormState)
    if (persistError || !persistSuccess) {
      console.warn('[api-sync] Failed to persist sync config after login.', persistError)
    }
    setSupabaseAuthUserSummary({ id: verifiedUser.id, email: verifiedUser.email })
    setSupabaseSyncStatusState({ tone: SYNC_STATUS_TONE_SUCCESS, message: SYNC_MSG_SESSION_ACTIVE, detail: verifiedUser.email || verifiedUser.id })
    console.info('[api-sync] Login verify success.', { id: verifiedUser.id, email: verifiedUser.email })
    showSyncNotice(SYNC_NOTICE_TONE_SUCCESS, SYNC_NOTICE_CONNECT_SUCCESS)
    setIsSupabaseOperationInFlight(false)
  }
  async function refreshSupabaseAuthUserSummaryFromSession() {
    const [userSummary, userSummaryError] = await readSupabaseAuthenticatedUserSummary(supabaseSyncFormState)
    if (userSummaryError) {
      console.warn('[api-sync] Failed to read auth user summary.', userSummaryError)
      setSupabaseSyncStatusState(buildSupabaseUiStatusFromError(userSummaryError))
      return
    }
    setSupabaseAuthUserSummary(userSummary)
    if (userSummary) {
      if (supabaseSyncFormState.password) {
        const nextFormState = { ...supabaseSyncFormState, password: '' }
        setSupabaseSyncFormState(nextFormState)
        const [persistSuccess, persistError] = await persistSupabaseWebConfigIntoLocalStorageCache(nextFormState)
        if (persistError || !persistSuccess) console.warn('[api-sync] Failed to persist config after refresh.', persistError)
      }
      setSupabaseSyncStatusState({ tone: SYNC_STATUS_TONE_SUCCESS, message: SYNC_MSG_SESSION_ACTIVE, detail: userSummary.email || userSummary.id })
    } else {
      setSupabaseSyncStatusState({ tone: SYNC_STATUS_TONE_NEUTRAL, message: SYNC_MSG_NO_SESSION, detail: '' })
    }
  }
  async function signOutFromSupabaseSessionFromModal() {
    setIsSupabaseOperationInFlight(true)
    setSupabaseSyncStatusState({ tone: SYNC_STATUS_TONE_NEUTRAL, message: SYNC_MSG_SIGNING_OUT, detail: '' })
    const [signOutSuccess, signOutError] = await signOutFromSupabaseCurrentSession(supabaseSyncFormState)
    if (signOutError || !signOutSuccess) {
      console.warn('[api-sync] Sign-out failed.', signOutError)
      setSupabaseSyncStatusState(buildSupabaseUiStatusFromError(signOutError))
      setIsSupabaseOperationInFlight(false)
      return
    }
    setSupabaseAuthUserSummary(null)
    const nextFormState = { ...supabaseSyncFormState, password: '' }
    setSupabaseSyncFormState(nextFormState)
    const [persistSuccess, persistError] = await persistSupabaseWebConfigIntoLocalStorageCache(nextFormState)
    if (persistError || !persistSuccess) console.warn('[api-sync] Failed to persist config on sign-out.', persistError)
    setSupabaseSyncStatusState({ tone: SYNC_STATUS_TONE_NEUTRAL, message: SYNC_MSG_SIGNED_OUT, detail: '' })
    setIsSupabaseOperationInFlight(false)
  }
  async function pushCurrentProfileSnapshotToSupabase() {
    setIsSupabaseOperationInFlight(true)
    setSupabaseSyncStatusState({ tone: SYNC_STATUS_TONE_NEUTRAL, message: SYNC_MSG_PUSH_START, detail: SYNC_MSG_PUSH_START_DETAIL })
    const [syncResult, syncError] = await pushCompleteFinancialProfileIntoSupabaseForAuthenticatedUser(
      supabaseSyncFormState,
      collections,
      { themeName, textScaleMultiplier, tableSortState },
      auditTimelineEntries
    )
    if (syncError || !syncResult) {
      console.warn('[api-sync] Push failed.', syncError)
      setSupabaseSyncStatusState(buildSupabaseUiStatusFromError(syncError))
      showSyncNotice(SYNC_NOTICE_TONE_FAILURE, SYNC_NOTICE_PUSH_FAILURE)
      setIsSupabaseOperationInFlight(false)
      return
    }
    setSupabaseSyncStatusState({ tone: SYNC_STATUS_TONE_SUCCESS, message: SYNC_MSG_PUSH_DONE, detail: syncResult.savedAtIso })
    showSyncNotice(SYNC_NOTICE_TONE_SUCCESS, SYNC_NOTICE_PUSH_SUCCESS)
    setIsSupabaseOperationInFlight(false)
  }
  async function pullProfileSnapshotFromSupabase() {
    setIsSupabaseOperationInFlight(true)
    setSupabaseSyncStatusState({ tone: SYNC_STATUS_TONE_NEUTRAL, message: SYNC_MSG_PULL_START, detail: SYNC_MSG_PULL_START_DETAIL })
    const [importedProfile, importedProfileError] = await pullCompleteFinancialProfileFromSupabaseForAuthenticatedUser(supabaseSyncFormState)
    if (importedProfileError || !importedProfile) {
      console.warn('[api-sync] Pull failed.', importedProfileError)
      setSupabaseSyncStatusState(buildSupabaseUiStatusFromError(importedProfileError))
      showSyncNotice(SYNC_NOTICE_TONE_FAILURE, SYNC_NOTICE_PULL_FAILURE)
      setIsSupabaseOperationInFlight(false)
      return
    }
    const didApply = await applyImportedProfileIntoLocalStateWithMergeAndRecompute(importedProfile, 'api-pull')
    if (!didApply) {
      setIsSupabaseOperationInFlight(false)
      return
    }
    setSupabaseSyncStatusState({ tone: SYNC_STATUS_TONE_SUCCESS, message: SYNC_MSG_PULL_DONE, detail: SYNC_MSG_PULL_DONE_DETAIL })
    showSyncNotice(SYNC_NOTICE_TONE_SUCCESS, SYNC_NOTICE_PULL_SUCCESS)
    setIsSupabaseOperationInFlight(false)
  }
  async function saveFirebaseWebConfigIntoCache() {
    setFirebaseSyncStatusState({ tone: 'neutral', message: 'Saving Firebase config...', detail: '' })
    const mergedFirebaseConfig = buildFirebaseSyncConfigWithRequiredDefaults(firebaseSyncFormState)
    const [isConfigValid, configValidationMessage] = validateFirebaseSyncConfigShapeForClientUsage(mergedFirebaseConfig)
    if (!isConfigValid) {
      setFirebaseSyncStatusState({ tone: 'warning', message: configValidationMessage, detail: '' })
      return
    }
    setFirebaseSyncFormState(mergedFirebaseConfig)
    const [persistSuccess, persistError] = await persistFirebaseWebConfigIntoLocalStorageCache(mergedFirebaseConfig)
    if (persistError || !persistSuccess) {
      console.warn('[firebase] Failed to persist firebase config.', persistError)
      setFirebaseSyncStatusState(buildFirebaseUiStatusFromError(persistError))
      return
    }
    setFirebaseSyncStatusState({ tone: 'success', message: 'Firebase config saved.', detail: `${mergedFirebaseConfig.projectId} | ${mergedFirebaseConfig.authDomain}` })
    console.info('[firebase] Firebase config saved.')
  }
  async function signInWithFirebaseGooglePopupFromModal() {
    setIsFirebaseOperationInFlight(true)
    setFirebaseSyncStatusState({ tone: 'neutral', message: 'Starting Google sign-in...', detail: 'Waiting for popup completion.' })
    const mergedFirebaseConfig = buildFirebaseSyncConfigWithRequiredDefaults(firebaseSyncFormState)
    const effectiveFirebaseConfig = mergedFirebaseConfig.enabled
      ? mergedFirebaseConfig
      : { ...mergedFirebaseConfig, enabled: true }
    if (!firebaseSyncFormState.enabled) {
      setFirebaseSyncFormState(effectiveFirebaseConfig)
      const [persistSuccess, persistError] = await persistFirebaseWebConfigIntoLocalStorageCache(effectiveFirebaseConfig)
      if (persistError || !persistSuccess) {
        console.warn('[firebase] Failed to auto-enable firebase before sign-in.', persistError)
        setFirebaseSyncStatusState(buildFirebaseUiStatusFromError(persistError))
        setIsFirebaseOperationInFlight(false)
        return
      }
      console.info('[firebase] Auto-enabled firebase for sign-in flow.')
    }
    const [isConfigValid, configValidationMessage] = validateFirebaseSyncConfigShapeForClientUsage(effectiveFirebaseConfig)
    if (!isConfigValid) {
      setFirebaseSyncStatusState({ tone: 'warning', message: configValidationMessage, detail: '' })
      setIsFirebaseOperationInFlight(false)
      return
    }
    const [userSummary, userSummaryError] = await signInToFirebaseWithGooglePopup(effectiveFirebaseConfig)
    if (userSummaryError || !userSummary) {
      console.warn('[firebase] Sign-in failed.', userSummaryError)
      setFirebaseSyncStatusState(buildFirebaseUiStatusFromError(userSummaryError))
      setIsFirebaseOperationInFlight(false)
      return
    }
    setFirebaseAuthUserSummary(userSummary)
    setFirebaseSyncStatusState({ tone: 'success', message: 'Firebase sign-in successful.', detail: userSummary.email || userSummary.uid })
    setIsFirebaseOperationInFlight(false)
    console.info('[firebase] Signed in.', { uid: userSummary.uid, email: userSummary.email })
  }
  async function signOutFromFirebaseSessionFromModal() {
    setIsFirebaseOperationInFlight(true)
    setFirebaseSyncStatusState({ tone: 'neutral', message: 'Signing out from Firebase...', detail: '' })
    const [signOutSuccess, signOutError] = await signOutFromFirebaseCurrentSession(firebaseSyncFormState)
    if (signOutError || !signOutSuccess) {
      console.warn('[firebase] Sign-out failed.', signOutError)
      setFirebaseSyncStatusState(buildFirebaseUiStatusFromError(signOutError))
      setIsFirebaseOperationInFlight(false)
      return
    }
    setFirebaseAuthUserSummary(null)
    setFirebaseSyncStatusState({ tone: 'neutral', message: 'Signed out from Firebase.', detail: '' })
    setIsFirebaseOperationInFlight(false)
    console.info('[firebase] Signed out.')
  }
  async function pushCurrentProfileSnapshotToFirebase() {
    setIsFirebaseOperationInFlight(true)
    setFirebaseSyncStatusState({ tone: 'neutral', message: 'Firebase push started...', detail: 'Writing profile snapshot to cloud.' })
    const [syncResult, syncError] = await pushCompleteFinancialProfileIntoFirebaseForAuthenticatedUser(
      firebaseSyncFormState,
      collections,
      { themeName, textScaleMultiplier, tableSortState },
      auditTimelineEntries
    )
    if (syncError || !syncResult) {
      console.warn('[firebase] Push failed.', syncError)
      setFirebaseSyncStatusState(buildFirebaseUiStatusFromError(syncError))
      setIsFirebaseOperationInFlight(false)
      return
    }
    setFirebaseSyncStatusState({ tone: 'success', message: 'Push to Firebase completed.', detail: syncResult.savedAtIso })
    setIsFirebaseOperationInFlight(false)
    console.info('[firebase] Push completed.', syncResult)
  }
  async function pullProfileSnapshotFromFirebase() {
    setIsFirebaseOperationInFlight(true)
    setFirebaseSyncStatusState({ tone: 'neutral', message: 'Firebase pull started...', detail: 'Reading profile snapshot from cloud.' })
    const [importedProfile, importedProfileError] = await pullCompleteFinancialProfileFromFirebaseForAuthenticatedUser(firebaseSyncFormState)
    if (importedProfileError || !importedProfile) {
      if (importedProfileError && importedProfileError.kind === 'NOT_FOUND') {
        console.info('[firebase] No remote profile found; creating one from local state.')
        setFirebaseSyncStatusState({ tone: 'neutral', message: 'No remote profile found. Creating one now.', detail: '' })
        await pushCurrentProfileSnapshotToFirebase()
        setIsFirebaseOperationInFlight(false)
        return
      }
      console.warn('[firebase] Pull failed.', importedProfileError)
      setFirebaseSyncStatusState(buildFirebaseUiStatusFromError(importedProfileError))
      setIsFirebaseOperationInFlight(false)
      return
    }
    const didApply = await applyImportedProfileIntoLocalStateWithMergeAndRecompute(importedProfile, 'firebase-pull')
    if (!didApply) {
      setIsFirebaseOperationInFlight(false)
      return
    }
    setFirebaseSyncStatusState({ tone: 'success', message: 'Pull from Firebase completed.', detail: 'Local profile updated from remote snapshot.' })
    setIsFirebaseOperationInFlight(false)
    console.info('[firebase] Pull completed and applied.')
  }
  async function deleteAllLocalFinancialProfileDataWithUndoSnapshot() {
    const shouldDelete = window.confirm('Delete all local profile data now? You can undo once from this modal.')
    if (!shouldDelete) return

    // Critical path: capture full pre-delete state so delete can be safely undone.
    const [snapshotJsonText, snapshotJsonTextError] = await exportCompleteFinancialProfileAsJsonTextSnapshot(
      collections,
      { themeName, textScaleMultiplier, tableSortState },
      auditTimelineEntries
    )
    if (snapshotJsonTextError || !snapshotJsonText) {
      console.warn('[profile] Failed to build delete undo snapshot.', snapshotJsonTextError)
      return
    }

    const emptyCollectionsState = buildEmptyBudgetCollectionsStateForHardReset()
    const [persistCollectionsSuccess, persistCollectionsError] = await persistBudgetCollectionsStateIntoLocalStorageCache(emptyCollectionsState)
    if (persistCollectionsError || !persistCollectionsSuccess) {
      console.warn('[profile] Failed to persist cleared collections.', persistCollectionsError)
    }
    const [persistAuditSuccess, persistAuditError] = await persistAuditTimelineIntoLocalStorageCache([])
    if (persistAuditError || !persistAuditSuccess) {
      console.warn('[profile] Failed to persist cleared audit timeline.', persistAuditError)
    }
    const [persistUiSuccess, persistUiError] = await persistUiPreferencesIntoLocalStorageCache({
      themeName: 'dark',
      textScaleMultiplier: 1,
      tableSortState: DEFAULT_TABLE_SORT_STATE
    })
    if (persistUiError || !persistUiSuccess) {
      console.warn('[profile] Failed to persist cleared ui preferences.', persistUiError)
    }

    setProfileDeleteUndoSnapshotJsonText(snapshotJsonText)
    setCollections(emptyCollectionsState)
    setAuditTimelineEntries([])
    setRiskFindings([])
    setSelectedRiskFinding(null)
    transactionUndoStackRef.current = []
    setTransactionUndoDepth(0)
    setThemeName('dark')
    setTextScaleMultiplier(1)
    setTableSortState(DEFAULT_TABLE_SORT_STATE)
    await recomputeAndValidateDashboardDerivedStateAfterImport(emptyCollectionsState)
    await recomputeRiskFindingsFromCollectionsState(emptyCollectionsState)
    setProfileTransferFormState({ mode: 'export', jsonText: '' })
    console.info('[profile] Local profile data deleted. Undo snapshot saved.')
  }
  async function restoreDeletedLocalFinancialProfileDataFromUndoSnapshot() {
    if (!profileDeleteUndoSnapshotJsonText) return
    console.info('[profile] Delete undo restore started.')
    const [importedProfile, importedProfileError] = await importCompleteFinancialProfileFromJsonTextSnapshot(profileDeleteUndoSnapshotJsonText)
    if (importedProfileError || !importedProfile || !importedProfile.collections) {
      console.warn('[profile] Failed to parse delete undo snapshot.', importedProfileError)
      return
    }
    const [persistCollectionsSuccess, persistCollectionsError] = await persistBudgetCollectionsStateIntoLocalStorageCache(importedProfile.collections)
    if (persistCollectionsError || !persistCollectionsSuccess) {
      console.warn('[profile] Failed to persist restored collections from undo snapshot.', persistCollectionsError)
      return
    }
    if (Array.isArray(importedProfile.auditTimelineEntries)) {
      const [persistAuditSuccess, persistAuditError] = await persistAuditTimelineIntoLocalStorageCache(importedProfile.auditTimelineEntries)
      if (persistAuditError || !persistAuditSuccess) {
        console.warn('[profile] Failed to persist restored audit timeline from undo snapshot.', persistAuditError)
        return
      }
      setAuditTimelineEntries(importedProfile.auditTimelineEntries)
    }
    if (importedProfile.uiPreferences) {
      const [persistUiSuccess, persistUiError] = await persistUiPreferencesIntoLocalStorageCache(importedProfile.uiPreferences)
      if (persistUiError || !persistUiSuccess) {
        console.warn('[profile] Failed to persist restored ui preferences from undo snapshot.', persistUiError)
        return
      }
      setThemeName(importedProfile.uiPreferences.themeName)
      setTextScaleMultiplier(importedProfile.uiPreferences.textScaleMultiplier)
      setTableSortState({
        ...DEFAULT_TABLE_SORT_STATE,
        ...(importedProfile.uiPreferences.tableSortState ?? {})
      })
    }
    setCollections(importedProfile.collections)
    await recomputeAndValidateDashboardDerivedStateAfterImport(importedProfile.collections)
    await recomputeRiskFindingsFromCollectionsState(importedProfile.collections)
    setProfileDeleteUndoSnapshotJsonText('')
    console.info('[profile] Delete undo restore completed successfully.')
  }

  async function persistUpdatedUiPreferencesAfterControlChanges(nextThemeName, nextTextScaleMultiplier, nextTableSortState = tableSortState) {
    await persistUiPreferencesIntoLocalStorageCache({ themeName: nextThemeName, textScaleMultiplier: nextTextScaleMultiplier, tableSortState: nextTableSortState })
  }
  async function toggleThemeNameBetweenLightAndDark() {
    const nextThemeName = themeName === 'dark' ? 'light' : 'dark'
    setThemeName(nextThemeName)
    await persistUpdatedUiPreferencesAfterControlChanges(nextThemeName, textScaleMultiplier)
  }
  async function updateGlobalTextScaleByDelta(delta) {
    const nextTextScaleMultiplier = Math.max(0.9, Math.min(1.2, Number((textScaleMultiplier + delta).toFixed(2))))
    setTextScaleMultiplier(nextTextScaleMultiplier)
    await persistUpdatedUiPreferencesAfterControlChanges(themeName, nextTextScaleMultiplier)
  }
  async function resetGlobalTextScaleToDefault() {
    setTextScaleMultiplier(1)
    await persistUpdatedUiPreferencesAfterControlChanges(themeName, 1)
  }
  function openLoginModal() {
    setLoginPasswordInputValue('')
    setLoginStatusMessage('')
    setIsLoginModalOpen(true)
  }
  async function submitAdminLoginFromModal(submitEvent) {
    submitEvent.preventDefault()
    const trimmedPassword = loginPasswordInputValue.trim()
    if (!trimmedPassword) {
      setLoginStatusMessage('Password is required.')
      return
    }
    setIsLoginOperationInFlight(true)
    setLoginStatusMessage('Authenticating...')
    const enabledConfig = { ...supabaseSyncFormState, enabled: true }
    const [verifiedUser, verifyError] = await verifySupabaseEmailOtpCodeAndCreateSession(enabledConfig, '', trimmedPassword)
    if (verifyError || !verifiedUser) {
      setLoginStatusMessage('Login failed. Check your password.')
      setIsLoginOperationInFlight(false)
      return
    }
    setSupabaseAuthUserSummary({ id: verifiedUser.id, email: verifiedUser.email })
    setSupabaseSyncFormState((prev) => ({ ...prev, enabled: true, password: '' }))
    await persistSupabaseWebConfigIntoLocalStorageCache({ enabled: true })
    setLoginStatusMessage('')
    setLoginPasswordInputValue('')
    setIsLoginOperationInFlight(false)
    setIsLoginModalOpen(false)
    sessionExpiryTimersRef.current.forEach(clearTimeout)
    const SESSION_TTL_MS = 3600000
    const WARN_BEFORE_MS = 120000
    sessionExpiryTimersRef.current = [
      setTimeout(() => { showSyncNotice(SYNC_NOTICE_TONE_FAILURE, 'Admin session expires in 2 minutes.') }, SESSION_TTL_MS - WARN_BEFORE_MS),
      setTimeout(() => { showSyncNotice(SYNC_NOTICE_TONE_FAILURE, 'Admin session expired. Please log in again.'); setSupabaseAuthUserSummary(null) }, SESSION_TTL_MS),
    ]
  }
  async function submitAdminLogoutFromModal() {
    setIsLoginOperationInFlight(true)
    const [, logoutError] = await signOutFromSupabaseCurrentSession({ ...supabaseSyncFormState, enabled: true })
    if (logoutError) {
      console.warn('[auth] logout failed', logoutError)
    }
    sessionExpiryTimersRef.current.forEach(clearTimeout)
    sessionExpiryTimersRef.current = []
    setSupabaseAuthUserSummary(null)
    setSupabaseSyncFormState((prev) => ({ ...prev, enabled: false, password: '' }))
    await persistSupabaseWebConfigIntoLocalStorageCache({ enabled: false })
    setIsLoginOperationInFlight(false)
    setIsLoginModalOpen(false)
  }
  function scrollViewportToTopFromUtilityButton() {
    scrollViewportToTopWithSmoothBehavior()
  }
  function scrollToSectionAnchorWithFastEasing(clickEvent) {
    const href = clickEvent.currentTarget.getAttribute('href')
    if (!href || !href.startsWith('#')) return
    const targetEl = document.getElementById(href.slice(1))
    if (!targetEl) return
    clickEvent.preventDefault()
    const navBar = document.querySelector('.budget-sticky-toolbar')
    const navHeight = navBar ? navBar.getBoundingClientRect().height : 0
    const siteHeaderOffset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--site-header-offset') || '96', 10)
    const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - navHeight - siteHeaderOffset - 12
    const startY = window.scrollY
    const distance = targetTop - startY
    const duration = 100
    const startTime = performance.now()
    function step(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      window.scrollTo(0, startY + distance * eased)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }
  function updateEditRecordFormFieldValue(fieldName, nextFieldValue) {
    setEditRecordFormState((previousFormState) => ({ ...previousFormState, [fieldName]: nextFieldValue }))
  }
  function openEditModalForRecord(collectionName, recordItem) {
    const recordPerson = normalizePersonaNameForDisplay(typeof recordItem.person === 'string' ? recordItem.person : '')
    const hasKnownPersona = personaOptions.includes(recordPerson)
    const recordCategory = typeof recordItem.category === 'string' ? recordItem.category : ''
    const hasKnownCategory = COMMON_BUDGET_CATEGORIES.includes(recordCategory)
    setEditRecordFormState({
      collectionName,
      recordId: typeof recordItem.id === 'string' ? recordItem.id : '',
      person: hasKnownPersona ? recordPerson : '__custom__',
      customPerson: hasKnownPersona ? '' : recordPerson,
      item: typeof recordItem.item === 'string' ? recordItem.item : '',
      category: hasKnownCategory ? recordCategory : (recordCategory ? '__custom__' : ''),
      customCategory: hasKnownCategory ? '' : recordCategory,
      amount: typeof recordItem.amount === 'number' ? String(recordItem.amount) : '',
      minimumPayment: typeof recordItem.minimumPayment === 'number' ? String(recordItem.minimumPayment) : '',
      interestRatePercent: typeof recordItem.interestRatePercent === 'number' ? String(recordItem.interestRatePercent) : '',
      remainingPayments: typeof recordItem.remainingPayments === 'number' ? String(recordItem.remainingPayments) : '',
      loanStartDate: typeof recordItem.loanStartDate === 'string' ? recordItem.loanStartDate : '',
      collateralAssetName: typeof recordItem.collateralAssetName === 'string' ? recordItem.collateralAssetName : '',
      collateralAssetMarketValue: typeof recordItem.collateralAssetMarketValue === 'number' ? String(recordItem.collateralAssetMarketValue) : '',
      creditLimit: typeof recordItem.creditLimit === 'number' ? String(recordItem.creditLimit) : '',
      maxCapacity: typeof recordItem.maxCapacity === 'number' ? String(recordItem.maxCapacity) : '',
      currentBalance: typeof recordItem.currentBalance === 'number' ? String(recordItem.currentBalance) : '',
      monthlyPayment: typeof recordItem.monthlyPayment === 'number' ? String(recordItem.monthlyPayment) : '',
      assetValueOwed: typeof recordItem.assetValueOwed === 'number' ? String(recordItem.assetValueOwed) : '',
      assetMarketValue: typeof recordItem.assetMarketValue === 'number' ? String(recordItem.assetMarketValue) : '',
      date: typeof recordItem.date === 'string' ? recordItem.date : '',
      description: typeof recordItem.description === 'string' ? recordItem.description : ''
    })
    setIsEditRecordModalOpen(true)
  }
  async function deleteRecordFromCollectionByCollectionNameAndId(collectionName, recordId) {
    if (!collectionName || !recordId) return
    const collectionItems = collections[collectionName]
    if (!Array.isArray(collectionItems)) {
      console.warn('[records] Delete skipped: unsupported collection.', { collectionName })
      return
    }
    const shouldDelete = window.confirm(`Delete this ${collectionName} record?`)
    if (!shouldDelete) return
    const nextCollectionsState = {
      ...collections,
      [collectionName]: collectionItems.filter((rowItem) => String(rowItem.id) !== String(recordId))
    }
    const didApply = await applyNextCollectionsStateWithUndoForTransaction(nextCollectionsState, `delete-${collectionName}`)
    if (!didApply) {
      return
    }
    if (isEditRecordModalOpen && editRecordFormState.collectionName === collectionName && String(editRecordFormState.recordId) === String(recordId)) {
      setIsEditRecordModalOpen(false)
      setEditRecordFormState(buildInitialEditRecordFormState())
    }
    if (isRecordNotesModalOpen && recordNotesFormState.collectionName === collectionName && String(recordNotesFormState.recordId) === String(recordId)) {
      setIsRecordNotesModalOpen(false)
      setRecordNotesFormState(buildInitialRecordNotesFormState())
    }
  }
  function openRecordNotesModalForCollectionAndRow(collectionName, recordItem) {
    const recordLabel = typeof recordItem.category === 'string' && recordItem.category.trim().length > 0
      ? recordItem.category
      : (typeof recordItem.item === 'string' && recordItem.item.trim().length > 0 ? recordItem.item : 'Record')
    const currentNotesCollection = Array.isArray(collections.notes) ? collections.notes : []
    const noteRow = currentNotesCollection.find((rowItem) => (
      rowItem &&
      typeof rowItem === 'object' &&
      String(rowItem.collectionName ?? '') === String(collectionName) &&
      String(rowItem.recordId ?? '') === String(recordItem.id ?? '')
    ))
    const notesValue = noteRow && typeof noteRow.notes === 'string' ? noteRow.notes : ''
    setRecordNotesFormState({
      collectionName,
      recordId: typeof recordItem.id === 'string' ? recordItem.id : '',
      recordLabel,
      notes: notesValue
    })
    setIsRecordNotesModalOpen(true)
  }
  async function submitRecordNotesFormChanges(submitEvent) {
    submitEvent.preventDefault()
    if (!recordNotesFormState.collectionName || !recordNotesFormState.recordId) return
    const [isoTimestamp, timestampError] = readCurrentIsoTimestampForBudgetRecordUpdates()
    if (timestampError || !isoTimestamp) return
    const currentNotesCollection = Array.isArray(collections.notes) ? collections.notes : []
    const nextNotesCollectionWithoutCurrent = currentNotesCollection.filter((rowItem) => {
      if (!rowItem || typeof rowItem !== 'object') return false
      return !(String(rowItem.collectionName ?? '') === String(recordNotesFormState.collectionName) && String(rowItem.recordId ?? '') === String(recordNotesFormState.recordId))
    })
    const trimmedNotes = typeof recordNotesFormState.notes === 'string' ? recordNotesFormState.notes.trim() : ''
    const nextNotesCollection = trimmedNotes.length > 0
      ? [
          ...nextNotesCollectionWithoutCurrent,
          {
            id: `note-${recordNotesFormState.collectionName}-${recordNotesFormState.recordId}`,
            collectionName: recordNotesFormState.collectionName,
            recordId: recordNotesFormState.recordId,
            notes: trimmedNotes,
            updatedAt: isoTimestamp
          }
        ]
      : nextNotesCollectionWithoutCurrent
    const nextCollectionsState = {
      ...collections,
      notes: nextNotesCollection
    }
    const didApply = await applyNextCollectionsStateWithUndoForTransaction(nextCollectionsState, `note-${recordNotesFormState.collectionName}`)
    if (!didApply) return
    setIsRecordNotesModalOpen(false)
    setRecordNotesFormState(buildInitialRecordNotesFormState())
  }
  function doesRecordHaveDetailedNotes(collectionName, recordItem) {
    const currentNotesCollection = Array.isArray(collections.notes) ? collections.notes : []
    return currentNotesCollection.some((rowItem) => (
      rowItem &&
      typeof rowItem === 'object' &&
      String(rowItem.collectionName ?? '') === String(collectionName) &&
      String(rowItem.recordId ?? '') === String(recordItem.id ?? '') &&
      typeof rowItem.notes === 'string' &&
      rowItem.notes.trim().length > 0
    ))
  }
  function readDetailedNoteTextForRecord(collectionName, recordItem) {
    const currentNotesCollection = Array.isArray(collections.notes) ? collections.notes : []
    const matchedNoteRow = currentNotesCollection.find((rowItem) => (
      rowItem &&
      typeof rowItem === 'object' &&
      String(rowItem.collectionName ?? '') === String(collectionName) &&
      String(rowItem.recordId ?? '') === String(recordItem.id ?? '') &&
      typeof rowItem.notes === 'string' &&
      rowItem.notes.trim().length > 0
    ))
    return typeof matchedNoteRow?.notes === 'string' ? matchedNoteRow.notes.trim() : null
  }
  function renderRecordActionsWithIconButtons(collectionName, recordItem, options = {}) {
    const hasDetailedNotes = doesRecordHaveDetailedNotes(collectionName, recordItem)
    const noteText = hasDetailedNotes ? readDetailedNoteTextForRecord(collectionName, recordItem) : null
    const displayLabel = typeof recordItem.category === 'string' ? recordItem.category : (typeof recordItem.item === 'string' ? recordItem.item : 'this record')
    return (
      <div className="flex w-full items-center justify-end gap-1 opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
        <RecordNoteHoverTooltip
          hasNote={hasDetailedNotes}
          noteText={noteText}
          onEditNote={() => openRecordNotesModalForCollectionAndRow(collectionName, recordItem)}
        />
        <button
          aria-label="Edit record"
          onClick={() => openEditModalForRecord(collectionName, recordItem)}
          title="Edit record"
          type="button"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#52525b', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#52525b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button
          aria-label="Delete record"
          onClick={() => setPendingDeleteRecordTarget({ collectionName, recordItem, displayLabel })}
          title="Delete record"
          type="button"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#52525b', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fb7185'; e.currentTarget.style.borderColor = 'rgba(251,113,133,0.4)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#52525b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    )
  }
  async function submitEditedRecordChanges(submitEvent) {
    submitEvent.preventDefault()
    const normalizedPerson = normalizePersonaNameForDisplay(editRecordFormState.person === '__custom__'
      ? editRecordFormState.customPerson
      : editRecordFormState.person)
    const [isoTimestamp, timestampError] = readCurrentIsoTimestampForBudgetRecordUpdates()
    if (timestampError || !isoTimestamp) return

    let recordPatch = {}
    if (editRecordFormState.collectionName === 'income' || editRecordFormState.collectionName === 'expenses' || editRecordFormState.collectionName === 'assets') {
      const normalizedCategory = editRecordFormState.category === '__custom__'
        ? editRecordFormState.customCategory.trim()
        : editRecordFormState.category.trim()
      recordPatch = {
        person: normalizedPerson,
        item: editRecordFormState.item,
        amount: Number(editRecordFormState.amount),
        category: normalizedCategory,
        date: editRecordFormState.date,
        description: editRecordFormState.description
      }
    } else if (editRecordFormState.collectionName === 'debts' || editRecordFormState.collectionName === 'credit' || editRecordFormState.collectionName === 'loans') {
      const normalizedCategory = editRecordFormState.category === '__custom__'
        ? editRecordFormState.customCategory.trim()
        : editRecordFormState.category.trim()
      recordPatch = {
        person: normalizedPerson,
        item: normalizedCategory,
        category: normalizedCategory,
        amount: Number(editRecordFormState.amount),
        minimumPayment: Number(editRecordFormState.minimumPayment),
        interestRatePercent: Number(editRecordFormState.interestRatePercent || 0),
        remainingPayments: Number(editRecordFormState.remainingPayments || 0),
        loanStartDate: editRecordFormState.loanStartDate,
        collateralAssetName: editRecordFormState.collateralAssetName,
        collateralAssetMarketValue: Number(editRecordFormState.collateralAssetMarketValue || 0),
        creditLimit: Number(editRecordFormState.creditLimit || 0),
        description: editRecordFormState.description,
        date: editRecordFormState.date
      }
    } else if (editRecordFormState.collectionName === 'creditCards') {
      recordPatch = {
        person: normalizedPerson,
        item: editRecordFormState.item,
        maxCapacity: Number(editRecordFormState.maxCapacity),
        currentBalance: Number(editRecordFormState.currentBalance),
        minimumPayment: Number(editRecordFormState.minimumPayment),
        monthlyPayment: Number(editRecordFormState.monthlyPayment),
        interestRatePercent: Number(editRecordFormState.interestRatePercent || 0),
        date: editRecordFormState.date
      }
    } else if (editRecordFormState.collectionName === 'assetHoldings') {
      recordPatch = {
        person: normalizedPerson,
        item: editRecordFormState.item,
        assetValueOwed: Number(editRecordFormState.assetValueOwed || 0),
        assetMarketValue: Number(editRecordFormState.assetMarketValue || 0),
        description: editRecordFormState.description,
        date: editRecordFormState.date
      }
    }

    const [nextCollectionsState, updateError] = updateExistingRecordInCollectionsStateByCollectionNameAndId(
      collections,
      /** @type {'income'|'expenses'|'assets'|'assetHoldings'|'debts'|'credit'|'loans'|'creditCards'} */ (editRecordFormState.collectionName),
      editRecordFormState.recordId,
      recordPatch,
      isoTimestamp
    )
    if (updateError || !nextCollectionsState) {
      console.warn('[records] Failed to update record.', updateError)
      return
    }

    const didApply = await applyNextCollectionsStateWithUndoForTransaction(nextCollectionsState, `edit-${editRecordFormState.collectionName}`)
    if (!didApply) {
      return
    }
    setIsEditRecordModalOpen(false)
    setEditRecordFormState(buildInitialEditRecordFormState())
  }
  function updateTableSortingForTableName(tableName, keyName) {
    setTableSortState((previousState) => {
      const previous = previousState[tableName]
      const nextDirection = previous.key === keyName && previous.direction === 'asc' ? 'desc' : 'asc'
      const nextSortState = {
        ...previousState,
        [tableName]: { key: keyName, direction: nextDirection }
      }
      void persistUpdatedUiPreferencesAfterControlChanges(themeName, textScaleMultiplier, nextSortState)
      return nextSortState
    })
  }
  function renderSortableHeaderCell(tableName, keyName, label, isRightAligned = false) {
    const currentSort = tableSortState?.[tableName]
    const isActiveSortColumn = Boolean(currentSort && currentSort.key === keyName)
    const isAscendingSort = currentSort?.direction === 'asc'
    const indicator = isActiveSortColumn
      ? (isAscendingSort ? '\u2191' : '\u2193')
      : '\u2195'
    return (
      <th
        className={`px-4 py-3.5 text-[12px] font-semibold uppercase tracking-[0.06em] ${isRightAligned ? 'text-right' : 'text-left'} text-[#71717a]`}
        aria-sort={isActiveSortColumn ? (isAscendingSort ? 'ascending' : 'descending') : 'none'}
      >
        <button className={`inline-flex items-center gap-1 transition hover:text-[#a1a1aa] ${isRightAligned ? 'w-full justify-end' : ''}`} onClick={() => updateTableSortingForTableName(tableName, keyName)} type="button">
          {isRightAligned && (
            <span style={{ color: isActiveSortColumn ? '#fbbf24' : undefined, opacity: isActiveSortColumn ? 1 : 0.35 }}>{indicator}</span>
          )}
          {label}
          {!isRightAligned && (
            <span style={{ color: isActiveSortColumn ? '#fbbf24' : undefined, opacity: isActiveSortColumn ? 1 : 0.35 }}>{indicator}</span>
          )}
        </button>
      </th>
    )
  }
  const primaryJumpLinks = [
    { href: '#overview', label: 'Overview' },
    { href: '#assets', label: 'Assets' },
    { href: '#debts', label: 'Debts' },
    { href: '#credit', label: 'Credit' },
    { href: '#savings', label: 'Savings' },
    { href: '#records', label: 'Records' },
    { href: '#details', label: 'Details' }
  ]
  const secondaryJumpLinks = [
    { href: '#loan-calculator', label: 'Loan Calculator' },
    { href: '#risks', label: 'Risk Flags' },
    { href: '#goals', label: 'Goals' },
    { href: '#net-worth-trajectory', label: 'Trajectory' },
    { href: '#emergency-fund', label: 'Emergency' }
  ]

  return (
    <main className={`app-shell theme-${themeName} mx-auto min-h-screen w-full max-w-7xl p-4 pb-16 md:p-8`}>
      <section className="budget-sticky-toolbar sticky z-[110] mb-4 overflow-hidden rounded-2xl border border-white/[0.025] bg-[rgba(10,10,10,0.88)] shadow-none">
        {/* Row 1: title + utility controls + action buttons */}
        <div className="flex min-w-0 items-center gap-2 px-3 py-2">
          <h1 className="shrink-0 text-sm font-bold text-[#ededed] md:text-base">Financial Flight Deck</h1>
          <div className="ml-1 flex shrink-0 items-center rounded-lg border border-white/[0.025] bg-[rgba(15,15,15,0.5)] p-0.5">
            <button title={themeName === 'dark' ? 'Switch to light' : 'Switch to dark'} className="budget-nav-util-btn" onClick={toggleThemeNameBetweenLightAndDark} type="button">{themeName === 'dark' ? <IconMoon /> : <IconSun />}</button>
            <button title="Larger text" className="budget-nav-util-btn" onClick={() => void updateGlobalTextScaleByDelta(0.05)} type="button"><IconZoomIn /></button>
            <button title="Smaller text" className="budget-nav-util-btn" onClick={() => void updateGlobalTextScaleByDelta(-0.05)} type="button"><IconZoomOut /></button>
            <button title="Reset text size" className="budget-nav-util-btn" onClick={resetGlobalTextScaleToDefault} type="button"><IconRefresh /></button>
          </div>
          <div className="flex-1" />
          <div className="no-scrollbar flex flex-nowrap items-center gap-1 overflow-x-auto">
            <button className="budget-nav-action-btn bg-amber-500 text-black hover:bg-amber-400" onClick={() => setIsAddRecordModalOpen(true)} type="button"><IconPlus /> Record</button>
            <button className="budget-nav-action-btn bg-[#1a1a1a] border border-white/[0.06] text-[#ededed] hover:bg-[#252525]" onClick={() => setIsAddGoalModalOpen(true)} type="button"><IconPlus /> Goal</button>
            <span className="mx-0.5 h-4 w-px shrink-0 bg-[#141414]/[0.08]" aria-hidden="true" />
            <button className="budget-nav-action-btn border border-white/[0.06] text-[#a1a1aa] hover:bg-[#1a1a1a]/[0.08]" onClick={openManagePersonasModal} type="button"><IconUsers /> Personas</button>
            <button className="budget-nav-action-btn border border-white/[0.06] text-[#a1a1aa] hover:bg-[#1a1a1a]/[0.08]" onClick={() => void openProfileTransferModalForMode('import')} type="button"><IconDownload /> Import</button>
            <button className="budget-nav-action-btn border border-white/[0.06] text-[#a1a1aa] hover:bg-[#1a1a1a]/[0.08]" onClick={() => void openProfileTransferModalForMode('export')} type="button"><IconUpload /> Export</button>
            <span className="mx-0.5 h-4 w-px shrink-0 bg-[#141414]/[0.08]" aria-hidden="true" />
            {supabaseAuthUserSummary ? (
              <button className="budget-nav-action-btn bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" onClick={openLoginModal} type="button"><IconLogOut /> Admin</button>
            ) : (
              <button className="budget-nav-action-btn bg-[#1a1a1a] border border-white/[0.06] text-[#ededed] hover:bg-[#252525]" onClick={openLoginModal} type="button"><IconLogIn /> Login</button>
            )}
          </div>
        </div>
        {/* Row 2: section jump links with active scrollspy */}
        <div className="no-scrollbar flex flex-nowrap items-center gap-0.5 overflow-x-auto border-t border-white/[0.025] px-2 py-1.5">
          {primaryJumpLinks.map((linkItem) => (
            <a
              key={linkItem.href}
              className={`budget-nav-jump-link shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${activeSectionId === linkItem.href.slice(1) ? 'bg-amber-500 text-black' : 'text-[#a1a1aa] hover:bg-[#1a1a1a]/[0.08] hover:text-[#ededed]'}`}
              href={linkItem.href}
              onClick={scrollToSectionAnchorWithFastEasing}
            >
              {linkItem.label}
            </a>
          ))}
          <span className="mx-1.5 h-3 w-px shrink-0 bg-[#141414]/[0.1]" aria-hidden="true" />
          {secondaryJumpLinks.map((linkItem) => (
            <a
              key={linkItem.href}
              className={`budget-nav-jump-link shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${activeSectionId === linkItem.href.slice(1) ? 'bg-amber-500 text-black' : 'text-[#71717a] hover:bg-[#1a1a1a]/[0.08] hover:text-[#d4d4d4]'}`}
              href={linkItem.href}
              onClick={scrollToSectionAnchorWithFastEasing}
            >
              {linkItem.label}
            </a>
          ))}
        </div>
      </section>

      <section id="overview" className="z-layer-section mb-4 scroll-mt-40 grid grid-cols-1 gap-3 md:mb-6 md:gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topMetrics.map((metricRow, metricIndex) => {
          const label = metricRow.metric
          const isNetWorth = label === 'Net Worth'
          const formattedValue = formatDashboardDatapointValueByFormat(metricRow.value, metricRow.valueFormat)
          const metadataLines = buildOverviewHoverContextLinesForMetric(metricRow, sourceBreakdown, emergencyFundSummary)
          const statusBlurb = Array.isArray(metadataLines) && metadataLines.length > 0 ? String(metadataLines[0]) : ''
          const trendSignalValue = isNetWorth
            ? sourceBreakdown.netWorth.delta
            : metricRow.value
          const trendDir = trendSignalValue > 0 ? 'up' : (trendSignalValue < 0 ? 'down' : 'flat')
          const savingsRateToneClasses = label === 'Savings Rate'
            ? resolveSavingsRateToneClasses(metricRow.value)
            : null
          const emergencyFundGapToneClasses = label === 'Emergency Fund Gap'
            ? (
                metricRow.value > 0
                  ? { valueClassName: 'text-rose-400', badgeClassName: 'bg-rose-500/15 text-rose-400' }
                  : { valueClassName: 'text-emerald-400', badgeClassName: 'bg-emerald-500/15 text-emerald-400' }
              )
            : null
          const toneClasses = savingsRateToneClasses ?? emergencyFundGapToneClasses
          const trendBadgeClassName = toneClasses
            ? toneClasses.badgeClassName
            : (trendDir === 'up' ? 'bg-emerald-500/15 text-emerald-400' : (trendDir === 'down' ? 'bg-rose-500/15 text-rose-400' : 'bg-[#1a1a1a] text-[#71717a]'))
          const valueClassName = toneClasses
            ? toneClasses.valueClassName
            : 'text-[#ededed]'
          const accentBorderColor = toneClasses
            ? (toneClasses.valueClassName.includes('emerald') ? '#10b981' : (toneClasses.valueClassName.includes('amber') ? '#f59e0b' : '#f43f5e'))
            : (trendDir === 'up' ? '#10b981' : (trendDir === 'down' ? '#f43f5e' : '#94a3b8'))
          const trendIcon = trendDir === 'up' ? 'G��' : (trendDir === 'down' ? 'G��' : 'G��')
          const trendLabel = trendDir === 'up' ? 'Up' : (trendDir === 'down' ? 'Down' : 'Flat')
          return (
            <React.Fragment key={label}>
              {renderHoverMetadataBoxForElement({
                label: `${label} Metadata`,
                lines: metadataLines,
                className: isNetWorth ? 'md:col-span-2 xl:col-span-2 h-full' : 'h-full',
                children: (
                  <article
                    className={`glass-panel-soft squircle-md metric-card-enter flex h-full flex-col justify-between ${isNetWorth ? 'p-5' : 'p-4'}`}
                    style={{ animationDelay: `${metricIndex * 70}ms`, borderTopWidth: '3px', borderTopColor: accentBorderColor, borderTopStyle: 'solid' }}
                  >
                    <div>
                      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#52525b]">{label}</h2>
                      <p className={`mt-2 ${isNetWorth ? 'text-3xl' : 'text-2xl'} font-bold leading-none ${valueClassName}`}>{formattedValue}</p>
                      {isNetWorth && sourceBreakdown.netWorth.delta !== 0 && (
                        <p className="mt-1.5 text-xs font-medium text-[#52525b]">
                          {sourceBreakdown.netWorth.delta > 0 ? '+' : ''}{formatCurrencyValueForDashboard(sourceBreakdown.netWorth.delta)} vs last month
                        </p>
                      )}
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${trendBadgeClassName}`}>
                        {trendIcon} {trendLabel}
                      </span>
                      {statusBlurb ? (
                        <p className="text-[11px] leading-snug text-[#52525b]">{statusBlurb}</p>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </React.Fragment>
          )
        })}
      </section>

      <div className="flex flex-col">
      <section id="net-worth-trajectory" className="section-tight section-allows-popovers glass-panel-soft squircle-md z-layer-section mb-4 scroll-mt-40 p-4 md:mb-6 md:p-6" style={{ order: 13 }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#ededed]">Net Worth Trajectory</h2>
          </div>
          <div className="flex items-center gap-2">
            {['conservative', 'base', 'accelerated'].map((profileId) => (
              <button
                key={profileId}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${netWorthProjectionProfileId === profileId ? 'border-amber-500 bg-amber-500 text-black' : 'border-white/[0.025] bg-[rgba(20,20,20,0.5)] text-[#a1a1aa]'}`}
                onClick={() => setNetWorthProjectionProfileId(profileId)}
                type="button"
              >
                {profileId.charAt(0).toUpperCase() + profileId.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {selectedNetWorthProjectionProfile ? (
          <React.Fragment>
            <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <article className="networth-clarity-card squircle-sm p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#71717a]">Baseline Inputs From Dataset</p>
                <dl className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[#71717a]">Savings / Month</dt>
                    <dd className="font-semibold text-[#e0e0e0]">{formatCurrencyValueForDashboard(netWorthProjectionBaselineVariables.monthlySavingsPaceBaselineFromDataset)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[#71717a]">Income / Month</dt>
                    <dd className="font-semibold text-[#e0e0e0]">{formatCurrencyValueForDashboard(netWorthProjectionBaselineVariables.totalMonthlyIncomeFromDataset)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[#71717a]">Expenses / Month</dt>
                    <dd className="font-semibold text-[#e0e0e0]">{formatCurrencyValueForDashboard(netWorthProjectionBaselineVariables.totalMonthlyExpensesFromDataset)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[#71717a]">Debt Pmts / Month</dt>
                    <dd className="font-semibold text-[#e0e0e0]">{formatCurrencyValueForDashboard(netWorthProjectionBaselineVariables.totalMonthlyDebtPaymentsFromDataset)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[#71717a]">Weighted APR</dt>
                    <dd className="font-semibold text-[#e0e0e0]">{netWorthProjectionBaselineVariables.weightedAprPercentFromDataset.toFixed(2)}%</dd>
                  </div>
                </dl>
              </article>
              {renderHoverMetadataBoxForElement({
                label: 'Selected Pace Modifiers Meaning',
                boxClassName: 'meta-hover-box-wide',
                lines: [
                  'Scenario modifiers applied on top of dataset baseline values.',
                  `Savings Multiplier (x${selectedNetWorthProjectionProfile.assumptions.savingsPaceMultiplier.toFixed(2)}): scales monthly savings contribution.`,
                  `Asset Growth (${selectedNetWorthProjectionProfile.assumptions.annualAssetGrowthPercent.toFixed(1)}%/yr): expected annual growth on assets.`,
                  `Debt Payment Lift (${(selectedNetWorthProjectionProfile.assumptions.debtPaymentExtraPercent * 100).toFixed(1)}%): extra debt paydown above base monthly payment.`,
                  `APR Shift (${selectedNetWorthProjectionProfile.assumptions.aprStressAdjustmentPercent.toFixed(1)} pts): interest-rate stress adjustment for liabilities.`,
                  'Rule of thumb: higher savings/growth/lift helps net worth; higher APR hurts net worth.'
                ],
                children: (
                  <article className="networth-clarity-card squircle-sm p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#71717a]">Selected Pace Modifiers</p>
                    <dl className="mt-2 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[#71717a]">Savings Multiplier</dt>
                        <dd className="rounded-md bg-[#1a1a1a] px-2 py-1 font-semibold text-[#e0e0e0]">x{selectedNetWorthProjectionProfile.assumptions.savingsPaceMultiplier.toFixed(2)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[#71717a]">Asset Growth (Annual)</dt>
                        <dd className="rounded-md bg-[#1a1a1a] px-2 py-1 font-semibold text-[#e0e0e0]">{selectedNetWorthProjectionProfile.assumptions.annualAssetGrowthPercent.toFixed(1)}%</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[#71717a]">Debt Payment Lift</dt>
                        <dd className="rounded-md bg-[#1a1a1a] px-2 py-1 font-semibold text-[#e0e0e0]">{(selectedNetWorthProjectionProfile.assumptions.debtPaymentExtraPercent * 100).toFixed(1)}%</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-[#71717a]">APR Shift</dt>
                        <dd className="rounded-md bg-[#1a1a1a] px-2 py-1 font-semibold text-[#e0e0e0]">{selectedNetWorthProjectionProfile.assumptions.aprStressAdjustmentPercent.toFixed(1)} pts</dd>
                      </div>
                    </dl>
                  </article>
                )
              })}
              <article className="networth-clarity-card squircle-sm p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#71717a]">How To Tune</p>
                <ul className="mt-2 space-y-1 text-xs text-[#a1a1aa]">
                  <li>Higher savings multiplier increases monthly contribution.</li>
                  <li>Higher growth percent compounds asset side faster.</li>
                  <li>Higher debt payment lift lowers liability principal sooner.</li>
                  <li>APR shift stress-tests borrowing conditions up/down.</li>
                </ul>
              </article>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedNetWorthProjectionProfile.points.map((pointItem) => {
                const currentPoint = selectedNetWorthProjectionProfile.points.find((rowItem) => rowItem.horizonId === 'current')
                const currentNetWorth = typeof currentPoint?.projectedNetWorth === 'number' ? currentPoint.projectedNetWorth : 0
                const currentDebt = typeof currentPoint?.projectedDebt === 'number' ? currentPoint.projectedDebt : 0
                const deltaValue = pointItem.projectedNetWorth - currentNetWorth
                const debtDeltaValue = pointItem.projectedDebt - currentDebt
                const deltaClassName = deltaValue > 0 ? 'text-emerald-400' : (deltaValue < 0 ? 'text-rose-400' : 'text-[#a1a1aa]')
                const debtDeltaClassName = debtDeltaValue < 0 ? 'text-emerald-400' : (debtDeltaValue > 0 ? 'text-rose-400' : 'text-[#a1a1aa]')
                const horizonLabel = netWorthProjectionProfiles?.horizons.find((rowItem) => rowItem.id === pointItem.horizonId)?.label ?? pointItem.horizonId
                const horizonMonths = typeof pointItem.months === 'number' ? pointItem.months : 0
                const debtPaymentMultiplier = 1 + (selectedNetWorthProjectionProfile.assumptions.debtPaymentExtraPercent || 0)
                const incomePredictionLines = safeCollections.income.map((incomeRow, incomeIndex) => {
                  const itemName = typeof incomeRow.item === 'string' ? incomeRow.item : `Income ${incomeIndex + 1}`
                  const monthlyAmount = typeof incomeRow.amount === 'number' ? incomeRow.amount : 0
                  const horizonTotal = monthlyAmount * horizonMonths
                  if (monthlyAmount <= 0) return ''
                  if (horizonMonths <= 0) return `Income ${itemName}: ${formatCurrencyValueForDashboard(monthlyAmount)}/mo`
                  return `- ${itemName}: ${formatCurrencyValueForDashboard(monthlyAmount)}/mo | ${formatCurrencyValueForDashboard(horizonTotal)}`
                }).filter((lineItem) => lineItem.length > 0)
                const debtPaymentRows = [...safeCollections.debts, ...safeCollections.loans, ...safeCollections.credit]
                const debtPredictionLines = debtPaymentRows.map((debtRow, debtIndex) => {
                  const itemName = typeof debtRow.item === 'string' ? debtRow.item : `Debt ${debtIndex + 1}`
                  const baseMonthlyPayment = typeof debtRow.monthlyPayment === 'number'
                    ? debtRow.monthlyPayment
                    : (typeof debtRow.minimumPayment === 'number' ? debtRow.minimumPayment : 0)
                  const adjustedMonthlyPayment = baseMonthlyPayment * debtPaymentMultiplier
                  const horizonTotal = adjustedMonthlyPayment * horizonMonths
                  if (adjustedMonthlyPayment <= 0) return ''
                  if (horizonMonths <= 0) return `Debt ${itemName}: ${formatCurrencyValueForDashboard(adjustedMonthlyPayment)}/mo`
                  return `- ${itemName}: ${formatCurrencyValueForDashboard(adjustedMonthlyPayment)}/mo | ${formatCurrencyValueForDashboard(horizonTotal)}`
                }).filter((lineItem) => lineItem.length > 0)
                const incomeTotalMonthly = safeCollections.income.reduce((runningTotal, incomeRow) => {
                  const amount = typeof incomeRow.amount === 'number' ? incomeRow.amount : 0
                  return runningTotal + Math.max(0, amount)
                }, 0)
                const debtTotalMonthly = debtPaymentRows.reduce((runningTotal, debtRow) => {
                  const baseMonthlyPayment = typeof debtRow.monthlyPayment === 'number'
                    ? debtRow.monthlyPayment
                    : (typeof debtRow.minimumPayment === 'number' ? debtRow.minimumPayment : 0)
                  return runningTotal + Math.max(0, baseMonthlyPayment * debtPaymentMultiplier)
                }, 0)
                const incomeHorizonTotal = incomeTotalMonthly * horizonMonths
                const debtHorizonTotal = debtTotalMonthly * horizonMonths
                const hoverLines = [
                  `Profile: ${selectedNetWorthProjectionProfile.label}`,
                  `Horizon: ${horizonLabel} (${horizonMonths} months)`,
                  `Projected Net Worth: ${formatCurrencyValueForDashboard(pointItem.projectedNetWorth)}`,
                  `Projected Debt Balance: ${formatCurrencyValueForDashboard(pointItem.projectedDebt)}`,
                  'Income Summary',
                  horizonMonths <= 0
                    ? `Total Income: ${formatCurrencyValueForDashboard(incomeTotalMonthly)}/mo`
                    : `Total Income: ${formatCurrencyValueForDashboard(incomeTotalMonthly)}/mo | ${formatCurrencyValueForDashboard(incomeHorizonTotal)}`,
                  ...incomePredictionLines,
                  'Debt Summary',
                  horizonMonths <= 0
                    ? `Total Debt Payments: ${formatCurrencyValueForDashboard(debtTotalMonthly)}/mo`
                    : `Total Debt Payments: ${formatCurrencyValueForDashboard(debtTotalMonthly)}/mo | ${formatCurrencyValueForDashboard(debtHorizonTotal)}`,
                  ...debtPredictionLines
                ]
                return (
                  <React.Fragment key={pointItem.horizonId}>
                    {renderHoverMetadataBoxForElement({
                      label: `${horizonLabel} Projection Inputs`,
                      lines: hoverLines,
                      boxClassName: 'meta-hover-box-wide',
                      children: (
                        <article className="networth-outcome-card squircle-sm p-3">
                          <p className="text-xs uppercase tracking-[0.12em] text-[#71717a]">{horizonLabel}</p>
                          <div className="mt-2 grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[11px] text-[#71717a]">Projected Net Worth</p>
                              <p className="text-lg font-bold text-[#e0e0e0]">{formatCurrencyValueForDashboard(pointItem.projectedNetWorth)}</p>
                              <p className={`text-xs font-semibold ${deltaClassName}`}>{deltaValue >= 0 ? '+' : ''}{formatCurrencyValueForDashboard(deltaValue)} vs current</p>
                            </div>
                            <div>
                              <p className="text-[11px] text-[#71717a]">Projected Debt Balance</p>
                              <p className="text-lg font-bold text-[#e0e0e0]">{formatCurrencyValueForDashboard(pointItem.projectedDebt)}</p>
                              <p className={`text-xs font-semibold ${debtDeltaClassName}`}>{debtDeltaValue <= 0 ? '' : '+'}{formatCurrencyValueForDashboard(debtDeltaValue)} vs current</p>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </div>
          </React.Fragment>
        ) : (
          <p className="text-sm text-[#71717a]">Unable to build trajectory from current data.</p>
        )}
      </section>

      <section id="emergency-fund" className="section-tight section-allows-popovers glass-panel-soft squircle-md z-layer-section mb-4 scroll-mt-40 p-4 md:mb-6 md:p-6" style={{ order: 14 }}>
        {(() => {
          const coverageMonths = typeof emergencyFundSummary.totalCoverageMonths === 'number' ? emergencyFundSummary.totalCoverageMonths : 0
          const goal = typeof emergencyFundSummary.emergencyFundGoal === 'number' ? emergencyFundSummary.emergencyFundGoal : 0
          const liquidAmount = typeof emergencyFundSummary.liquidAmount === 'number' ? emergencyFundSummary.liquidAmount : 0
          const investedAmount = typeof emergencyFundSummary.investedAmount === 'number' ? emergencyFundSummary.investedAmount : 0
          const liquidTarget = typeof emergencyFundSummary.liquidTarget === 'number' ? emergencyFundSummary.liquidTarget : 0
          const investedTarget = typeof emergencyFundSummary.investedTarget === 'number' ? emergencyFundSummary.investedTarget : 0
          const monthlyObligation = typeof emergencyFundSummary.monthlyObligations === 'number' ? emergencyFundSummary.monthlyObligations : 0
          const monthlyExpenses = typeof emergencyFundSummary.monthlyExpenses === 'number' ? emergencyFundSummary.monthlyExpenses : 0
          const monthlyDebtMins = typeof emergencyFundSummary.monthlyDebtMinimums === 'number' ? emergencyFundSummary.monthlyDebtMinimums : 0
          const totalFunds = liquidAmount + investedAmount
          const overallFillPct = goal > 0 ? Math.min(100, (totalFunds / goal) * 100) : 0
          const liquidFillPct = liquidTarget > 0 ? Math.min(100, (liquidAmount / liquidTarget) * 100) : 0
          const investedFillPct = investedTarget > 0 ? Math.min(100, (investedAmount / investedTarget) * 100) : 0
          const liquidGap = Math.max(0, liquidTarget - liquidAmount)
          const investedGap = Math.max(0, investedTarget - investedAmount)
          const coverageStatus = coverageMonths >= 6 ? 'good' : coverageMonths >= 3 ? 'watch' : 'risk'
          const coverageBadgeClass = coverageStatus === 'good' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : coverageStatus === 'watch' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
          const barFillColor = coverageStatus === 'good' ? '#10b981' : coverageStatus === 'watch' ? '#f59e0b' : '#f43f5e'
          const liquidFillColor = liquidGap > 0 ? '#0ea5e9' : '#10b981'
          const investedFillColor = investedGap > 0 ? '#8b5cf6' : '#10b981'
          const milestone1Pct = goal > 0 ? Math.min(100, (monthlyObligation / goal) * 100) : 16.67
          const milestone3Pct = 50
          return (
            <React.Fragment>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-[#ededed]">Emergency Fund</h2>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${coverageBadgeClass}`}>{coverageMonths.toFixed(1)} mo. covered</span>
                  <span className="rounded-full border border-white/[0.025] bg-[rgba(20,20,20,0.8)] px-2.5 py-0.5 text-xs font-semibold text-[#71717a]">Goal: 6 months</span>
                </div>
                <span className="text-sm font-bold text-[#d4d4d4]">{formatCurrencyValueForDashboard(totalFunds)} <span className="font-normal text-[#52525b]">of</span> {formatCurrencyValueForDashboard(goal)}</span>
              </div>

              <div className="mb-5">
                <div className="relative h-3 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${overallFillPct}%`, backgroundColor: barFillColor }} />
                  <div className="absolute inset-y-0 border-l border-white/[0.15]/60" style={{ left: `${milestone1Pct}%` }} />
                  <div className="absolute inset-y-0 border-l border-white/[0.15]/60" style={{ left: `${milestone3Pct}%` }} />
                </div>
                <div className="relative mt-1 h-4">
                  <span className="absolute -translate-x-1/2 text-[10px] text-[#52525b]" style={{ left: `${milestone1Pct}%` }}>1 mo</span>
                  <span className="absolute -translate-x-1/2 text-[10px] text-[#52525b]" style={{ left: `${milestone3Pct}%` }}>3 mo</span>
                  <span className="absolute right-0 text-[10px] text-[#52525b]">6 mo</span>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <article className={`rounded-2xl border p-3 ${liquidGap > 0 ? 'border-white/[0.025] bg-[rgba(15,15,15,0.8)]' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#71717a]">Liquid Cash</p>
                    {liquidGap > 0 ? <span className="text-xs font-semibold text-rose-600">G��{formatCurrencyValueForDashboard(liquidGap)} gap</span> : <span className="text-xs font-semibold text-emerald-600">G�� Funded</span>}
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-xl font-bold text-[#e0e0e0]">{formatCurrencyValueForDashboard(liquidAmount)}</p>
                    <p className="text-xs text-[#71717a]">target {formatCurrencyValueForDashboard(liquidTarget)}</p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                    <div className="h-full rounded-full" style={{ width: `${liquidFillPct}%`, backgroundColor: liquidFillColor }} />
                  </div>
                  {emergencyFundSourceLabels.liquidText !== 'None classified' && <p className="mt-2 text-[10px] text-[#52525b] truncate">Sources: {emergencyFundSourceLabels.liquidText}</p>}
                </article>
                <article className={`rounded-2xl border p-3 ${investedGap > 0 ? 'border-violet-500/30 bg-violet-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#71717a]">Invested Assets</p>
                    {investedGap > 0 ? <span className="text-xs font-semibold text-rose-600">G��{formatCurrencyValueForDashboard(investedGap)} gap</span> : <span className="text-xs font-semibold text-emerald-600">G�� Funded</span>}
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-xl font-bold text-[#e0e0e0]">{formatCurrencyValueForDashboard(investedAmount)}</p>
                    <p className="text-xs text-[#71717a]">target {formatCurrencyValueForDashboard(investedTarget)}</p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                    <div className="h-full rounded-full" style={{ width: `${investedFillPct}%`, backgroundColor: investedFillColor }} />
                  </div>
                  {emergencyFundSourceLabels.investedText !== 'None classified' && <p className="mt-2 text-[10px] text-[#52525b] truncate">Sources: {emergencyFundSourceLabels.investedText}</p>}
                </article>
              </div>

              {renderHoverMetadataBoxForElement({
                label: 'Emergency Goal Expense Breakdown',
                lines: emergencyGoalExpenseLines,
                boxClassName: 'meta-hover-box-wide',
                children: (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-white/[0.06] bg-[rgba(20,20,20,0.6)] px-3 py-2">
                    <p className="text-xs text-[#71717a]">Monthly obligation: <span className="font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(monthlyObligation)}</span></p>
                    <span className="hidden text-white/[0.2] sm:inline">|</span>
                    <p className="text-xs text-[#71717a]">Expenses: <span className="font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(monthlyExpenses)}</span></p>
                    <span className="hidden text-white/[0.2] sm:inline">+</span>
                    <p className="text-xs text-[#71717a]">Debt minimums: <span className="font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(monthlyDebtMins)}</span></p>
                    <span className="hidden text-white/[0.2] sm:inline">G��</span>
                    <p className="text-xs text-[#71717a]">6+� goal: <span className="font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(goal)}</span></p>
                    <span className="ml-auto text-[10px] text-[#52525b]">hover for breakdown</span>
                  </div>
                )
              })}
            </React.Fragment>
          )
        })()}
      </section>

      <section id="risks" className="section-tight glass-panel-soft squircle-md z-layer-section mb-4 scroll-mt-40 p-4 md:mb-6 md:p-6" style={{ order: 11 }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-[#ededed]">Financial Risk Flags</h2>
            {!isRiskLoading && riskFindings.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                {riskFindings.filter((f) => f.severity === 'high').length > 0 && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-400">{riskFindings.filter((f) => f.severity === 'high').length} high</span>}
                {riskFindings.filter((f) => f.severity === 'medium').length > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-400">{riskFindings.filter((f) => f.severity === 'medium').length} medium</span>}
                {riskFindings.filter((f) => f.severity === 'low').length > 0 && <span className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[#a1a1aa]">{riskFindings.filter((f) => f.severity === 'low').length} low</span>}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl border border-white/[0.06] bg-[rgba(20,20,20,0.85)] p-2 text-[#d4d4d4] transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              onClick={() => { void recomputeRiskFindingsFromCollectionsState(safeCollections) }}
              disabled={isRiskLoading}
              aria-label="Reload risk checks"
              title="Reload risk checks"
            >
              <IconRefresh className={isRiskLoading ? 'animate-spin' : ''} />
            </button>
            <span className="text-xs text-[#71717a]">{isRiskLoading ? 'running checks...' : `${riskFindings.length} active`}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {riskFindings.map((findingItem, findingIndex) => {
            const severityName = typeof findingItem.severity === 'string' ? findingItem.severity : 'medium'
            const severityClassName = severityName === 'high'
              ? 'risk-flag-card-high'
              : (severityName === 'low' ? 'risk-flag-card-low' : 'risk-flag-card-medium')
            const severityBadgeClassName = severityName === 'high'
              ? 'risk-flag-severity-high'
              : (severityName === 'low' ? 'risk-flag-severity-low' : 'risk-flag-severity-medium')
            return (
            <button
              key={findingItem.id}
              className={`risk-flag-card risk-card-enter-smooth rounded-2xl border p-3 text-left transition duration-500 ${isRiskCardsFadingOut ? 'opacity-0' : 'opacity-100'} hover:-translate-y-[1px] hover:shadow-md ${severityClassName}`}
              style={{ animationDelay: `${Math.min(findingIndex * 60, 420)}ms` }}
              onClick={() => setSelectedRiskFinding(findingItem)}
              type="button"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold leading-snug text-[#ededed]">{findingItem.title}</p>
                <p className={`risk-flag-severity shrink-0 text-xs font-semibold uppercase tracking-[0.14em] ${severityBadgeClassName}`}>{findingItem.severity}</p>
              </div>
              <p className="mt-1 text-sm text-[#a1a1aa]">{findingItem.detail}</p>
            </button>
            )
          })}
        </div>
      </section>

      <section id="goals" className="section-tight glass-panel-soft squircle-md z-layer-section mb-4 scroll-mt-40 p-4 md:mb-6 md:p-6" style={{ order: 12 }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-[#ededed]">Goals</h2>
            {powerGoalsFormulaSummary.completionRatePercent > 0 && (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">{powerGoalsFormulaSummary.completionRatePercent.toFixed(0)}% complete</span>
            )}
          </div>
          <button className="inline-flex items-center gap-2 rounded-2xl bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a1a1a]" onClick={() => { setGoalEntryFormState(buildInitialGoalEntryFormState()); setEditingGoalId(''); setIsAddGoalModalOpen(true) }} type="button"><IconPlus /> Add Goal</button>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">G�� {powerGoalsFormulaSummary.completedCount} Completed</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40/80 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">G�� {powerGoalsFormulaSummary.inProgressCount} In Progress</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-[#1a1a1a] px-2.5 py-0.5 text-xs font-semibold text-[#a1a1aa]">G�� {powerGoalsFormulaSummary.notStartedCount} Not Started</span>
          {powerGoalsFormulaSummary.averageTimeframeMonths > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.025]/70 bg-[#0f0f0f] px-2.5 py-0.5 text-xs font-semibold text-[#a1a1aa]">GŦ {powerGoalsFormulaSummary.averageTimeframeMonths.toFixed(0)} mo. avg</span>
          )}
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#52525b]">Sort</span>
          {[{ key: 'timeframeMonths', label: 'Timeframe' }, { key: 'status', label: 'Status' }, { key: 'title', label: 'Title' }].map(({ key, label }) => {
            const isActive = tableSortState.goals.key === key
            return (
              <button key={key} type="button" onClick={() => updateTableSortingForTableName('goals', key)} className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold transition ${isActive ? 'border-amber-500 bg-amber-500 text-black' : 'border-white/[0.025] bg-[rgba(20,20,20,0.8)] text-[#a1a1aa] hover:border-white/[0.06]'}`}>
                {label}{isActive ? (tableSortState.goals.direction === 'asc' ? ' G��' : ' G��') : ''}
              </button>
            )
          })}
        </div>
        {goalRowsSortedByTimeframeAndStatus.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-[rgba(20,20,20,0.6)] py-10 text-center">
            <p className="text-[#52525b]">No goals recorded yet</p>
            <button className="mt-3 inline-flex items-center gap-1.5 rounded-2xl bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a1a1a]" onClick={() => { setGoalEntryFormState(buildInitialGoalEntryFormState()); setEditingGoalId(''); setIsAddGoalModalOpen(true) }} type="button"><IconPlus /> Add your first goal</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {goalRowsSortedByTimeframeAndStatus.map((goalItem, goalIndex) => {
              const title = typeof goalItem.title === 'string' ? goalItem.title : `Goal ${goalIndex + 1}`
              const stableKey = typeof goalItem.id === 'string' ? goalItem.id : `${title}-${goalIndex}`
              const status = typeof goalItem.status === 'string' ? goalItem.status.trim().toLowerCase() : 'not started'
              const timeframeMonths = typeof goalItem.timeframeMonths === 'number' ? goalItem.timeframeMonths : Number(goalItem.timeframeMonths ?? 0)
              const description = typeof goalItem.description === 'string' ? goalItem.description : ''
              const isCompleted = status === 'completed'
              const isInProgress = status === 'in progress'
              const isUrgent = isInProgress && Number.isFinite(timeframeMonths) && timeframeMonths > 0 && timeframeMonths <= 3
              const cardBg = isCompleted
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : isInProgress
                  ? 'border-amber-500/30 bg-amber-500/10'
                  : 'border-white/[0.06] bg-[rgba(15,15,15,0.7)]'
              const statusBadgeClass = isCompleted
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                : isInProgress
                  ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                  : 'border-white/[0.06] bg-[#1a1a1a] text-[#a1a1aa]'
              const statusLabel = isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'
              return (
                <article key={stableKey} className={`group relative rounded-2xl border p-3 transition duration-150 ${cardBg}`}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${statusBadgeClass}`}>{statusLabel}</span>
                    {isUrgent && <span className="inline-flex items-center rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-rose-400">Urgent</span>}
                  </div>
                  <p className="text-sm font-bold text-[#e0e0e0]">{title}</p>
                  {description ? <p className="mt-1 text-xs text-[#71717a]">{description}</p> : null}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${Number.isFinite(timeframeMonths) && timeframeMonths > 0 ? 'border-white/[0.025]/70 bg-[#0f0f0f] text-[#a1a1aa]' : 'border-white/[0.025] bg-[rgba(20,20,20,0.4)] text-[#52525b]'}`}>{Number.isFinite(timeframeMonths) && timeframeMonths > 0 ? `${timeframeMonths} mo.` : 'No timeframe'}</span>
                    <div className="flex items-center gap-1 pointer-events-none opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                      <button aria-label="Edit goal" className="rounded-lg border border-white/[0.06] bg-[rgba(20,20,20,0.8)] px-2 py-1 text-xs font-semibold text-[#d4d4d4]" onClick={() => openEditGoalModal(goalItem)} title="Edit" type="button"><IconEdit /></button>
                      <button aria-label="Delete goal" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-400" onClick={() => { void deleteGoalRecordById(String(goalItem.id ?? '')) }} title="Delete" type="button"><IconTrash /></button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section id="debts" className="section-tight glass-panel-soft squircle-md z-layer-section mb-4 scroll-mt-40 p-4 md:mb-6 md:p-6" style={{ order: 2 }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#ededed]">Debts / Loans</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-rose-400">{formatCurrencyValueForDashboard(debtRows.reduce((t, d) => t + (typeof d.amount === 'number' ? d.amount : 0), 0))}</span>
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-amber-500 px-3 py-2 text-xs font-semibold text-white" onClick={() => openAddRecordModalWithPresetTypeAndCategory('debt', 'Debt Payment')} type="button"><IconPlus /> Add Debt</button>
          </div>
        </div>
        <div className="table-scroll-region rounded-lg border border-white/[0.03] backdrop-blur">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-[#1a1a1a] text-[#a1a1aa]">
              <tr>
                {renderSortableHeaderCell('debts', 'person', 'Person')}
                {renderSortableHeaderCell('debts', 'item', 'Item')}
                {renderSortableHeaderCell('debts', 'amount', 'Balance', true)}
                {renderSortableHeaderCell('debts', 'minimumPayment', 'Min. Payment', true)}
                {renderSortableHeaderCell('debts', 'interestRatePercent', 'Rate', true)}
                <th className="px-3 py-2 text-right font-semibold">Payoff Date</th>
                <th className="px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {debtRows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[#52525b]">No debts recorded yet</td></tr>
              ) : debtRowsSorted.map((debtItem, debtIndex) => {
                const stableKey = typeof debtItem.id === 'string' ? debtItem.id : `debt-row-${debtIndex}`
                const person = typeof debtItem.person === 'string' ? debtItem.person : DEFAULT_PERSONA_NAME
                const item = typeof debtItem.item === 'string' ? debtItem.item : (typeof debtItem.category === 'string' ? debtItem.category : '')
                const value = typeof debtItem.amount === 'number' ? debtItem.amount : 0
                const perMonth = typeof debtItem.minimumPayment === 'number' ? debtItem.minimumPayment : 0
                const interestRatePercent = typeof debtItem.interestRatePercent === 'number' ? debtItem.interestRatePercent : 0
                const remainingPayments = typeof debtItem.remainingPayments === 'number' ? debtItem.remainingPayments : 0
                const [calculatedPaybackMonths] = calculateEstimatedPayoffMonthsFromBalancePaymentAndInterestRate(value, perMonth, interestRatePercent)
                const payoffMonthsForProjection = remainingPayments > 0 ? remainingPayments : Number(calculatedPaybackMonths ?? 0)
                const projectedPayoffDate = formatProjectedPayoffDateFromMonthsOffset(payoffMonthsForProjection)
                return (
                  <tr key={stableKey} className="group border-t border-white/[0.025] bg-[#141414]">
                    <td className="px-3 py-2 text-[#d4d4d4]">{formatPersonaLabelWithEmoji(person, personaEmojiByName)}</td>
                    <td className="px-3 py-2 text-[#d4d4d4]">{item}</td>
                    <td className="px-3 py-2 text-right font-semibold text-rose-400"><span className="inline-flex items-center gap-1">{formatCurrencyValueForDashboard(value)}{renderStaleUpdateIconIfNeeded(debtItem)}</span></td>
                    <td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(perMonth)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{interestRatePercent.toFixed(2)}%</td>
                    <td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{projectedPayoffDate}</td>
                    <td className="px-3 py-2 text-right">{renderRecordActionsWithIconButtons(String(debtItem.__collectionName), debtItem)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section id="credit" className="section-tight glass-panel-soft squircle-md z-layer-section mb-4 scroll-mt-40 p-4 md:mb-6 md:p-6" style={{ order: 3 }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#ededed]">Credit Accounts</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-rose-400">{formatCurrencyValueForDashboard(creditCardSummary.totalCurrent)}</span>
            <span className="text-sm font-semibold text-violet-300">{creditCardSummary.totalUtilizationPercent.toFixed(1)}% util.</span>
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-rose-600 px-3 py-2 text-xs font-semibold text-white" onClick={() => openAddRecordModalWithPresetTypeAndCategory('credit_card', 'Credit Card')} type="button"><IconPlus /> Add Card</button>
          </div>
        </div>
        <div className="table-scroll-region mb-4 rounded-2xl border border-white/[0.06] bg-[rgba(20,20,20,0.6)] backdrop-blur">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-[#1a1a1a] text-[#a1a1aa]">
              <tr>
                {renderSortableHeaderCell('credit', 'person', 'Person')}
                {renderSortableHeaderCell('credit', 'item', 'Account')}
                {renderSortableHeaderCell('credit', 'currentBalance', 'Balance', true)}
                {renderSortableHeaderCell('credit', 'maxCapacity', 'Limit', true)}
                {renderSortableHeaderCell('credit', 'interestRatePercent', 'APR', true)}
                <th className="px-3 py-2 text-right font-semibold">Util%</th>
                {renderSortableHeaderCell('credit', 'monthlyPayment', 'Monthly Pmt', true)}
                <th className="px-3 py-2 text-right font-semibold">Payoff Date</th>
                <th className="px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {creditCardInformationCollection.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-[#52525b]">No credit accounts recorded yet</td></tr>
              ) : creditRowsSorted.map((creditCardItem, creditIndex) => {
                const stableKey = typeof creditCardItem.id === 'string' ? creditCardItem.id : `credit-info-row-${creditIndex}`
                const person = typeof creditCardItem.person === 'string' ? creditCardItem.person : DEFAULT_PERSONA_NAME
                const item = typeof creditCardItem.item === 'string' ? creditCardItem.item : ''
                const maxCapacity = typeof creditCardItem.maxCapacity === 'number' ? creditCardItem.maxCapacity : 0
                const currentBalance = typeof creditCardItem.currentBalance === 'number' ? creditCardItem.currentBalance : 0
                const monthlyPayment = typeof creditCardItem.monthlyPayment === 'number' ? creditCardItem.monthlyPayment : 0
                const interestRatePercent = typeof creditCardItem.interestRatePercent === 'number' ? creditCardItem.interestRatePercent : 0
                const utilizationPercent = maxCapacity > 0 ? (currentBalance / maxCapacity) * 100 : 0
                const utilColor = utilizationPercent <= 30 ? '#15803d' : utilizationPercent <= 70 ? '#b45309' : '#be123c'
                const [paybackMonths] = calculateEstimatedPayoffMonthsFromBalancePaymentAndInterestRate(currentBalance, monthlyPayment, interestRatePercent)
                const projectedPayoffDate = formatProjectedPayoffDateFromMonthsOffset(Number(paybackMonths ?? 0))
                return (
                  <tr key={stableKey} className="group border-t border-white/[0.025] bg-[#141414]">
                    <td className="px-3 py-2 text-[#d4d4d4]">{formatPersonaLabelWithEmoji(person, personaEmojiByName)}</td>
                    <td className="px-3 py-2 text-[#d4d4d4]">{item}</td>
                    <td className="px-3 py-2 text-right font-semibold text-rose-400"><span className="inline-flex items-center gap-1">{formatCurrencyValueForDashboard(currentBalance)}{renderStaleUpdateIconIfNeeded(creditCardItem)}</span></td>
                    <td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(maxCapacity)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{interestRatePercent.toFixed(2)}%</td>
                    <td className="px-3 py-2 text-right font-semibold" style={{ color: utilColor }}>{utilizationPercent.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(monthlyPayment)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{projectedPayoffDate}</td>
                    <td className="px-3 py-2 text-right">{renderRecordActionsWithIconButtons('creditCards', creditCardItem)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[rgba(20,20,20,0.6)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
            <h3 className="text-sm font-bold text-[#e0e0e0]">Payment Recommendation</h3>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#71717a]">{creditCardRecommendations.strategy}</span>
              <span className="text-xs font-semibold text-[#a1a1aa]">Now: <span className="text-[#e0e0e0]">{formatCurrencyValueForDashboard(creditCardRecommendations.currentTotalMonthlyPayment)}</span></span>
              <span className="text-xs font-semibold text-[#a1a1aa]">Recommended: <span className="text-amber-400">{formatCurrencyValueForDashboard(creditCardRecommendations.recommendedTotalMonthlyPayment)}</span></span>
              {Math.max(0, creditCardRecommendations.weightedPayoffMonthsCurrent - creditCardRecommendations.weightedPayoffMonthsRecommended) > 0 ? (
                <span className="text-xs font-semibold text-[#a1a1aa]">{Math.max(0, creditCardRecommendations.weightedPayoffMonthsCurrent - creditCardRecommendations.weightedPayoffMonthsRecommended).toFixed(1)} mo. faster</span>
              ) : null}
            </div>
          </div>
          <div className="table-scroll-region rounded-b-2xl">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead className="bg-[#1a1a1a] text-[#a1a1aa]">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Account</th>
                  <th className="px-3 py-2 text-right font-semibold">Current Pmt</th>
                  <th className="px-3 py-2 text-right font-semibold">Recommended</th>
                  <th className="px-3 py-2 text-right font-semibold">Payoff Date</th>
                  <th className="px-3 py-2 text-right font-semibold">Now vs. Reco</th>
                  <th className="px-3 py-2 text-left font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody>
                {creditCardRecommendations.rows.map((rowItem) => {
                  const recoPayoffDate = formatProjectedPayoffDateFromMonthsOffset(Number(rowItem.estimatedMonthsRecommended ?? 0))
                  return (
                    <tr key={rowItem.id} className="border-t border-white/[0.025] bg-[#141414]">
                      <td className="px-3 py-2 text-[#d4d4d4]">{rowItem.item}</td>
                      <td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(rowItem.currentMonthlyPayment)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-amber-400">{formatCurrencyValueForDashboard(rowItem.recommendedMonthlyPayment)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-[#a1a1aa]">{recoPayoffDate}</td>
                      <td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">
                        <span className="text-[#52525b]">{Math.round(rowItem.estimatedMonthsCurrent)}mo</span>
                        <span className="mx-1 text-white/[0.2]">G��</span>
                        <span className="text-[#a1a1aa]">{Math.round(rowItem.estimatedMonthsRecommended)}mo</span>
                      </td>
                      <td className="px-3 py-2 text-[#71717a]">{rowItem.recommendationReason}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="savings" className="section-tight glass-panel-soft squircle-md z-layer-section mb-4 scroll-mt-40 p-4 md:mb-6 md:p-6" style={{ order: 4 }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#ededed]">Monthly Savings Storage</h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold ${monthlySavingsStorageSummary.monthlySavingsAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrencyValueForDashboard(monthlySavingsStorageSummary.monthlySavingsAmount)}</span>
            <span className={`text-sm font-semibold ${resolveSavingsRateToneClasses(monthlySavingsStorageSummary.monthlySavingsRatePercent).valueClassName}`}>{monthlySavingsStorageSummary.monthlySavingsRatePercent.toFixed(1)}% rate</span>
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-emerald-600 px-3 py-2 text-xs font-semibold text-white" onClick={() => openAddRecordModalWithPresetTypeAndCategory('savings', 'Savings')} type="button"><IconPlus /> Add</button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[rgba(20,20,20,0.6)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
            <h3 className="text-sm font-bold text-[#e0e0e0]">Recommended Target</h3>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xs text-[#71717a]">{savingsRecommendation.recommendationReason}</span>
              <span className="text-xs font-semibold text-[#a1a1aa]">Recommended: <span className="text-emerald-400">{formatCurrencyValueForDashboard(savingsRecommendation.recommendedMonthlySavings)}</span> ({savingsRecommendation.recommendedSavingsRatePercent.toFixed(1)}%)</span>
              <span className="text-xs font-semibold text-[#a1a1aa]">Range: <span className="text-[#e0e0e0]">{formatCurrencyValueForDashboard(savingsRecommendation.minimumRecommendedSavings)}G��{formatCurrencyValueForDashboard(savingsRecommendation.stretchRecommendedSavings)}</span></span>
              <span className={`text-xs font-semibold ${savingsRecommendation.gapToRecommendedSavings <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Gap: {formatCurrencyValueForDashboard(savingsRecommendation.gapToRecommendedSavings)}</span>
            </div>
          </div>
          <div className="table-scroll-region rounded-b-2xl">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead className="bg-[#1a1a1a] text-[#a1a1aa]">
                <tr>
                  {renderSortableHeaderCell('savings', 'person', 'Person')}
                  {renderSortableHeaderCell('savings', 'location', 'Storage')}
                  {renderSortableHeaderCell('savings', 'balance', 'Balance', true)}
                  {renderSortableHeaderCell('savings', 'allocationPercent', 'Allocation', true)}
                  {renderSortableHeaderCell('savings', 'description', 'Description')}
                  <th className="px-3 py-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {savingsStorageRowsSorted.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#52525b]">No savings storage recorded yet</td></tr>
                ) : savingsStorageRowsSorted.map((rowItem) => (
                  <tr key={rowItem.id} className="group border-t border-white/[0.025] bg-[#141414]">
                    <td className="px-3 py-2 text-[#d4d4d4]">{formatPersonaLabelWithEmoji(rowItem.person, personaEmojiByName)}</td>
                    <td className="px-3 py-2 text-[#d4d4d4]">{rowItem.location}</td>
                    <td className="px-3 py-2 text-right font-semibold text-emerald-400">{formatCurrencyValueForDashboard(rowItem.balance)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{rowItem.allocationPercent.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-[#71717a]">{rowItem.description}</td>
                    <td className="px-3 py-2 text-right">{renderRecordActionsWithIconButtons('assets', rowItem)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="assets" className="section-tight glass-panel-soft squircle-md z-layer-section mb-4 scroll-mt-40 p-4 md:mb-6 md:p-6" style={{ order: 1 }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#ededed]">Assets</h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold ${totalAssetHoldingsValue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrencyValueForDashboard(totalAssetHoldingsValue)}</span>
            <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-cyan-600 px-3 py-2 text-xs font-semibold text-white" onClick={() => setIsAddAssetModalOpen(true)} type="button"><IconPlus /> Add Asset</button>
          </div>
        </div>
        <div className="table-scroll-region rounded-lg border border-white/[0.03] backdrop-blur">
          <table className="w-full min-w-[620px] border-collapse text-sm">
            <thead className="bg-[#1a1a1a] text-[#a1a1aa]">
              <tr>
                {renderSortableHeaderCell('assets', 'person', 'Person')}
                {renderSortableHeaderCell('assets', 'item', 'Item')}
                {renderSortableHeaderCell('assets', 'assetMarketValue', 'Market Value', true)}
                {renderSortableHeaderCell('assets', 'assetValueOwed', 'Owed', true)}
                {renderSortableHeaderCell('assets', 'value', 'Equity', true)}
                <th className="px-3 py-2 text-right font-semibold">LTV</th>
                <th className="px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assetHoldingRows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[#52525b]">No assets recorded yet</td></tr>
              ) : assetHoldingRowsSorted.map((rowItem, rowIndex) => {
                const stableKey = typeof rowItem.id === 'string' ? rowItem.id : `asset-row-${rowIndex}`
                const marketValue = typeof rowItem.assetMarketValue === 'number' ? rowItem.assetMarketValue : 0
                const owed = typeof rowItem.assetValueOwed === 'number' ? rowItem.assetValueOwed : 0
                const equity = typeof rowItem.value === 'number' ? rowItem.value : (marketValue - owed)
                const ltvPercent = marketValue > 0 ? Math.min(100, Math.round((owed / marketValue) * 100)) : 0
                const ltvColor = ltvPercent <= 50 ? '#10b981' : ltvPercent <= 80 ? '#f59e0b' : '#f43f5e'
                return (
                  <tr key={stableKey} className="group border-t border-white/[0.025] bg-[#141414]">
                    <td className="px-3 py-2 text-[#d4d4d4]">{formatPersonaLabelWithEmoji(String(rowItem.person ?? ''), personaEmojiByName)}</td>
                    <td className="px-3 py-2 text-[#d4d4d4]"><span className="inline-flex items-center gap-1">{String(rowItem.item ?? 'G��')}{renderStaleUpdateIconIfNeeded(rowItem)}</span></td>
                    <td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(marketValue)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{owed > 0 ? formatCurrencyValueForDashboard(owed) : 'G��'}</td>
                    <td className="px-3 py-2 text-right font-semibold" style={{ color: equity >= 0 ? '#15803d' : '#be123c' }}>{formatCurrencyValueForDashboard(equity)}</td>
                    <td className="px-3 py-2 text-right font-semibold" style={{ color: ltvColor }}>{owed > 0 ? `${ltvPercent}%` : 'G��'}</td>
                    <td className="px-3 py-2 text-right">{renderRecordActionsWithIconButtons('assetHoldings', rowItem)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {false ? (<section id="planning" className="section-tight glass-panel-soft squircle-md z-layer-section mb-4 scroll-mt-40 p-4 md:mb-6 md:p-6" style={{ order: 7 }}>
        <div className="mb-5"><h2 className="text-lg font-bold text-[#ededed]">Planning Engine</h2><p className="text-xs text-[#71717a]">Budget hygiene, forecast layers, debt execution, scenarios, and month-close readiness.</p></div>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <article className="squircle-sm border border-white/[0.06] bg-[rgba(20,20,20,0.9)] p-3"><p className="text-xs uppercase tracking-[0.12em] text-[#71717a]">Forecast: Committed</p><p className="text-xl font-bold text-rose-400">{formatCurrencyValueForDashboard(planningInsights.forecast.committed)}</p></article>
          <article className="squircle-sm border border-white/[0.06] bg-[rgba(20,20,20,0.9)] p-3"><p className="text-xs uppercase tracking-[0.12em] text-[#71717a]">Forecast: Planned</p><p className="text-xl font-bold text-[#a1a1aa]">{formatCurrencyValueForDashboard(planningInsights.forecast.planned)}</p></article>
          <article className="squircle-sm border border-white/[0.06] bg-[rgba(20,20,20,0.9)] p-3"><p className="text-xs uppercase tracking-[0.12em] text-[#71717a]">Forecast Risk</p><p className={`text-xl font-bold ${planningInsights.forecast.projectedRiskLevel === 'low' ? 'text-emerald-400' : (planningInsights.forecast.projectedRiskLevel === 'medium' ? 'text-amber-400' : 'text-rose-400')}`}>{planningInsights.forecast.projectedRiskLevel}</p></article>
        </div>
        <div className="mb-4 table-scroll-region rounded-lg border border-white/[0.03] backdrop-blur">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead className="bg-[#1a1a1a] text-[#a1a1aa]"><tr><th className="px-3 py-2 text-left font-semibold">Category</th><th className="px-3 py-2 text-right font-semibold">Budget</th><th className="px-3 py-2 text-right font-semibold">Actual</th><th className="px-3 py-2 text-right font-semibold">Variance</th><th className="px-3 py-2 text-right font-semibold">Run-rate (EOM)</th></tr></thead>
            <tbody>{planningInsights.budgetVsActualRows.slice(0, 10).map((rowItem) => <tr key={`bva-${rowItem.category}`} className="border-t border-white/[0.025] bg-[#141414]"><td className="px-3 py-2 text-[#d4d4d4]">{rowItem.category}</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(rowItem.planned)}</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(rowItem.actual)}</td><td className={`px-3 py-2 text-right font-semibold ${rowItem.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrencyValueForDashboard(rowItem.variance)}</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(rowItem.runRateMonthEnd)}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="table-scroll-region rounded-lg border border-white/[0.03] backdrop-blur">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="bg-[#1a1a1a] text-[#a1a1aa]"><tr><th className="px-3 py-2 text-left font-semibold">Recurring Baseline</th><th className="px-3 py-2 text-right font-semibold">Amount</th><th className="px-3 py-2 text-left font-semibold">Cadence</th></tr></thead>
              <tbody>{planningInsights.recurringBaselineRows.slice(0, 10).map((rowItem) => <tr key={rowItem.id} className="border-t border-white/[0.025] bg-[#141414]"><td className="px-3 py-2 text-[#d4d4d4]">{rowItem.category}</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(rowItem.amount)}</td><td className="px-3 py-2 text-[#71717a]">{rowItem.cadence}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="table-scroll-region rounded-lg border border-white/[0.03] backdrop-blur">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="bg-[#1a1a1a] text-[#a1a1aa]"><tr><th className="px-3 py-2 text-left font-semibold">Scenario</th><th className="px-3 py-2 text-right font-semibold">Monthly Delta</th><th className="px-3 py-2 text-right font-semibold">Debt-free Delta</th><th className="px-3 py-2 text-right font-semibold">Runway (months)</th></tr></thead>
              <tbody>{planningInsights.scenarioRows.map((rowItem) => <tr key={rowItem.id} className="border-t border-white/[0.025] bg-[#141414]"><td className="px-3 py-2 text-[#d4d4d4]">{rowItem.label}</td><td className={`px-3 py-2 text-right font-semibold ${rowItem.monthlyDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrencyValueForDashboard(rowItem.monthlyDelta)}</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{rowItem.debtFreeMonthsDelta.toFixed(1)} mo</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{rowItem.runwayMonths.toFixed(2)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className="mb-4 table-scroll-region rounded-lg border border-white/[0.03] backdrop-blur">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead className="bg-[#1a1a1a] text-[#a1a1aa]"><tr><th className="px-3 py-2 text-left font-semibold">Debt / Loan</th><th className="px-3 py-2 text-right font-semibold">Balance</th><th className="px-3 py-2 text-right font-semibold">Payment</th><th className="px-3 py-2 text-right font-semibold">APR</th><th className="px-3 py-2 text-right font-semibold">Remaining Pmts</th><th className="px-3 py-2 text-right font-semibold">Payoff (months)</th></tr></thead>
            <tbody>{planningInsights.amortizationRows.map((rowItem) => <tr key={rowItem.id} className="border-t border-white/[0.025] bg-[#141414]"><td className="px-3 py-2 text-[#d4d4d4]">{rowItem.item}</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(rowItem.startBalance)}</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(rowItem.payment)}</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{rowItem.interestRatePercent.toFixed(2)}%</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{Math.round(rowItem.remainingPayments)}</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{rowItem.projectedPayoffMonths.toFixed(1)}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="table-scroll-region rounded-lg border border-white/[0.03] backdrop-blur">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead className="bg-[#1a1a1a] text-[#a1a1aa]"><tr><th className="px-3 py-2 text-left font-semibold">Goal Template</th><th className="px-3 py-2 text-right font-semibold">Target</th><th className="px-3 py-2 text-right font-semibold">Months</th><th className="px-3 py-2 text-right font-semibold">Req. / Month</th></tr></thead>
              <tbody>{planningInsights.goalTemplateRows.map((rowItem) => <tr key={rowItem.id} className="border-t border-white/[0.025] bg-[#141414]"><td className="px-3 py-2 text-[#d4d4d4]">{rowItem.title}</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(rowItem.targetAmount)}</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{Math.round(rowItem.targetMonths)}</td><td className="px-3 py-2 text-right font-semibold text-[#a1a1aa]">{formatCurrencyValueForDashboard(rowItem.requiredMonthlyContribution)}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="table-scroll-region rounded-lg border border-white/[0.03] backdrop-blur">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead className="bg-[#1a1a1a] text-[#a1a1aa]"><tr><th className="px-3 py-2 text-left font-semibold">Risk Provenance</th><th className="px-3 py-2 text-left font-semibold">Formula</th><th className="px-3 py-2 text-left font-semibold">Threshold</th><th className="px-3 py-2 text-right font-semibold">Completeness</th></tr></thead>
              <tbody>{planningInsights.riskProvenanceRows.map((rowItem) => <tr key={rowItem.id} className="border-t border-white/[0.025] bg-[#141414]"><td className="px-3 py-2 text-[#d4d4d4]">{rowItem.title}</td><td className="px-3 py-2 text-[#71717a]">{rowItem.formula}</td><td className="px-3 py-2 text-[#71717a]">{rowItem.threshold}</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{rowItem.dataCompletenessPercent}%</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className="table-scroll-region rounded-lg border border-white/[0.03] backdrop-blur">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead className="bg-[#1a1a1a] text-[#a1a1aa]"><tr><th className="px-3 py-2 text-left font-semibold">Reconcile / Close Month</th><th className="px-3 py-2 text-left font-semibold">Status</th><th className="px-3 py-2 text-left font-semibold">Detail</th></tr></thead>
            <tbody>{planningInsights.reconcileChecklistRows.map((rowItem) => <tr key={rowItem.id} className="border-t border-white/[0.025] bg-[#141414]"><td className="px-3 py-2 text-[#d4d4d4]">{rowItem.label}</td><td className={`px-3 py-2 font-semibold ${rowItem.status === 'ready' ? 'text-emerald-400' : 'text-amber-400'}`}>{rowItem.status}</td><td className="px-3 py-2 text-[#71717a]">{rowItem.detail}</td></tr>)}</tbody>
          </table>
        </div>
      </section>) : null}

      {false ? (<section id="trends" className="section-tight glass-panel-soft squircle-md z-layer-section mb-4 scroll-mt-40 p-4 md:mb-6 md:p-6" style={{ order: 8 }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#ededed]">Historical Trends</h2>
            <p className="text-xs text-[#71717a]">Net worth, DTI, savings rate, and utilization over 3/6/12 month windows.</p>
          </div>
          <div className="flex items-center gap-1">
            <button className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${trendWindowMonths === 3 ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-white/[0.025] bg-[#141414] text-[#d4d4d4]'}`} onClick={() => setTrendWindowMonths(3)} type="button">3M</button>
            <button className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${trendWindowMonths === 6 ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-white/[0.025] bg-[#141414] text-[#d4d4d4]'}`} onClick={() => setTrendWindowMonths(6)} type="button">6M</button>
            <button className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${trendWindowMonths === 12 ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-white/[0.025] bg-[#141414] text-[#d4d4d4]'}`} onClick={() => setTrendWindowMonths(12)} type="button">12M</button>
          </div>
        </div>
        <div className="mb-4 rounded-2xl border border-white/[0.06] bg-[rgba(20,20,20,0.6)] p-3 backdrop-blur">
          <div className="flex items-end gap-1">
            {trendRowsInSelectedWindow.map((rowItem) => {
              const range = Math.max(1, trendNetWorthMinMax.max - trendNetWorthMinMax.min)
              const normalizedHeight = ((rowItem.netWorth - trendNetWorthMinMax.min) / range) * 100
              return (
                <div key={`trend-networth-${rowItem.monthKey}`} className="flex min-w-[42px] flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-cyan-500/80" style={{ height: `${Math.max(10, normalizedHeight)}px` }} />
                  <span className="text-[10px] font-semibold text-[#71717a]">{rowItem.monthKey.slice(5)}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="table-scroll-region rounded-lg border border-white/[0.03] backdrop-blur">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead className="bg-[#1a1a1a] text-[#a1a1aa]"><tr><th className="px-3 py-2 text-left font-semibold">Month</th><th className="px-3 py-2 text-right font-semibold">Net Worth</th><th className="px-3 py-2 text-right font-semibold">DTI</th><th className="px-3 py-2 text-right font-semibold">Savings Rate</th><th className="px-3 py-2 text-right font-semibold">Utilization</th></tr></thead>
            <tbody>{trendRowsInSelectedWindow.map((rowItem) => <tr key={`trend-row-${rowItem.monthKey}`} className="border-t border-white/[0.025] bg-[#141414]"><td className="px-3 py-2 text-[#d4d4d4]">{rowItem.monthKey}</td><td className={`px-3 py-2 text-right font-semibold ${rowItem.netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrencyValueForDashboard(rowItem.netWorth)}</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{rowItem.debtToIncomePercent.toFixed(2)}%</td><td className={`px-3 py-2 text-right font-semibold ${rowItem.savingsRatePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{rowItem.savingsRatePercent.toFixed(2)}%</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{rowItem.utilizationPercent.toFixed(2)}%</td></tr>)}</tbody>
          </table>
        </div>
      </section>) : null}

      {false ? (<section id="audit" className="section-tight glass-panel-soft squircle-md z-layer-section mb-4 scroll-mt-40 p-4 md:mb-6 md:p-6" style={{ order: 9 }}>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#ededed]">Audit And Restore</h2>
            <p className="text-xs text-[#71717a]">Persistent rollback points with summary metrics for each state change.</p>
          </div>
          <span className="rounded-full bg-[#1a1a1a] px-3 py-1 text-xs font-semibold text-[#a1a1aa]">{auditTimelineEntries.length} snapshots</span>
        </div>
        <div className="table-scroll-region rounded-lg border border-white/[0.03] backdrop-blur">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead className="bg-[#1a1a1a] text-[#a1a1aa]"><tr><th className="px-3 py-2 text-left font-semibold">Timestamp</th><th className="px-3 py-2 text-left font-semibold">Context</th><th className="px-3 py-2 text-right font-semibold">Income</th><th className="px-3 py-2 text-right font-semibold">Expenses</th><th className="px-3 py-2 text-right font-semibold">Net Worth</th><th className="px-3 py-2 text-right font-semibold">Actions</th></tr></thead>
            <tbody>{auditTimelineEntries.slice(0, 20).map((entryItem) => <tr key={String(entryItem.id)} className="border-t border-white/[0.025] bg-[#141414]"><td className="px-3 py-2 text-[#d4d4d4]">{String(entryItem.timestamp ?? '')}</td><td className="px-3 py-2 text-[#d4d4d4]">{String(entryItem.contextTag ?? '')}</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(typeof entryItem.summary?.totalIncome === 'number' ? entryItem.summary.totalIncome : 0)}</td><td className="px-3 py-2 text-right font-semibold text-[#d4d4d4]">{formatCurrencyValueForDashboard(typeof entryItem.summary?.totalExpenses === 'number' ? entryItem.summary.totalExpenses : 0)}</td><td className={`px-3 py-2 text-right font-semibold ${(typeof entryItem.summary?.netWorth === 'number' ? entryItem.summary.netWorth : 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrencyValueForDashboard(typeof entryItem.summary?.netWorth === 'number' ? entryItem.summary.netWorth : 0)}</td><td className="px-3 py-2 text-right"><button className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-400" onClick={() => { void restoreCollectionsSnapshotFromAuditEntryById(String(entryItem.id)) }} type="button">Restore</button></td></tr>)}</tbody>
          </table>
        </div>
      </section>) : null}

      <section id="loan-calculator" className="section-tight glass-panel-soft squircle-md z-layer-section mb-4 scroll-mt-40 p-4 md:mb-6 md:p-6" style={{ order: 10 }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#ededed]">Loan Payoff Calculator</h2>
            <p className="text-xs text-[#71717a]">Base vs. base + extra payment G�� months and interest saved.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[rgba(20,20,20,0.6)] backdrop-blur">
          <div className="grid grid-cols-1 gap-3 border-b border-white/[0.06] p-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-sm font-medium text-[#d4d4d4] sm:col-span-2 lg:col-span-1">Existing Debt<select className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 text-[#ededed] outline-none transition focus:border-amber-500 focus:bg-[#141414]" value={loanCalculatorFormState.selectedLoanKey} onChange={(event) => selectLoanRecordForCalculatorByKey(event.target.value)}><option value="">Manual entry...</option>{loanCalculatorSourceRows.map((rowItem) => <option key={rowItem.key} value={rowItem.key}>{rowItem.label}</option>)}</select></label>
            <label className="text-sm font-medium text-[#d4d4d4]">Balance<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 text-[#ededed] outline-none transition focus:border-amber-500 focus:bg-[#141414]" min="0" step="0.01" type="number" value={loanCalculatorFormState.principalBalance} onChange={(event) => updateLoanCalculatorFormFieldValue('principalBalance', event.target.value)} /></label>
            <label className="text-sm font-medium text-[#d4d4d4]">APR %<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 text-[#ededed] outline-none transition focus:border-amber-500 focus:bg-[#141414]" min="0" step="0.01" type="number" value={loanCalculatorFormState.annualInterestRatePercent} onChange={(event) => updateLoanCalculatorFormFieldValue('annualInterestRatePercent', event.target.value)} /></label>
            <label className="text-sm font-medium text-[#d4d4d4]">Base Payment<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 text-[#ededed] outline-none transition focus:border-amber-500 focus:bg-[#141414]" min="0" step="0.01" type="number" value={loanCalculatorFormState.baseMonthlyPayment} onChange={(event) => updateLoanCalculatorFormFieldValue('baseMonthlyPayment', event.target.value)} /></label>
            <label className="text-sm font-medium text-[#d4d4d4]">Extra Payment<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 text-[#ededed] outline-none transition focus:border-amber-500 focus:bg-[#141414]" min="0" step="0.01" type="number" value={loanCalculatorFormState.extraMonthlyPayment} onChange={(event) => updateLoanCalculatorFormFieldValue('extraMonthlyPayment', event.target.value)} /></label>
          </div>
          {loanCalculatorResult.error ? (
            <div className="px-4 py-3 text-sm font-semibold text-rose-400">Unable to calculate G�� check all fields are valid numbers.</div>
          ) : (
            <div className="flex flex-wrap divide-x divide-slate-200/70">
              <div className="flex min-w-[130px] flex-1 flex-col gap-0.5 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#52525b]">Base Payoff</span>
                <span className="text-base font-bold text-[#e0e0e0]">{loanCalculatorResult.comparison.baseMonths >= 9999 ? 'Not reachable' : `${loanCalculatorResult.comparison.baseMonths.toFixed(1)} mo`}</span>
              </div>
              <div className="flex min-w-[130px] flex-1 flex-col gap-0.5 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#52525b]">With Extra</span>
                <span className="text-base font-bold text-[#a1a1aa]">{loanCalculatorResult.comparison.acceleratedMonths >= 9999 ? 'Not reachable' : `${loanCalculatorResult.comparison.acceleratedMonths.toFixed(1)} mo`}</span>
              </div>
              <div className="flex min-w-[130px] flex-1 flex-col gap-0.5 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#52525b]">Months Saved</span>
                <span className="text-base font-bold text-emerald-400">{loanCalculatorResult.comparison.monthsSaved.toFixed(1)}</span>
              </div>
              <div className="flex min-w-[130px] flex-1 flex-col gap-0.5 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#52525b]">Interest (Base)</span>
                <span className="text-base font-bold text-[#d4d4d4]">{Number.isFinite(loanCalculatorResult.comparison.baseInterestPaid) ? formatCurrencyValueForDashboard(loanCalculatorResult.comparison.baseInterestPaid) : 'G��'}</span>
              </div>
              <div className="flex min-w-[130px] flex-1 flex-col gap-0.5 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#52525b]">Interest (w/ Extra)</span>
                <span className="text-base font-bold text-[#a1a1aa]">{Number.isFinite(loanCalculatorResult.comparison.acceleratedInterestPaid) ? formatCurrencyValueForDashboard(loanCalculatorResult.comparison.acceleratedInterestPaid) : 'G��'}</span>
              </div>
              <div className="flex min-w-[130px] flex-1 flex-col gap-0.5 px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#52525b]">Interest Saved</span>
                <span className="text-base font-bold text-emerald-400">{formatCurrencyValueForDashboard(loanCalculatorResult.comparison.interestSaved)}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="details" className="section-tight glass-panel-soft squircle-md z-layer-section mb-4 scroll-mt-40 p-4 md:mb-6 md:p-6" style={{ order: 6 }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#ededed]">Detailed Dashboard Metrics</h2>
          <span className="rounded-full bg-[rgba(26,26,26,0.9)] px-3 py-1 text-xs font-semibold text-[#a1a1aa] backdrop-blur">{detailedRowsSorted.length} metrics</span>
        </div>
        <div className="table-scroll-region rounded-lg border border-white/[0.03] backdrop-blur">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-[#1a1a1a] text-[#a1a1aa]"><tr>{renderSortableHeaderCell('detailed', 'metric', 'Metric')}{renderSortableHeaderCell('detailed', 'value', 'Value', true)}{renderSortableHeaderCell('detailed', 'description', 'Description')}</tr></thead>
            <tbody>{detailedRowsSorted.map((rowItem) => {
              const isCurrency = rowItem.valueFormat === 'currency'
              const isDuration = rowItem.valueFormat === 'duration'
              const isPercent = rowItem.valueFormat === 'percent'
              const numVal = typeof rowItem.value === 'number' ? rowItem.value : 0
              const valueColorClass = isCurrency
                ? (numVal > 0 ? 'text-emerald-400' : numVal < 0 ? 'text-rose-400' : 'text-[#a1a1aa]')
                : (isPercent || isDuration ? 'text-[#d4d4d4]' : 'text-[#d4d4d4]')
              const formattedValue = isCurrency
                ? formatCurrencyValueForDashboard(numVal)
                : (isDuration
                    ? (Number.isFinite(numVal) && numVal > 0 ? `${numVal.toFixed(1)} mo` : 'G��')
                    : formatPlainNumericValueForDashboard(numVal, rowItem.valueFormat) + (isPercent ? '%' : ''))
              return (
                <tr key={rowItem.metric} className="border-t border-white/[0.025] bg-[#141414]">
                  <td className="px-3 py-2 font-semibold text-[#e0e0e0]">{rowItem.metric}</td>
                  <td className={`px-3 py-2 text-right font-semibold tabular-nums ${valueColorClass}`}>{formattedValue}</td>
                  <td className="px-3 py-2 text-[#71717a]">{rowItem.description}</td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      </section>

      <section id="records" className="section-tight glass-panel-soft squircle-md z-layer-section mb-4 scroll-mt-40 p-4 md:mb-6 md:p-5" style={{ order: 5 }}>
        {/* -- Header -- */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold tracking-wide text-[#ededed]">Records</h2>
            <span className="h-3.5 w-px bg-white/[0.1]" aria-hidden="true" />
            <span className="tabular-nums text-sm font-bold" style={{ color: '#34d399' }}>+{formatCurrencyValueForDashboard(recordsFlowSummary.totalIn)}</span>
            <span className="tabular-nums text-sm font-bold" style={{ color: '#fb7185' }}>-{formatCurrencyValueForDashboard(recordsFlowSummary.totalOut)}</span>
            <span className="tabular-nums text-sm font-bold" style={{ color: recordsFlowSummary.diff > 0 ? '#34d399' : (recordsFlowSummary.diff < 0 ? '#fb7185' : '#52525b') }}>
              ={recordsFlowSummary.diff > 0 ? '+' : ''}{formatCurrencyValueForDashboard(recordsFlowSummary.diff)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="records-quick-btn records-quick-btn-income" onClick={() => openAddRecordModalWithPresetTypeAndCategory('income', 'Income')} type="button">+ Income</button>
            <button className="records-quick-btn records-quick-btn-expense" onClick={() => openAddRecordModalWithPresetTypeAndCategory('expense', 'Miscellaneous')} type="button">+ Expense</button>
            <button className="records-quick-btn records-quick-btn-savings" onClick={() => openAddRecordModalWithPresetTypeAndCategory('savings', 'Savings')} type="button">+ Savings</button>
            <button
              className="records-quick-btn records-quick-btn-undo disabled:opacity-20 disabled:cursor-not-allowed"
              disabled={transactionUndoDepth <= 0}
              onClick={() => { void undoMostRecentTransactionChangeFromUndoStack() }}
              type="button"
              title="Undo"
            ><IconRefresh /></button>
            <span className="ml-1 text-[11px] text-[#52525b]">{incomeAndExpenseRows.length}</span>
          </div>
        </div>

        {/* -- Table -- */}
        <div className="table-scroll-region -mx-4 md:-mx-5">
          <table className="w-full min-w-[780px] border-collapse">
            <thead>
              <tr className="border-b border-white/[0.03]">
                {renderSortableHeaderCell('records', 'person', 'Person')}
                {renderSortableHeaderCell('records', 'recordType', 'Type')}
                {renderSortableHeaderCell('records', 'date', 'Date')}
                {renderSortableHeaderCell('records', 'category', 'Category')}
                {renderSortableHeaderCell('records', 'description', 'Note')}
                {renderSortableHeaderCell('records', 'signedAmount', 'Amount', true)}
                <th className="w-24 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {incomeExpenseRowsSorted.map((recordItem, recordIndex) => {
                const recordType = String(recordItem.recordType)
                const person = typeof recordItem.person === 'string' ? recordItem.person : DEFAULT_PERSONA_NAME
                const isIncome = recordType === 'income'
                const isSavings = recordType === 'savings'
                const isAssetType = recordType === 'asset'
                const isDebtLike = recordType === 'debt' || recordType === 'loan' || recordType === 'credit' || recordType === 'credit card'
                const amountValue = typeof recordItem.amount === 'number'
                  ? recordItem.amount
                  : (typeof recordItem.amount === 'string' && recordItem.amount.trim().length > 0 ? Number(recordItem.amount) : 0)
                const badgeClassName = isIncome
                  ? 'record-type-badge record-type-badge-income'
                  : (isSavings ? 'record-type-badge record-type-badge-savings' : 'record-type-badge record-type-badge-expense')
                const amountClassName = !amountValue || !Number.isFinite(amountValue)
                  ? 'text-[#52525b]'
                  : (isIncome ? 'text-emerald-400' : 'text-rose-400')
                const amountColorStyle = !amountValue || !Number.isFinite(amountValue)
                  ? '#52525b'
                  : (isIncome ? '#34d399' : '#fb7185')
                const editCollectionName = isIncome
                  ? 'income'
                  : (isSavings
                    ? 'assets'
                    : (recordType === 'asset'
                      ? 'assetHoldings'
                      : (recordType === 'debt'
                        ? 'debts'
                        : (recordType === 'loan'
                          ? 'loans'
                          : (recordType === 'credit card'
                            ? 'creditCards'
                            : (recordType === 'credit' ? 'credit' : 'expenses'))))))
                const rowStableKey = `${recordType}-${String(recordItem.id ?? 'row')}-${recordIndex}`
                return (
                  <tr key={rowStableKey} className="records-row group border-t border-white/[0.025]">
                    <td className="px-4 py-3 text-xs text-[#71717a] md:px-5">{formatPersonaLabelWithEmoji(person, personaEmojiByName)}</td>
                    <td className="px-3 py-3"><span className={`record-type-badge ${badgeClassName}`}>{recordType}</span></td>
                    <td className="px-3 py-3 text-xs tabular-nums text-[#52525b]">{typeof recordItem.date === 'string' ? recordItem.date : ''}</td>
                    <td className="px-3 py-3 text-xs font-medium text-[#d4d4d4]">{typeof recordItem.category === 'string' ? recordItem.category : (typeof recordItem.item === 'string' ? recordItem.item : '')}</td>
                    <td className="max-w-[180px] truncate px-3 py-3 text-xs text-[#52525b]">{typeof recordItem.description === 'string' ? recordItem.description : (isDebtLike ? 'Liability record' : '')}</td>
                    <td className={`px-3 py-3 text-right text-xs font-semibold tabular-nums ${amountClassName}`} style={{ color: amountColorStyle }}>
                      <span className="inline-flex items-center gap-1">{formatCurrencyValueForDashboard(amountValue)}{renderStaleUpdateIconIfNeeded(recordItem)}</span>
                    </td>
                    <td className="px-3 py-3 pr-4 text-right md:pr-5">{renderRecordActionsWithIconButtons(editCollectionName, recordItem)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      </div>

      {isScrolledPastThreshold && (
        <button
          className="fixed bottom-5 right-5 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/90 text-black shadow-lg backdrop-blur transition-opacity hover:bg-amber-400 focus:outline-none"
          style={{ animation: 'fadeInUp 0.2s ease-out' }}
          onClick={scrollViewportToTopFromUtilityButton}
          type="button"
          aria-label="Scroll to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
        </button>
      )}

      {isAddRecordModalOpen ? (
        <section style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} role="dialog" aria-modal="true" aria-label="Add Record Modal">
          <button style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} onClick={() => setIsAddRecordModalOpen(false)} type="button" aria-label="Close add record modal backdrop" />
          <div
            style={{
              position: 'relative', zIndex: 5001, width: '100%', maxWidth: '520px',
              overflow: 'hidden', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              border: `1px solid ${entryFormState.recordType === 'income' ? 'rgba(52,211,153,0.2)' : entryFormState.recordType === 'savings' ? 'rgba(251,191,36,0.2)' : entryFormState.recordType === 'expense' ? 'rgba(251,113,133,0.18)' : 'rgba(255,255,255,0.08)'}`
            }}
          >
            <div style={{ height: '3px', background: entryFormState.recordType === 'income' ? 'linear-gradient(90deg,#34d399,#059669)' : entryFormState.recordType === 'savings' ? 'linear-gradient(90deg,#fbbf24,#d97706)' : entryFormState.recordType === 'expense' ? 'linear-gradient(90deg,#fb7185,#e11d48)' : 'linear-gradient(90deg,#a855f7,#7c3aed)' }} />
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a', margin: 0 }}>New Record</p>
                  <h3 style={{ marginTop: '2px', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em', color: entryFormState.recordType === 'income' ? '#34d399' : entryFormState.recordType === 'savings' ? '#fbbf24' : entryFormState.recordType === 'expense' ? '#fb7185' : '#d4d4d4', margin: '2px 0 0' }}>
                    {entryFormState.recordType === 'income' ? 'Income' : entryFormState.recordType === 'savings' ? 'Savings' : entryFormState.recordType === 'asset' ? 'Asset' : entryFormState.recordType === 'debt' ? 'Debt' : entryFormState.recordType === 'loan' ? 'Loan' : entryFormState.recordType === 'credit_card' ? 'Credit Account' : 'Expense'}
                  </h3>
                </div>
                <button style={{ flexShrink: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#52525b', cursor: 'pointer', transition: 'color 0.12s, border-color 0.12s' }} onClick={() => setIsAddRecordModalOpen(false)} type="button" aria-label="Close"><IconX /></button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[['income', '#34d399', 'rgba(52,211,153,0.1)', 'rgba(52,211,153,0.22)'], ['expense', '#fb7185', 'rgba(251,113,133,0.09)', 'rgba(251,113,133,0.2)'], ['savings', '#fbbf24', 'rgba(251,191,36,0.08)', 'rgba(251,191,36,0.2)']].map(([typeName, color, bg, borderColor]) => (
                    <button key={typeName} type="button"
                      style={{
                        padding: '10px 0', fontSize: '13px', fontWeight: 700, letterSpacing: '0.01em',
                        borderRadius: '10px', border: `1px solid ${entryFormState.recordType === typeName ? borderColor : 'rgba(255,255,255,0.05)'}`,
                        background: entryFormState.recordType === typeName ? bg : 'rgba(255,255,255,0.02)',
                        color: entryFormState.recordType === typeName ? color : '#71717a',
                        cursor: 'pointer', transition: 'all 0.12s'
                      }}
                      onClick={() => updateEntryFormFieldValue('recordType', typeName)}
                    >{typeName === 'income' ? 'Income' : typeName === 'expense' ? 'Expense' : 'Savings'}</button>
                  ))}
                </div>
                {['asset', 'debt', 'loan', 'credit_card'].includes(entryFormState.recordType) ? (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15,15,15,0.5)', padding: '8px 12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#71717a' }}>Advanced: <span style={{ color: '#a1a1aa' }}>{entryFormState.recordType === 'credit_card' ? 'Credit Account' : entryFormState.recordType.charAt(0).toUpperCase() + entryFormState.recordType.slice(1)}</span></span>
                    <button type="button" style={{ fontSize: '10px', fontWeight: 600, color: '#a1a1aa', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => updateEntryFormFieldValue('recordType', 'expense')}>switch to expense</button>
                  </div>
                ) : (
                  <select style={{ marginTop: '8px', height: '32px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', background: 'transparent', padding: '0 12px', fontSize: '11px', color: '#71717a', outline: 'none', cursor: 'pointer' }} value="" onChange={(e) => e.target.value && updateEntryFormFieldValue('recordType', e.target.value)}>
                    <option value="" style={{ background: '#111' }}>Advanced types...</option>
                    <option value="asset" style={{ background: '#111' }}>Asset</option>
                    <option value="debt" style={{ background: '#111' }}>Debt</option>
                    <option value="loan" style={{ background: '#111' }}>Loan</option>
                    <option value="credit_card" style={{ background: '#111' }}>Credit Account</option>
                  </select>
                )}
              </div>

              <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} onSubmit={submitNewIncomeOrExpenseRecord}>
                <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>Person<select style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', color: '#ededed', outline: 'none' }} value={entryFormState.person} onChange={(event) => updateEntryFormFieldValue('person', event.target.value)}>{personaSelectOptions.map((personaOption) => <option key={personaOption.value} value={personaOption.value}>{personaOption.label}</option>)}<option value="__custom__">Custom person...</option></select></label>
                {entryFormState.person === '__custom__' ? (
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a', gridColumn: '1 / -1' }}>Custom Person<input style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box' }} type="text" value={entryFormState.customPerson} onChange={(event) => updateEntryFormFieldValue('customPerson', event.target.value)} /></label>
                ) : null}
                {entryFormState.recordType === 'credit_card' ? (
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>Account<input style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box' }} type="text" value={entryFormState.item} onChange={(event) => updateEntryFormFieldValue('item', event.target.value)} /></label>
                ) : null}
                {entryFormState.recordType === 'debt' || entryFormState.recordType === 'loan' ? (
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>Item<input style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box' }} type="text" value={entryFormState.item} onChange={(event) => updateEntryFormFieldValue('item', event.target.value)} /></label>
                ) : null}
                <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>{entryFormState.recordType === 'credit_card' ? 'Current Balance' : 'Amount'}<input style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box' }} type="number" step="0.01" autoFocus value={entryFormState.recordType === 'credit_card' ? entryFormState.currentBalance : entryFormState.amount} onChange={(event) => updateEntryFormFieldValue(entryFormState.recordType === 'credit_card' ? 'currentBalance' : 'amount', event.target.value)} /></label>
                {entryFormState.recordType === 'credit_card' ? (
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>Max Capacity<input style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box' }} type="number" step="0.01" value={entryFormState.maxCapacity} onChange={(event) => updateEntryFormFieldValue('maxCapacity', event.target.value)} /></label>
                ) : (
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>Category<select style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none' }} value={entryFormState.category} onChange={(event) => updateEntryFormFieldValue('category', event.target.value)}><option value="">Select a category</option>{COMMON_BUDGET_CATEGORIES.map((categoryName) => <option key={categoryName} value={categoryName}>{categoryName}</option>)}<option value="__custom__">Custom category...</option></select></label>
                )}
                {entryFormState.category === '__custom__' ? (
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a', gridColumn: '1 / -1' }}>Custom Category<input style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box' }} type="text" value={entryFormState.customCategory} onChange={(event) => updateEntryFormFieldValue('customCategory', event.target.value)} /></label>
                ) : null}
                {entryFormState.recordType !== 'credit_card' && entryFormState.recordType !== 'debt' && entryFormState.recordType !== 'loan' ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ marginBottom: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a' }}>Quick pick</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(entryFormState.recordType === 'income'
                        ? ['Income', 'Investments', 'Savings']
                        : entryFormState.recordType === 'savings'
                          ? ['Savings', 'Investments', 'Income']
                          : entryFormState.recordType === 'asset'
                            ? ['Investments', 'Housing', 'Transportation']
                            : ['Groceries', 'Dining', 'Transportation', 'Fuel', 'Housing', 'Entertainment', 'Personal Care', 'Healthcare', 'Miscellaneous']
                      ).map((cat) => (
                        <button key={cat} type="button" style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '7px', border: `1px solid ${entryFormState.category === cat ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.06)'}`, background: entryFormState.category === cat ? 'rgba(251,191,36,0.1)' : 'rgba(26,26,26,0.8)', color: entryFormState.category === cat ? '#fbbf24' : '#a1a1aa', cursor: 'pointer' }} onClick={() => updateEntryFormFieldValue('category', cat)}>{cat}</button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {entryFormState.recordType === 'debt' || entryFormState.recordType === 'loan' || entryFormState.recordType === 'credit_card' ? (
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>Minimum Payment<input style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box' }} type="number" step="0.01" value={entryFormState.minimumPayment} onChange={(event) => updateEntryFormFieldValue('minimumPayment', event.target.value)} /></label>
                ) : null}
                {entryFormState.recordType === 'credit_card' ? (
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>Monthly Payment<input style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box' }} type="number" step="0.01" value={entryFormState.monthlyPayment} onChange={(event) => updateEntryFormFieldValue('monthlyPayment', event.target.value)} /></label>
                ) : null}
                {entryFormState.recordType === 'debt' || entryFormState.recordType === 'loan' || entryFormState.recordType === 'credit_card' ? (
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>APR (%)<input style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box' }} type="number" step="0.01" value={entryFormState.interestRatePercent} onChange={(event) => updateEntryFormFieldValue('interestRatePercent', event.target.value)} /></label>
                ) : null}
                {entryFormState.recordType === 'debt' || entryFormState.recordType === 'loan' ? (
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>Remaining Payments<input style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box' }} type="number" step="1" min="0" value={entryFormState.remainingPayments} onChange={(event) => updateEntryFormFieldValue('remainingPayments', event.target.value)} /></label>
                ) : null}
                {entryFormState.recordType === 'debt' || entryFormState.recordType === 'loan' ? (
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>Loan Start Date<input style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box' }} type="date" value={entryFormState.loanStartDate} onChange={(event) => updateEntryFormFieldValue('loanStartDate', event.target.value)} /></label>
                ) : null}
                {entryFormState.recordType === 'debt' || entryFormState.recordType === 'loan' ? (
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>Collateral Asset<input style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box' }} type="text" value={entryFormState.collateralAssetName} onChange={(event) => updateEntryFormFieldValue('collateralAssetName', event.target.value)} /></label>
                ) : null}
                {entryFormState.recordType === 'debt' || entryFormState.recordType === 'loan' ? (
                  <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>Collateral Market Value<input style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box' }} type="number" step="0.01" min="0" value={entryFormState.collateralAssetMarketValue} onChange={(event) => updateEntryFormFieldValue('collateralAssetMarketValue', event.target.value)} /></label>
                ) : null}
                <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>Date<input style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box' }} type="date" value={entryFormState.date} onChange={(event) => updateEntryFormFieldValue('date', event.target.value)} /></label>
                <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a', gridColumn: '1 / -1' }}>Description<input style={{ marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box' }} type="text" value={entryFormState.description} onChange={(event) => updateEntryFormFieldValue('description', event.target.value)} /></label>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '4px' }}>
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'none', color: '#a1a1aa', cursor: 'pointer' }} onClick={() => setIsAddRecordModalOpen(false)} type="button"><IconX /> Cancel</button>
                  <button
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, borderRadius: '10px', border: 'none', cursor: 'pointer', background: entryFormState.recordType === 'income' ? '#34d399' : entryFormState.recordType === 'savings' ? '#fbbf24' : entryFormState.recordType === 'expense' ? '#fb7185' : '#a855f7', color: '#000' }}
                    type="submit"
                  ><IconCheck /> Save {entryFormState.recordType === 'income' ? 'Income' : entryFormState.recordType === 'savings' ? 'Savings' : entryFormState.recordType === 'asset' ? 'Asset' : entryFormState.recordType === 'debt' ? 'Debt' : entryFormState.recordType === 'loan' ? 'Loan' : entryFormState.recordType === 'credit_card' ? 'Credit Account' : 'Expense'}</button>
                </div>
              </form>
            </div>
          </div>
        </section>
      ) : null}

      {isAddGoalModalOpen ? (
        <section className="fixed inset-0 z-[5000] flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Add Goal Modal">
          <button className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={closeGoalModalAndResetForm} type="button" aria-label="Close add goal modal backdrop" />
          <div className="relative z-[5001] w-full max-w-2xl rounded-3xl border border-white/40 bg-[#141414] p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-lg font-bold text-[#ededed]">{editingGoalId ? 'Edit Goal' : 'Add Goal'}</h3><button className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.025] px-3 py-2 text-sm font-semibold text-[#d4d4d4]" onClick={closeGoalModalAndResetForm} type="button"><IconX /> Close</button></div>
            <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={submitNewGoalRecord}>
              <label className="text-sm font-medium text-[#d4d4d4] sm:col-span-2">Item<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 text-[#ededed] outline-none transition focus:border-amber-500 focus:bg-[#141414]" type="text" value={goalEntryFormState.title} onChange={(event) => updateGoalEntryFormFieldValue('title', event.target.value)} /></label>
              <label className="text-sm font-medium text-[#d4d4d4]">Status<select className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 text-[#ededed] outline-none transition focus:border-amber-500 focus:bg-[#141414]" value={goalEntryFormState.status} onChange={(event) => updateGoalEntryFormFieldValue('status', event.target.value)}><option value="not started">Not started</option><option value="in progress">In progress</option><option value="completed">Completed</option></select></label>
              <label className="text-sm font-medium text-[#d4d4d4]">Timeframe(months)<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 text-[#ededed] outline-none transition focus:border-amber-500 focus:bg-[#141414]" type="number" min="0" step="1" value={goalEntryFormState.timeframeMonths} onChange={(event) => updateGoalEntryFormFieldValue('timeframeMonths', event.target.value)} /></label>
              <label className="text-sm font-medium text-[#d4d4d4] sm:col-span-2">Description<textarea className="mt-1 min-h-[90px] w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 py-2 text-[#ededed] outline-none transition focus:border-amber-500 focus:bg-[#141414]" value={goalEntryFormState.description} onChange={(event) => updateGoalEntryFormFieldValue('description', event.target.value)} /></label>
              <div className="sm:col-span-2 flex flex-wrap justify-end gap-2"><button className="inline-flex items-center gap-1.5 rounded-2xl border border-white/[0.025] px-4 py-2 text-sm font-semibold text-[#d4d4d4]" onClick={closeGoalModalAndResetForm} type="button"><IconX /> Cancel</button>{editingGoalId ? <button className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-400" onClick={() => { void deleteGoalRecordById(editingGoalId) }} type="button"><IconTrash /> Delete Goal</button> : null}<button className="rounded-2xl bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] inline-flex items-center gap-1.5" type="submit"><IconCheck /> {editingGoalId ? 'Save Changes' : 'Save Goal'}</button></div>
            </form>
          </div>
        </section>
      ) : null}

      {isAddAssetModalOpen ? (
        <section className="fixed inset-0 z-[5000] flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Add Asset Modal">
          <button className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setIsAddAssetModalOpen(false)} type="button" aria-label="Close add asset modal backdrop" />
          <div className="relative z-[5001] w-full max-w-2xl rounded-3xl border border-white/40 bg-[#141414] p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-lg font-bold text-[#ededed]">Add Asset</h3><button className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.025] px-3 py-2 text-sm font-semibold text-[#d4d4d4]" onClick={() => setIsAddAssetModalOpen(false)} type="button"><IconX /> Close</button></div>
            <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={submitNewAssetHoldingRecord}>
              <label className="text-sm font-medium text-[#d4d4d4]">Person<select className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 text-[#ededed] outline-none transition focus:border-cyan-400 focus:bg-[#141414]" value={assetHoldingEntryFormState.person} onChange={(event) => updateAssetHoldingEntryFormFieldValue('person', event.target.value)}>{personaSelectOptions.map((personaOption) => <option key={personaOption.value} value={personaOption.value}>{personaOption.label}</option>)}<option value="__custom__">Custom person...</option></select></label>
              {assetHoldingEntryFormState.person === '__custom__' ? <label className="text-sm font-medium text-[#d4d4d4]">Custom Person<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 text-[#ededed] outline-none transition focus:border-cyan-400 focus:bg-[#141414]" type="text" value={assetHoldingEntryFormState.customPerson} onChange={(event) => updateAssetHoldingEntryFormFieldValue('customPerson', event.target.value)} /></label> : null}
              <label className="text-sm font-medium text-[#d4d4d4]">Item<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 text-[#ededed] outline-none transition focus:border-cyan-400 focus:bg-[#141414]" type="text" value={assetHoldingEntryFormState.item} onChange={(event) => updateAssetHoldingEntryFormFieldValue('item', event.target.value)} /></label>
              <label className="text-sm font-medium text-[#d4d4d4]">Asset Value Owed<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 text-[#ededed] outline-none transition focus:border-cyan-400 focus:bg-[#141414]" type="number" min="0" step="0.01" value={assetHoldingEntryFormState.assetValueOwed} onChange={(event) => updateAssetHoldingEntryFormFieldValue('assetValueOwed', event.target.value)} /></label>
              <label className="text-sm font-medium text-[#d4d4d4]">Asset Market Value<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 text-[#ededed] outline-none transition focus:border-cyan-400 focus:bg-[#141414]" type="number" min="0" step="0.01" value={assetHoldingEntryFormState.assetMarketValue} onChange={(event) => updateAssetHoldingEntryFormFieldValue('assetMarketValue', event.target.value)} /></label>
              <label className="text-sm font-medium text-[#d4d4d4]">Date<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 text-[#ededed] outline-none transition focus:border-cyan-400 focus:bg-[#141414]" type="date" value={assetHoldingEntryFormState.date} onChange={(event) => updateAssetHoldingEntryFormFieldValue('date', event.target.value)} /></label>
              <label className="text-sm font-medium text-[#d4d4d4] sm:col-span-2">Description<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] px-3 text-[#ededed] outline-none transition focus:border-cyan-400 focus:bg-[#141414]" type="text" value={assetHoldingEntryFormState.description} onChange={(event) => updateAssetHoldingEntryFormFieldValue('description', event.target.value)} /></label>
              <div className="sm:col-span-2 flex flex-wrap justify-end gap-2"><button className="inline-flex items-center gap-1.5 rounded-2xl border border-white/[0.025] px-4 py-2 text-sm font-semibold text-[#d4d4d4]" onClick={() => setIsAddAssetModalOpen(false)} type="button"><IconX /> Cancel</button><button className="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 inline-flex items-center gap-1.5" type="submit"><IconCheck /> Save Asset</button></div>
            </form>
          </div>
        </section>
      ) : null}

      {isAddPersonaModalOpen ? (
        <section className="manage-personas-modal fixed inset-0 z-[5000] flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Manage Personas Modal">
          <button className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setIsAddPersonaModalOpen(false)} type="button" aria-label="Close manage personas modal backdrop" />
          <div className="manage-personas-shell relative z-[5001] w-full max-w-6xl rounded-3xl border border-white/40 bg-[#141414] p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-lg font-bold text-[#ededed]">Manage Personas</h3><button className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.025] px-3 py-2 text-sm font-semibold text-[#d4d4d4]" onClick={() => setIsAddPersonaModalOpen(false)} type="button"><IconX /> Close</button></div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="manage-personas-panel rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.7)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#71717a]">Existing Personas</p>
                <ul className="mt-3 space-y-2">
                  {personaOptions.map((personaName) => {
                    const isSelected = normalizePersonaNameForDisplay(personaCrudFormState.personaName).toLowerCase() === normalizePersonaNameForDisplay(personaName).toLowerCase()
                    return (
                      <li key={personaName}>
                        <button className={`manage-persona-row w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${isSelected ? 'border-violet-500/40 bg-violet-500/10 text-violet-300' : 'border-white/[0.025] bg-[#141414] text-[#d4d4d4] hover:border-white/[0.06]'}`} type="button" onClick={() => selectPersonaForCrudByName(personaName)}>{formatPersonaLabelWithEmoji(personaName, personaEmojiByName)}</button>
                      </li>
                    )
                  })}
                </ul>
                {personaDangerBackupState ? (
                  <div className="manage-personas-warning mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-400">Backup Available</p>
                    <p className="mt-1 text-xs text-amber-300">Destructive change backup from {personaDangerBackupState.at}.</p>
                    <button className="inline-flex items-center gap-1.5 mt-2 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-300" type="button" onClick={() => void restorePersonaDangerBackupIntoCollections()}><IconRefresh /> Restore Backup</button>
                  </div>
                ) : null}
              </aside>

              <div className="space-y-4">
                <form className="manage-personas-panel rounded-2xl border border-white/[0.06] bg-[#0f0f0f]/70 p-4" onSubmit={submitNewPersonaRecord}>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#71717a]">Create Persona</p>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-sm font-medium text-[#d4d4d4]">Name<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[#141414] px-3 text-[#ededed] outline-none transition focus:border-violet-400" type="text" value={personaEntryFormState.name} onChange={(event) => updatePersonaEntryFormFieldValue('name', event.target.value)} /></label>
                    <label className="text-sm font-medium text-[#d4d4d4]">Emoji Preset<select className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[#141414] px-3 text-xl text-[#ededed] outline-none transition focus:border-violet-400" value={personaEntryFormState.emojiPreset} onChange={(event) => updatePersonaEntryFormFieldValue('emojiPreset', event.target.value)}>{PERSONA_EMOJI_OPTIONS.map((emojiOption) => <option key={emojiOption} value={emojiOption}>{emojiOption}</option>)}</select></label>
                    <label className="text-sm font-medium text-[#d4d4d4]">Custom Emoji (Optional)<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[#141414] px-3 text-2xl text-[#ededed] outline-none transition focus:border-violet-400" type="text" maxLength="4" value={personaEntryFormState.customEmoji} onChange={(event) => updatePersonaEntryFormFieldValue('customEmoji', event.target.value)} /></label>
                    <label className="text-sm font-medium text-[#d4d4d4]">Note (Optional)<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[#141414] px-3 text-[#ededed] outline-none transition focus:border-violet-400" type="text" value={personaEntryFormState.note} onChange={(event) => updatePersonaEntryFormFieldValue('note', event.target.value)} /></label>
                  </div>
                  <div className="mt-3 flex justify-end gap-2"><button className="inline-flex items-center gap-1.5 rounded-2xl border border-white/[0.025] px-4 py-2 text-sm font-semibold text-[#d4d4d4]" type="button" onClick={() => setPersonaEntryFormState(buildInitialPersonaEntryFormState())}><IconX /> Clear</button><button className="inline-flex items-center gap-1.5 rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700" type="submit"><IconPlus /> Create Persona</button></div>
                </form>

                {personaCrudFormState.personaName ? (
                  <form className="manage-personas-panel rounded-2xl border border-white/[0.06] bg-[rgba(20,20,20,0.8)] p-4" onSubmit={submitPersonaCrudOperation}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#71717a]">Edit / Delete Persona</p>
                      <span className="rounded-full bg-[#1a1a1a] px-2 py-1 text-xs font-semibold text-[#d4d4d4]">{formatPersonaLabelWithEmoji(personaCrudFormState.personaName, personaEmojiByName)}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="text-sm font-medium text-[#d4d4d4]">Mode<select className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[#141414] px-3 text-[#ededed] outline-none transition focus:border-violet-400" value={personaCrudFormState.mode} onChange={(event) => updatePersonaCrudFormFieldValue('mode', event.target.value)}><option value="edit">Edit</option><option value="delete_reassign">Delete + Reassign</option><option value="delete_cascade">Delete Cascade</option></select></label>
                      {selectedPersonaImpactSummary ? <div className="rounded-2xl border border-white/[0.06] bg-[#0f0f0f] px-3 py-2 text-xs text-[#a1a1aa]"><p className="font-semibold text-[#d4d4d4]">Impacted records</p><p className="mt-1">Total: {Math.round(typeof selectedPersonaImpactSummary.total === 'number' ? selectedPersonaImpactSummary.total : 0)}</p></div> : <div />}
                      {personaCrudFormState.mode === 'edit' ? <label className="text-sm font-medium text-[#d4d4d4]">Name<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[#141414] px-3 text-[#ededed] outline-none transition focus:border-violet-400" type="text" value={personaCrudFormState.nextName} onChange={(event) => updatePersonaCrudFormFieldValue('nextName', event.target.value)} /></label> : null}
                      {personaCrudFormState.mode === 'edit' ? <label className="text-sm font-medium text-[#d4d4d4]">Emoji Preset<select className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[#141414] px-3 text-xl text-[#ededed] outline-none transition focus:border-violet-400" value={personaCrudFormState.nextEmojiPreset} onChange={(event) => updatePersonaCrudFormFieldValue('nextEmojiPreset', event.target.value)}>{PERSONA_EMOJI_OPTIONS.map((emojiOption) => <option key={emojiOption} value={emojiOption}>{emojiOption}</option>)}</select></label> : null}
                      {personaCrudFormState.mode === 'edit' ? <label className="text-sm font-medium text-[#d4d4d4]">Custom Emoji<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[#141414] px-3 text-2xl text-[#ededed] outline-none transition focus:border-violet-400" type="text" maxLength="4" value={personaCrudFormState.nextCustomEmoji} onChange={(event) => updatePersonaCrudFormFieldValue('nextCustomEmoji', event.target.value)} /></label> : null}
                      {personaCrudFormState.mode === 'edit' ? <label className="text-sm font-medium text-[#d4d4d4]">Note<input className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[#141414] px-3 text-[#ededed] outline-none transition focus:border-violet-400" type="text" value={personaCrudFormState.nextNote} onChange={(event) => updatePersonaCrudFormFieldValue('nextNote', event.target.value)} /></label> : null}
                      {personaCrudFormState.mode === 'delete_reassign' ? <label className="text-sm font-medium text-[#d4d4d4] sm:col-span-2">Reassign all records to<select className="mt-1 h-11 w-full rounded-2xl border border-white/[0.06] bg-[#141414] px-3 text-[#ededed] outline-none transition focus:border-violet-400" value={personaCrudFormState.reassignToPersonaName} onChange={(event) => updatePersonaCrudFormFieldValue('reassignToPersonaName', event.target.value)}>{reassignablePersonaOptions.map((personaName) => <option key={personaName} value={personaName}>{formatPersonaLabelWithEmoji(personaName, personaEmojiByName)}</option>)}</select></label> : null}
                      {personaCrudFormState.mode === 'delete_reassign' && reassignablePersonaOptions.length === 0 ? <div className="sm:col-span-2 rounded-xl border border-amber-500/40 bg-amber-500/10/80 px-3 py-2 text-xs text-amber-300">No alternate persona exists to reassign records. To delete the default user profile, switch to <span className="font-semibold">Delete Cascade</span>.<button className="inline-flex items-center gap-1 ml-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs font-semibold text-rose-400" type="button" onClick={() => updatePersonaCrudFormFieldValue('mode', 'delete_cascade')}><IconTrash /> Switch to Cascade</button></div> : null}
                      {personaCrudFormState.mode === 'delete_cascade' ? <label className="text-sm font-medium text-rose-400 sm:col-span-2">Type to confirm hard delete<input className="mt-1 h-11 w-full rounded-2xl border border-rose-500/40 bg-rose-500/10/70 px-3 text-[#ededed] outline-none transition focus:border-rose-500" type="text" placeholder={`DELETE ${personaCrudFormState.personaName}`} value={personaCrudFormState.deleteConfirmText} onChange={(event) => updatePersonaCrudFormFieldValue('deleteConfirmText', event.target.value)} /></label> : null}
                    </div>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button className="inline-flex items-center gap-1.5 rounded-2xl border border-white/[0.025] px-4 py-2 text-sm font-semibold text-[#d4d4d4]" type="button" onClick={() => setPersonaCrudFormState(buildInitialPersonaCrudFormState())}><IconX /> Clear Selection</button>
                      <button className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-semibold text-white transition ${personaCrudFormState.mode === 'edit' ? 'bg-violet-500/20 hover:bg-violet-500/30' : 'bg-rose-500/20 hover:bg-rose-500/30'}`} type="submit">{personaCrudFormState.mode === 'edit' ? <><IconCheck /> Save Persona</> : <><IconTrash /> Apply Delete Operation</>}</button>
                    </div>
                  </form>
                ) : (
                  <div className="manage-personas-panel rounded-2xl border border-white/[0.06] bg-[rgba(20,20,20,0.8)] p-4 text-sm text-[#a1a1aa]">Select a persona from the left list to edit or delete with safety controls.</div>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {isProfileTransferModalOpen ? (
        <section className="profile-transfer-modal fixed inset-0 z-[5000] flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Financial Profile Import Export Modal">
          <button className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setIsProfileTransferModalOpen(false)} type="button" aria-label="Close profile transfer modal backdrop" />
          <div className="profile-transfer-shell relative z-[5001] w-full max-w-2xl rounded-3xl border border-white/40 bg-[#141414] p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-[#ededed]">{profileTransferFormState.mode === 'import' ? 'Import Profile' : 'Export Profile'}</h3>
              <button className="rounded-xl border border-white/[0.025] px-3 py-2 text-sm font-semibold text-[#d4d4d4] inline-flex items-center gap-1.5" onClick={() => setIsProfileTransferModalOpen(false)} type="button"><IconX /> Close</button>
            </div>
            <form className="grid grid-cols-1 gap-3" onSubmit={submitImportedProfileJson}>
              <textarea className="min-h-[260px] w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] p-3 font-mono text-xs text-[#ededed] outline-none transition focus:border-indigo-400 focus:bg-[#141414]" value={profileTransferFormState.jsonText} onChange={(event) => updateProfileTransferFormFieldValue('jsonText', event.target.value)} readOnly={profileTransferFormState.mode === 'export'} placeholder={profileTransferFormState.mode === 'import' ? 'Paste profile JSON here...' : ''} />
              {!supabaseAuthUserSummary ? (
                <p className="text-[11px] text-amber-600">Log in as admin to enable server sync.</p>
              ) : (
                <p className="text-[11px] text-emerald-600">Signed in as {supabaseAuthUserSummary.email || supabaseAuthUserSummary.id}.</p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <button className="rounded-2xl border border-white/[0.025] px-4 py-2 text-sm font-semibold text-[#d4d4d4] inline-flex items-center gap-1.5" onClick={() => setIsProfileTransferModalOpen(false)} type="button"><IconX /> Cancel</button>
                {profileTransferFormState.mode === 'export' ? (
                  <React.Fragment>
                    <button className="rounded-2xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => { void copyProfileTransferJsonTextToClipboard() }} type="button">Copy JSON</button>
                    <button className="rounded-2xl border border-white/[0.025] bg-[#0f0f0f] px-4 py-2 text-sm font-semibold text-[#a1a1aa] disabled:cursor-not-allowed disabled:opacity-40" disabled={!supabaseAuthUserSummary || isSupabaseOperationInFlight} onClick={() => { void pushCurrentProfileSnapshotToSupabase() }} type="button">Save to Server</button>
                    {profileDeleteUndoSnapshotJsonText ? (
                      <button className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400" onClick={() => { void restoreDeletedLocalFinancialProfileDataFromUndoSnapshot() }} type="button">Undo Delete</button>
                    ) : null}
                    <button className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-400" onClick={() => { void deleteAllLocalFinancialProfileDataWithUndoSnapshot() }} type="button">Delete Local</button>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <button className="rounded-2xl border border-white/[0.025] bg-[#0f0f0f] px-4 py-2 text-sm font-semibold text-[#a1a1aa] disabled:cursor-not-allowed disabled:opacity-40" disabled={!supabaseAuthUserSummary || isSupabaseOperationInFlight} onClick={() => { void pullProfileSnapshotFromSupabase() }} type="button">Restore from Server</button>
                    <button className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700" type="submit">Import JSON</button>
                  </React.Fragment>
                )}
              </div>
            </form>
          </div>
        </section>
      ) : null}

      {selectedRiskFinding && selectedRiskTemplate ? (
        <section className="fixed inset-0 z-[5000] flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Risk Flag Detail Modal">
          <button className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setSelectedRiskFinding(null)} type="button" aria-label="Close risk detail modal backdrop" />
          <div className="relative z-[5001] w-full max-w-2xl rounded-3xl border border-white/40 bg-[#141414] p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-[#ededed]">Risk Flag Guidance</h3>
              <button className="rounded-xl border border-white/[0.025] px-3 py-2 text-sm font-semibold text-[#d4d4d4] inline-flex items-center gap-1.5" onClick={() => setSelectedRiskFinding(null)} type="button"><IconX /> Close</button>
            </div>
            <div className="space-y-4">
              <article className={`risk-modal-selected rounded-2xl border p-3 ${
                selectedRiskFinding.severity === 'high'
                  ? 'border-rose-500/30 bg-rose-500/10'
                  : (selectedRiskFinding.severity === 'low' ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10')
              }`}>
                <p className={`risk-flag-severity text-xs font-semibold uppercase tracking-[0.12em] ${
                  selectedRiskFinding.severity === 'high'
                    ? 'risk-flag-severity-high'
                    : (selectedRiskFinding.severity === 'low' ? 'risk-flag-severity-low' : 'risk-flag-severity-medium')
                }`}>Selected Risk</p>
                <p className="mt-1 text-sm font-semibold text-[#e0e0e0]">{selectedRiskTemplate.title}</p>
              </article>
              <article className="risk-modal-panel rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#71717a]">What it means</p>
                <p className="mt-1 text-sm text-[#d4d4d4]">{selectedRiskTemplate.meaningText}</p>
              </article>
              <article className="risk-modal-panel rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#71717a]">How it affects personas</p>
                <p className="mt-1 text-sm text-[#d4d4d4]">{selectedRiskTemplate.impactText}</p>
              </article>
              <article className="risk-modal-panel rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#71717a]">How to fix it</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#d4d4d4]">
                  {selectedRiskTemplate.fixChecklist.map((fixItem) => <li key={fixItem}>{fixItem}</li>)}
                </ul>
              </article>
            </div>
          </div>
        </section>
      ) : null}

      {isRecordNotesModalOpen ? (
        <section style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} role="dialog" aria-modal="true" aria-label="Record Notes Modal">
          <button style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} onClick={() => setIsRecordNotesModalOpen(false)} type="button" aria-label="Close record notes modal backdrop" />
          <div style={{ position: 'relative', zIndex: 5001, width: '100%', maxWidth: '480px', overflow: 'hidden', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ height: '3px', background: 'linear-gradient(90deg,#818cf8,#6366f1)' }} />
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a', margin: 0 }}>Record</p>
                  <h3 style={{ marginTop: '2px', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em', color: '#a5b4fc', margin: '2px 0 0' }}>Notes</h3>
                </div>
                <button style={{ flexShrink: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#71717a', cursor: 'pointer' }} onClick={() => setIsRecordNotesModalOpen(false)} type="button" aria-label="Close"><IconX /></button>
              </div>
              <form onSubmit={submitRecordNotesFormChanges}>
                <p style={{ fontSize: '12px', color: '#71717a', marginBottom: '16px' }}>For: <span style={{ fontWeight: 600, color: '#d4d4d4' }}>{recordNotesFormState.recordLabel || 'Record'}</span></p>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }}>
                  Notes
                  <textarea
                    style={{ display: 'block', marginTop: '6px', minHeight: '130px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '10px 12px', fontSize: '13px', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', color: '#ededed', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    value={recordNotesFormState.notes}
                    onChange={(event) => setRecordNotesFormState((previousFormState) => ({ ...previousFormState, notes: event.target.value }))}
                  />
                </label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '16px' }}>
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'none', color: '#a1a1aa', cursor: 'pointer' }} onClick={() => setIsRecordNotesModalOpen(false)} type="button"><IconX /> Cancel</button>
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, borderRadius: '10px', border: 'none', cursor: 'pointer', background: '#6366f1', color: '#fff' }} type="submit"><IconCheck /> Save Notes</button>
                </div>
              </form>
            </div>
          </div>
        </section>
      ) : null}

      {pendingDeleteRecordTarget ? (
        <section style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} role="dialog" aria-modal="true" aria-label="Delete record confirmation">
          <button style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} onClick={() => setPendingDeleteRecordTarget(null)} type="button" aria-label="Close delete confirmation" />
          <div style={{ position: 'relative', zIndex: 5001, width: '100%', maxWidth: '400px', overflow: 'hidden', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ height: '3px', background: 'linear-gradient(90deg,#f43f5e,#fb7185)' }} />
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a', margin: 0 }}>Record</p>
                  <h3 style={{ marginTop: '2px', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em', color: '#fb7185', margin: '2px 0 0' }}>Delete</h3>
                </div>
                <button style={{ flexShrink: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#71717a', cursor: 'pointer' }} onClick={() => setPendingDeleteRecordTarget(null)} type="button" aria-label="Close"><IconX /></button>
              </div>
              <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '20px', lineHeight: '1.5' }}>Delete <span style={{ fontWeight: 600, color: '#d4d4d4' }}>{pendingDeleteRecordTarget.displayLabel}</span>? This action cannot be undone.</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'none', color: '#a1a1aa', cursor: 'pointer' }} onClick={() => setPendingDeleteRecordTarget(null)} type="button"><IconX /> Cancel</button>
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, borderRadius: '10px', border: 'none', cursor: 'pointer', background: '#f43f5e', color: '#fff' }} onClick={() => { void deleteRecordFromCollectionByCollectionNameAndId(pendingDeleteRecordTarget.collectionName, String(pendingDeleteRecordTarget.recordItem.id ?? '')); setPendingDeleteRecordTarget(null) }} type="button"><IconTrash /> Delete Record</button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {isLoginModalOpen ? (
        <section className="fixed inset-0 z-[5000] flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Admin Login Modal">
          <button className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setIsLoginModalOpen(false)} type="button" aria-label="Close login modal backdrop" />
          <div className="relative z-[5001] w-full max-w-sm rounded-3xl border border-white/40 bg-[#141414] p-4 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-[#ededed]">{supabaseAuthUserSummary ? 'Admin Session' : 'Admin Login'}</h3>
              <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.025] px-3 py-2 text-sm font-semibold text-[#d4d4d4]" onClick={() => setIsLoginModalOpen(false)} type="button"><IconX /> Close</button>
            </div>
            {supabaseAuthUserSummary ? (
              <div className="space-y-4">
                <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">Signed in as <span className="font-semibold">{supabaseAuthUserSummary.email || supabaseAuthUserSummary.id}</span>.</p>
                <div className="flex justify-end gap-2">
                  <button className="rounded-2xl border border-white/[0.025] px-4 py-2 text-sm font-semibold text-[#d4d4d4]" onClick={() => setIsLoginModalOpen(false)} type="button">Close</button>
                  <button className="inline-flex items-center gap-1.5 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40" disabled={isLoginOperationInFlight} onClick={() => void submitAdminLogoutFromModal()} type="button"><IconLogOut /> Sign Out</button>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={(e) => void submitAdminLoginFromModal(e)}>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#71717a]">Admin Password</span>
                  <div className="relative mt-2">
                    <input
                      autoFocus
                      className="h-11 w-full rounded-2xl border border-white/[0.06] bg-[rgba(15,15,15,0.8)] text-[#ededed] outline-none transition focus:border-indigo-400 focus:bg-[#141414]"
                      style={{ paddingLeft: '14px', paddingRight: '44px' }}
                      type={isLoginPasswordVisible ? 'text' : 'password'}
                      value={loginPasswordInputValue}
                      onChange={(e) => setLoginPasswordInputValue(e.target.value)}
                      disabled={isLoginOperationInFlight}
                    />
                    <button
                      className="absolute flex h-8 w-8 items-center justify-center rounded-xl text-[#52525b] transition hover:bg-white/[0.07] hover:text-[#a1a1aa]"
                      style={{ right: '6px', top: '50%', transform: 'translateY(-50%)' }}
                      type="button"
                      tabIndex={-1}
                      onClick={() => setIsLoginPasswordVisible((v) => !v)}
                      aria-label={isLoginPasswordVisible ? 'Hide password' : 'Show password'}
                    >
                      {isLoginPasswordVisible ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </label>
                {loginStatusMessage ? (
                  <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{loginStatusMessage}</p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <button className="rounded-2xl border border-white/[0.025] px-4 py-2 text-sm font-semibold text-[#d4d4d4]" onClick={() => setIsLoginModalOpen(false)} type="button">Cancel</button>
                  <button className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40" disabled={isLoginOperationInFlight} type="submit"><IconLogIn /> {isLoginOperationInFlight ? 'Signing in...' : 'Sign In'}</button>
                </div>
              </form>
            )}
          </div>
        </section>
      ) : null}

      {isEditRecordModalOpen ? (() => {
        const col = editRecordFormState.collectionName
        const isStandard = col === 'income' || col === 'expenses' || col === 'assets'
        const isDebtLike = col === 'debts' || col === 'credit' || col === 'loans'
        const isCreditCard = col === 'creditCards'
        const isAssetHolding = col === 'assetHoldings'
        const accentColor = col === 'income' ? '#34d399' : col === 'expenses' ? '#fb7185' : isDebtLike ? '#a855f7' : isCreditCard ? '#38bdf8' : '#fbbf24'
        const accentBg = col === 'income' ? 'rgba(52,211,153,0.15)' : col === 'expenses' ? 'rgba(251,113,133,0.15)' : isDebtLike ? 'rgba(168,85,247,0.15)' : isCreditCard ? 'rgba(56,189,248,0.15)' : 'rgba(251,191,36,0.15)'
        const collectionLabel = col === 'income' ? 'Income' : col === 'expenses' ? 'Expense' : col === 'assets' ? 'Savings' : col === 'debts' ? 'Debt' : col === 'loans' ? 'Loan' : col === 'credit' ? 'Credit Line' : col === 'creditCards' ? 'Credit Card' : col === 'assetHoldings' ? 'Asset' : 'Record'
        const lbl = { display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#71717a' }
        const inp = { display: 'block', marginTop: '6px', height: '40px', width: '100%', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,15,15,0.8)', padding: '0 12px', fontSize: '13px', color: '#ededed', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }
        const sel = { ...inp, cursor: 'pointer' }
        return (
          <section style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} role="dialog" aria-modal="true" aria-label="Edit Record Modal">
            <button style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }} onClick={() => setIsEditRecordModalOpen(false)} type="button" aria-label="Close edit record modal backdrop" />
            <div style={{ position: 'relative', zIndex: 5001, width: '100%', maxWidth: '560px', overflow: 'hidden', borderRadius: '24px', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid ${accentBg}` }}>
              <div style={{ height: '3px', background: `linear-gradient(90deg,${accentColor},${accentColor}88)` }} />
              <div style={{ padding: '20px 24px 24px', maxHeight: 'calc(85vh - 3px)', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#71717a', margin: 0 }}>Edit</p>
                    <h3 style={{ marginTop: '2px', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em', color: accentColor, margin: '2px 0 0' }}>{collectionLabel}</h3>
                  </div>
                  <button style={{ flexShrink: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#71717a', cursor: 'pointer' }} onClick={() => setIsEditRecordModalOpen(false)} type="button" aria-label="Close"><IconX /></button>
                </div>
                <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} onSubmit={submitEditedRecordChanges}>
                  <label style={lbl}>Person
                    <select style={sel} value={editRecordFormState.person} onChange={(e) => updateEditRecordFormFieldValue('person', e.target.value)}>
                      {personaSelectOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      <option value="__custom__">Custom person...</option>
                    </select>
                  </label>
                  {editRecordFormState.person === '__custom__' ? (
                    <label style={lbl}>Custom Person<input style={inp} type="text" value={editRecordFormState.customPerson} onChange={(e) => updateEditRecordFormFieldValue('customPerson', e.target.value)} /></label>
                  ) : null}
                  {(isStandard || isDebtLike) ? (
                    <label style={lbl}>Category
                      <select style={sel} value={editRecordFormState.category} onChange={(e) => updateEditRecordFormFieldValue('category', e.target.value)}>
                        <option value="">Select a category</option>
                        {COMMON_BUDGET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        <option value="__custom__">Custom category...</option>
                      </select>
                    </label>
                  ) : null}
                  {(isStandard || isDebtLike) && editRecordFormState.category === '__custom__' ? (
                    <label style={lbl}>Custom Category<input style={inp} type="text" value={editRecordFormState.customCategory} onChange={(e) => updateEditRecordFormFieldValue('customCategory', e.target.value)} /></label>
                  ) : null}
                  {(isStandard || isCreditCard || isAssetHolding) ? (
                    <label style={lbl}>Item<input style={inp} type="text" value={editRecordFormState.item} onChange={(e) => updateEditRecordFormFieldValue('item', e.target.value)} /></label>
                  ) : null}
                  {!isAssetHolding ? (
                    <label style={lbl}>Amount / Value<input style={inp} type="number" step="0.01" value={editRecordFormState.amount} onChange={(e) => updateEditRecordFormFieldValue('amount', e.target.value)} /></label>
                  ) : null}
                  {isAssetHolding ? (
                    <label style={lbl}>Value Owed<input style={inp} type="number" min="0" step="0.01" value={editRecordFormState.assetValueOwed} onChange={(e) => updateEditRecordFormFieldValue('assetValueOwed', e.target.value)} /></label>
                  ) : null}
                  {isAssetHolding ? (
                    <label style={lbl}>Market Value<input style={inp} type="number" min="0" step="0.01" value={editRecordFormState.assetMarketValue} onChange={(e) => updateEditRecordFormFieldValue('assetMarketValue', e.target.value)} /></label>
                  ) : null}
                  {isDebtLike ? (
                    <label style={lbl}>Minimum Payment<input style={inp} type="number" step="0.01" value={editRecordFormState.minimumPayment} onChange={(e) => updateEditRecordFormFieldValue('minimumPayment', e.target.value)} /></label>
                  ) : null}
                  {isDebtLike ? (
                    <label style={lbl}>Loan Start Date<input style={inp} type="date" value={editRecordFormState.loanStartDate} onChange={(e) => updateEditRecordFormFieldValue('loanStartDate', e.target.value)} /></label>
                  ) : null}
                  {isDebtLike ? (
                    <label style={lbl}>Remaining Payments<input style={inp} type="number" min="0" step="1" value={editRecordFormState.remainingPayments} onChange={(e) => updateEditRecordFormFieldValue('remainingPayments', e.target.value)} /></label>
                  ) : null}
                  {(col === 'debts' || col === 'loans') ? (
                    <label style={lbl}>Collateral Asset<input style={inp} type="text" value={editRecordFormState.collateralAssetName} onChange={(e) => updateEditRecordFormFieldValue('collateralAssetName', e.target.value)} /></label>
                  ) : null}
                  {(col === 'debts' || col === 'loans') ? (
                    <label style={lbl}>Collateral Market Value<input style={inp} type="number" min="0" step="0.01" value={editRecordFormState.collateralAssetMarketValue} onChange={(e) => updateEditRecordFormFieldValue('collateralAssetMarketValue', e.target.value)} /></label>
                  ) : null}
                  {(isDebtLike || isCreditCard) ? (
                    <label style={lbl}>Interest Rate (%)<input style={inp} type="number" min="0" step="0.01" value={editRecordFormState.interestRatePercent} onChange={(e) => updateEditRecordFormFieldValue('interestRatePercent', e.target.value)} /></label>
                  ) : null}
                  {col === 'credit' ? (
                    <label style={lbl}>Credit Limit<input style={inp} type="number" step="0.01" value={editRecordFormState.creditLimit} onChange={(e) => updateEditRecordFormFieldValue('creditLimit', e.target.value)} /></label>
                  ) : null}
                  {isCreditCard ? (
                    <>
                      <label style={lbl}>Max Capacity<input style={inp} type="number" step="0.01" value={editRecordFormState.maxCapacity} onChange={(e) => updateEditRecordFormFieldValue('maxCapacity', e.target.value)} /></label>
                      <label style={lbl}>Current Balance<input style={inp} type="number" step="0.01" value={editRecordFormState.currentBalance} onChange={(e) => updateEditRecordFormFieldValue('currentBalance', e.target.value)} /></label>
                      <label style={lbl}>Minimum Payment<input style={inp} type="number" step="0.01" value={editRecordFormState.minimumPayment} onChange={(e) => updateEditRecordFormFieldValue('minimumPayment', e.target.value)} /></label>
                      <label style={lbl}>Monthly Payment<input style={inp} type="number" step="0.01" value={editRecordFormState.monthlyPayment} onChange={(e) => updateEditRecordFormFieldValue('monthlyPayment', e.target.value)} /></label>
                    </>
                  ) : null}
                  <label style={lbl}>Date<input style={inp} type="date" value={editRecordFormState.date} onChange={(e) => updateEditRecordFormFieldValue('date', e.target.value)} /></label>
                  <label style={{ ...lbl, gridColumn: '1 / -1' }}>Description<input style={inp} type="text" value={editRecordFormState.description} onChange={(e) => updateEditRecordFormFieldValue('description', e.target.value)} /></label>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '4px' }}>
                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', background: 'none', color: '#a1a1aa', cursor: 'pointer' }} onClick={() => setIsEditRecordModalOpen(false)} type="button"><IconX /> Cancel</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isAssetHolding ? (
                        <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '10px', border: '1px solid rgba(251,113,133,0.3)', background: 'rgba(251,113,133,0.1)', color: '#fb7185', cursor: 'pointer' }} onClick={() => { void deleteRecordFromCollectionByCollectionNameAndId('assetHoldings', editRecordFormState.recordId); setIsEditRecordModalOpen(false) }} type="button"><IconTrash /> Delete Asset</button>
                      ) : null}
                      <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, borderRadius: '10px', border: 'none', cursor: 'pointer', background: accentColor, color: col === 'income' ? '#000' : '#fff' }} type="submit"><IconCheck /> Save Changes</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </section>
        )
      })() : null}
      {syncNoticeState.message ? (
        <section aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[5200]">
          <div
            className={`rounded-xl border px-3 py-2 text-xs font-medium shadow-lg backdrop-blur ${
              syncNoticeState.tone === SYNC_NOTICE_TONE_SUCCESS
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
            }`}
          >
            {syncNoticeState.message}
          </div>
        </section>
      ) : null}
    </main>
  )
}







