#!/bin/bash
# Health check script for oho.chat local development
# Usage: ./scripts/health-check.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; FAILURES=$((FAILURES + 1)); }
warn() { echo -e "  ${YELLOW}!${NC} $1"; }

FAILURES=0

echo "=== oho.chat Health Check ==="
echo ""

# Docker
echo "Docker:"
if docker info > /dev/null 2>&1; then
  pass "Docker daemon running"
else
  fail "Docker daemon not running"
fi

# PostgreSQL
echo "PostgreSQL:"
PG_PORT=${POSTGRES_PORT:-5433}
if docker exec oho-postgres pg_isready -U oho -d oho_dev > /dev/null 2>&1; then
  pass "Accepting connections (port $PG_PORT)"
  DB_TABLES=$(docker exec oho-postgres psql -U oho -d oho_dev -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
  if [ "$DB_TABLES" -gt 0 ] 2>/dev/null; then
    pass "Schema loaded ($DB_TABLES tables)"
  else
    warn "No tables found — run: bun run db:push"
  fi
else
  fail "Not responding"
fi

# Redis
echo "Redis:"
if docker exec oho-redis redis-cli ping > /dev/null 2>&1; then
  pass "Accepting connections (port 6379)"
  REDIS_MEM=$(docker exec oho-redis redis-cli info memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '[:space:]')
  pass "Memory usage: $REDIS_MEM"
else
  fail "Not responding"
fi

# MinIO
echo "MinIO:"
if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
  pass "API healthy (port 9000)"
  pass "Console at http://localhost:9001"
else
  fail "Not responding"
fi

# App
echo "App:"
if curl -s -o /dev/null -w "" http://localhost:3000/ 2>/dev/null; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
  pass "Responding on port 3000 (HTTP $HTTP_CODE)"
else
  warn "Not running — start with: bun run dev"
fi

# .env
echo "Config:"
if [ -f .env ]; then
  pass ".env file exists"
else
  warn ".env missing — run: cp .env.example .env"
fi

echo ""
if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}All checks passed.${NC}"
else
  echo -e "${RED}$FAILURES check(s) failed.${NC}"
  exit 1
fi
