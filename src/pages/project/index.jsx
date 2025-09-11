import Taro, { useLoad } from "@tarojs/taro";
import { Text, View } from "@tarojs/components";
import CTabBar from "../../components/CTabBar";
import "./index.scss";

export default function Project() {
  useLoad(() => {});
  const onChangeTabItem = (value) => {
    if (value === 1) {
      Taro.navigateTo({
        url: "/pages/my/index",
      });
    }
  };

  return (
    <View className="project-page">
      <Text>项目列表!</Text>
      <CTabBar value={0} onChange={onChangeTabItem} />
    </View>
  );
}
