import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AdaptivityProvider, AppRoot, ConfigProvider, View } from '@vkontakte/vkui';
import { Home } from '../src/panels/Home';
import { convertBatch } from '../src/utils/convertBatch';
vi.mock('../src/utils/convertBatch', async (original) => ({ ...await original<object>(), convertBatch: vi.fn() }));
const download = vi.hoisted(() => vi.fn());
vi.mock('file-saver', () => ({ saveAs: download }));
let number = 0;
const make = (id: string, name = 'photo.png') => ({ id, name, blob: new Blob(['synthetic png'], { type: 'image/png' }) });
function mount() { return render(<ConfigProvider platform="vkcom"><AdaptivityProvider><AppRoot><View activePanel="home"><Home id="home" isMobileInApp={false} isMobileWeb={false} /></View></AppRoot></AdaptivityProvider></ConfigProvider>); }
function upload(container: HTMLElement) { fireEvent.change(container.querySelector('input[type=file]')!, { target: { files: [new File(['synthetic'], 'photo.webp', { type: 'image/webp' })] } }); }
beforeEach(() => {
  vi.clearAllMocks(); vi.mocked(convertBatch).mockReset(); number = 0;
  vi.stubGlobal('URL', class extends URL { static createObjectURL = vi.fn(() => `blob:owned-${++number}`); static revokeObjectURL = vi.fn(); });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('owns each preview URL once across duplicate batches, download and deletion', async () => {
  vi.mocked(convertBatch).mockResolvedValueOnce({ images: [make('a')], rejected: 0, failed: 0 }).mockResolvedValueOnce({ images: [make('b')], rejected: 0, failed: 0 });
  const { container, unmount } = mount(); upload(container);
  await screen.findByRole('img', { name: 'photo.png' });
  fireEvent.click(screen.getByRole('button', { name: 'Скачать photo.png', exact: true }));
  expect(download).toHaveBeenCalledWith(expect.any(Blob), 'photo.png');
  upload(container); await screen.findByRole('img', { name: 'photo (2).png' });
  expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('button', { name: 'Удалить photo.png', exact: true }));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:owned-1');
  unmount(); expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
});
it('shows partial failure while keeping valid images usable and permits retry', async () => {
  vi.mocked(convertBatch).mockResolvedValueOnce({ images: [make('a')], failed: 1, rejected: 0 }).mockResolvedValueOnce({ images: [make('b')], failed: 0, rejected: 0 });
  const { container } = mount(); upload(container);
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось прочитать WEBP файлов: 1');
  expect(screen.getByRole('button', { name: 'Скачать все' })).toBeEnabled();
  upload(container); await screen.findByRole('img', { name: 'photo (2).png' });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
it('clear discards an unfinished batch and a later upload still works', async () => {
  let finish!: (result: Awaited<ReturnType<typeof convertBatch>>) => void;
  vi.mocked(convertBatch).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; })).mockResolvedValueOnce({ images: [make('b')], failed: 0, rejected: 0 });
  const { container } = mount(); upload(container);
  fireEvent.click(screen.getByRole('button', { name: 'Удалить все' }));
  await act(async () => { finish({ images: [make('a')], failed: 0, rejected: 0 }); });
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  upload(container); await screen.findByRole('img', { name: 'photo.png' });
  await waitFor(() => expect(screen.queryByText('Конвертируем файлы…')).not.toBeInTheDocument());
});
it('a completed batch after unmount creates no preview URL', async () => {
  let finish!: (result: Awaited<ReturnType<typeof convertBatch>>) => void;
  vi.mocked(convertBatch).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  const { container, unmount } = mount(); upload(container); unmount();
  await act(async () => { finish({ images: [make('a')], failed: 0, rejected: 0 }); });
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});
