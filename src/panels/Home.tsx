import { type FC, useEffect, useRef, useState } from 'react';
import { Button, ButtonGroup, Div, DropZone, File, Flex, FormItem, Group, Header, IconButton, Image, type NavIdProps, Panel, PanelHeader, Placeholder, SimpleCell } from '@vkontakte/vkui';
import type { UserInfo } from '@vkontakte/vk-bridge';
import { Icon16Delete, Icon16DownloadOutline, Icon24Camera, Icon56CameraOutline } from '@vkontakte/icons';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { appendUniqueImages, convertBatch, type ConvertedImage } from '../utils/convertBatch';
import NotAvailable from './NotAvailable';

export interface HomeProps extends NavIdProps {
  fetchedUser?: UserInfo;
  isMobileInApp: boolean;
  isMobileWeb: boolean;
}

function ImageResult({ image, onDelete }: { image: ConvertedImage; onDelete: () => void }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const next = URL.createObjectURL(image.blob);
    // The URL belongs to this mounted result, never to a render or a discarded batch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [image.blob]);
  return <SimpleCell after={<ButtonGroup>
    <IconButton aria-label={`Скачать ${image.name}`} onClick={() => saveAs(image.blob, image.name)}><Icon16DownloadOutline /></IconButton>
    <IconButton aria-label={`Удалить ${image.name}`} onClick={onDelete}><Icon16Delete /></IconButton>
  </ButtonGroup>}>
    <Div style={{ paddingLeft: 0 }}>
      <a href={url} download={image.name} title={image.name}>
        <Image src={url} alt={image.name} widthSize="100%" heightSize="100%" />
      </a>
    </Div>
  </SimpleCell>;
}

export const Home: FC<HomeProps> = ({ id, isMobileInApp, isMobileWeb }) => {
  const [images, setImages] = useState<ConvertedImage[]>([]);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(0);
  const active = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; generation.current += 1; };
  }, []);

  async function addFiles(files: File[]) {
    const request = generation.current;
    setPending((count) => count + 1);
    setMessage('');
    try {
      const result = await convertBatch(files);
      if (!active.current || request !== generation.current) return;
      setImages((previous) => appendUniqueImages(previous, result.images));
      if (result.failed) setMessage(`Не удалось прочитать WEBP файлов: ${result.failed}. Остальные файлы готовы.`);
      else if (result.rejected) setMessage('Некоторые файлы не являются WEBP файлами');
      else if (!result.images.length) setMessage('Нет WEBP файлов для загрузки');
    } catch {
      if (active.current && request === generation.current) setMessage('Не удалось обработать файлы. Попробуйте снова.');
    } finally {
      if (active.current && request === generation.current) setPending((count) => count - 1);
    }
  }

  async function downloadAll() {
    try {
      const zip = new JSZip();
      images.forEach((image) => zip.file(image.name, image.blob));
      const archive = await zip.generateAsync({ type: 'blob' });
      if (active.current) saveAs(archive, 'images.zip');
    } catch {
      if (active.current) setMessage('Не удалось создать ZIP. Попробуйте снова.');
    }
  }

  if (isMobileInApp || isMobileWeb) return <NotAvailable id={id} />;
  return <Panel id={id}>
    <PanelHeader>WEBP в PNG конвертер</PanelHeader>
    {message && <Div role="alert">{message}</Div>}
    {pending > 0 && <Div role="status">Конвертируем файлы…</Div>}
    <Group header={<Header>Загрузите ваши WEBP файлы</Header>}>
      <DropZone.Grid><DropZone onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
        event.preventDefault(); void addFiles(Array.from(event.dataTransfer.files));
      }}>{({ active: dragging }) => <Placeholder.Container><Placeholder.Icon>
        <Icon56CameraOutline fill={dragging ? 'var(--vkui--color_icon_accent)' : undefined} />
      </Placeholder.Icon><Placeholder.Title>Быстрая отправка</Placeholder.Title></Placeholder.Container>}</DropZone></DropZone.Grid>
      <Flex align="center" justify="center"><FormItem top="Загрузите ваше фото">
        <File before={<Icon24Camera role="presentation" />} size="l" multiple accept="image/webp" onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          void addFiles(files);
        }}>Выбрать WEBP файлы</File>
      </FormItem></Flex>
    </Group>
    {(images.length > 0 || pending > 0) && <Group header={<Header>Ваши PNG файлы:</Header>}>
      <Div><ButtonGroup mode="vertical" stretched>
        <Button size="l" disabled={!images.length} onClick={() => void downloadAll()}>Скачать все</Button>
        <Button appearance="negative" size="l" onClick={() => {
          generation.current += 1; setImages([]); setPending(0); setMessage('');
        }}>Удалить все</Button>
      </ButtonGroup></Div>
      {images.map((image) => <ImageResult key={image.id} image={image} onDelete={() => setImages((previous) => previous.filter((entry) => entry.id !== image.id))} />)}
    </Group>}
  </Panel>;
};
