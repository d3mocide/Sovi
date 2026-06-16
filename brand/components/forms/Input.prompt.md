Labelled text field on a sunken cool fill (`--surface-input`); border goes sky on focus, amber on error. Use for everything from login to the debt-metadata modal.

```jsx
<Input label="APR (%)" type="number" step="0.001" placeholder="24.99" />
<Input label="Email" type="email" error="That address isn't registered." />
<Input label="Extra monthly" hint="Applied on top of minimums" />
```

Forwards its ref to the `<input>`. Pair fields in a `display:grid; gridTemplateColumns:1fr 1fr; gap:12px` for the modal two-up layout.
