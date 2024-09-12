import {
  Div,
  Flex,
  Group,
  Image,
  Panel,
  PanelHeader,
  Text,
} from "@vkontakte/vkui";

const NotAvailable = ({ id }: { id?: string }) => {
  return (
    <Panel id={id}>
      <PanelHeader>WEBP в PNG конвертер</PanelHeader>
      <Group>
        <Div>
          <Flex direction={"column"} align="center" justify="center">
            <Image
              src="/main_icon_278.png"
              alt="Main Icon"
              width={278}
              height={278}
            />
            <Text>
              Конвертация доступна только в веб-версии приложения на настольном
              компьютере.
            </Text>
            <Text>
              Конвертация файлов в мобильных клиентах будет доступна позднее.
            </Text>
          </Flex>
        </Div>
      </Group>
    </Panel>
  );
};

export default NotAvailable;
