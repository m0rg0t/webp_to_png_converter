import { DragEventHandler, FC, useState } from "react";
import {
  Button,
  DropZone,
  File,
  FormItem,
  Group,
  Header,
  IconButton,
  NavIdProps,
  Panel,
  PanelHeader,
  Placeholder,
  SimpleCell,
  Snackbar,
} from "@vkontakte/vkui";
import { UserInfo } from "@vkontakte/vk-bridge";
import {
  Icon16Delete,
  Icon24Camera,
  Icon28ErrorCircleOutline,
  Icon56CameraOutline,
} from "@vkontakte/icons";
import { v4 as uuidv4 } from "uuid"; // Add this import for generating unique IDs
import { saveAs } from "file-saver"; // Add this import for saving files
import JSZip from "jszip";
import convertWebPToPNG from "../utils/convertWebpToPNG";

export interface HomeProps extends NavIdProps {
  fetchedUser?: UserInfo;
}

interface BlobMetadata {
  id: string;
  blob: Blob;
  name: string;
}

export const Home: FC<HomeProps> = ({ id }) => {
  const [blobs, setBlobs] = useState<BlobMetadata[]>([]);
  const [snackbar, setSnackbar] = useState<React.ReactNode | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newBlobs = Array.from(files).map((file) => ({
        id: uuidv4(),
        blob: file,
        name: file.name,
      }));
      setBlobs((prevBlobs) => [...prevBlobs, ...newBlobs]);
    }
  };

  const deleteBlob = (id: string) => {
    setBlobs((prevBlobs) => prevBlobs.filter((blob) => blob.id !== id));
  };

  const Item = ({ active }: { active: boolean }) => {
    return (
      <Placeholder.Container>
        <Placeholder.Icon>
          <Icon56CameraOutline
            fill={active ? "var(--vkui--color_icon_accent)" : undefined}
          />
        </Placeholder.Icon>
        <Placeholder.Header>Быстрая отправка</Placeholder.Header>
      </Placeholder.Container>
    );
  };

  const dragOverHandler = (event: { preventDefault: () => void }) => {
    event.preventDefault();
  };

  const dropHandler: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();

    console.table(event.dataTransfer.files);

    const only_webp_files = Array.from(event.dataTransfer.files).filter(
      (file) => file.type === "image/webp"
    );

    console.table(only_webp_files);

    if (only_webp_files.length === 0) {
      setSnackbar(renderSnackbar("Нет webp файлов для загрузки"));
      return;
    }

    if (only_webp_files.length !== event.dataTransfer.files.length) {
      setSnackbar(renderSnackbar("Некоторые файлы не являются webp файлами"));
    }

    //convert files to blob and store in state
    const newBlobs = only_webp_files.map((file) => ({
      id: uuidv4(),
      blob: new Blob([file], { type: "image/webp" }),
      name: file.name,
    }));

    setBlobs(newBlobs);
  };

  const renderSnackbar = (message: string) => (
    <Snackbar
      onClose={() => setSnackbar(null)}
      before={
        <Icon28ErrorCircleOutline fill="var(--vkui--color_icon_negative)" />
      }
    >
      {message}
    </Snackbar>
  );

  return (
    <Panel id={id}>
      <PanelHeader>WEBP в PNG конвертер</PanelHeader>
      {snackbar}

      <Group
        header={<Header mode="secondary">Загрузите ваши WEBP файлы</Header>}
      >
        <DropZone.Grid>
          <DropZone onDragOver={dragOverHandler} onDrop={dropHandler}>
            {({ active }) => <Item active={active} />}
          </DropZone>
        </DropZone.Grid>
        <FormItem top="Загрузите ваше фото">
          <File
            before={<Icon24Camera role="presentation" />}
            onChange={handleFileUpload}
            size="l"
            accept={"image/webp"}
          >
            Выбрать WEBP файлы
          </File>
        </FormItem>
      </Group>

      {blobs && (
        <Group header={<Header mode="secondary">Ваши webp файлы:</Header>}>
          <>
            <Button
              size="l"
              onClick={async () => {
                const zip = new JSZip();
                await Promise.allSettled(
                  blobs.map(async ({ blob, name }) => {
                    const newBlob = await convertWebPToPNG(blob);
                    zip.file(name.replace("webp", "png"), newBlob);
                  })
                );

                zip.generateAsync({ type: "blob" }).then((content) => {
                  saveAs(content, "images.zip");
                });
              }}
            >
              Конвертировать и скачать все в PNG формате
            </Button>
            {blobs.map(({ id, blob, name }) => {
              const url = URL.createObjectURL(blob);

              return (
                <SimpleCell
                  key={id}
                  before={<Icon24Camera role="presentation" />}
                  after={
                    <IconButton label="Удалить" onClick={() => deleteBlob(id)}>
                      <Icon16Delete />
                    </IconButton>
                  }
                >
                  <img src={url} alt={`uploaded ${name}`} />
                </SimpleCell>
              );
            })}
          </>
        </Group>
      )}
    </Panel>
  );
};
