Quiet on/off toggle with a sky track when on. For settings rows like two-factor or auto-sync.

```jsx
<Switch checked={twoFA} onChange={setTwoFA} label="Require 2FA at login" />
```

Controlled — pass `checked` and handle `onChange(next)`.
