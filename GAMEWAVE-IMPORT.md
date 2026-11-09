# GameWave import

Upload the ZIP with `index.html` at the root. The game starts independently. A compatible GameWave host can inject `window.neonlib` before or after startup.

- One round is one lab. A first committed play or resumed checkpoint starts the host round. Actual clear or failure ends it. Scans, pause and viewing the result do not create extra round events.
- The game uses the local key `dye-dodge-v1` and uploads only the `dye-dodge` profile envelope. An existing local checkpoint wins over a different cloud checkpoint. Best stars and records merge by maximum. Confirmed reward flags merge by union.
- A checkpoint saves the scan index, deck seed, last landing tile, lives, score and streak. On reload the saved scan restarts at its initial clock. The next real Play or Resume begins that visit.
- A confirmed positive like unlocks golden sparks. A confirmed direct comment, including an image-only comment, unlocks a larger burst. These optional visuals do not change scores or gameplay. They are saved and awarded once per recognized profile.
- Invalid callbacks and unlikes do not grant rewards. Unsupported interactions stay hidden, and listeners are cleaned up on exit.

See the [official SDK guide](https://rg975ojk5z.feishu.cn/wiki/MQg7wMknzieOkukxyWVc4UB0nDh) for host support. Mock browser tests and real GameWave host tests are separate.
