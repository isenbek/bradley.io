# Terminal 1 - GPS receiver
socat UDP-LISTEN:2222,fork STDOUT | stdbuf -oL tee -a ./data/gps_data.jsonl &>/dev/null &
#socat UDP-LISTEN:2222,fork STDOUT &

# Terminal 2 - ADSB receiver
socat UDP-LISTEN:2223,fork STDOUT | stdbuf -oL tee -a ./data/adsb_data.jsonl &>/dev/null &
#socat UDP-LISTEN:2223,fork STDOUT &

# Terminal 3 - Telemetry receiver
socat UDP-LISTEN:2224,fork STDOUT | stdbuf -oL tee -a ./data/telemetry_data.jsonl &>/dev/null &
#socat UDP-LISTEN:2224,fork STDOUT &

wait
