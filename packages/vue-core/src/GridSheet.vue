<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount, ref, h as vueH, isRef, watch } from 'vue';
import {
  GridSheet as PreactGridSheet,
  h as preactH,
  render as preactRender,
  HubReactiveType,
} from '@gridsheet/preact-core';
import type { Ref } from 'vue';

import type { 
  CellsByAddressType, 
  OptionsType, 
  TableRef,
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
    hubReactive: {
      type: Object as () => HubReactiveType | Ref<HubReactiveType>,
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

    function getPreactProps() {
      return {
        ...props,
        hubReactive: isRef(props.hubReactive) ? (props.hubReactive.value as HubReactiveType | undefined) : (props.hubReactive as HubReactiveType | undefined),
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
      if (isRef(props.hubReactive)) {
        watch(
          () => (props.hubReactive as Ref<HubReactiveType>).value,
          renderPreact,
          { deep: false }
        );
      } else {
        watch(
          () => props.hubReactive,
          renderPreact,
          { deep: false }
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
