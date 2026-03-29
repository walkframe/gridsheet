<template>
  <main>
    <h1>GridSheet Vue Example</h1>
    
    <div class="grid-container">
      <GridSheet
        :book="book"
        :initialCells="{
          A1: { value: 'Hello' },
          B1: { value: 'Vue', style: { backgroundColor: '#448888'} },
          A2: { value: 123 },
          B2: { value: 456 },
          A3: { value: 789},
          C6: { value: '=SUM(A2:B2)' },
        }"
        :options="{
          mode: 'dark',
        }"
        sheetName="Sheet1"
      />

      <GridSheet
        :book="book"
        :initialCells="{
          C3: { value: '=SUM(Sheet1!A2:B3)' },
          defaultCol: { policy: 'decimal' },
        }"
        :options="{}"
        sheetName="Sheet2"
      />
    </div>

    <!-- Labeler Control -->
    <div class="labeler-control">
      <label>
        <input
          type="checkbox"
          v-model="enableDecimalLabeler"
          @change="handleToggle"
        />
        Enable Decimal Labeler for Sheet2
      </label>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import { GridSheet, Policy } from '@gridsheet/vue-core';
import { useSpellbook } from '@gridsheet/vue-core/spellbook';

const enableDecimalLabeler = ref(false);

const bookProps = { policies: {} };
const book = useSpellbook(bookProps);

const handleToggle = () => {
  const { registry } = book.value;
  bookProps.policies.decimal = enableDecimalLabeler.value
    ? new Policy({ mixins: [{ renderColHeaderLabel: (n) => String(n) }] })
    : null;
  registry.transmit(bookProps);
};
</script>

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