import { toPng, toSvg } from 'html-to-image';

export interface ExportOptions {
  format?: 'png' | 'svg';
  quality?: number;
  backgroundColor?: string;
  padding?: number;
  filename?: string;
}

export async function exportDiagram(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<string> {
  const {
    format = 'png',
    quality = 1,
    backgroundColor = '#fafafa',
    padding = 40,
  } = options;

  const exportFn = format === 'svg' ? toSvg : toPng;

  const dataUrl = await exportFn(element, {
    quality,
    backgroundColor,
    style: {
      padding: `${padding}px`,
    },
  });

  return dataUrl;
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function exportAndDownload(
  element: HTMLElement,
  options: ExportOptions = {}
) {
  const { format = 'png', filename } = options;
  const defaultFilename = `diagram.${format}`;
  const dataUrl = await exportDiagram(element, options);
  downloadDataUrl(dataUrl, filename || defaultFilename);
}
