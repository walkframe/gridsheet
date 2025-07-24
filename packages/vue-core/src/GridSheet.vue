<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount, ref, h as vueH, isRef, watch } from 'vue';
import {
  GridSheet as PreactGridSheet,
  h as preactH,
  render as preactRender,
} from '@gridsheet/preact-core';
import type { Ref } from 'vue';

import type { 
  CellsByAddressType, 
  OptionsType, 
  HubType,
  Connector,
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
    hub: {
      type: Object as () => HubType | Ref<HubType>,
      default: null,
    },
    connector: {
      type: Object as () => RefObject<Connector | null>,
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
      // Remove legacy tableRef, use connector instead
      const { tableRef, ...rest } = props as any;
      return {
        ...rest,
        hub: isRef(props.hub) ? (props.hub.value as HubType | undefined) : (props.hub as HubType | undefined),
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
      if (isRef(props.hub)) {
        watch(
          () => (props.hub as Ref<HubType>).value,
          renderPreact,
          { deep: false }
        );
      } else {
        watch(
          () => props.hub,
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
