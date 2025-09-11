import { Tabbar, ConfigProvider } from "@taroify/core";
import { HomeOutlined, ContactOutlined } from "@taroify/icons";

const defaultTabList = [
  { icon: <HomeOutlined />, title: "项目", value: 0 },
  { icon: <ContactOutlined />, title: "我的", value: 1 },
];

export default function CTabBar(props = {}) {
  let { theme = {}, tabList = [], children, onChange, ...restProps } = props;
  tabList = tabList.length ? tabList : defaultTabList;

  const onChangeTabItem = (value) => {
    onChange && onChange(value);
  }

  return (
    <ConfigProvider theme={theme}>
      <Tabbar
        className="c-tabBar-wrapper"
        defaultValue={0}
        fixed={true}
        bordered={true}
        {...restProps}
        onChange={onChangeTabItem}
      >
        {
          tabList.map((item, index) => (
            <Tabbar.TabItem key={index} icon={item.icon} {...item}>{item.title}</Tabbar.TabItem>
          ))
        }
      </Tabbar>
    </ConfigProvider>
  );
}