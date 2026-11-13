#!/bin/bash
cd "$(dirname "$0")"
if [ ! -d "venv" ]; then
  python3 -m venv venv
  ./venv/bin/pip install -r requirements.txt
fi
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 3009 --reload
