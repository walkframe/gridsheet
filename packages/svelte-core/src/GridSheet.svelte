<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    GridSheet as PreactGridSheet,
    h as preactH,
    render,
  } from '@gridsheet/preact-core';

  import type {
    CellsByAddressType,
    OptionsType,
    HubReactiveType,
    TableRef,
  } from '@gridsheet/preact-core';

  interface RefObject<T> {
    readonly current: T | null;
  }

  export let initialCells: CellsByAddressType;
  export let sheetName: string = '';
  export let hubReactive: HubReactiveType | undefined = undefined;
  export let tableRef: RefObject<TableRef | null> | undefined = undefined;
  export let options: OptionsType = {};
  export let className: string = '';

  let container: HTMLElement | null = null;
  let root: HTMLElement | null = null;

  function renderPreact() {
    if (container) {
      render(
        preactH(PreactGridSheet, {
          initialCells,
          sheetName,
          hubReactive,
          tableRef,
          options,
          className,
        }),
        container,
      );
    }
  }

  onMount(() => {
    root = container;
    renderPreact();
  });

  $: hubReactive, renderPreact();

  onDestroy(() => {
    if (root) {
      root.innerHTML = '';
    }
  });
</script>

<div bind:this={container} class={className}></div>
