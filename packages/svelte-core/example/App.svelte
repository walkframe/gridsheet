<script>
  import { GridSheet, useHub } from '@gridsheet/svelte-core';

  const enabledWireProps = { labelers: { decimal: n => String(n) } };
  const disabledWireProps = { labelers: {}};

  let enableDecimalLabeler = $state(false);

  let hubStore = useHub(enableDecimalLabeler ? enabledWireProps : disabledWireProps);
  let lastEnabled;
  $effect(() => {
    if (enableDecimalLabeler !== lastEnabled) {
      lastEnabled = enableDecimalLabeler;
      $hubStore.wire.transmit(enableDecimalLabeler ? enabledWireProps : disabledWireProps);
    }
  });

  const initialCells1 = {
    A1: { value: 'Hello' },
    B1: { value: 'Svelte', style: { backgroundColor: '#448888'} },
    A2: { value: 123 },
    B2: { value: 456 },
    A3: { value: 789},
    C10: { value: '=SUM(A2:B2)' },
  };

  const initialCells2 = {
    C3: { value: '=SUM(Sheet1!A2:B3)' },
    default: { labeler: 'decimal' },
  };
</script>

<main>
  <h1>GridSheet Svelte Example</h1>
  
  <div class="grid-container">
    <GridSheet
      hub={$hubStore}
      initialCells={initialCells1}
      options={{
        mode: 'dark',
      }}
      sheetName="Sheet1"
    />

    <GridSheet
      hub={$hubStore}
      initialCells={initialCells2}
      options={{}}
      sheetName="Sheet2"
    />
  </div>

  <!-- Labeler Control -->
  <div class="labeler-control">
    <label>
      <input 
        type="checkbox" 
        bind:checked={enableDecimalLabeler}
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
