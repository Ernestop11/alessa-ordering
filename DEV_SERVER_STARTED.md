# ✅ Dev Server Starting

## Status

The development server is starting in the background. 

## URLs to Visit

Once the server is ready (usually takes 10-30 seconds), visit:

```
http://localhost:3000/order?tenant=lapoblanita
```

## What You'll See

The VPS version with:
- ✅ Floating Action Buttons on the LEFT side:
  - 🎉 Catering (top)
  - ⭐ Rewards (middle)  
  - ♿ Accessibility/ADA (bottom)
  - All lined up vertically!

- ✅ Menu upsell bundles
- ✅ Bakery styling (amber/yellow colors)

## If It Doesn't Load

Wait a few more seconds for the server to fully start, then refresh your browser.

## Stop the Server

When you're done viewing, you can stop it with:
```bash
# Find the process
lsof -ti:3000

# Kill it
kill $(lsof -ti:3000)
```

Or just press `Ctrl+C` in the terminal where it's running.




















