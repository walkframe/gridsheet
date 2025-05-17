// packages/vue-core/src/GridSheet.vue
<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount, ref, h as vueH } from 'vue';
import {
  GridSheet as PreactGridSheet,
  h as preactH,
  render as preactRender,
} from '@gridsheet/preact-core';

import type { CellsByAddressType, Props as GridSheetProps, OptionsType, SheetConnector } from '@gridsheet/preact-core';
import { TableRef } from '@gridsheet/preact-core/dist/types';

interface RefObject<T> {
  readonly current: T | null;
}

export default defineComponent({
  name: 'GridSheet',
  props: {
    initialCells: {
      type: Object as () => CellsByAddressType,
      required: true,
    },
    sheetName: {
      type: String,
      default: '',
    },
    connector: {
      type: Object as () => SheetConnector,
      default: null,
    },
    tableRef: {
      type: Object as () => RefObject<TableRef | null>,
      default: null,
    },
    options: {
      type: Object as () => OptionsType,
      default: () => ({}),
    },
    className: {
      type: String,
      default: '',
    },
    style: {
      type: Object as any,
      default: () => ({}),
    },
  },
  setup(props) {
    const container = ref<HTMLElement | null>(null);
    let root: HTMLElement | null = null;

    onMounted(() => {
      if (container.value) {
        root = container.value;
        preactRender(
          preactH(PreactGridSheet, props),
          root
        );
      }
    });

    onBeforeUnmount(() => {
      if (root) {
        root.innerHTML = '';
      }
    });

    return {
      container,
    };
  },
});
</script>

<template>
  <div ref="container"></div>
</template>
