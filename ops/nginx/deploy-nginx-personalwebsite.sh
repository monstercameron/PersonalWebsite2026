#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_SOURCE_CONFIG="${SCRIPT_DIR}/personalwebsite-www-reader.conf.example"
TARGET_CONFIG="${TARGET_CONFIG:-/etc/nginx/sites-available/personalwebsite}"
TARGET_SYMLINK="${TARGET_SYMLINK:-/etc/nginx/sites-enabled/personalwebsite}"
BACKUP_DIR="${BACKUP_DIR:-/etc/nginx/sites-available/backups}"
NGINX_BIN="${NGINX_BIN:-nginx}"
SYSTEMCTL_BIN="${SYSTEMCTL_BIN:-systemctl}"
SUDO_BIN="${SUDO_BIN:-sudo}"
WWW_HOST="${WWW_HOST:-www.earlcameron.com}"
READER_HOST="${READER_HOST:-reader.earlcameron.com}"
LOCAL_TLS_IP="${LOCAL_TLS_IP:-127.0.0.1}"
API_HEALTH_PATH="${API_HEALTH_PATH:-/api/health}"
MAIN_EXPECTED_CODE="${MAIN_EXPECTED_CODE:-200}"
API_EXPECTED_CODE="${API_EXPECTED_CODE:-200}"
READER_EXPECTED_CODE="${READER_EXPECTED_CODE:-200}"
TEST_READER="${TEST_READER:-1}"
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-1}"
PRECHECK_UPSTREAMS="${PRECHECK_UPSTREAMS:-1}"
REQUIRE_HOST_ASSERTS="${REQUIRE_HOST_ASSERTS:-1}"
VERIFY_REDIRECTS="${VERIFY_REDIRECTS:-1}"
UPSTREAM_MAIN_URL="${UPSTREAM_MAIN_URL:-http://127.0.0.1:8081${API_HEALTH_PATH}}"
UPSTREAM_READER_URL="${UPSTREAM_READER_URL:-http://127.0.0.1:3001/}"
SOURCE_CONFIG="${1:-$DEFAULT_SOURCE_CONFIG}"

MSG_INFO="[nginx-deploy]"
MSG_OK="[nginx-deploy] OK:"
ERR_MISSING_SOURCE="Source nginx config file not found"
ERR_NGINX_TEST_FAILED="nginx config test failed; restore the backup manually if needed"
ERR_MAIN_TEST_FAILED="main site HTTPS test failed"
ERR_API_TEST_FAILED="API health proxy test failed"
ERR_READER_TEST_FAILED="reader HTTPS test failed"
ERR_SYMLINK_CONFLICT="Target symlink path exists but is not a symlink"
ERR_INVALID_CONFIG="Source nginx config failed sanity checks"
ERR_BASELINE_NGINX_TEST_FAILED="Current nginx config is already invalid before deployment"
ERR_ROLLBACK_FAILED="Automatic rollback failed; restore nginx config manually and run nginx -t"
ERR_RELOAD_FAILED="nginx reload failed"
ERR_SERVICE_INACTIVE="nginx service is not active after reload"
ERR_UPSTREAM_UNREACHABLE="upstream precheck failed"
ERR_REDIRECT_TEST_FAILED="HTTP to HTTPS redirect test failed"

PHASE="init"
BACKUP_PATH=""
DEPLOY_INSTALLED="0"
DEPLOY_RELOADED="0"
HAD_EXISTING_TARGET="0"

log_info() {
  printf '%s %s\n' "$MSG_INFO" "$1"
}

log_warn() {
  printf '%s WARN: %s\n' "$MSG_INFO" "$1"
}

log_err() {
  printf '%s ERROR: %s\n' "$MSG_INFO" "$1" >&2
}

log_ok() {
  printf '%s %s\n' "$MSG_OK" "$1"
}

die() {
  log_err "$1"
  exit 1
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    die "required command not found: $cmd"
  fi
}

run_root() {
  if [[ "${EUID}" -eq 0 ]]; then
    "$@"
    return
  fi
  "$SUDO_BIN" "$@"
}

