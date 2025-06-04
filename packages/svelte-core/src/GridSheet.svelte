<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    GridSheet as PreactGridSheet,
    h as preactH,
    render as preactRender,
  } from '@gridsheet/preact-core';
  import type { CellsByAddressType, OptionsType, SheetConnector, TableRef } from '@gridsheet/preact-core';

  interface RefObject<T> {
    readonly current: T | null;
  }

  export let initialCells: CellsByAddressType;
  export let sheetName: string = '';
  export let connector: SheetConnector | undefined = undefined;
  export let tableRef: RefObject<TableRef | null> | undefined = undefined;
  export let options: OptionsType = {};
  export let className: string = '';

  let container: HTMLElement | null = null;
  let root: HTMLElement | null = null;

  onMount(() => {
    if (container) {
      root = container;
      preactRender(
        preactH(PreactGridSheet, { initialCells, sheetName, connector, tableRef, options, className }),
        root
      );
    }
  });

  onDestroy(() => {
    if (root) {
      root.innerHTML = '';
    }
  });
</script>

<div bind:this={container} class={className}></div>
