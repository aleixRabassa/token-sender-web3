# Synpress Troubleshooting

## Cache hash mismatch error

**Error:** `Cache for <expected_hash> does not exist. Create it first!`

**Fix:** Rename the existing folder inside `.cache-synpress/` to match the expected hash from the error message.

```bash
# Example: if error says "Cache for 08a20e3c7fc77e6ae298 does not exist"
mv .cache-synpress/<old_hash> .cache-synpress/08a20e3c7fc77e6ae298
```

This happens when the cache was created with a different hash than what Synpress now expects (e.g., after dependency updates).
