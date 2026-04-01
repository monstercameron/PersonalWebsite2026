# AGENTS.md

Purpose
- Agent-facing repo contract.
- Describes current structure, style, naming, error handling, and placement rules.
- Preserve these defaults unless explicitly asked to change them.

Repo
- Monorepo workspaces:
  - `web/` = React + Vite frontend
  - `api/` = Node + Hono backend
- Root support dirs:
  - `scripts/` = dev/build helpers
  - `ops/` = deployment + nginx
  - `logs/` = runtime logs
- Root files:
  - `package.json` = workspace entrypoint + scripts
  - `README.md` = public project summary
  - `.env` = local runtime config, gitignored

Layout
- Frontend:
  - `web/src/main.jsx` = React bootstrap + top-level error boundary
  - `web/src/ui.jsx` = main portfolio app, route selection, most page UI
  - `web/src/ui.css` = main site styles
  - `web/src/core.pure.js` = pure main-site helpers
  - `web/src/core.impure.js` = browser/network side effects for main site
- Budget tool:
  - `web/src/budget/entry.jsx` = lazy entry
  - `web/src/budget/App.jsx` = budget UI shell + feature composition
  - `web/src/budget/budget.css` = budget styles
  - `web/src/budget/core/pure.js` = calculations + pure business logic
  - `web/src/budget/core/impure.js` = persistence, sync, browser APIs, worker wrappers
  - `web/src/budget/workers/risk-worker.js` = workerized risk analysis
- Static:
  - `web/public/` = images, resume PDF, favicon, robots.txt
- Backend:
  - `api/src/server.js` = boot, routes, auth, rate limiting, cron, static serving
  - `api/src/app.pure.js` = validation + public error shaping
  - `api/src/app.impure.js` = SQLite, cache, OpenAI, RSS, filesystem
  - `api/src/app.impure.test.js` = current automated coverage
  - `api/src/cron-anime-release-check.js` = cron entrypoint
  - `api/content/context.md` = extra backend content/context

Design philosophy
- Names carry documentation load.
  - Prefer explicit names over explanatory comments.
  - Names should reveal behavior, purity/impurity, external system touched, and validation/failure role.
  - Examples:
    - `buildDefaultBudgetCollectionsStateForLocalFirstUsage`
    - `computeFinancialRiskFindingsUsingBackgroundWorkerWhenAvailable`
    - `validateRequiredGoalRecordFieldsBeforePersistence`
- Errors are explicit, not implied.
  - Existing patterns include `{ value, err }`, `[value, err]`, validation-returned errors, and structured IO failure wrappers.
  - Optimize for no undefined behavior, no hidden failure paths, visible call-site failures, intentional recovery.
- Separate pure logic from side effects.
  - `*.pure.*` = deterministic logic, validation, transformation, calculations.
  - `*.impure.*` = IO, persistence, network, browser APIs, workers, runtime effects.
  - Pure examples: parsing, validation, derived UI state, calculations, shaping.
  - Impure examples: `fetch`, `localStorage`, IndexedDB, SQLite, filesystem, auth session handling, worker creation, OpenAI calls.
- Predictability beats cleverness.
  - Prefer direct control flow, defensive guards, named constants, explicit branching, stable data shapes.
  - Do not compress clear multi-step logic into dense code unless it is obviously easier to read.
- Runtime boundaries matter.
  - Backend is production runtime, not thin glue: serves SPA/static assets, handles blog auth, rate limiting, cron, RSS, budget snapshot persistence.
  - Frontend is also production runtime, not thin marketing shell: includes substantial local-first budget app with workers and sync flows.

Naming contract
- Use long, explicit names for exported functions and boundary-crossing helpers.
- Primary function grammar:
  - `VerbObject`
  - `VerbObjectFromSource`
  - `VerbObjectToTarget`
  - `VerbObjectIntoTarget`
  - `VerbObjectUsingMechanism`
  - `VerbObjectForScope`
- Interpretation:
  - `Verb` = what happens
  - `Object` = primary thing acted on
  - `FromSource` = read source
  - `ToTarget` / `IntoTarget` = write or persistence target
  - `UsingMechanism` = implementation path
  - `ForScope` = user/context scope
- Canonical examples:
  - `pushCompleteFinancialProfileIntoSupabaseForAuthenticatedUser`
  - `copyTextToClipboardUsingBrowserApi`
  - `loadBudgetCollectionsStateFromLocalStorageCache`
- Direction/context suffix families:
  - `From...`
  - `To...`
  - `Into...`
  - `Using...`
  - `For...`
