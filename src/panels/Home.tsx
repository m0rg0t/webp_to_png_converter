import { DragEventHandler, FC, useState } from "react";
import {
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

export interface HomeProps extends NavIdProps {
  fetchedUser?: UserInfo;
}

export const Home: FC<HomeProps> = ({ id }) => {
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [snackbar, setSnackbar] = useState<React.ReactNode | null>(null);

  const Item = ({ active }: { active: boolean }) => {
    return (
      <Placeholder.Container>
        <Placeholder.Icon>
          <Icon56CameraOutline
            fill={active ? "var(--vkui--color_icon_accent)" : undefined}
          />
        </Placeholder.Icon>
        <Placeholder.Header>Быстрая отправка</Placeholder.Header>
        <Placeholder.Text>
          Перенесите файл сюда для быстрой отправки. В таком случае изображения
          будут сжаты.
        </Placeholder.Text>
      </Placeholder.Container>
    );
  };

  const dragOverHandler = (event: { preventDefault: () => void }) => {
    event.preventDefault();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files === null) {
      return;
    }

    const only_webp_files = Array.from(files).filter(
      (file) => file.type === "image/webp"
    );

    if (only_webp_files.length === 0) {
      setSnackbar(
        <Snackbar
          onClose={() => setSnackbar(null)}
          before={
            <Icon28ErrorCircleOutline fill="var(--vkui--color_icon_negative)" />
          }
        >
          Нет webp файлов для загрузки
        </Snackbar>
      );

      return;
    }

    if (only_webp_files.length !== files.length) {
      setSnackbar(
        <Snackbar
          onClose={() => setSnackbar(null)}
          before={
            <Icon28ErrorCircleOutline fill="var(--vkui--color_icon_negative)" />
          }
        >
          Некоторые файлы не являются webp файлами
        </Snackbar>
      );
    }

    //convert files to blob and store in state
    const blobs = only_webp_files.map(
      (file) => new Blob([file], { type: "image/webp" })
    );

    setBlobs(blobs);
  };

  const dropHandler: DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();

    console.table(event.dataTransfer.files);

    const only_webp_files = Array.from(event.dataTransfer.files).filter(
      (file) => file.type === "image/webp"
    );

    console.table(only_webp_files);

    if (only_webp_files.length === 0) {
      setSnackbar(
        <Snackbar
          onClose={() => setSnackbar(null)}
          before={
            <Icon28ErrorCircleOutline fill="var(--vkui--color_icon_negative)" />
          }
        >
          Нет webp файлов для загрузки
        </Snackbar>
      );

      return;
    }

    if (only_webp_files.length !== event.dataTransfer.files.length) {
      setSnackbar(
        <Snackbar
          onClose={() => setSnackbar(null)}
          before={
            <Icon28ErrorCircleOutline fill="var(--vkui--color_icon_negative)" />
          }
        >
          Некоторые файлы не являются webp файлами
        </Snackbar>
      );
    }

    //convert files to blob and store in state
    const blobs = only_webp_files.map(
      (file) => new Blob([file], { type: "image/webp" })
    );

    setBlobs(blobs);
  };

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

      <Group header={<Header mode="secondary">Ваши webp файлы:</Header>}>
        {blobs.map((blob, index) => {
          const url = URL.createObjectURL(blob);

          return (
            <SimpleCell
              before={<Icon24Camera role="presentation" />}
              after={
                <IconButton
                  label="Удалить"
                  onClick={() => {
                    console.log("delete", index);
                  }}
                >
                  <Icon16Delete />
                </IconButton>
              }
            >
              <img key={index} src={url} alt={`uploaded ${blob.type}`} />
            </SimpleCell>
          );
        })}
      </Group>
    </Panel>
  );
};