on_err_trap() {
  local exit_code="$1"
  local line_no="$2"
  log_err "script failed at phase='${PHASE}' line=${line_no} exit_code=${exit_code}"
  if [[ "${ROLLBACK_ON_FAILURE}" == "1" ]]; then
    attempt_rollback "trap error at line ${line_no}"
  fi
  exit "$exit_code"
}

trap 'on_err_trap $? $LINENO' ERR

assert_file_readable() {
  local file_path="$1"
  [[ -f "$file_path" ]] || die "${ERR_MISSING_SOURCE}: $file_path"
  [[ -r "$file_path" ]] || die "source config is not readable: $file_path"
}

assert_parent_dir_exists() {
  local path="$1"
  local parent_dir
  parent_dir="$(dirname "$path")"
  [[ -d "$parent_dir" ]] || die "required parent directory missing: ${parent_dir}"
}

assert_config_contains() {
  local file_path="$1"
  local needle="$2"
  local label="$3"
  if ! grep -Fq "$needle" "$file_path"; then
    die "${ERR_INVALID_CONFIG}: missing ${label} (${needle})"
  fi
}

assert_config_sanity() {
  local file_path="$1"
  if [[ "${REQUIRE_HOST_ASSERTS}" != "1" ]]; then
    log_info "config host assertions disabled (REQUIRE_HOST_ASSERTS=${REQUIRE_HOST_ASSERTS})"
    return
  fi
  assert_config_contains "$file_path" "server_name ${WWW_HOST};" "www server_name"
  assert_config_contains "$file_path" "server_name ${READER_HOST};" "reader server_name"
  assert_config_contains "$file_path" "upstream personalwebsite_app" "main upstream block"
  assert_config_contains "$file_path" "server 127.0.0.1:8081;" "main upstream port 8081"
  assert_config_contains "$file_path" "proxy_pass http://personalwebsite_app" "main proxy_pass upstream alias"
  if [[ "${TEST_READER}" == "1" ]]; then
    assert_config_contains "$file_path" "upstream reader_app" "reader upstream block"
    assert_config_contains "$file_path" "server 127.0.0.1:3001;" "reader upstream port 3001"
    assert_config_contains "$file_path" "proxy_pass http://reader_app" "reader proxy_pass upstream alias"
  fi
}

ensure_target_symlink() {
  if run_root test -L "$TARGET_SYMLINK"; then
    local current_target
    current_target="$(run_root readlink "$TARGET_SYMLINK" || true)"
    if [[ -n "${current_target}" && "${current_target}" != "${TARGET_CONFIG}" ]]; then
      log_warn "target symlink points to ${current_target}; replacing with ${TARGET_CONFIG}"
      run_root rm -f "$TARGET_SYMLINK"
      run_root ln -s "$TARGET_CONFIG" "$TARGET_SYMLINK"
    fi
    return
  fi

  if run_root test -e "$TARGET_SYMLINK"; then
    die "${ERR_SYMLINK_CONFLICT}: ${TARGET_SYMLINK}"
  fi

  log_info "creating symlink ${TARGET_SYMLINK} -> ${TARGET_CONFIG}"
  run_root ln -s "$TARGET_CONFIG" "$TARGET_SYMLINK"
}

assert_nginx_baseline_valid() {
  PHASE="baseline_nginx_test"
  log_info "verifying current nginx config is valid before deploy"
  if ! run_root "$NGINX_BIN" -t >/dev/null 2>&1; then
    die "${ERR_BASELINE_NGINX_TEST_FAILED}. Fix existing nginx config before running this deploy script."
  fi
  log_ok "current nginx config validates"
}

http_code_or_fail() {
  local url="$1"
  local host="$2"
  local port="${3:-443}"
  local code
  code="$(
    curl -sS -o /dev/null -w '%{http_code}' \
      --max-time 10 \
      --connect-timeout 5 \
      --resolve "${host}:${port}:${LOCAL_TLS_IP}" \
      "$url"
  )"
  printf '%s' "$code"
}