- More examples:
  - `readPromptHistoryFromDatabase`
  - `writeAuditEntryToLogFile`
  - `persistBudgetProfileIntoSQLite`
- Value naming should encode stage/certainty:
  - `rawPromptText`
  - `parsedPayload`
  - `normalizedEmail`
  - `validatedBlogBody`
  - `derivedMonthlySavingsTarget`
  - `cachedProfileSnapshot`
  - `nextFormState`
- Preferred stage words:
  - `raw`
  - `parsed`
  - `normalized`
  - `validated`
  - `derived`
  - `cached`
  - `persisted`
  - `next`
- Boolean naming:
  - prefixes: `is`, `has`, `can`, `should`, `did`
  - examples:
    - `isLoginModalOpen`
    - `hasSupportedCollectionsShape`
    - `canTrustProxyHeaders`
    - `shouldRefreshCache`
- React naming:
  - handlers: `handleSubjectAction`
  - callback props: `onSubjectAction`
  - refs: `somethingRef`
  - broad state objects: `somethingState`
  - replacement values: `nextSomethingState`
  - examples:
    - `handleResumeDownload`
    - `onFieldChange`
    - `imageInputRef`
    - `syncStatusState`
    - `nextFormState`
- Result naming:
  - object-style modules:
    - `thingRes`
    - `thingRes.value`
    - `thingRes.err`
  - tuple-style modules:
    - `[thingValue, thingError]`
  - keep `error` for actual error objects and `message` for human-readable text
- Constraints:
  - Prefer explicit exported names.
  - Keep local names shorter when scope is obvious.
  - Do not stack multiple verbs unless function truly performs multiple distinct actions.
  - Avoid generic placeholders like `data`, `obj`, `thing`, `stuff`, `temp` unless no tighter name exists.
  - Do not shorten names so much that stage or side effect disappears.

Error naming + details contract
- Error names should be long, explicit, and mechanically consistent.
- Goal: caller should infer failure category, whether it came from a condition or caught runtime failure, and what system boundary was involved.
- Error variable naming:
  - `validationApplicationErrorForCondition`
  - `authenticationApplicationErrorForCondition`
  - `authorizationApplicationErrorForCondition`
  - `networkApplicationErrorFromFailureSource`
  - `databaseApplicationErrorFromFailureSource`
  - `storageApplicationErrorFromFailureSource`
  - `browserApiApplicationErrorFromFailureSource`
  - `internalApplicationErrorFromFailureSource`
- Examples:
  - `validationApplicationErrorForMissingPromptField`
  - `validationApplicationErrorForMalformedBudgetCollectionsShape`
  - `authenticationApplicationErrorForMissingAdminPassword`
  - `authorizationApplicationErrorForInvalidAdminSession`
  - `networkApplicationErrorFromFetchFailure`
  - `storageApplicationErrorFromLocalStorageWriteFailure`
  - `databaseApplicationErrorFromSqliteExecutionFailure`
  - `browserApiApplicationErrorFromClipboardWriteFailure`
- Error builder naming:
  - `build<ErrorType>ApplicationErrorFor<Condition>`
  - `build<ErrorType>ApplicationErrorFrom<FailureSource>`
  - `mapUnknown<FailureSource>Into<ErrorType>ApplicationError`
- Examples:
  - `buildValidationApplicationErrorForMissingPromptField`
  - `buildValidationApplicationErrorForMalformedBudgetCollectionsShape`
  - `buildAuthenticationApplicationErrorForMissingAdminPassword`
  - `buildAuthorizationApplicationErrorForInvalidAdminSession`
  - `buildNetworkApplicationErrorFromFetchFailure`
  - `buildStorageApplicationErrorFromLocalStorageWriteFailure`
  - `buildDatabaseApplicationErrorFromSqliteExecutionFailure`
  - `buildBrowserApiApplicationErrorFromDocumentAccessFailure`
  - `mapUnknownRuntimeFailureIntoInternalApplicationError`
- Top-level error shape stays compact:
```ts
type ApplicationError = {
  kind: ApplicationErrorKind
  message: string
  recoverable: boolean
  details?: ApplicationErrorDetails
}
```
- Recommended `kind` values:
  - `VALIDATION`
  - `AUTHENTICATION`
  - `AUTHORIZATION`
  - `NETWORK`
  - `DATABASE`
  - `STORAGE`
  - `BROWSER_API`
  - `CONFIGURATION`
  - `WORKER`
  - `INTERNAL`
