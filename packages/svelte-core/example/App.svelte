<script>
import { GridSheet, useHubReactive } from '@gridsheet/svelte-core';
const hubReactiveStore = useHubReactive();
</script>

<main>
  <h1>GridSheet Svelte Example</h1>
  <div class="grid-container">
    <GridSheet
      hubReactive={$hubReactiveStore}
      initialCells={{
        A1: { value: 'Hello' },
        B1: { value: 'Svelte', style: { backgroundColor: '#FF8800'} },
        A2: { value: 123 },
        B2: { value: 456 },
        A3: { value: 789},
        C10: { value: '=SUM(A2:B2)' },
      }}
      sheetName="Sheet1"
    />
    <GridSheet
      hubReactive={$hubReactiveStore}
      initialCells={{
        C3: { value: '=SUM(Sheet1!A2:B3)' },
      }}
      options={{
        mode: 'dark',
      }}
      sheetName="Sheet2"
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