http_code_plain_or_fail() {
  local url="$1"
  local code
  code="$(
    curl -sS -o /dev/null -w '%{http_code}' \
      --max-time 10 \
      --connect-timeout 5 \
      "$url"
  )"
  printf '%s' "$code"
}

assert_not_code_000() {
  local code="$1"
  local label="$2"
  [[ "$code" != "000" ]] || die "${ERR_UPSTREAM_UNREACHABLE}: ${label} returned curl code 000 (connect failure/timeout)"
}

precheck_upstreams() {
  local main_upstream_code reader_upstream_code
  if [[ "${PRECHECK_UPSTREAMS}" != "1" ]]; then
    log_info "upstream prechecks disabled (PRECHECK_UPSTREAMS=${PRECHECK_UPSTREAMS})"
    return
  fi

  PHASE="precheck_upstreams"
  log_info "prechecking upstream availability before nginx reload"

  main_upstream_code="$(http_code_plain_or_fail "$UPSTREAM_MAIN_URL")"
  assert_not_code_000 "$main_upstream_code" "main upstream ${UPSTREAM_MAIN_URL}"
  log_ok "main upstream reachable (${UPSTREAM_MAIN_URL}) code=${main_upstream_code}"

  if [[ "${TEST_READER}" == "1" ]]; then
    reader_upstream_code="$(http_code_plain_or_fail "$UPSTREAM_READER_URL")"
    assert_not_code_000 "$reader_upstream_code" "reader upstream ${UPSTREAM_READER_URL}"
    log_ok "reader upstream reachable (${UPSTREAM_READER_URL}) code=${reader_upstream_code}"
  fi
}

attempt_rollback() {
  local reason="${1:-unknown}"
  if [[ "${ROLLBACK_ON_FAILURE}" != "1" ]]; then
    log_warn "rollback disabled; reason=${reason}"
    return
  fi
  if [[ "${DEPLOY_INSTALLED}" != "1" ]]; then
    return
  fi
  if [[ "${HAD_EXISTING_TARGET}" != "1" ]]; then
    log_warn "no previous target config existed; rollback cannot restore prior file (reason=${reason})"
    return
  fi
  if [[ -z "${BACKUP_PATH}" ]]; then
    log_warn "backup path not set; rollback skipped (reason=${reason})"
    return
  fi
  if ! run_root test -f "$BACKUP_PATH"; then
    log_warn "backup file missing; rollback skipped (reason=${reason}, backup=${BACKUP_PATH})"
    return
  fi

  log_warn "attempting rollback from backup due to: ${reason}"
  run_root cp "$BACKUP_PATH" "$TARGET_CONFIG" || die "$ERR_ROLLBACK_FAILED"
  if ! run_root "$NGINX_BIN" -t; then
    die "$ERR_ROLLBACK_FAILED"
  fi
  run_root "$SYSTEMCTL_BIN" reload nginx || die "$ERR_ROLLBACK_FAILED"
  log_ok "rollback restored previous nginx config"
}

assert_service_active() {
  PHASE="service_health"
  if ! run_root "$SYSTEMCTL_BIN" is-active --quiet nginx; then
    die "${ERR_SERVICE_INACTIVE}. Check: sudo systemctl status nginx"
  fi
  log_ok "nginx service is active"
}

assert_redirect() {
  local url="$1"
  local host="$2"
  local expected_code="${3:-301}"
  local code
  code="$(http_code_or_fail "$url" "$host" 80)"
  if [[ "$code" != "$expected_code" ]]; then
    die "${ERR_REDIRECT_TEST_FAILED} (${url}) expected ${expected_code}, got ${code}"
  fi
  log_ok "redirect check passed for ${url} (${code})"
}