- Keep `kind` values short/stable. Let identifiers around them be long/descriptive.
- Error details shape:
```ts
type ApplicationErrorDetails = {
  parentFunctionUseHint?: string
  errorDetailsHint?: string
  errorSeverityHint?: 'low' | 'medium' | 'high' | 'critical'
  applicationErrorCode?: string
  underlyingFailureMessage?: string
  underlyingFailureName?: string
  relevantRuntimeContext?: Record<string, unknown>
}
```
- Details fields mean:
  - `parentFunctionUseHint` = what parent function was trying to do
  - `errorDetailsHint` = what specifically failed
  - `errorSeverityHint` = operational seriousness
  - `applicationErrorCode` = stable machine subcode
  - `underlyingFailureMessage` = raw failure message
  - `underlyingFailureName` = raw error name/type
  - `relevantRuntimeContext` = structured debug context
- Use `details` to improve debugging without full repo-wide error redesign.
- Good `relevantRuntimeContext` content:
  - request targets
  - storage keys
  - env var names
  - collection names
  - authenticated user scope
  - operation names
  - payload expectations
- Do not store large payloads or sensitive secrets in `relevantRuntimeContext`.
- Example:
```ts
const networkApplicationErrorFromFetchFailure = {
  kind: 'NETWORK',
  message: 'Failed to fetch remote budget profile.',
  recoverable: true,
  details: {
    parentFunctionUseHint: 'Used to load the complete budget collections state from the remote profile API.',
    errorDetailsHint: 'The remote profile request failed before a valid response body was returned.',
    errorSeverityHint: 'high',
    applicationErrorCode: 'REMOTE_BUDGET_PROFILE_FETCH_FAILURE',
    underlyingFailureMessage: fetchFailure instanceof Error ? fetchFailure.message : String(fetchFailure),
    underlyingFailureName: fetchFailure instanceof Error ? fetchFailure.name : 'UnknownFailure',
    relevantRuntimeContext: {
      requestUrl,
      httpMethod: 'GET',
      expectedPayloadType: 'budget profile json'
    }
  }
}
```
- Error rules:
  - Do not return failure as bare `null` without an accompanying error object.
  - Do not throw raw strings.
  - Do not swallow failures silently.
  - Use long, explicit error variable/helper names.
  - Prefer stable top-level `kind` values plus richer `details`.
  - Add debugging hints in `details` when crossing IO, auth, browser, worker, or storage boundaries.

Editing rules
- Preserve:
  - descriptive identifiers instead of comments for ordinary logic
  - comments only for non-obvious invariants, external constraints, or why a strange rule exists
  - explicit error handling for IO/auth/persistence/parsing/network
  - pure/impure split
  - obvious side-effect boundaries at call sites
- Avoid:
  - collapsing explicit result handling into unchecked nullable flows
  - broad catch-and-ignore behavior
  - mixing new IO into pure modules
  - shortening names until intent becomes ambiguous
  - magic control flow that depends on unstated assumptions

Current style tensions
- Large files:
  - `web/src/budget/App.jsx`
  - `web/src/ui.jsx`
  - `api/src/server.js`
  - `api/src/app.impure.js`
  - Prefer coherent extraction when touching these areas if control flow stays clear.
- Mixed result conventions:
  - `{ value, err }`
  - `[value, err]`
  - Do not normalize repo-wide unless asked; do not make inconsistency worse; follow local file convention.
- Verbosity vs readability:
  - Verbosity is acceptable.
  - Unreadable verbosity is not.
  - Aim for explicit names, linear logic, scan-friendly modules.

Build + validation reality
- Root scripts:
  - `npm run dev`
  - `npm run build`
  - `npm run lint`
  - `npm run test`
- Current repo reality at this snapshot:
  - root build works
  - API tests exist and pass
  - frontend test files are absent
  - ESLint is installed but no active config file is present
- Verify assumptions against current repo state; do not assume every declared script is healthy.

Where to put new code
- Main site pure helper: `web/src/core.pure.js`
- Main site browser/network effect: `web/src/core.impure.js`
- Budget pure logic: `web/src/budget/core/pure.js`
- Budget impure logic: `web/src/budget/core/impure.js`
- API validation/request-shape logic: `api/src/app.pure.js`
- API persistence/integration logic: `api/src/app.impure.js`
- API route wiring/middleware/runtime boot: `api/src/server.js`
- If a feature crosses these boundaries, prefer a new focused module over growing an existing catch-all file.

Summary
- Optimize for:
  - explicit names
  - explicit error handling
  - deterministic behavior
  - clear pure/impure boundaries
  - practical maintainability
- Do not optimize for:
  - shortest possible code
  - implicit behavior
  - clever abstractions with unclear failure modes
  - comment-heavy explanations of logic names can already carry
