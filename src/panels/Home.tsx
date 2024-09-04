import {DragEventHandler, FC, useState} from 'react';
import {
    DropZone,
    File,
    FormItem,
    Group,
    Header,
    NavIdProps,
    Panel,
    PanelHeader,
    Placeholder,
    SimpleCell,
} from '@vkontakte/vkui';
import {UserInfo} from '@vkontakte/vk-bridge';
import {Icon24Camera, Icon56CameraOutline} from "@vkontakte/icons";

export interface HomeProps extends NavIdProps {
    fetchedUser?: UserInfo;
}

export const Home: FC<HomeProps> = ({id}) => {
    const [blobs, setBlobs] = useState<Blob[]>([]);

    const Item = ({active}: {
        active: boolean
    }) => {
        return (
            <Placeholder.Container>
                <Placeholder.Icon>
                    <Icon56CameraOutline fill={active ? 'var(--vkui--color_icon_accent)' : undefined}/>
                </Placeholder.Icon>
                <Placeholder.Header>Быстрая отправка</Placeholder.Header>
                <Placeholder.Text>
                    Перенесите файл сюда для быстрой отправки. В таком случае изображения будут сжаты.
                </Placeholder.Text>
            </Placeholder.Container>
        );
    };

    const dragOverHandler = (event: { preventDefault: () => void; }) => {
        event.preventDefault();
    };

    const dropHandler: DragEventHandler<HTMLDivElement> = (event) => {
        event.preventDefault();

        console.table(event.dataTransfer.files);

        const only_webp_files = Array.from(event.dataTransfer.files).filter(file => file.type === 'image/webp');

        console.table(only_webp_files);

        if (only_webp_files.length === 0) {
            return;
        }

        //convert files to blob and store in state
        const blobs = only_webp_files.map(file => new Blob([file], {type: 'image/webp'}));

        setBlobs(blobs);
    };

    return (
        <Panel id={id}>
            <PanelHeader>WEBP в PNG конвертер</PanelHeader>

            <Group header={<Header mode="secondary">Загрузите ваши WEBP файлы</Header>}>
                <DropZone.Grid>
                    <DropZone onDragOver={dragOverHandler} onDrop={dropHandler}>
                        {({active}) => <Item active={active}/>}
                    </DropZone>
                </DropZone.Grid>
                <FormItem top="Загрузите ваше фото">
                    <File before={<Icon24Camera role="presentation"/>} size="l" accept={"image/webp"}>
                        Выбрать WEBP файлы
                    </File>
                </FormItem>
            </Group>

            <Group header={<Header mode="secondary">Ваши webp файлы:</Header>}>

                {
                    blobs.map((blob, index) => {
                        const url = URL.createObjectURL(blob);

                        return (
                            <SimpleCell
                                before={<Icon24Camera role="presentation"/>}
                                after={"delete"}
                            >
                                <img key={index} src={url} alt={`uploaded ${blob.type}`}/>
                            </SimpleCell>

                        );
                    })
                }
            </Group>
        </Panel>
    );
};
