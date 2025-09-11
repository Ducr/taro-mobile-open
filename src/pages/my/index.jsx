import Taro, { useLoad } from "@tarojs/taro";
import { Text, View } from "@tarojs/components";
// import Taro from "@tarojs/taro";
import "./index.scss";
import CTabBar from "../../components/CTabBar";

export default function My() {
  useLoad(() => {});
  const onChangeTabItem = (value) => {
    if (value === 0) {
      Taro.navigateTo({
        url: "/pages/project/index",
      });
    }
  };

  return (
    <View className="my-page">
      <Text>我的!</Text>
      <CTabBar value={1} onChange={onChangeTabItem} />
    </View>
  );
}
