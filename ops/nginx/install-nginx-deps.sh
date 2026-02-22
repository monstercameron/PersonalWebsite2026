#!/usr/bin/env bash
set -Eeuo pipefail

SUDO_BIN="${SUDO_BIN:-sudo}"
APT_BIN="${APT_BIN:-apt-get}"
SYSTEMCTL_BIN="${SYSTEMCTL_BIN:-systemctl}"
NGINX_SERVICE_NAME="${NGINX_SERVICE_NAME:-nginx}"
INSTALL_CERTBOT="${INSTALL_CERTBOT:-1}"
INSTALL_UFW="${INSTALL_UFW:-0}"
RUN_APT_UPDATE="${RUN_APT_UPDATE:-1}"
ENABLE_AND_START_NGINX="${ENABLE_AND_START_NGINX:-1}"

APT_PACKAGES_CORE=(
  nginx
  curl
  ca-certificates
  gnupg
  lsb-release
)

APT_PACKAGES_TLS=(
  certbot
  python3-certbot-nginx
)

APT_PACKAGES_NET=(
  ufw
)

MSG_INFO="[nginx-deps]"
MSG_OK="[nginx-deps] OK:"

PHASE="init"

log_info() { printf '%s %s\n' "$MSG_INFO" "$1"; }
log_ok() { printf '%s %s\n' "$MSG_OK" "$1"; }
log_warn() { printf '%s WARN: %s\n' "$MSG_INFO" "$1"; }
log_err() { printf '%s ERROR: %s\n' "$MSG_INFO" "$1" >&2; }
die() { log_err "$1"; exit 1; }

run_root() {
  if [[ "${EUID}" -eq 0 ]]; then
    "$@"
    return
  fi
  "$SUDO_BIN" "$@"
}

require_command() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || die "required command not found: $cmd"
}

assert_ubuntu_like() {
  PHASE="os_check"
  [[ -f /etc/os-release ]] || die "/etc/os-release not found; unsupported environment"
  # shellcheck disable=SC1091
  source /etc/os-release
  if [[ "${ID:-}" != "ubuntu" && "${ID_LIKE:-}" != *"ubuntu"* && "${ID_LIKE:-}" != *"debian"* ]]; then
    die "this script expects Ubuntu/Debian (detected ID='${ID:-unknown}', ID_LIKE='${ID_LIKE:-unknown}')"
  fi
  log_ok "OS check passed (${PRETTY_NAME:-unknown})"
}

apt_update_if_enabled() {
  PHASE="apt_update"
  if [[ "${RUN_APT_UPDATE}" != "1" ]]; then
    log_info "apt update skipped (RUN_APT_UPDATE=${RUN_APT_UPDATE})"
    return
  fi
  log_info "running apt package index update"
  run_root "$APT_BIN" update
  log_ok "apt update completed"
}

package_installed() {
  local pkg="$1"
  dpkg -s "$pkg" >/dev/null 2>&1
}

install_packages_if_missing() {
  local -n package_list_ref="$1"
  local label="$2"
  local missing_packages=()
  local pkg

  for pkg in "${package_list_ref[@]}"; do
    if package_installed "$pkg"; then
      log_info "${label}: already installed -> ${pkg}"
    else
      missing_packages+=("$pkg")
    fi
  done

  if [[ "${#missing_packages[@]}" -eq 0 ]]; then
    log_ok "${label}: all packages already installed"
    return
  fi

  log_info "${label}: installing -> ${missing_packages[*]}"
  run_root "$APT_BIN" install -y "${missing_packages[@]}"
  log_ok "${label}: install completed"
}

verify_binaries() {
  PHASE="verify_bins"
  require_command nginx
  require_command curl
  if [[ "${INSTALL_CERTBOT}" == "1" ]]; then
    require_command certbot
  fi
  log_ok "required binaries available"
}

enable_start_nginx_if_enabled() {
  PHASE="nginx_service"
  if [[ "${ENABLE_AND_START_NGINX}" != "1" ]]; then
    log_info "nginx enable/start skipped (ENABLE_AND_START_NGINX=${ENABLE_AND_START_NGINX})"
    return
  fi

  log_info "enabling nginx service"
  run_root "$SYSTEMCTL_BIN" enable "$NGINX_SERVICE_NAME"
  log_info "starting nginx service (or ensuring it is running)"
  run_root "$SYSTEMCTL_BIN" start "$NGINX_SERVICE_NAME" || run_root "$SYSTEMCTL_BIN" restart "$NGINX_SERVICE_NAME"
  run_root "$SYSTEMCTL_BIN" is-active --quiet "$NGINX_SERVICE_NAME" || die "nginx service is not active after start"
  log_ok "nginx service active"
}

print_next_steps() {
  printf '\n'
  log_info "next steps"
  printf '  1. Place your site config in /etc/nginx/sites-available/personalwebsite\n'
  printf '  2. Run: sudo nginx -t\n'
  printf '  3. Run: sudo systemctl reload nginx\n'
  printf '  4. If certs are not present yet, request them with certbot\n'
  printf '     Example: sudo certbot --nginx -d www.earlcameron.com -d earlcameron.com -d reader.earlcameron.com\n'
}

on_err_trap() {
  local exit_code="$1"
  local line_no="$2"
  log_err "script failed at phase='${PHASE}' line=${line_no} exit_code=${exit_code}"
  exit "$exit_code"
}

trap 'on_err_trap $? $LINENO' ERR

main() {
  require_command dpkg
  require_command "$APT_BIN"
  require_command "$SYSTEMCTL_BIN"
  require_command "$SUDO_BIN"

  assert_ubuntu_like
  apt_update_if_enabled

  PHASE="install_core"
  install_packages_if_missing APT_PACKAGES_CORE "core"

  if [[ "${INSTALL_CERTBOT}" == "1" ]]; then
    PHASE="install_tls"
    install_packages_if_missing APT_PACKAGES_TLS "tls/certbot"
  else
    log_info "certbot install skipped (INSTALL_CERTBOT=${INSTALL_CERTBOT})"
  fi

  if [[ "${INSTALL_UFW}" == "1" ]]; then
    PHASE="install_net"
    install_packages_if_missing APT_PACKAGES_NET "network"
  else
    log_info "ufw install skipped (INSTALL_UFW=${INSTALL_UFW})"
  fi

  verify_binaries
  enable_start_nginx_if_enabled
  PHASE="done"
  log_ok "dependency installation completed"
  print_next_steps
}

main "$@"
