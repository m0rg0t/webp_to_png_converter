import { DragEventHandler, FC, useEffect, useRef, useState } from "react";
import {
  Button,
  DropZone,
  File,
  Flex,
  FormItem,
  Group,
  Header,
  IconButton,
  NavIdProps,
  Panel,
  PanelHeader,
  Placeholder,
  SimpleCell,
  Text,
  Snackbar,
  Image,
  Div,
  ButtonGroup,
} from "@vkontakte/vkui";
import { UserInfo } from "@vkontakte/vk-bridge";
import {
  Icon16Delete,
  Icon16DownloadOutline,
  Icon24Camera,
  Icon28ErrorCircleOutline,
  Icon56CameraOutline,
} from "@vkontakte/icons";
import { v4 as uuidv4 } from "uuid"; // Add this import for generating unique IDs
import { saveAs } from "file-saver"; // Add this import for saving files
import JSZip from "jszip";
import convertWebPToPNG from "../utils/convertWebpToPNG";
import bridge from "@vkontakte/vk-bridge";

export interface HomeProps extends NavIdProps {
  fetchedUser?: UserInfo;
  isMobileInApp: boolean;
  isMobileWeb: boolean;
}

interface BlobMetadata {
  id: string;
  blob: Blob;
  name: string;
  pngBlob: Blob | null;
  webpName: string;
}

export const Home: FC<HomeProps> = ({ id, isMobileInApp, isMobileWeb }) => {
  const [blobs, setBlobs] = useState<BlobMetadata[]>([]);
  const [snackbar, setSnackbar] = useState<React.ReactNode | null>(null);

  const isMobile = isMobileInApp || isMobileWeb;

  const filesUploadRef = useRef<HTMLInputElement>(null); // Declare the filesUploadRef variable

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files) {
      const webpFiles = Array.from(files).filter(
        (file) => file.type === "image/webp"
      );

      if (webpFiles.length === 0) {
        setSnackbar(renderSnackbar("Нет webp файлов для загрузки"));
        return;
      }

      if (webpFiles.length !== files.length) {
        setSnackbar(renderSnackbar("Некоторые файлы не являются webp файлами"));
      }

      const newBlobs = webpFiles.map(async (file) => {
        return {
          id: uuidv4(),
          blob: file,
          pngBlob: await convertWebPToPNG(file),
          name: file.name,
          webpName: file.name.replace("webp", "png"),
        };
      });

      Promise.all(newBlobs).then((resolvedBlobs) => {
        setBlobs((prevBlobs) => [...prevBlobs, ...resolvedBlobs]);

        filesUploadRef.current!.value = "";
      });
    }
  };

  const deleteBlob = (id: string) => {
    setBlobs((prevBlobs) => prevBlobs.filter((blob) => blob.id !== id));
  };

  useEffect(() => {
    bridge.subscribe(({ detail: { type, data } }) => {
      if (type === "VKWebAppDownloadFileFailed") {
        console.error("Download failed", data);
        setSnackbar(renderSnackbar("Ошибка при скачивании файла"));
      }
    });
  }, []);

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
    const newBlobs = only_webp_files.map(async (file) => ({
      id: uuidv4(),
      blob: new Blob([file], { type: "image/webp" }),
      pngBlob: await convertWebPToPNG(file),
      name: file.name,
      webpName: file.name.replace("webp", "png"),
    }));

    Promise.all(newBlobs).then((resolvedBlobs) => {
      setBlobs((prevBlobs) => [...prevBlobs, ...resolvedBlobs]);

      filesUploadRef.current!.value = "";
    });
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
        {!isMobile && (
          <DropZone.Grid>
            <DropZone onDragOver={dragOverHandler} onDrop={dropHandler}>
              {({ active }) => <Item active={active} />}
            </DropZone>
          </DropZone.Grid>
        )}
        <Flex align="center" justify="center">
          <FormItem top="Загрузите ваше фото">
            <File
              before={<Icon24Camera role="presentation" />}
              onChange={handleFileUpload}
              size="l"
              accept={"image/webp"}
              getRef={filesUploadRef}
            >
              Выбрать WEBP файлы
            </File>
          </FormItem>
        </Flex>
      </Group>

      {blobs.length > 0 && (
        <Group header={<Header mode="secondary">Ваши PNG файлы:</Header>}>
          <>
            <Div>
              <Flex align="center" justify="center">
                <ButtonGroup mode="vertical" stretched={true}>
                  {!isMobile && (
                    <Button
                      size="l"
                      onClick={async () => {
                        try {
                          const zip = new JSZip();
                          blobs.map(({ pngBlob, webpName }) => {
                            zip.file(webpName, pngBlob);
                          });

                          zip
                            .generateAsync({ type: "blob" })
                            .then((content) => {
                              if (isMobileInApp) {
                                bridge.send("VKWebAppDownloadFile", {
                                  url: URL.createObjectURL(content),
                                  filename: "images.zip",
                                });
                              } else {
                                saveAs(content, "images.zip");
                              }
                            });
                        } catch (error) {
                          console.error(error);
                          setSnackbar(renderSnackbar("Ошибка при конвертации"));
                        }
                      }}
                    >
                      Скачать все
                    </Button>
                  )}
                  <Button
                    appearance="negative"
                    size="l"
                    onClick={() => {
                      setBlobs([]);
                    }}
                  >
                    Удалить все
                  </Button>
                </ButtonGroup>
              </Flex>
            </Div>
            <Div>
              {isMobile && (
                <Text>
                  Сейчас приложение открыто в режиме мобильного сайта. В этом
                  режиме может быть затрубнено авто-скачивание изображений. В
                  этом случае можно зажать конвертированное изображение и
                  выбрать опцию сохраненния картинки.
                </Text>
              )}
            </Div>
            {blobs.map(({ id, webpName, pngBlob, blob }) => {
              const url = URL.createObjectURL(pngBlob || blob);

              return (
                <SimpleCell
                  key={id}
                  after={
                    <ButtonGroup>
                      {!isMobile && (
                        <IconButton
                          label="Скачать"
                          onClick={() => {
                            if (isMobileInApp) {
                              bridge.send("VKWebAppDownloadFile", {
                                url: URL.createObjectURL(pngBlob || blob),
                                filename: webpName,
                              });
                            } else {
                              saveAs(pngBlob || blob, webpName);
                            }
                          }}
                        >
                          <Icon16DownloadOutline />
                        </IconButton>
                      )}
                      <IconButton
                        label="Удалить"
                        onClick={() => deleteBlob(id)}
                      >
                        <Icon16Delete />
                      </IconButton>
                    </ButtonGroup>
                  }
                >
                  <Div style={{ paddingLeft: "0" }}>
                    <a
                      title={webpName}
                      href={URL.createObjectURL(pngBlob || blob)}
                      target="_blank"
                      download={webpName}
                    >
                      <Image
                        src={url}
                        alt={`uploaded ${webpName}`}
                        widthSize={"100%"}
                        heightSize={"100%"}
                      />
                    </a>
                  </Div>
                </SimpleCell>
              );
            })}
          </>
        </Group>
      )}
    </Panel>
  );
};
