<script>
  import { GridSheet } from '@gridsheet/svelte-core';
</script>

<main>
  <h1>GridSheet Svelte Example</h1>
  <div class="grid-container">
    <GridSheet
      initialCells={{
        A1: { value: 'Hello' },
        B1: { value: 'Svelte', style: { backgroundColor: '#FF8800'} },
        A2: { value: 123 },
        B2: { value: 456 },
        C10: { value: '=SUM(A2:B2)' },
      }}
      options={{
        mode: 'dark',
      }}
      sheetName="Example"
    />
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
</style> 