main() {
  require_command "$NGINX_BIN"
  require_command "$SYSTEMCTL_BIN"
  require_command curl
  require_command install
  require_command cp
  require_command mkdir
  require_command ln
  require_command grep
  require_command readlink
  require_command rm
  require_command test
  require_command date

  PHASE="preflight"
  assert_file_readable "$SOURCE_CONFIG"
  assert_parent_dir_exists "$TARGET_CONFIG"
  assert_parent_dir_exists "$TARGET_SYMLINK"
  assert_config_sanity "$SOURCE_CONFIG"
  assert_nginx_baseline_valid
  precheck_upstreams

  local timestamp backup_path
  timestamp="$(date +%Y%m%d-%H%M%S)"
  backup_path="${BACKUP_DIR}/personalwebsite.${timestamp}.bak"
  BACKUP_PATH="$backup_path"

  PHASE="backup_install"
  log_info "deploying config from ${SOURCE_CONFIG}"
  run_root mkdir -p "$BACKUP_DIR"

  if run_root test -f "$TARGET_CONFIG"; then
    HAD_EXISTING_TARGET="1"
    log_info "backing up existing config to ${backup_path}"
    run_root cp "$TARGET_CONFIG" "$backup_path"
    run_root test -f "$backup_path" || die "backup file was not created: ${backup_path}"
  else
    log_warn "no existing target config at ${TARGET_CONFIG}; skipping backup"
  fi

  log_info "installing nginx site config -> ${TARGET_CONFIG}"
  run_root install -m 0644 "$SOURCE_CONFIG" "$TARGET_CONFIG"
  DEPLOY_INSTALLED="1"
  run_root test -f "$TARGET_CONFIG" || die "installed target config missing after install: ${TARGET_CONFIG}"

  ensure_target_symlink

  PHASE="nginx_test_after_install"
  log_info "testing nginx config"
  if ! run_root "$NGINX_BIN" -t; then
    die "$ERR_NGINX_TEST_FAILED"
  fi
  log_ok "nginx config test passed"

  PHASE="reload"
  log_info "reloading nginx"
  if ! run_root "$SYSTEMCTL_BIN" reload nginx; then
    die "$ERR_RELOAD_FAILED"
  fi
  DEPLOY_RELOADED="1"
  assert_service_active

  PHASE="post_deploy_checks"
  log_info "running basic HTTPS checks"
  local main_code api_code reader_code

  if [[ "${VERIFY_REDIRECTS}" == "1" ]]; then
    assert_redirect "http://${WWW_HOST}/" "$WWW_HOST" "301"
    if [[ "${TEST_READER}" == "1" ]]; then
      assert_redirect "http://${READER_HOST}/" "$READER_HOST" "301"
    fi
  else
    log_info "redirect checks disabled (VERIFY_REDIRECTS=${VERIFY_REDIRECTS})"
  fi

  main_code="$(http_code_or_fail "https://${WWW_HOST}/" "$WWW_HOST")"
  log_info "main site code: ${main_code}"
  if [[ "$main_code" != "$MAIN_EXPECTED_CODE" ]]; then
    die "${ERR_MAIN_TEST_FAILED} (expected ${MAIN_EXPECTED_CODE}, got ${main_code})"
  fi
  log_ok "main site HTTPS check passed"

  api_code="$(http_code_or_fail "https://${WWW_HOST}${API_HEALTH_PATH}" "$WWW_HOST")"
  log_info "api health code: ${api_code}"
  if [[ "$api_code" != "$API_EXPECTED_CODE" ]]; then
    die "${ERR_API_TEST_FAILED} (expected ${API_EXPECTED_CODE}, got ${api_code})"
  fi
  log_ok "API health proxy check passed"

  if [[ "$TEST_READER" == "1" ]]; then
    reader_code="$(http_code_or_fail "https://${READER_HOST}/" "$READER_HOST")"
    log_info "reader code: ${reader_code}"
    if [[ "$reader_code" != "$READER_EXPECTED_CODE" ]]; then
      die "${ERR_READER_TEST_FAILED} (expected ${READER_EXPECTED_CODE}, got ${reader_code})"
    fi
    log_ok "reader HTTPS check passed"
  else
    log_info "reader test disabled (TEST_READER=${TEST_READER})"
  fi

  PHASE="done"
  log_info "deployment + basic nginx checks passed"
}

main "$@"
