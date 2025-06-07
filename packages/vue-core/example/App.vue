<template>
  <main>
    <h1>GridSheet Vue Example</h1>
    <div class="grid-container">
      <GridSheet
        :hubReactive="hubReactive"
        :initialCells="{
          A1: { value: 'Hello' },
          B1: { value: 'Vue', style: { backgroundColor: '#448888'} },
          A2: { value: 123 },
          B2: { value: 456 },
          A3: { value: 789},
          C10: { value: '=SUM(A2:B2)' },
        }"
        :options="{
          mode: 'dark',
        }"
        sheetName="Sheet1"
      />

      <GridSheet
        :hubReactive="hubReactive"
        :initialCells="{
          C3: { value: '=SUM(Sheet1!A2:B3)' },
        }"
        :options="{}"
        sheetName="Sheet2"
      />
    </div>
  </main>
</template>

<script setup>
import { GridSheet, useHubReactive } from '@gridsheet/vue-core';
const hubReactive = useHubReactive();
</script>

<style>
main {
  padding: 1rem;
}

h1 {
  color: #333;
  margin-bottom: 1rem;
}
</style> 