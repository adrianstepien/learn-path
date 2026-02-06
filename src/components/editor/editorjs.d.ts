declare module '@editorjs/header' {
  import { BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs';
  
  interface HeaderConfig {
    levels?: number[];
    defaultLevel?: number;
  }
  
  export default class Header implements BlockTool {
    constructor(config: BlockToolConstructorOptions<{}, HeaderConfig>);
    render(): HTMLElement;
    save(block: HTMLElement): { text: string; level: number };
    static get toolbox(): { title: string; icon: string };
  }
}

declare module '@editorjs/list' {
  import { BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs';
  
  interface ListConfig {
    defaultStyle?: 'ordered' | 'unordered';
  }
  
  export default class List implements BlockTool {
    constructor(config: BlockToolConstructorOptions<{}, ListConfig>);
    render(): HTMLElement;
    save(block: HTMLElement): { style: string; items: string[] };
    static get toolbox(): { title: string; icon: string };
  }
}

declare module '@editorjs/image' {
  import { BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs';
  
  interface ImageConfig {
    endpoints?: {
      byFile?: string;
      byUrl?: string;
    };
    field?: string;
    types?: string;
    captionPlaceholder?: string;
    buttonContent?: string;
  }
  
  export default class ImageTool implements BlockTool {
    constructor(config: BlockToolConstructorOptions<{}, ImageConfig>);
    render(): HTMLElement;
    save(block: HTMLElement): { file: { url: string }; caption: string; withBorder: boolean; stretched: boolean; withBackground: boolean };
    static get toolbox(): { title: string; icon: string };
  }
}
