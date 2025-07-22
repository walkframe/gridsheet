<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    GridSheet as PreactGridSheet,
    h as preactH,
    render as preactRender,
    type HubType,
  } from '@gridsheet/preact-core';
  import type {
    CellsByAddressType,
    OptionsType,
    Connector,
  } from '@gridsheet/react-core';

  interface RefObject<T> {
    readonly current: T | null;
  }

  interface Props {
    initialCells: CellsByAddressType;
    sheetName?: string;
    hub?: HubType;
    connector?: RefObject<Connector | null>;
    options?: OptionsType;
    className?: string;
    style?: Record<string, any>;
  }

  let {
    initialCells,
    sheetName = '',
    hub,
    connector,
    options = {},
    className = '',
    style = {}
  }: Props = $props();

  let root: HTMLElement | null = null;
  let container: HTMLElement;

  function getPreactProps() {
    return {
      initialCells,
      sheetName,
      hub,
      connector,
      options,
      className,
      style
    };
  }

  function renderPreact() {
    if (container) {
      root = container;
      preactRender(
        preactH(PreactGridSheet, getPreactProps()),
        root
      );

    }
  }

  onDestroy(() => {
    if (root) {
      root.innerHTML = '';
    }
  });

  $effect(() => {
    if (container) {
      renderPreact();
    }
  });
</script>

<div bind:this={container} class={className} style={style}></div>
