<script>
  import { GridSheet, Policy } from '@gridsheet/svelte-core';
  import { useSpellbook } from '@gridsheet/svelte-core/spellbook';

  let enableDecimalLabeler = $state(false);

  const bookProps = { policies: {} };
  const book = useSpellbook(bookProps);

  function handleToggle() {
    let bookValue;
    book.subscribe((v) => (bookValue = v))();
    const { registry } = bookValue;
    bookProps.policies.decimal = enableDecimalLabeler
      ? new Policy({ mixins: [{ renderColHeaderLabel: (n) => String(n) }] })
      : null;
    registry.transmit(bookProps);
  }
</script>

<main>
  <h1>GridSheet Svelte Example</h1>

  <div class="grid-container">
    <GridSheet
      {book}
      initialCells={{
        A1: { value: 'Hello' },
        B1: { value: 'Svelte', style: { backgroundColor: 'orange' } },
        A2: { value: 123 },
        B2: { value: 456 },
        A3: { value: 789 },
        C6: { value: '=SUM(A2:B2)' },
      }}
      options={{
        mode: 'dark',
      }}
      sheetName="Sheet1"
    />

    <GridSheet
      {book}
      initialCells={{
        C3: { value: '=SUM(Sheet1!A2:B3)' },
        defaultCol: { policy: 'decimal' },
      }}
      options={{}}
      sheetName="Sheet2"
    />
  </div>

  <div class="labeler-control">
    <label>
      <input
        type="checkbox"
        bind:checked={enableDecimalLabeler}
        onchange={handleToggle}
      />
      Enable Decimal Labeler for Sheet2
    </label>
  </div>
</main>

<style>
  main {
    padding: 1rem;
  }

  h1 {
    color: #333;
    margin-bottom: 1rem;
  }

  .labeler-control {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
    border: 1px solid #e9ecef;
  }

  .labeler-control label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: #495057;
    cursor: pointer;
  }

  .labeler-control input[type="checkbox"] {
    margin: 0;
  }

  .grid-container {
    border: 1px solid #e9ecef;
    border-radius: 8px;
    overflow: hidden;
  }
</style>
