<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount, ref, h as vueH, watch } from 'vue';
import {
  GridSheet as PreactGridSheet,
  h as preactH,
  render as preactRender,
} from '@gridsheet/preact-core';

import type {
  CellsByAddressType,
  OptionsType,
  BookType,
  SheetHandle,
  StoreHandle,
} from '@gridsheet/preact-core';

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
    book: {
      type: Object as () => BookType,
      default: undefined,
    },
    sheetRef: {
      type: Object as () => RefObject<SheetHandle | null>,
      default: undefined,
    },
    storeRef: {
      type: Object as () => RefObject<StoreHandle | null>,
      default: undefined,
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

    function getPreactProps() {
      return {
        initialCells: props.initialCells,
        sheetName: props.sheetName,
        book: props.book,
        sheetRef: props.sheetRef,
        storeRef: props.storeRef,
        options: props.options,
        className: props.className,
        style: props.style,
      };
    }

    function renderPreact() {
      if (container.value) {
        root = container.value;
        preactRender(
          preactH(PreactGridSheet, getPreactProps()),
          root
        );
      }
    }

    onMounted(() => {
      renderPreact();
      watch(
        () => props.book,
        renderPreact,
        { deep: false }
      );
    });

    onBeforeUnmount(() => {
      if (root) {
        preactRender(null, root);
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
