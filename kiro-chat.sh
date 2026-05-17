#!/bin/bash
# kiro-chat — call Kiro Claude via 9Router (localhost)
# DeepSeek usage = zero. This goes directly to 9Router → Kiro API.
#
# Usage:
#   ./kiro-chat.sh                          # interactive
#   ./kiro-chat.sh "prompt"                 # one-shot
#   ./kiro-chat.sh "prompt" sonnet-4-6      # specify model
#   ./kiro-chat.sh "prompt" opus-4-7 0.5    # specify temp

BASE="http://127.0.0.1:20128/v1"
PROMPT="$1"
MODEL="${2:-sonnet-4-6}"
TEMP="${3:-0.7}"

# Map short names → 9Router model IDs (kr/ prefix)
case "$MODEL" in
  sonnet|sonnet-4-6) MODEL_ID="kr/claude-sonnet-4.6" ;;
  sonnet-4-5)        MODEL_ID="kr/claude-sonnet-4.5" ;;
  opus|opus-4-6)     MODEL_ID="kr/claude-opus-4.6" ;;
  opus-4-7)          MODEL_ID="kr/claude-opus-4.7" ;;
  haiku|haiku-4-5)   MODEL_ID="kr/claude-haiku-4.5" ;;
  *)                 MODEL_ID="kr/claude-$MODEL" ;;
esac

if [ -z "$PROMPT" ]; then
  echo "🧠 Kiro Claude ($MODEL_ID via 9Router) — Ctrl+D to exit"
  echo "─────────────────────────────────"
  while IFS= read -rp "> " line; do
    [ -z "$line" ] && continue
    curl -s "$BASE/chat/completions" \
      -H "Content-Type: application/json" \
      -d "{\"model\":\"$MODEL_ID\",\"messages\":[{\"role\":\"user\",\"content\":\"$line\"}],\"temperature\":$TEMP}" \
      | python3 -c "
import sys
buf = ''
for line in sys.stdin:
    if line.startswith('data: ') and line.strip() != 'data: [DONE]':
        import json
        try:
            chunk = json.loads(line[6:])
            delta = chunk.get('choices',[{}])[0].get('delta',{}).get('content','')
            buf += delta
        except: pass
print(buf) if buf else (lambda d: print(d['choices'][0]['message']['content']))(json.loads(sys.stdin.read()))
" 2>/dev/null
    echo "─────────────────────────────────"
  done
else
  curl -s "$BASE/chat/completions" \
    -H "Content-Type: application/json" \
    -d "{\"model\":\"$MODEL_ID\",\"messages\":[{\"role\":\"user\",\"content\":\"$PROMPT\"}],\"temperature\":$TEMP}" \
    | python3 -c "
import sys, json
buf = ''
for line in sys.stdin:
    if line.startswith('data: ') and line.strip() != 'data: [DONE]':
        try:
            chunk = json.loads(line[6:])
            delta = chunk.get('choices',[{}])[0].get('delta',{}).get('content','')
            buf += delta
        except: pass
    elif line.strip() and not line.startswith('data:'):
        try:
            d = json.loads(line)
            print(d['choices'][0]['message']['content'])
            sys.exit(0)
        except: pass
if buf: print(buf)
" 2>/dev/null
fi