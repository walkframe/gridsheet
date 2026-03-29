<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
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

  import type { Writable } from 'svelte/store';

  interface RefObject<T> {
    readonly current: T | null;
  }

  let {
    initialCells,
    sheetName = '',
    book = undefined,
    sheetRef = undefined,
    storeRef = undefined,
    options = {},
    className = '',
    style = {},
  }: {
    initialCells: CellsByAddressType;
    sheetName?: string;
    book?: Writable<BookType>;
    sheetRef?: RefObject<SheetHandle | null>;
    storeRef?: RefObject<StoreHandle | null>;
    options?: OptionsType;
    className?: string;
    style?: Record<string, string>;
  } = $props();

  let container: HTMLElement;
  let bookValue: BookType | undefined = undefined;

  function renderPreact() {
    if (container) {
      preactRender(
        preactH(PreactGridSheet, {
          initialCells,
          sheetName,
          book: bookValue,
          sheetRef,
          storeRef,
          options,
          className,
          style,
        }),
        container
      );
    }
  }

  onMount(() => {
    if (book) {
      const unsubscribe = book.subscribe((value) => {
        bookValue = value;
        renderPreact();
      });
      return unsubscribe;
    } else {
      renderPreact();
    }
  });

  onDestroy(() => {
    if (container) {
      preactRender(null, container);
    }
  });
</script>

<div bind:this={container}></div>
